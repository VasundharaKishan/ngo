#!/usr/bin/env bash
# PR_HANDOFF.sh — Land Commit 1 (B1-B9 blocker fixes) of FIX_PROD_BLOCKERS_HANDOFF.md
# and prepare fix/prod-blockers for a pull request against origin/main.
#
# This script is interactive — it pauses at each major step so you can
# review state before continuing. Re-running is safe: each step is idempotent
# or guarded by a state check.
#
# Run from the repo root:
#     bash PR_HANDOFF.sh
#
# Pre-reqs:
#   - SSH key authorized for git@github.com:VasundharaKishan/ngo.git
#   - (Optional) gh CLI authenticated, for `gh pr create`
#
# Author: handoff prep — 2026-04-26

set -e
set -o pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
say()   { printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m!! %s\033[0m\n' "$*"; }
fail()  { printf '\033[1;31mxx %s\033[0m\n' "$*"; exit 1; }
pause() { printf '\n\033[1;35m>> Press ENTER to continue, Ctrl-C to abort...\033[0m'; read -r _; }

# ---------------------------------------------------------------------------
# 0. Sanity: are we in the right repo?
# ---------------------------------------------------------------------------
say "0. Sanity checks"

cd "$(dirname "$0")"
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  fail "Not a git repository — run this from the repo root."
fi

origin_url=$(git remote get-url origin 2>/dev/null || echo "(no origin)")
echo "Repo:   $(pwd)"
echo "Origin: $origin_url"
case "$origin_url" in
  *VasundharaKishan/ngo*) echo "OK — looks like the right remote." ;;
  *) warn "Origin URL doesn't mention VasundharaKishan/ngo — double-check this is the right repo." ;;
esac

# ---------------------------------------------------------------------------
# 1. Clear stale lock + sanity-fetch
# ---------------------------------------------------------------------------
say "1. Clear stale .git/index.lock and fetch origin"

if [ -e .git/index.lock ]; then
  warn "Stale .git/index.lock found — removing."
  rm -f .git/index.lock
fi

echo "Running: git fetch origin --prune"
git fetch origin --prune

# ---------------------------------------------------------------------------
# 2. Show current state
# ---------------------------------------------------------------------------
say "2. Branch + remote state"

current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"
echo
echo "origin/main is now at:"
git log origin/main -1 --format='  %h  %ad  %s' --date=short
echo
echo "Local fix/prod-blockers is at:"
git log fix/prod-blockers -1 --format='  %h  %ad  %s' --date=short
echo
ahead=$(git rev-list --count origin/main..fix/prod-blockers 2>/dev/null || echo "?")
behind=$(git rev-list --count fix/prod-blockers..origin/main 2>/dev/null || echo "?")
echo "fix/prod-blockers is $ahead commits ahead of origin/main, $behind commits behind."
echo
echo "Uncommitted file count on disk:"
git status --porcelain | wc -l

pause

# ---------------------------------------------------------------------------
# 3. Switch to fix/prod-blockers
# ---------------------------------------------------------------------------
say "3. Checkout fix/prod-blockers"

if [ "$current_branch" != "fix/prod-blockers" ]; then
  echo "Switching from $current_branch to fix/prod-blockers..."
  git checkout fix/prod-blockers
else
  echo "Already on fix/prod-blockers."
fi

# ---------------------------------------------------------------------------
# 4. Untrack files that should never have been committed (B3, B8, B9)
# ---------------------------------------------------------------------------
say "4. Untrack stale files (DS_Store + .env.backup + Home.tsx.backup)"

untrack_one() {
  local f="$1"
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    git rm --cached -f "$f"
  else
    echo "  (already untracked: $f)"
  fi
}
untrack_one .DS_Store
untrack_one playwright-tests/.DS_Store
untrack_one target/.DS_Store
untrack_one foundation-backend/.env.backup
untrack_one foundation-frontend/src/pages/Home.tsx.backup

# Optional: physically delete the .env.backup so it really is gone
if [ -f foundation-backend/.env.backup ]; then
  warn "foundation-backend/.env.backup still exists on disk."
  echo "Delete it now? (y/N)"
  read -r ans
  if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
    rm -f foundation-backend/.env.backup
    echo "  deleted."
  fi
fi

# ---------------------------------------------------------------------------
# 5. Stage the blocker-fix files (and ONLY those)
# ---------------------------------------------------------------------------
say "5. Stage blocker-fix files"

git add \
  .gitignore \
  render.yaml \
  foundation-backend/pom.xml \
  foundation-backend/src/main/resources/application-prod.yml \
  foundation-backend/src/main/java/com/myfoundation/school/config/ProductionSafetyValidator.java \
  foundation-frontend/vercel.json \
  PROJECT_COMPLETENESS_REVIEW.md \
  FIX_PROD_BLOCKERS_HANDOFF.md \
  patches/0001-application-yml-prod-blockers.patch

