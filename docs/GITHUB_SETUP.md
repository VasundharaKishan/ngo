# 🚀 GitHub Repository Setup Guide

Step-by-step guide to push your NGO Donation Platform to GitHub.

## 📋 Prerequisites

- Git installed on your machine
- GitHub account
- Repository created on GitHub (or you'll create it in step 1)

---

## 1️⃣ Create GitHub Repository

### Option A: Via GitHub Website

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `ngo-donation-platform` (or your preferred name)
3. Description: "Full-stack NGO donation platform with Stripe integration"
4. **Visibility:** Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"
7. Copy the repository URL: `https://github.com/YOUR_USERNAME/ngo-donation-platform.git`

### Option B: Via GitHub CLI

```bash
gh repo create ngo-donation-platform --public --description "Full-stack NGO donation platform"
```

---

## 2️⃣ Prepare Your Local Repository

### Check Current Git Status

```bash
cd /Users/e141057/Desktop/work/ngo

# Check if git is already initialized
git status
```

### If Git is NOT Initialized:

```bash
# Initialize git repository
git init

# Check status
git status
```

### If Git IS Already Initialized:

```bash
# Check current remote
git remote -v

# If remote exists and you want to change it:
git remote remove origin

# Or just continue to step 3
```

---

## 3️⃣ Stage and Commit Your Files

### Review What Will Be Committed

```bash
# See all files that will be tracked
git status

# Verify secrets are NOT staged (should be ignored)
git status | grep -E "\.env$|application\.yml"
# Should NOT show .env files (they're in .gitignore)
```

### Verify Secrets Are Removed

```bash
# Check application.yml has no real secrets
grep -E "password|secret" foundation-backend/src/main/resources/application.yml

# Should only show env var placeholders like:
# password: ${DATABASE_PASSWORD:postgres}
# NOT real values
```

### Stage All Files

```bash
# Add all files respecting .gitignore
git add .

# Verify what's staged
git status
```

### Create Initial Commit

```bash
git commit -m "Initial commit: NGO donation platform with Stripe integration

Features:
- Spring Boot backend with Stripe webhooks
- React + TypeScript frontend
- Admin dashboard
- Campaign management
- Donation tracking
- Email notifications
- Comprehensive deployment docs"
```

---

## 4️⃣ Push to GitHub

### Add Remote Repository

```bash
# Add your GitHub repository as remote
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/ngo-donation-platform.git

# Verify remote was added
git remote -v
```

### Set Default Branch Name (if needed)

```bash
# Check current branch
git branch

# If not on 'main', rename to 'main'
git branch -M main
```

### Push to GitHub

```bash
# Push to GitHub
git push -u origin main

# You may be prompted for GitHub credentials
# Use Personal Access Token (not password)
```

---

## 5️⃣ Set Up GitHub Personal Access Token (if needed)

If push fails due to authentication:

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "NGO Platform Deployment"
4. Scopes: Check `repo` (full control of private repositories)
5. Generate token
6. **Copy token** (you won't see it again)
7. Use token as password when pushing:
   ```bash
   git push -u origin main
   Username: YOUR_USERNAME
   Password: ghp_YOUR_TOKEN_HERE
   ```

### Or Configure Git Credential Helper

```bash
# macOS (use Keychain)
git config --global credential.helper osxkeychain

# Then push again - credentials will be saved
git push -u origin main
```

---

## 6️⃣ Verify Repository on GitHub

1. Go to `https://github.com/YOUR_USERNAME/ngo-donation-platform`
2. Verify files are present:
   - ✅ `foundation-backend/`
   - ✅ `foundation-frontend/`
   - ✅ `docs/DEPLOYMENT.md`
   - ✅ `README.md`
   - ✅ `.gitignore`
3. Verify secrets are NOT present:
   - ❌ `.env` files should NOT be visible
   - ❌ Real passwords/keys should NOT be in `application.yml`

---

## 7️⃣ Add Environment Variables to Hosting

### For Backend (Render/Railway)

Add these environment variables in your hosting dashboard:

```bash
DATABASE_URL=jdbc:postgresql://your-db-host/ngo_donations
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
STRIPE_SECRET_KEY=sk_test_or_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=https://your-frontend-url.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password
```

### For Frontend (Netlify/Vercel)

Add this environment variable:

```bash
VITE_API_BASE_URL=https://your-backend-url.com/api
```

---

## 8️⃣ Set Up Branch Protection (Optional but Recommended)

### On GitHub:

1. Repository → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
3. Save changes

---

## 🔄 Ongoing Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make your changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# Merge after review
```

### Pulling Updates

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main
```

### Deploy Updates

Most hosting services auto-deploy on push to `main`:
- **Netlify/Vercel:** Auto-deploy on push
- **Render:** Auto-deploy on push (if enabled)
- **Railway:** Auto-deploy on push

---

## 🔐 Security Checklist

Before pushing:

- [ ] All `.env` files are in `.gitignore`
- [ ] `application.yml` only has environment variable placeholders
- [ ] No hardcoded API keys in code
- [ ] No real database credentials in repository
- [ ] `.env.example` files have placeholder values only
- [ ] Email passwords are not committed

After pushing:

- [ ] Verify secrets are not visible on GitHub
- [ ] Add environment variables to hosting services
- [ ] Rotate any exposed credentials immediately
- [ ] Enable 2FA on GitHub account

---

## 📁 Expected Repository Structure on GitHub

```
ngo-donation-platform/
├── .github/                    # (Optional) GitHub Actions workflows
├── .gitignore                 # Root gitignore
├── README.md                   # Main documentation
├── start-all.sh               # Start script
├── docs/
│   └── DEPLOYMENT.md          # Deployment guide
├── foundation-backend/
│   ├── .gitignore
│   ├── .env.example           # ✅ Template only
│   ├── README.md
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   └── resources/
│       │       └── application.yml  # ✅ No real secrets
│       └── test/
└── foundation-frontend/
    ├── .gitignore
    ├── .env.example           # ✅ Template only
    ├── README.md
    ├── package.json
    ├── vite.config.ts
    └── src/
```

---

## 🐛 Troubleshooting

### Git Push Fails with "Permission Denied"

**Solution:** Use Personal Access Token instead of password
1. Generate token at [github.com/settings/tokens](https://github.com/settings/tokens)
2. Use token as password when pushing

### "Remote Already Exists" Error

```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/ngo-donation-platform.git
```

### Accidentally Committed Secrets

**CRITICAL:** If you accidentally commit secrets:

```bash
# If not pushed yet:
git reset --soft HEAD~1  # Undo last commit
# Remove secrets, then commit again

# If already pushed:
1. Rotate ALL exposed credentials immediately
2. Remove from git history:
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch path/to/secret-file" \
   --prune-empty --tag-name-filter cat -- --all
3. Force push: git push origin --force --all
```

### Large Files Error

```bash
# If you hit GitHub's 100MB file limit:
# Add to .gitignore:
echo "foundation-backend/target/" >> .gitignore
echo "foundation-frontend/node_modules/" >> .gitignore

# Remove from git cache
git rm -r --cached foundation-backend/target
git rm -r --cached foundation-frontend/node_modules

# Commit and push
git commit -m "Remove build artifacts"
git push origin main
```

---

## 📞 Next Steps

After successful push:

1. ✅ Verify repository on GitHub
2. 🚀 Follow [DEPLOYMENT.md](../docs/DEPLOYMENT.md) to deploy
3. 🔌 Configure Stripe webhooks
4. 📧 Test complete donation flow
5. 🎉 Share your project!

---

**Questions? Check [README.md](../README.md) or open an issue on GitHub.**
