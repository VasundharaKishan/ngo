# Stripe Webhook Local Development Setup

## 🚨 CRITICAL: Webhooks Cannot Reach Localhost Directly

**Stripe webhooks CANNOT reach `http://localhost:8080` from the internet.** Your local development server is not publicly accessible.

## Webhook Endpoint Configuration

### Current Setup
- **Backend URL (Local)**: `http://localhost:8080`
- **Webhook Endpoint Path**: `/api/donations/stripe/webhook`
- **Full Local URL**: `http://localhost:8080/api/donations/stripe/webhook`
- **Security**: ✅ Public endpoint (no authentication required)
- **CORS**: ✅ Configured for localhost:5173, 5174, 3000

### Security Configuration Status
✅ **Webhook endpoint is PUBLIC and accessible**

In `SecurityConfig.java` (Line 36):
```java
.requestMatchers("/api/donations/**").permitAll()
```

This means:
- No authentication required
- No JWT token needed
- Stripe can POST directly to the endpoint
- Security is handled by Stripe signature verification in the controller

## 🛠️ Local Development Options

### Option 1: Stripe CLI (RECOMMENDED) ⭐

The Stripe CLI forwards webhook events from Stripe to your local server.

#### Step 1: Install Stripe CLI

**macOS (Homebrew)**:
```bash
brew install stripe/stripe-cli/stripe
```

**Manual Installation**: Download from https://stripe.com/docs/stripe-cli

#### Step 2: Authenticate with Stripe
```bash
stripe login
```
This opens a browser to authorize the CLI with your Stripe account.

#### Step 3: Start Webhook Forwarding
```bash
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook
```

**Expected Output**:
```
> Ready! You are using Stripe API Version [2024-12-18]. Your webhook signing secret is whsec_xxx (^C to quit)
```

#### Step 4: Update application.yml with CLI Webhook Secret

The CLI provides a **temporary webhook secret** (starts with `whsec_`). Copy it and update:

**foundation-backend/src/main/resources/application.yml**:
```yaml
stripe:
  webhook-secret: whsec_YOUR_CLI_SECRET_HERE
```

Or set as environment variable:
```bash
export STRIPE_WEBHOOK_SECRET=whsec_YOUR_CLI_SECRET_HERE
./start-backend.sh
```

#### Step 5: Test with Real Stripe Events

**Option A: Trigger event through your app**
1. Make a test donation at http://localhost:5173
2. Complete checkout
3. See webhook events in CLI terminal AND backend logs

**Option B: Trigger event with CLI**
```bash
stripe trigger checkout.session.completed
```

**Option C: Replay specific event**
```bash
stripe events list --limit 10
stripe events resend evt_xxxxx
```

### Verification Checklist

When webhook is received, you should see in **backend logs**:
```
========================================
[Webhook] ✅ WEBHOOK REQUEST RECEIVED
[Webhook] Endpoint: POST /api/donations/stripe/webhook
[Webhook] Payload size: 1234 bytes
[Webhook] Has Stripe-Signature header: true
========================================
[Webhook] Processing event: checkout.session.completed (ID: evt_xxxxx)
```

And in **Stripe CLI terminal**:
```
2025-12-19 17:30:15   --> checkout.session.completed [evt_xxxxx]
2025-12-19 17:30:15  <--  [200] POST http://localhost:8080/api/donations/stripe/webhook [evt_xxxxx]
```

---

### Option 2: ngrok (Alternative)

If you need a public URL (e.g., for mobile testing or webhook debugging from Stripe Dashboard):

#### Step 1: Install ngrok
```bash
brew install ngrok
```

#### Step 2: Start ngrok tunnel
```bash
ngrok http 8080
```

**Expected Output**:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8080
```

#### Step 3: Configure Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Set endpoint URL: `https://abc123.ngrok.io/api/donations/stripe/webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `checkout.session.async_payment_succeeded`
   - ✅ `checkout.session.async_payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

#### Step 4: Update application.yml
```yaml
stripe:
  webhook-secret: whsec_YOUR_NGROK_SECRET_HERE  # From Stripe Dashboard
