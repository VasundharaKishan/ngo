#!/bin/bash

# Direct email test to check Brevo configuration

echo "🧪 Testing direct email through Brevo SMTP..."
echo "=============================================="

# Test with curl to Brevo API
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "accept: application/json" \
  -H "api-key: xsmtpsib-1a62eb462fcce89fa2fd779e356c040fe53bb74272c047eaa078cf9cad570316-ggVElV7D90W6vmFl" \
  -H "content-type: application/json" \
  -d '{
    "sender": {
      "name": "Yugal Savitri Seva",
      "email": "donations@yugalsavitriseva.org"
    },
    "to": [
      {
        "email": "kishankumarnaukri@gmail.com",
        "name": "Test Recipient"
      }
    ],
    "subject": "Test Email from Brevo",
    "htmlContent": "<html><body><h1>Test Email</h1><p>This is a test email to verify Brevo configuration.</p></body></html>"
  }'

echo ""
echo "=============================================="
echo "Check the response above for any errors"