echo
echo "Currently staged:"
git diff --cached --name-status

echo
echo "Sanity check: the staged set should be exactly:"
echo "  D  .DS_Store"
echo "  D  playwright-tests/.DS_Store"
echo "  D  target/.DS_Store"
echo "  D  foundation-backend/.env.backup"
echo "  D  foundation-frontend/src/pages/Home.tsx.backup"
echo "  M  .gitignore"
echo "  M  foundation-backend/pom.xml"
echo "  M  foundation-frontend/vercel.json"
echo "  A  foundation-backend/src/main/resources/application-prod.yml"
echo "  A  foundation-backend/src/main/java/com/myfoundation/school/config/ProductionSafetyValidator.java"
echo "  A  PROJECT_COMPLETENESS_REVIEW.md"
echo "  A  FIX_PROD_BLOCKERS_HANDOFF.md"
echo "  A  patches/0001-application-yml-prod-blockers.patch"
echo "  A  render.yaml"
echo
echo "If anything else is staged, abort now (Ctrl-C) and inspect."
pause

# ---------------------------------------------------------------------------
# 6. Commit
# ---------------------------------------------------------------------------
say "6. Commit blocker fixes"

git commit -m "fix: prod-deploy blockers (B1-B9)

- B1 Actuator dep + expose /actuator/health for Docker/Railway/Render probes
- B2 admin bootstrap off by default in prod; prod validator requires strong
     ADMIN_BOOTSTRAP_PASSWORD when enabled
- B3 untrack .env.backup; ignore all .env* in root gitignore
- B4 prod validator fails boot if JWT secret is blank/default/<32 chars
- B5 application.yml hardening (see patches/0001 for the patch to apply
     once your in-flight application.yml edits are settled)
- B6 render.yaml expanded envVars (DB, JWT, admin bootstrap, Stripe URLs,
     CORS, mail, R2, Turnstile, Swagger toggle); --legacy-peer-deps
- B7 vercel.json drop wildcard CORS header; add standard security headers
- B8 untrack .DS_Store everywhere; ignore in root .gitignore
- B9 untrack Home.tsx.backup; ignore *.backup in root .gitignore

See FIX_PROD_BLOCKERS_HANDOFF.md and PROJECT_COMPLETENESS_REVIEW.md for
the full review and follow-up work (Refund page, footer cleanup,
campaign-pagination scroll fix) which are tracked as separate patches
in patches/ and intended for follow-up commits."

echo
echo "Commit landed:"
git log -1 --stat | head -25

pause

# ---------------------------------------------------------------------------
# 7. Rebase onto origin/main
# ---------------------------------------------------------------------------
say "7. Rebase fix/prod-blockers onto origin/main"

echo "Strategy: git rebase origin/main"
echo
echo "Likely conflict zones (origin/main has invest-page work merged via PR #38/#39):"
echo "  - foundation-frontend/src/App.tsx"
echo "  - foundation-frontend/src/components/Layout.tsx"
echo "  - any frontend routing / layout files"
echo
echo "If a conflict arises:"
echo "  - resolve it (edit the file, then git add)"
echo "  - run: git rebase --continue"
echo "  - to bail out at any point: git rebase --abort"
pause

if git rebase origin/main; then
  echo "Rebase clean."
else
  warn "Rebase paused on conflicts. Resolve them, then run:"
  echo "    git add <resolved files>"
  echo "    git rebase --continue"
  echo "  ...and re-run this script from step 8 onwards (or just run the push step manually)."
  exit 1
fi

# ---------------------------------------------------------------------------
# 8. Verify no merge markers anywhere, working tree is clean (besides in-flight)
# ---------------------------------------------------------------------------
say "8. Post-rebase sanity check"

if git grep -n '<<<<<<< ' -- ':!*.md' >/dev/null 2>&1; then
  fail "Found leftover merge conflict markers — resolve before pushing."
fi
echo "No leftover conflict markers."

echo
echo "Final state:"
git log origin/main..HEAD --oneline | head -10
echo "..."
echo "Total commits ahead of origin/main: $(git rev-list --count origin/main..HEAD)"

# ---------------------------------------------------------------------------
# 9. Print push + PR commands (do NOT auto-push)
# ---------------------------------------------------------------------------
say "9. Push + open PR"

cat <<EOF

Everything looks good. To push and open a PR, run:

    # Push (force-with-lease because rebase rewrote history)
    git push --force-with-lease -u origin fix/prod-blockers

    # Open PR via gh CLI (preferred):
    gh pr create \\
      --base main \\
      --head fix/prod-blockers \\
      --title "fix: production-deployment blockers (B1-B9)" \\
      --body-file FIX_PROD_BLOCKERS_HANDOFF.md

    # ...or open in the browser:
    open "https://github.com/VasundharaKishan/ngo/pull/new/fix/prod-blockers"

EOF

echo "Done. Review the printed git log above one more time before pushing."