```

⚠️ **Limitations**:
- ngrok URL changes on restart (unless paid plan)
- Must update Stripe Dashboard webhook URL every time
- Stripe CLI is easier for local dev

---

## 🔍 Troubleshooting

### Webhook Never Fires

**Check 1: Is backend running?**
```bash
curl http://localhost:8080/api/campaigns
# Should return campaign data
```

**Check 2: Is webhook endpoint accessible?**
```bash
curl -X POST http://localhost:8080/api/donations/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{}'
```
Expected: `400 Bad Request` (signature invalid, but endpoint is reachable)
**NOT** 404 Not Found

**Check 3: Is Stripe CLI connected?**
```bash
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook
```
Should say "Ready!" not "Connection refused"

**Check 4: Check backend logs**
```bash
tail -f foundation-backend/backend.log
# or
cd foundation-backend && mvn spring-boot:run
```
Look for:
```
[Webhook] ✅ WEBHOOK REQUEST RECEIVED
```

**Check 5: Verify webhook secret matches**
- CLI provides temporary secret when you run `stripe listen`
- Must match `stripe.webhook-secret` in application.yml
- Mismatch = "Invalid signature" error

### Common Errors

**Error: "Invalid signature"**
- ❌ Webhook secret doesn't match
- ✅ Fix: Copy secret from `stripe listen` output to application.yml

**Error: "Connection refused"**
- ❌ Backend not running
- ✅ Fix: Start backend with `./start-backend.sh`

**Error: "404 Not Found"**
- ❌ Wrong webhook URL
- ✅ Fix: Verify path is `/api/donations/stripe/webhook`

**No webhook received (Stripe CLI shows 200)**
- ❌ Firewall blocking localhost
- ✅ Fix: Check firewall settings or use ngrok

---

## 📋 Production Deployment Checklist

When deploying to production, you must:

1. **Get Production Webhook Secret**
   - Go to https://dashboard.stripe.com/webhooks (LIVE mode)
   - Add endpoint: `https://yourdomain.com/api/donations/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
   - Copy webhook signing secret

2. **Set Production Environment Variables**
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From production webhook endpoint
   STRIPE_SUCCESS_URL=https://yourdomain.com/donate/success?session_id={CHECKOUT_SESSION_ID}
   STRIPE_CANCEL_URL=https://yourdomain.com/donate/cancel
   ```

3. **Test in Production**
   - Make test donation with real card (Stripe test mode if available)
   - Check Stripe Dashboard → Webhooks → Events
   - Verify donation status updates in admin dashboard

4. **Monitor Webhook Health**
   - Stripe Dashboard shows webhook delivery success rate
   - Set up alerts for failed webhooks
   - Monitor backend logs for webhook errors

---

## 🎯 Quick Start for Local Development

```bash
# Terminal 1: Start backend
cd foundation-backend
./start-backend.sh

# Terminal 2: Start Stripe CLI forwarding
stripe login
stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook

# Copy the webhook secret from Terminal 2 output
# Update application.yml:
# stripe.webhook-secret: whsec_xxxxx

# Restart backend (Ctrl+C in Terminal 1, then restart)

# Terminal 3: Start frontend
cd foundation-frontend
npm run dev

# Terminal 4: Test donation
# Go to http://localhost:5173
# Make a test donation
# Watch webhooks in Terminal 2 and backend logs in Terminal 1
```

---

## 🔐 Security Notes

### Webhook Signature Verification

✅ **Already implemented** in `StripeWebhookController.java`:
```java
try {
    event = Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
} catch (SignatureVerificationException e) {
    log.error("[Webhook] Invalid webhook signature - potential security issue", e);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
}
```

This ensures:
- Only requests from Stripe are processed
- Payload hasn't been tampered with
- Replay attacks are prevented

### Endpoint Security

The webhook endpoint is **intentionally public** because:
1. Stripe signs each request with a secret
2. Our code verifies the signature
3. Invalid signatures are rejected
4. No authentication token is needed

**DO NOT** add JWT authentication to webhook endpoint - Stripe can't provide your JWT tokens!

---

## 📊 Monitoring Webhook Events

### In Stripe Dashboard
https://dashboard.stripe.com/test/webhooks
- See all webhook deliveries
- Retry failed webhooks
- View request/response details

### In Backend Logs
Look for these patterns:

**Request received**:
```
[Webhook] ✅ WEBHOOK REQUEST RECEIVED
[Webhook] Endpoint: POST /api/donations/stripe/webhook
```

**Signature verified**:
```
[Webhook] Processing event: checkout.session.completed (ID: evt_xxxxx)
```

**Event processed**:
```
[Webhook] Payment completed immediately (payment_status=paid), marking donation don_123 as SUCCESS
[Webhook] Successfully marked donation don_123 as SUCCESS
```

**Error**:
```
[Webhook] Invalid webhook signature - potential security issue
```

---

## 🆘 Still Having Issues?

1. **Verify webhook endpoint is accessible**:
   ```bash
   curl -v http://localhost:8080/api/donations/stripe/webhook
   ```

2. **Check security filters aren't blocking**:
   - Endpoint at `/api/donations/**` is public
   - No authentication required
   - Should return 400 (bad request) not 401/403

3. **Enable debug logging**:
   ```yaml
   logging:
     level:
       com.myfoundation.school.webhook: DEBUG
   ```

4. **Test with Stripe CLI trigger**:
   ```bash
   stripe trigger checkout.session.completed
   ```

5. **Check Stripe CLI logs** for HTTP errors

If webhook shows `[200]` in Stripe CLI but nothing in backend logs:
- Backend might not be running on port 8080
- Check `lsof -i :8080` to verify process
- Check firewall/antivirus isn't blocking localhost connections
