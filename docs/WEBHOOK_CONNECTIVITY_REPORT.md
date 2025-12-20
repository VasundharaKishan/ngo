# 🔍 Webhook Connectivity Analysis Report

## Executive Summary

✅ **Webhook endpoint is configured and accessible**  
⚠️ **Local development requires Stripe CLI** (webhooks cannot reach localhost directly)  
✅ **Security configuration is correct** (public endpoint with signature verification)  
❌ **Stripe CLI not installed** - required for local testing

---

## Current Configuration

### Backend Server
- **URL**: `http://localhost:8080`
- **Status**: ✅ Running and accessible
- **Port**: 8080

### Webhook Endpoint
- **Path**: `/api/donations/stripe/webhook`
- **Method**: POST
- **Full URL**: `http://localhost:8080/api/donations/stripe/webhook`
- **Status**: ✅ Endpoint exists and returns 400 (signature verification)

### Security Status
✅ **Correctly configured as PUBLIC endpoint**

**In SecurityConfig.java (Line 36)**:
```java
.requestMatchers("/api/donations/**").permitAll()
```

**This means**:
- ✅ No authentication required
- ✅ No JWT token needed
- ✅ Stripe can POST directly
- ✅ Security via Stripe signature verification

### Webhook Secret Configuration
⚠️ **Using placeholder value**: `${STRIPE_WEBHOOK_SECRET:whsec_placeholder}`

**Location**: `foundation-backend/src/main/resources/application.yml` (Line 62)

**This means**:
- Environment variable `STRIPE_WEBHOOK_SECRET` not set
- Falls back to `whsec_placeholder` (invalid for production)
- Must be updated for webhook signature verification to work

---

## 🚨 Critical Issue: Localhost Cannot Receive Webhooks

### The Problem
**Stripe servers CANNOT send webhooks to `http://localhost:8080`**

**Why?**
- `localhost` only exists on your computer
- Stripe servers are on the internet
- They cannot access your local development server
- This is a fundamental networking limitation

### The Solution: Stripe CLI

The Stripe CLI creates a secure tunnel to forward webhook events from Stripe to your local server.

**How it works**:
```
Stripe Servers → Stripe CLI → Your Local Server
(Internet)      (Bridge)     (localhost:8080)
```

---

## ✅ Test Results

### Test 1: Backend Running
**Status**: ✅ PASS
```
curl http://localhost:8080/api/campaigns
```
Backend is accessible and responding.

### Test 2: Webhook Endpoint Exists
**Status**: ✅ PASS
```
POST http://localhost:8080/api/donations/stripe/webhook
HTTP Status: 400 (Bad Request - signature invalid)
```
This is CORRECT behavior:
- 400 = endpoint exists
- Signature verification working
- Would be 404 if endpoint didn't exist

### Test 3: Webhook Secret
**Status**: ⚠️ PLACEHOLDER
```yaml
webhook-secret: ${STRIPE_WEBHOOK_SECRET:whsec_placeholder}
```
Must be updated with real secret from Stripe CLI or Dashboard.

### Test 4: Stripe CLI
**Status**: ❌ NOT INSTALLED
```
stripe command not found
```

---

## 🛠️ Setup Instructions

### Step 1: Install Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
```

**Verify installation**:
```bash
stripe --version
```

### Step 2: Authenticate with Stripe

```bash
stripe login
```

This opens a browser to connect CLI to your Stripe account.

### Step 3: Start Webhook Forwarding

```bash
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook
```

**Expected output**:
```
> Ready! You are using Stripe API Version [2024-12-18]. 
> Your webhook signing secret is whsec_abc123xyz... (^C to quit)
```

**Copy the webhook secret** (starts with `whsec_`)

### Step 4: Update Webhook Secret

**Option A: Environment variable** (recommended):
```bash
export STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_FROM_CLI
cd foundation-backend && ./start-backend.sh
```

**Option B: Update application.yml**:
```yaml
stripe:
  webhook-secret: whsec_YOUR_SECRET_FROM_CLI
