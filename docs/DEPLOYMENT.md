# 🚀 Deployment Guide

Complete deployment guide for the NGO Donation Platform.

## Table of Contents

- [Local Development](#local-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Stripe Webhook Setup](#stripe-webhook-setup)
- [Environment Variables](#environment-variables)

---

## 📍 Local Development

### Backend

```bash
cd foundation-backend

# 1. Setup PostgreSQL
createdb ngo_donations

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with local values:
DATABASE_URL=jdbc:postgresql://localhost:5432/ngo_donations
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
STRIPE_SECRET_KEY=sk_test_xxx  # From Stripe Dashboard
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_password

# 4. Start Stripe CLI for webhooks
stripe login
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook
# Copy webhook secret (whsec_xxx) to .env

# 5. Run backend
mvn spring-boot:run
```

### Frontend

```bash
cd foundation-frontend

# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env (default should work)
VITE_API_BASE_URL=http://localhost:8080/api

# 4. Run frontend
npm run dev
```

Visit `http://localhost:5173`

---

## 🌐 Staging Deployment

### Backend (Render)

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New → Web Service
   - Connect GitHub repository

2. **Configure Service:**
   ```
   Name: ngo-backend-staging
   Root Directory: foundation-backend
   Environment: Docker OR:
     - Build Command: mvn clean package -DskipTests
     - Start Command: java -jar target/school-donation-backend-1.0.0-SNAPSHOT.jar
   Instance Type: Free (or Starter)
   ```

3. **Add PostgreSQL Database:**
   - Render Dashboard → New → PostgreSQL
   - Name: `ngo-database-staging`
   - Plan: Free
   - Copy connection details

4. **Environment Variables:**
   ```
   DATABASE_URL=<from Render PostgreSQL - Internal Database URL>
   DATABASE_USERNAME=<from Render PostgreSQL>
   DATABASE_PASSWORD=<from Render PostgreSQL>
   SQL_INIT_MODE=never
   FRONTEND_URL=https://ngo-staging.netlify.app
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_staging_xxx
   STRIPE_SUCCESS_URL=https://ngo-staging.netlify.app/donate/success?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=https://ngo-staging.netlify.app/donate/cancel
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your_app_password
   ```

5. **Deploy** - Render will auto-deploy from `main` branch

6. **Get Backend URL:** `https://ngo-backend-staging.onrender.com`

### Frontend (Netlify)

1. **Import Project:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Add new site → Import from Git
   - Connect GitHub repository

2. **Build Settings:**
   ```
   Base directory: foundation-frontend
   Build command: npm run build
   Publish directory: foundation-frontend/dist
   ```

3. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://ngo-backend-staging.onrender.com/api
   ```

4. **Deploy Settings:**
   - Branch: `main`
   - Deploy previews: Enable for pull requests

5. **Custom Domain** (optional):
   - Domain settings → Add custom domain
   - Example: `staging.yourngodomain.org`

### Stripe Webhook (Staging)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint:
   - URL: `https://ngo-backend-staging.onrender.com/api/donations/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
3. Copy signing secret
4. Add to Render backend env vars: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
5. Restart backend service

---

## 🏢 Production Deployment

### Backend (Railway)

1. **Create Project:**
   - Go to [Railway Dashboard](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository

2. **Configure Service:**
   ```
   Root Directory: foundation-backend
   Start Command: Auto-detected
   ```

3. **Add PostgreSQL:**
   - Add Plugin → PostgreSQL
   - Railway auto-injects `DATABASE_URL`

4. **Environment Variables:**
   ```
   SQL_INIT_MODE=never
   FRONTEND_URL=https://yourngodomain.org
   STRIPE_SECRET_KEY=sk_live_xxx  # PRODUCTION KEY
   STRIPE_WEBHOOK_SECRET=whsec_production_xxx
   STRIPE_SUCCESS_URL=https://yourngodomain.org/donate/success?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=https://yourngodomain.org/donate/cancel
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your_app_password
   ```

5. **Custom Domain:**
   - Settings → Domains → Add custom domain
   - Example: `api.yourngodomain.org`
   - Add CNAME record in your DNS

### Frontend (Vercel)

1. **Import Project:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Add New → Project
   - Import GitHub repository

2. **Project Settings:**
   ```
   Framework Preset: Vite
   Root Directory: foundation-frontend
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Environment Variables:**
   ```
   Production:
   VITE_API_BASE_URL=https://api.yourngodomain.org/api
   
   Preview:
   VITE_API_BASE_URL=https://ngo-backend-staging.onrender.com/api
   ```

4. **Custom Domain:**
   - Project Settings → Domains
   - Add: `yourngodomain.org`
   - Follow DNS configuration steps

5. **Deploy:**
   - Vercel auto-deploys from `main` branch
   - Preview deployments for PRs

### Stripe Webhook (Production)

⚠️ **CRITICAL: Use LIVE MODE in Stripe Dashboard**

1. Switch to [Live Mode](https://dashboard.stripe.com/webhooks)
2. Add endpoint:
   - URL: `https://api.yourngodomain.org/api/donations/stripe/webhook`
   - Events: (same as staging)
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
3. Copy **LIVE** signing secret
4. Update Railway env var: `STRIPE_WEBHOOK_SECRET=whsec_live_xxx`
5. Redeploy backend

---

## 🔌 Stripe Webhook Setup

### Development (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook

# Output:
# > Ready! Your webhook signing secret is whsec_xxxxx

# Copy secret to backend .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Test
stripe trigger checkout.session.completed
```

### Staging/Production (Dashboard)

1. **Stripe Dashboard → Webhooks**
2. **Add Endpoint:**
   - Staging: `https://staging-backend-url/api/donations/stripe/webhook`
   - Production: `https://production-backend-url/api/donations/stripe/webhook`

3. **Select Events:**
   ```
   checkout.session.completed
   checkout.session.async_payment_succeeded
   checkout.session.async_payment_failed
   checkout.session.expired
   ```

4. **Copy Signing Secret:**
   - Format: `whsec_xxxxx`
   - Add to backend environment variables

5. **Test Webhook:**
   - Send test webhook from Stripe Dashboard
   - Check backend logs for webhook receipt
   - Verify donation status updates in admin panel

---

## 🔐 Environment Variables Reference

### Backend

| Variable | Local | Staging | Production | Notes |
|----------|-------|---------|------------|-------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/ngo_donations` | From Render | From Railway | PostgreSQL connection |
| `DATABASE_USERNAME` | `postgres` | From Render | Auto (Railway) | Database user |
| `DATABASE_PASSWORD` | Local password | From Render | Auto (Railway) | Database password |
| `SQL_INIT_MODE` | `always` | `never` | `never` | Load sample data |
| `FRONTEND_URL` | `http://localhost:5173` | Staging URL | Production URL | CORS origin |
| `STRIPE_SECRET_KEY` | `sk_test_xxx` | `sk_test_xxx` | `sk_live_xxx` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | From CLI | From Dashboard (test) | From Dashboard (live) | Webhook signing |
| `MAIL_USERNAME` | Gmail | Gmail | Gmail | SMTP username |
| `MAIL_PASSWORD` | App password | App password | App password | Gmail app password |

### Frontend

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Staging backend URL | Production backend URL |

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Remove all hardcoded secrets from code
- [ ] Test locally with production-like config
- [ ] Run all tests: `mvn test` and `npm run build`
- [ ] Update CORS origins in backend
- [ ] Generate Gmail app password
- [ ] Get Stripe API keys (test for staging, live for production)

### Backend Deployment

- [ ] Create database (PostgreSQL)
- [ ] Deploy backend service
- [ ] Set all environment variables
- [ ] Verify health check: `https://your-backend/actuator/health`
- [ ] Check logs for startup errors
- [ ] Test API endpoint: `https://your-backend/api/campaigns`

### Frontend Deployment

- [ ] Deploy frontend
- [ ] Set `VITE_API_BASE_URL` environment variable
- [ ] Verify build succeeds
- [ ] Test frontend loads: `https://your-frontend`
- [ ] Test API connection (check browser console)

### Stripe Webhook

- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Copy signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to backend
- [ ] Restart backend service
- [ ] Send test webhook from Stripe Dashboard
- [ ] Verify webhook receipt in backend logs
- [ ] Make test donation and verify status updates

### Post-Deployment

- [ ] Test complete donation flow
- [ ] Test admin login
- [ ] Verify emails are sent
- [ ] Check database for donations
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring (UptimeRobot, etc.)

---

## 🐛 Troubleshooting

### Webhook Failures

**Symptom:** Donations remain PENDING

**Check:**
1. Backend logs for webhook receipt
2. Stripe Dashboard → Webhooks → Attempts
3. Webhook signing secret is correct
4. Backend is publicly accessible

**Fix:**
```bash
# Test webhook endpoint
curl -X POST https://your-backend/api/donations/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return 400 (signature invalid), not 404
```

### CORS Errors

**Symptom:** Frontend can't reach backend

**Check:**
1. `FRONTEND_URL` in backend env vars
2. Backend CORS configuration
3. Browser console for exact error

**Fix:**
Update `application.yml` or backend env vars with correct frontend URL.

### Database Connection Issues

**Symptom:** Backend fails to start

**Check:**
1. `DATABASE_URL` format is correct
2. Database is running and accessible
3. Username/password are correct
4. SSL mode matches database requirements

### Build Failures

**Frontend:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Backend:**
```bash
mvn clean install -U
```

---

## 📊 Monitoring

### Logs

**Render:** View logs in dashboard or:
```bash
render logs <service-name>
```

**Railway:** View logs in dashboard

**Netlify/Vercel:** Function logs and deploy logs in dashboard

### Health Checks

- Backend: `https://your-backend/actuator/health`
- Frontend: Load homepage
- Database: Check connection from backend logs

---

## 🔄 CI/CD (Optional)

Add GitHub Actions for automated deployment:

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: curl https://api.render.com/deploy/your-hook-url
```

---

**Questions? Check main [README.md](../README.md) or open an issue.**
