# ============================================
# DEPLOYMENT GUIDE
# ============================================
# Step-by-step deployment instructions for your NGO donation platform

## 📋 Prerequisites Checklist

- [ ] GitHub repository created and code pushed
- [ ] Stripe account created (get API keys from https://dashboard.stripe.com/test/apikeys)
- [ ] Neon Postgres database running (you already have this)
- [ ] Gmail App Password generated (for email notifications)

---

## 🚀 STEP 1: Deploy Backend to Railway

### A. Initial Railway Setup

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub (free $5/month credit)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `foundation-backend` directory

3. **Configure Service**
   - Railway auto-detects Dockerfile
   - Click on service → Settings
   - Root Directory: `foundation-backend`
   - Build Command: (auto-detected from Dockerfile)

4. **Add Environment Variables**
   
   Go to Variables tab and add these:

   ```
   DATABASE_URL=jdbc:postgresql://ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
   DATABASE_USERNAME=neondb_owner
   DATABASE_PASSWORD=npg_zC7GDKo2JeUq
   
   SQL_INIT_MODE=never
   
   FRONTEND_URL=https://your-vercel-url.vercel.app
   
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_local_secret_here
   
   STRIPE_SUCCESS_URL=https://your-vercel-url.vercel.app/donate/success?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=https://your-vercel-url.vercel.app/donate/cancel
   
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-gmail-app-password
   ```

5. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Copy the URL: `https://your-backend.up.railway.app`
   - **Save this URL** - you'll need it for frontend and Stripe webhooks

6. **Deploy**
   - Railway automatically deploys
   - Check logs for successful startup
   - Test health endpoint: `https://your-backend.up.railway.app/actuator/health`

---

## 🎨 STEP 2: Deploy Frontend to Vercel

### A. Initial Vercel Setup

1. **Sign up for Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub (free tier)

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Root Directory: `foundation-frontend`
   - Framework Preset: Vite (auto-detected)

3. **Configure Build Settings**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables**
   
   Go to Settings → Environment Variables:

   ```
   VITE_API_BASE_URL=https://your-backend.up.railway.app/api
   ```

   ⚠️ **IMPORTANT**: Use the Railway backend URL from Step 1.5

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Copy deployment URL: `https://your-project.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway
   - Update `FRONTEND_URL` env var to your Vercel URL
   - Railway will auto-redeploy

---

## 💳 STEP 3: Configure Stripe Webhooks

### A. Test Mode Setup (for testing)

1. **Go to Stripe Dashboard (Test Mode)**
   - https://dashboard.stripe.com/test/webhooks

2. **Add Endpoint**
   - Click "+ Add endpoint"
   - **Endpoint URL**: `https://your-backend.up.railway.app/api/donations/stripe/webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`

3. **Copy Webhook Secret**
   - After creating endpoint, reveal signing secret (starts with `whsec_`)
   - Go to Railway → Variables
   - Update `STRIPE_WEBHOOK_SECRET` with this value
   - Railway will auto-redeploy

4. **Test Webhook**
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Choose `checkout.session.completed`
   - Check Railway logs for successful webhook processing

### B. Production Mode Setup (when going live)

1. **Switch Stripe to Live Mode**
   - Toggle "Test mode" → "Live mode" in Stripe Dashboard

2. **Get Live API Keys**
   - https://dashboard.stripe.com/apikeys
   - Copy **Live Secret Key** (starts with `sk_live_`)

3. **Create Live Webhook Endpoint**
   - https://dashboard.stripe.com/webhooks
   - Same URL: `https://your-backend.up.railway.app/api/donations/stripe/webhook`
   - Same events (listed above)
   - Copy new webhook secret

4. **Update Railway Environment Variables**
   - `STRIPE_SECRET_KEY=sk_live_your_live_key`
   - `STRIPE_WEBHOOK_SECRET=whsec_your_live_secret`
   - Railway will auto-redeploy

---

## 🔄 STEP 4: Setup GitHub Actions (Optional - for CI/CD)

### A. Get Required Secrets

1. **Vercel Secrets**
   - Token: https://vercel.com/account/tokens → Create new token
   - Org ID: Vercel dashboard → Settings → General → Your org ID
   - Project ID: Vercel project → Settings → General → Project ID

2. **Railway Secrets**
   - Token: https://railway.app/account/tokens → Create new token
   - Service ID: Railway project → Service → Copy service ID from URL

### B. Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:

   **For Frontend:**
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   VITE_API_BASE_URL=https://your-backend.up.railway.app/api
   ```

   **For Backend:**
   ```
   RAILWAY_TOKEN=your_railway_token
   RAILWAY_SERVICE_ID=your_service_id
   ```

### C. Enable Workflows

The workflows are already in `.github/workflows/`:
- `deploy-frontend.yml` - Deploys frontend on changes
- `deploy-backend.yml` - Tests and deploys backend on changes

They will run automatically on push to main.

---

## ✅ DEPLOYMENT CHECKLIST

### Initial Deployment (Test Mode)

- [ ] Backend deployed to Railway
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads without errors
- [ ] Test donation with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify webhook processes in Railway logs
- [ ] Check donation appears in admin dashboard with SUCCESS status
- [ ] Test email notification sent

### Production Deployment (Live Mode)

- [ ] Switch Stripe to Live mode
- [ ] Update `STRIPE_SECRET_KEY` to live key in Railway
- [ ] Create live webhook endpoint in Stripe
- [ ] Update `STRIPE_WEBHOOK_SECRET` to live secret in Railway
- [ ] Update `SQL_INIT_MODE=never` in Railway (important!)
- [ ] Test with real card (small amount)
- [ ] Verify webhook works
- [ ] Verify email notification sent
- [ ] Monitor Railway logs for errors

---

## 🚨 COMMON MISTAKES TO AVOID

### 1. Webhook Configuration

❌ **WRONG**: Using localhost URL in Stripe webhooks  
✅ **CORRECT**: Use Railway public URL: `https://your-backend.up.railway.app/api/donations/stripe/webhook`

❌ **WRONG**: Forgetting to update `STRIPE_WEBHOOK_SECRET` after creating endpoint  
✅ **CORRECT**: Always copy and update webhook secret after creating endpoint

❌ **WRONG**: Testing webhooks with wrong mode (test key + live webhook)  
✅ **CORRECT**: Test mode keys → test webhooks, Live mode keys → live webhooks

### 2. CORS Issues

❌ **WRONG**: Forgetting to update `FRONTEND_URL` in Railway  
✅ **CORRECT**: Set `FRONTEND_URL=https://your-vercel-url.vercel.app` in Railway

### 3. Environment Variables

❌ **WRONG**: Hardcoding secrets in code or committing .env files  
✅ **CORRECT**: Use platform environment variables (Railway/Vercel dashboards)

❌ **WRONG**: Using test Stripe keys in production  
✅ **CORRECT**: Separate test and live keys, update when going live

### 4. Database Issues

❌ **WRONG**: Using `SQL_INIT_MODE=always` in production  
✅ **CORRECT**: Set `SQL_INIT_MODE=never` in production (prevents sample data reload)

### 5. Deployment Issues

❌ **WRONG**: Not checking logs after deployment  
✅ **CORRECT**: Always check Railway/Vercel logs for startup errors

❌ **WRONG**: Deploying untested code  
✅ **CORRECT**: Test locally with Stripe CLI before deploying

---

## 🧪 LOCAL → STAGING → PRODUCTION WORKFLOW

### Local Development

```bash
# 1. Start local Stripe CLI
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook

# 2. Copy webhook secret to backend .env
STRIPE_WEBHOOK_SECRET=whsec_local_secret_from_cli

# 3. Run backend
cd foundation-backend && mvn spring-boot:run

# 4. Run frontend
cd foundation-frontend && npm run dev

# 5. Test donation with test card: 4242 4242 4242 4242
```

### Staging (Railway + Vercel)

1. Push to feature branch: `git push origin feature/new-feature`
2. Create pull request
3. GitHub Actions run tests
4. Merge to main
5. Auto-deploy to Railway + Vercel
6. Test on staging URLs
7. Verify webhooks work

### Production (Go Live)

1. Ensure all staging tests pass
2. Switch Stripe to Live mode
3. Update Railway environment variables (live keys)
4. Create live webhook endpoint in Stripe
5. Test with real card (small amount)
6. Monitor for 24 hours
7. Announce to users

---

## 📊 MONITORING

### Railway Logs

```bash
# View live logs
railway logs --service backend

# Or in Railway dashboard: Service → Logs
```

### Vercel Logs

Go to Vercel dashboard → Project → Logs

### Stripe Webhooks

Stripe Dashboard → Webhooks → Your endpoint → View logs

---

## 🆘 TROUBLESHOOTING

### Webhook Not Receiving Events

1. Check webhook URL is correct (use Railway URL, not localhost)
2. Verify webhook secret is updated in Railway
3. Check Railway logs for incoming requests
4. Test with "Send test webhook" in Stripe Dashboard
5. Ensure Railway service is running (not sleeping)

### CORS Errors

1. Verify `FRONTEND_URL` matches your Vercel URL exactly
2. Check Railway logs for CORS-related errors
3. Ensure no trailing slash in URLs

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check Neon database is running
3. Ensure `sslmode=require` is in connection string
4. Check Railway logs for connection errors

### Email Not Sending

1. Verify Gmail App Password is correct (not regular password)
2. Check 2FA is enabled on Gmail account
3. Check Railway logs for SMTP errors
4. Test with a different email address

---

## 💰 COST BREAKDOWN (Free Tier)

| Service | Free Tier | Limits | Overage |
|---------|-----------|--------|---------|
| **Vercel** | Unlimited | 100GB bandwidth/month | $20/100GB |
| **Railway** | $5 credit/month | ~500 hours runtime | $0.01/hour |
| **Neon Postgres** | Free | 0.5GB storage | $15/month for 10GB |
| **Stripe** | Free | 2.9% + 30¢ per transaction | Same |
| **GitHub Actions** | 2000 min/month | Public repos unlimited | N/A |

**Estimated Monthly Cost**: $0 for low-traffic NGO site (under limits)

---

**🎉 You're all set! Your donation platform is now live and production-ready.**
