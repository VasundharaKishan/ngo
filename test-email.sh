#!/bin/bash

# Test email delivery by creating a donation with email
# This will trigger the full email flow: donor receipt + admin notification

echo "🧪 Testing email delivery to kishankumarnaukri@gmail.com"
echo "=================================================="
echo ""

# Create a test donation with email
response=$(curl -s -X POST http://localhost:8080/api/donations/stripe/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "donorName": "Test Donor",
    "donorEmail": "kishankumarnaukri@gmail.com",
    "campaignId": "camp-food-002"
  }')

echo "API Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Extract session URL if successful
sessionUrl=$(echo "$response" | jq -r '.sessionUrl' 2>/dev/null)

if [ "$sessionUrl" != "null" ] && [ -n "$sessionUrl" ]; then
    echo "✅ Checkout session created successfully!"
    echo "🔗 Session URL: $sessionUrl"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open the session URL in your browser"
    echo "2. Complete the payment with test card: 4242 4242 4242 4242"
    echo "3. Check backend logs for email sending status"
    echo "4. Check kishankumarnaukri@gmail.com inbox for emails"
    echo ""
    echo "🔍 Watch backend logs:"
    echo "   tail -f /Users/e141057/Desktop/work/foundation/ngo/foundation-backend/logs/spring.log | grep -i email"
else
    echo "❌ Failed to create checkout session"
    echo "Check if backend is running on port 8080"
fi
