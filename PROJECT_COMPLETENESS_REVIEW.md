# Foundation NGO — Project Completeness Review

_Review date: 2026-04-18_
_Reviewed by: Claude (Cowork mode)_
_Branch reviewed: `feature/playwright-tests-other-tests`_

---

## TL;DR

The project is **feature-complete and production-grade** in scope — a full NGO donation platform with Stripe, JWT auth, PostgreSQL/Flyway, admin CMS, email, R2 storage, rate-limiting, PWA, and i18n. Test coverage is strong: **486 backend unit/integration tests (0 failures, 2 skipped)**, **~88% frontend line coverage from ~47 Vitest files**, and a **multi-browser Playwright E2E suite** wired into GitHub Actions.

However, it is **NOT ready to push to production as-is**. There are ~10 deployment-blocking or risky issues, mostly around secrets hygiene, a broken Docker healthcheck, default admin credentials, and uncommitted in-flight changes. All are fixable within a day.

---

## What's in the project

| Area | Status | Evidence |
|---|---|---|
| Backend (Spring Boot 3.2.12, Java 21) | Complete | 240 Java source files across 28 packages (auth, campaign, donation, cms, hero, footer, faq, stats, contact, settings, storage, security, webhook, …) |
| Frontend (React 19 + Vite 7 + TS) | Complete | 148 TS/TSX files, public site + full admin panel, i18n, PWA, lazy-loaded chunks |
| Database | Complete | 32 Flyway migrations (V1→V32), baselined at V14, PostgreSQL |
| Payments | Complete | Stripe checkout session + webhook (checkout.session.completed, async_payment_*, expired) |
| Auth | Complete | JWT in HttpOnly cookies, password setup, optional OTP, rate limiting, account lockout (V8), admin bootstrap |
| CMS | Complete | Hero slides, home sections, FAQs, stories, trust badges, donation presets, money allocations, announcement bar, transparency docs |
| File storage | Complete | Cloudflare R2 (S3 SDK) |
| Email | Complete | Brevo SMTP, onboarding + donation receipts |
| Observability | Partial | logback-spring.xml + audit_logs table (V14), but no Spring Boot Actuator (see blockers) |
| Security | Mostly complete | Spring Security, CORS, Turnstile captcha, rate-limit filter + interceptor |
| Tests | Strong | 486 backend tests, ~88% frontend line coverage, Playwright across Chromium/Firefox/WebKit |
| CI/CD | Partial | GH Actions runs Playwright only; no workflow for backend `mvn test` or frontend `vitest`/lint/build |
| Deploy targets | Configured | Render (render.yaml), Railway (Dockerfile + railway.json), Vercel (vercel.json) |

---

## Completeness checklist (your original question)

### 1. Is the project "complete"?

For a donation platform, yes — functionally. Every user journey I could identify has code + UI + tests:

- Public: browse campaigns, filter by category, view detail, donate via Stripe, success/cancel, contact form, FAQ, legal pages, stories, transparency docs.
- Admin: login (with optional OTP), password setup, dashboard, manage campaigns/categories/donations/users/hero/home sections/CMS/contact submissions/popup/site settings/donation presets/money allocations/stories/FAQs/trust badges/transparency docs/announcement bar.
- Ops: webhook retries implied, audit log table, rate limiting, email transport.

What's open is the usual "day-2" stuff: observability, secrets management, infra hardening — covered below.

### 2. Tests — do you have all the important ones?

**Backend (486 tests, 0 failures, 2 skipped — from `target/surefire-reports`)**
Every domain package has service + controller tests. Security has `JwtServiceTest`, `RateLimiterServiceTest`, and a full `SecurityIntegrationTest`. Auth has end-to-end flow tests (`UserOnboardingFlowTest`, `OtpLoginFlowTest`). Stripe webhook, donation pagination, email, R2 storage, CMS, Turnstile, contact integration — all covered.

**Frontend (~47 test files, 88.3% lines / 73.65% branches / 70.9% functions)**
Every major page and shared component has a test. Good coverage on utils (auth, currency, dateUtils, validators, logger, contactApi, scrollAnimations) and hooks (useDebounce, usePaginationParams). Snapshot test for sections.

**E2E (Playwright, 3 browsers)**
14 spec files across `admin/`, `public/`, plus root-level smokes. Covers login, session expiry, access control, campaigns, categories, CMS, donation validation, Stripe-mocked donation, cancel/failure flow, navigation, legal pages, site settings, users, homepage, donate-popup.

**Gaps in tests:**

- No load/perf test (k6, JMeter, or artillery) — not strictly required, but for a donation platform that may see traffic spikes during campaigns, consider at least a smoke perf test on `/api/campaigns` and the Stripe create endpoint.
- No contract test between frontend and backend (Pact / OpenAPI-validated). You have springdoc/OpenAPI — you could generate the schema and have the frontend's API client validated against it in CI.
- No security-scan step in CI (dependency vuln scan, SAST). See recommendations.
- Backend coverage threshold is set to 65% (pom.xml jacoco), but actual % isn't surfaced in a report I can see — add a CI badge.
- Branch coverage on frontend is 73.65% — fine, but the admin flows that go through Stripe/email/R2 could benefit from a few more negative-path tests.
- The `TestEmailSending.java` file at the root of test package looks like a manual smoke tool, not a real test — confirm it's not polluting CI.

