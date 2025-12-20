#!/bin/bash

echo "🔍 Webhook Connectivity Test"
echo "=============================="
echo ""

# Test 1: Check if backend is running
echo "Test 1: Backend running on port 8080?"
if curl -s http://localhost:8080/api/campaigns > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo "   Start with: cd foundation-backend && ./start-backend.sh"
    exit 1
fi
echo ""

# Test 2: Check if webhook endpoint exists
echo "Test 2: Webhook endpoint accessible?"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/donations/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{}' 2>&1)

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Webhook endpoint exists (returns 400 for invalid signature)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Webhook endpoint NOT FOUND (404)"
    echo "   Check controller mapping"
    exit 1
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "⚠️  Webhook endpoint is BLOCKED by authentication ($HTTP_CODE)"
    echo "   Check SecurityConfig.java"
    exit 1
else
    echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
fi
echo ""

# Test 3: Check webhook secret configuration
echo "Test 3: Webhook secret configured?"
if grep -q "webhook-secret: whsec_" foundation-backend/src/main/resources/application.yml; then
    SECRET=$(grep "webhook-secret:" foundation-backend/src/main/resources/application.yml | cut -d' ' -f4)
    if [ "$SECRET" = "whsec_placeholder" ]; then
        echo "⚠️  Using placeholder webhook secret"
        echo "   Update with: stripe listen output or Stripe Dashboard"
    else
        echo "✅ Webhook secret configured"
    fi
else
    echo "❌ Webhook secret not found in application.yml"
fi
echo ""

# Test 4: Check if Stripe CLI is installed
echo "Test 4: Stripe CLI installed?"
if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI is installed"
    STRIPE_VERSION=$(stripe --version 2>&1)
    echo "   Version: $STRIPE_VERSION"
else
    echo "❌ Stripe CLI is NOT installed"
    echo "   Install with: brew install stripe/stripe-cli/stripe"
fi
echo ""

# Test 5: Show Stripe CLI command
echo "=============================="
echo "🚀 Next Steps for Local Development:"
echo ""
echo "1. Start Stripe CLI forwarding:"
echo "   stripe listen --forward-to http://localhost:8080/api/donations/stripe/webhook"
echo ""
echo "2. Copy the webhook secret (whsec_xxx) from CLI output"
echo ""
echo "3. Update application.yml:"
echo "   stripe.webhook-secret: whsec_YOUR_SECRET"
echo ""
echo "4. Restart backend"
echo ""
echo "5. Test donation at http://localhost:5173"
echo ""
echo "6. Watch webhook logs in:"
echo "   - Stripe CLI terminal"
echo "   - Backend logs (look for ✅ WEBHOOK REQUEST RECEIVED)"
echo ""
