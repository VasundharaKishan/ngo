# 🚀 Quick Deployment Summary

## Files Created

✅ **Backend Files:**
- [`Dockerfile`](foundation-backend/Dockerfile) - Multi-stage Docker build for Railway
- [`.dockerignore`](foundation-backend/.dockerignore) - Excludes unnecessary files from Docker build
- [`railway.json`](foundation-backend/railway.json) - Railway configuration

✅ **Frontend Files:**
- [`vercel.json`](foundation-frontend/vercel.json) - Vercel deployment configuration

✅ **CI/CD Files:**
- [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml) - Auto-deploy frontend to Vercel
- [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml) - Auto-deploy backend to Railway

✅ **Documentation:**
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Complete step-by-step deployment guide

---

## 🎯 Recommended Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Vercel    │   →     │   Railway    │   →     │   Neon DB    │
│  (Frontend) │  HTTPS  │  (Backend)   │  SSL    │ (PostgreSQL) │
│   React +   │         │  Spring Boot │         │              │
│    Vite     │         │   + Docker   │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
       ↓                       ↑
       │                       │
       │                  ┌────┴─────┐
       └──────────────────┤  Stripe  │
                          │ Webhooks │
                          └──────────┘
```

---

## 🏆 Why This Setup?

### Frontend: Vercel
✅ **Best Vite integration** - Zero configuration  
✅ **Instant deployments** - <30 seconds  
✅ **Global CDN** - Fast everywhere  
✅ **Free tier** - 100GB bandwidth/month  
✅ **Automatic HTTPS** - SSL certificates included  

### Backend: Railway
✅ **Docker-first** - Matches your Spring Boot setup  
✅ **$5/month credit** - Covers ~500 hours (more than enough)  
✅ **No cold starts** - Unlike Render free tier  
✅ **Automatic HTTPS** - SSL included  
✅ **PostgreSQL support** - Easy Neon integration  

---

## ⚡ Quick Start

### 1. Test Docker Build Locally (Optional)

```bash
cd foundation-backend

# Build Docker image
docker build -t ngo-backend .

# Run locally
docker run -p 8080:8080 \
  -e DATABASE_URL="jdbc:postgresql://..." \
  -e DATABASE_USERNAME="..." \
  -e DATABASE_PASSWORD="..." \
  -e STRIPE_SECRET_KEY="sk_test_..." \
  ngo-backend

# Test health endpoint
curl http://localhost:8080/actuator/health
```

### 2. Deploy Backend (Railway)

1. Sign up: https://railway.app
2. New Project → Deploy from GitHub
3. Select `foundation-backend` directory
4. Add environment variables (see [DEPLOYMENT.md](DEPLOYMENT.md))
5. Copy Railway URL: `https://your-backend.up.railway.app`

### 3. Deploy Frontend (Vercel)

1. Sign up: https://vercel.com
2. Import Project → Select `foundation-frontend`
3. Add env var: `VITE_API_BASE_URL=https://your-backend.up.railway.app/api`
4. Deploy

### 4. Configure Stripe Webhooks

1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.up.railway.app/api/donations/stripe/webhook`
3. Events: `checkout.session.*`
4. Copy webhook secret → Update Railway env var

---

## 📋 Environment Variables Reference

### Backend (Railway)

```env
# Database
DATABASE_URL=jdbc:postgresql://your-neon-db-url
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=your_password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_SUCCESS_URL=https://your-vercel-url/donate/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://your-vercel-url/donate/cancel

# CORS
FRONTEND_URL=https://your-vercel-url.vercel.app

# Email
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_gmail_app_password

# Database Init
SQL_INIT_MODE=never
```

### Frontend (Vercel)

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
```

---

## 🔍 Verification Steps

After deployment, verify:

1. **Backend Health Check**
   ```bash
   curl https://your-backend.up.railway.app/actuator/health
   # Should return: {"status":"UP"}
   ```

2. **Frontend Loads**
   - Visit your Vercel URL
   - Check browser console for errors
   - Verify campaigns load

3. **Test Donation Flow**
   - Make test donation
   - Use Stripe test card: `4242 4242 4242 4242`
   - Check webhook in Railway logs
   - Verify donation status = SUCCESS in admin

4. **Test Webhook**
   - Stripe Dashboard → Webhooks → Send test webhook
   - Check Railway logs for webhook receipt
   - Response should be 200 OK

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Webhook returns 400** | Update `STRIPE_WEBHOOK_SECRET` in Railway |
| **CORS error** | Set `FRONTEND_URL` to exact Vercel URL (no trailing slash) |
| **Database connection failed** | Check `DATABASE_URL` has `?sslmode=require` |
| **Email not sending** | Use Gmail App Password, not regular password |
| **Build fails** | Check Railway logs, verify Java 21 is specified |

---

## 💡 Pro Tips

1. **Use different Stripe webhooks for test/live**
   - Test mode → `whsec_test_...`
   - Live mode → `whsec_live_...`

2. **Monitor Railway usage**
   - Dashboard shows remaining free credit
   - Set up billing alerts

3. **Enable GitHub Actions**
   - Auto-deploy on push to main
   - See workflows in `.github/workflows/`

4. **Database backups**
   - Neon provides automatic backups
   - Consider manual exports for critical data

5. **Set `SQL_INIT_MODE=never` in production**
   - Prevents sample data from being reloaded

---

## 📚 Additional Resources

- [Complete Deployment Guide](DEPLOYMENT.md) - Detailed step-by-step instructions
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Ready to deploy? Follow the detailed guide in [DEPLOYMENT.md](DEPLOYMENT.md)**