### 3. Ready to deploy?

**Blocking issues (fix before any prod deploy):**

**B1. Docker healthcheck points to `/actuator/health` but Actuator is not a dependency.**
`foundation-backend/Dockerfile` has `wget … /actuator/health`, and `railway.json` uses the same path. But `pom.xml` does NOT include `spring-boot-starter-actuator`. The healthcheck will always fail → Railway/Render will mark the container unhealthy and restart-loop. Fix: add `spring-boot-starter-actuator` and expose `management.endpoints.web.exposure.include=health,info` (or change the healthcheck URL to something that actually exists, e.g. `/api/campaigns`).

**B2. Default admin password is `admin123` and auto-creates on every startup.**
`ADMIN_LOGIN_SETUP.md` confirms `AdminUserInitializer` re-creates `admin@hopefoundation.org / admin123` on every start. `app.allow-admin-bootstrap` defaults to `true`. If this ships to prod with the default, the site is owned in under a minute. Fix: set `ALLOW_ADMIN_BOOTSTRAP=false` in prod env, OR gate bootstrap on `!prod` profile, OR require a first-run env var with a strong password.

**B3. `.env.backup` is tracked in git (`foundation-backend/.env.backup`).**
Today it only contains placeholders (`sk_test_..._your_key_here`), so it's not a live leak — but keeping this pattern means someone will eventually commit real values. Remove from the index, add to `.gitignore`, and enforce via a pre-commit hook (e.g., gitleaks or pre-commit's detect-secrets).

**B4. JWT default secret is a placeholder.**
`JWT_SECRET` default in `application.yml` is `change-this-secret-to-a-long-random-value-please`. If the env var isn't set in prod, Spring happily uses the default and tokens become forgeable. Fix: fail-fast on boot if running prod profile and secret equals the default, OR remove the default entirely so startup fails loudly.

**B5. Hard-coded personal DB username default.**
`DATABASE_USERNAME:e141057` in `application.yml`. Harmless but leaks a developer identity and shouldn't be a default. Change to `postgres` or remove.

**B6. Render `envVars` list is missing several required keys.**
`render.yaml` declares `DATABASE_URL, JWT_SECRET, STRIPE_*, MAIL_USERNAME, MAIL_PASSWORD, R2_*, SPRING_PROFILES_ACTIVE` — but the app also reads `FRONTEND_URL, CORS_ALLOWED_ORIGINS, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, MAIL_HOST, MAIL_PORT, JWT_COOKIE_DOMAIN, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, R2_PUBLIC_BASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, ALLOW_ADMIN_BOOTSTRAP`. Without these the service will either boot with unsafe defaults (see B2, B4) or have broken redirects/CORS.

**B7. Frontend `vercel.json` sets `Access-Control-Allow-Origin: *` on `/api/(.*)`.**
Vercel is a static host — it doesn't serve `/api/*` for you. This header either does nothing or, if you later rewrite/proxy, weakens the CORS model the backend carefully controls. Delete the headers block.

**B8. Tracked `.DS_Store` files.**
3 `.DS_Store` files are in the git index. Add `**/.DS_Store` to `.gitignore` and `git rm --cached` them.

**B9. Tracked backup file `foundation-frontend/src/pages/Home.tsx.backup`.**
Dead code. Remove.

**B10. Large uncommitted working tree on the review branch.**
`git status` shows 25+ modified files including `SecurityConfig.java`, `application.yml`, `AdminLayout.tsx`, `Home.tsx`. Either these are your in-flight work (fine) or they were forgotten. Don't deploy from this branch state; commit or stash, then deploy from a tagged commit.

**Non-blocking but worth addressing before launch:**

- No Spring Boot `/actuator/info`, `/actuator/metrics`, `/actuator/prometheus` endpoints → no real monitoring story. Add Actuator + Micrometer + Prometheus scrape (or at least APM like New Relic / Sentry).
- No error tracking on frontend (Sentry, LogRocket). `ErrorBoundary.tsx` exists; piping it to Sentry is a 10-minute change.
- `backend.log` (1.9 MB) and `playwright-tests/test-results/` are on disk in the repo tree — ignored by `.gitignore` at root only partially; double-check none of these are ever committed.
- 16 stale `vitest.config.ts.timestamp-*` files — add `vitest.config.ts.timestamp-*` to the frontend `.gitignore`.
- No `LICENSE` file even though README says MIT. Add it.
- CI runs Playwright but does NOT run backend `mvn test` or frontend `vitest run` / `tsc` / `eslint` / `npm run build`. Add those as separate jobs; block PR merges on red.
- No dependency vulnerability scanning. Add GitHub's Dependabot (zero-config) and `mvn org.owasp:dependency-check-maven` or Snyk for the JVM side; `npm audit --audit-level=high` for the frontend.
- No Docker image for the frontend and no Dockerfile for local dev of the whole stack (a `docker-compose.yml` with Postgres + backend + frontend + Mailhog would massively improve onboarding).
- No database backup / restore runbook documented. For a donation platform, this is the single highest-risk gap operationally.
- `SQL_INIT_MODE=always` in `.env.example`, but `application.yml` sets `spring.sql.init.mode: never` (good) — reconcile the docs.
- `logging.level.org.hibernate.SQL=DEBUG` and `org.springframework.security=DEBUG` in default config — fine for dev, but the prod profile only sets `root: WARN` and doesn't explicitly downgrade these. Double-check prod logs aren't dumping SQL/security internals.
- `data.init.enabled: true` in `application.yml` root and `DataInitializer` runs sample data — make sure this is false in prod.
- `render.yaml` uses `plan: free` — free Render dynos sleep; webhooks from Stripe will 5xx during cold starts. Move to a paid tier or accept the trade-off.
- CORS allow-list includes at least two preview Vercel URLs (`frontend-three-psi-17.vercel.app`, `foundation-frontend-three.vercel.app`) — remove any you no longer own before going live.