```
Then restart backend.

### Step 5: Test

**Option A: Real donation**:
1. Go to http://localhost:5173
2. Make a test donation
3. Watch Stripe CLI terminal for webhook delivery
4. Check backend logs for "✅ WEBHOOK REQUEST RECEIVED"

**Option B: Trigger test event**:
```bash
stripe trigger checkout.session.completed
```

---

## 📊 Verification Checklist

When webhook is working correctly, you should see:

### In Stripe CLI Terminal
```
2025-12-19 17:30:15   --> checkout.session.completed [evt_xxxxx]
2025-12-19 17:30:15  <--  [200] POST http://localhost:8080/api/donations/stripe/webhook [evt_xxxxx]
```

### In Backend Logs
```
========================================
[Webhook] ✅ WEBHOOK REQUEST RECEIVED
[Webhook] Endpoint: POST /api/donations/stripe/webhook
[Webhook] Payload size: 1234 bytes
[Webhook] Has Stripe-Signature header: true
========================================
[Webhook] Processing event: checkout.session.completed (ID: evt_xxxxx)
[Webhook] checkout.session.completed - sessionId: cs_..., payment_status: paid
[Webhook] Payment completed immediately (payment_status=paid), marking donation don_123 as SUCCESS
[Webhook] Successfully marked donation don_123 as SUCCESS
```

### In Admin Dashboard
- Donation status changes from PENDING → SUCCESS
- Amount is recorded correctly
- Donor information is displayed

---

## 🔍 Why Webhooks Might Never Fire

### Reason 1: ❌ Stripe CLI Not Running
**Symptom**: No events in Stripe CLI terminal  
**Fix**: Run `stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook`

### Reason 2: ❌ Wrong Webhook Secret
**Symptom**: Logs show "Invalid webhook signature"  
**Fix**: Copy secret from Stripe CLI output to application.yml or env variable

### Reason 3: ❌ Backend Not Running
**Symptom**: Stripe CLI shows "Connection refused"  
**Fix**: Start backend with `./start-backend.sh`

### Reason 4: ❌ Wrong Endpoint URL
**Symptom**: Stripe CLI shows 404  
**Fix**: Verify path is `/api/donations/stripe/webhook` not `/webhook`

### Reason 5: ❌ Firewall Blocking
**Symptom**: Stripe CLI shows 200 but no backend logs  
**Fix**: Check firewall settings or use ngrok

### Reason 6: ❌ Using Dashboard Webhook in Dev
**Symptom**: No webhook events for local donations  
**Fix**: Dashboard webhooks only work for deployed apps, use Stripe CLI for local

---

## 🚀 Quick Start Command Sequence

```bash
# Terminal 1: Start Backend
cd /Users/e141057/Desktop/work/ngo/foundation-backend
./start-backend.sh

# Terminal 2: Install & Start Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook

# Copy webhook secret from Terminal 2

# Terminal 3: Update Config & Restart Backend
export STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_FROM_TERMINAL_2
cd /Users/e141057/Desktop/work/ngo/foundation-backend
pkill -f spring-boot:run
./start-backend.sh

# Terminal 4: Start Frontend
cd /Users/e141057/Desktop/work/ngo/foundation-frontend
npm run dev

# Browser: Make Test Donation
# Open http://localhost:5173
# Make a test donation
# Watch Terminal 2 (Stripe CLI) for webhook events
# Watch Terminal 1 (Backend) for "✅ WEBHOOK REQUEST RECEIVED"
```

---

## 📝 Enhanced Logging

I've added detailed logging at the webhook entry point:

**Before**:
```java
log.info("[Webhook] Received Stripe webhook request");
```

**After**:
```java
log.info("========================================");
log.info("[Webhook] ✅ WEBHOOK REQUEST RECEIVED");
log.info("[Webhook] Endpoint: POST /api/donations/stripe/webhook");
log.info("[Webhook] Payload size: {} bytes", payload.length());
log.info("[Webhook] Has Stripe-Signature header: {}", sigHeader != null);
log.info("========================================");
```

This makes it **immediately obvious** when webhooks are being received.

---

## 🌐 Production Deployment

For production, you'll need:

1. **Public domain**: `https://yourdomain.com`
2. **Stripe Dashboard webhook**: Create at https://dashboard.stripe.com/webhooks
3. **Webhook URL**: `https://yourdomain.com/api/donations/stripe/webhook`
4. **Production webhook secret**: Different from CLI secret
5. **Environment variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_from_dashboard
   ```

---

## 📚 Additional Resources

- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Webhook Security**: https://stripe.com/docs/webhooks/signatures

---

## 🆘 Troubleshooting Script

Run the connectivity test anytime:
```bash
cd /Users/e141057/Desktop/work/ngo
./test-webhook-connectivity.sh
```

This checks:
- ✅ Backend running
- ✅ Webhook endpoint accessible
- ✅ Webhook secret configured
- ✅ Stripe CLI installed

---

## Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Backend Server | ✅ Running | None |
| Webhook Endpoint | ✅ Configured | None |
| Security Config | ✅ Public | None |
| Enhanced Logging | ✅ Added | None |
| Webhook Secret | ⚠️ Placeholder | Update from CLI |
| Stripe CLI | ❌ Not Installed | Install with brew |
| Forwarding | ❌ Not Running | Start `stripe listen` |

**Next Step**: Install Stripe CLI and start webhook forwarding.
