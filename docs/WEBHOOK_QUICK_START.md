# 🚀 Webhook Setup - Quick Reference Card

## ⚡ TL;DR - Get Webhooks Working in 3 Minutes

```bash
# 1. Install Stripe CLI (one-time)
brew install stripe/stripe-cli/stripe

# 2. Login to Stripe (one-time)
stripe login

# 3. Start forwarding (keep running while developing)
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook

# 4. Copy webhook secret from output (looks like: whsec_abc123...)

# 5. Set environment variable
export STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# 6. Restart backend
cd foundation-backend && ./start-backend.sh

# ✅ Done! Make a test donation and watch the magic happen.
```

---

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| Backend | http://localhost:8080 |
| Frontend | http://localhost:5173 |
| Webhook Endpoint | http://localhost:8080/api/donations/stripe/webhook |
| Stripe Dashboard | https://dashboard.stripe.com/test/webhooks |

---

## 🔍 Verification

### ✅ Success Indicators

**In Stripe CLI**:
```
--> checkout.session.completed [evt_xxxxx]
<-- [200] POST http://localhost:8080/api/donations/stripe/webhook
```

**In Backend Logs**:
```
========================================
[Webhook] ✅ WEBHOOK REQUEST RECEIVED
========================================
[Webhook] Successfully marked donation don_123 as SUCCESS
```

**In Admin Dashboard**:
- Donation status: SUCCESS ✅

---

## ❌ Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| "stripe: command not found" | `brew install stripe/stripe-cli/stripe` |
| "Connection refused" | Start backend: `./start-backend.sh` |
| "Invalid signature" | Update webhook secret from `stripe listen` output |
| CLI shows 200 but no backend logs | Check backend is running on port 8080 |
| No webhooks firing | Ensure `stripe listen` is running |

---

## 📂 Files Modified

1. ✅ **StripeWebhookController.java** - Added enhanced entry logging
2. ✅ **SecurityConfig.java** - Webhook endpoint is public (already correct)
3. ✅ **application.yml** - Webhook secret configured (needs update with real secret)

---

## 🎯 Testing

### Option 1: Real Donation
1. Go to http://localhost:5173
2. Add amount and donor info
3. Use test card: 4242 4242 4242 4242
4. Watch webhooks fire in Stripe CLI

### Option 2: CLI Trigger
```bash
stripe trigger checkout.session.completed
```

### Option 3: Replay Event
```bash
stripe events list --limit 5
stripe events resend evt_xxxxx
```

---

## 🔐 Security

✅ **Webhook endpoint is PUBLIC** (by design)
✅ **Protected by Stripe signature verification**
✅ **Invalid signatures are rejected**
✅ **No JWT token needed** (Stripe can't provide your tokens)

---

## 📞 Quick Commands

```bash
# Check backend status
curl http://localhost:8080/api/campaigns

# Test webhook endpoint
curl -X POST http://localhost:8080/api/donations/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{}'
# Expect: 400 Bad Request (endpoint exists)

# Run connectivity test
./test-webhook-connectivity.sh

# View backend logs
tail -f foundation-backend/backend.log

# Stop Stripe CLI
# Press Ctrl+C in terminal running stripe listen
```

---

## 🎓 Learn More

- [WEBHOOK_CONNECTIVITY_REPORT.md](WEBHOOK_CONNECTIVITY_REPORT.md) - Detailed analysis
- [WEBHOOK_LOCAL_DEV_SETUP.md](WEBHOOK_LOCAL_DEV_SETUP.md) - Complete setup guide
- [WEBHOOK_FIX_SUMMARY.md](WEBHOOK_FIX_SUMMARY.md) - Implementation details

---

**Need Help?** Run: `./test-webhook-connectivity.sh`