---

## What I would add to make the project more meaningful

These are additions, not fixes — things that would genuinely raise the bar of what this platform delivers for an NGO.

**For donors (trust & transparency):**
- Donation impact tracking: per-campaign, show "your ₹X funded Y beneficiaries" dashboards pulled from real expenditure data. You have `moneyallocation` and `transparency` modules — link donations to allocations and expose a public donor-visible impact page.
- Anonymous-by-default option + donor wall (opt-in) with configurable privacy.
- Recurring donations (Stripe subscriptions) — huge lifetime-value lift for NGOs. Currently only one-off.
- Tax-receipt PDFs emailed automatically (80G for India, 501(c)(3) for US) — you already have email + donation data; a PDF template + signed hash is small work.
- Gift-donation flow (donate in someone's name, they receive a card).

**For the NGO (operations):**
- Admin analytics dashboard: funnel from visit → campaign view → donation; conversion by campaign, traffic source (UTM), device.
- CSV/Excel export of donations with filters (already partially in admin — confirm export; add scheduled email reports).
- Donor CRM lite: lifetime value, last donation, preferred causes, tags. Export to Mailchimp/Sendy.
- Campaign lifecycle: draft → review → publish → closed, with scheduled auto-close and auto-archive.
- Bulk image upload to R2 with background processing and perceptual-hash dedup.

**For robustness & scale:**
- Stripe webhook idempotency: store `event.id` in `audit_logs` (or a dedicated table) and short-circuit duplicates. Stripe retries aggressively; duplicate donation records are the #1 pain point here.
- Outbox pattern for emails — today a transient SMTP failure silently drops the receipt. Persist pending emails and retry.
- Replace in-process rate limiter with Redis-backed so limits hold across multiple instances when you scale horizontally.
- Blue-green or canary deploys (Render and Railway both support it) plus a real staging env.
- Feature flags (Unleash, PostHog, or a 50-line DB-backed toggle) — you already have a settings table; extend it.

**For accessibility & reach:**
- You have i18n + an AccessibilityPage. Add automated a11y checks (axe-core in Playwright) and run them on every PR. NGO sites are frequently audited; this is table-stakes.
- Light/dark mode and reduced-motion honoring.
- Indian payments (Razorpay / UPI) — the roadmap notes this; the abstractions in `donation/` look amenable to a `PaymentProvider` interface. Without it, you're leaving Indian donors on the table.
- SMS receipts via Twilio for Indian donors who prefer SMS to email.

**For the development loop:**
- `docker-compose.yml` for full stack + seeded DB — one command to onboard.
- Pre-commit hooks (ktlint/spotless for Java, prettier + eslint for frontend, gitleaks for secrets).
- Renovate or Dependabot for automated dependency PRs.
- ADRs (Architecture Decision Records) directory — your `docs/` has 60+ files but no clear index; an ADR log + a cleanup pass would help.

---

## Concrete, prioritized next steps (one sprint)

1. Fix B1 (actuator healthcheck) and B4 (JWT secret fail-fast) — hard blockers for a safe boot.
2. Fix B2 (admin bootstrap disabled in prod, strong first-run password) — hard blocker for security.
3. Fix B6 (full env var list in `render.yaml` / Railway) — hard blocker for correct runtime.
4. Fix B3, B7, B8, B9, B5 (git hygiene + vercel.json) — 30 minutes total.
5. Add backend test + frontend test + lint + build jobs to GitHub Actions; block merges on failure.
6. Add Dependabot + one security-scan job (`npm audit` + `dependency-check`).
7. Add Sentry (frontend + backend) and wire `ErrorBoundary` to it.
8. Add Stripe webhook idempotency table + test.
9. Draft + test a DB backup/restore runbook.
10. Then ship.

---

## Bottom line

You have built substantially more than a "production-ready donation platform" README promises — this is a mid-sized SaaS-grade codebase with disciplined testing. The gap to prod is real but small and mostly configurational. Close the 10 blockers above, tighten CI, add one observability wire, and this is deployable with confidence.
