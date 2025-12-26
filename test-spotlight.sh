#!/bin/bash

# Spotlight Campaign Feature - Manual Test Script
# Run this after backend is started with database credentials

BASE_URL="http://localhost:8080/api"
ADMIN_TOKEN=""

echo "🧪 Spotlight Campaign Feature - Manual Testing"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Public endpoint - No spotlight set
echo "Test 1: Public endpoint without spotlight"
echo "GET ${BASE_URL}/config/public/donate-popup"
response=$(curl -s "${BASE_URL}/config/public/donate-popup")
echo "$response" | python3 -m json.tool 2>/dev/null
mode=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('mode', 'N/A'))" 2>/dev/null)
if [ "$mode" == "FALLBACK" ]; then
    echo -e "${GREEN}✓ PASS: Returns fallback campaign${NC}"
else
    echo -e "${RED}✗ FAIL: Expected FALLBACK mode${NC}"
fi
echo ""

# Test 2: Get all campaigns
echo "Test 2: List all campaigns (to get IDs for testing)"
echo "GET ${BASE_URL}/campaigns"
campaigns=$(curl -s "${BASE_URL}/campaigns")
campaign_id=$(echo "$campaigns" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if data else 'none')" 2>/dev/null)
echo "First campaign ID: $campaign_id"
echo ""

# Test 3: Admin login (you'll need to update credentials)
echo "Test 3: Admin login"
echo "POST ${BASE_URL}/admin/auth/login"
read -p "Enter admin username [admin]: " admin_user
admin_user=${admin_user:-admin}
read -s -p "Enter admin password: " admin_pass
echo ""
login_response=$(curl -s -X POST "${BASE_URL}/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${admin_user}\",\"password\":\"${admin_pass}\"}")

ADMIN_TOKEN=$(echo "$login_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ PASS: Admin login successful${NC}"
    echo "Token: ${ADMIN_TOKEN:0:20}..."
else
    echo -e "${RED}✗ FAIL: Admin login failed${NC}"
    echo "Response: $login_response"
    exit 1
fi
echo ""

# Test 4: Get current spotlight settings
echo "Test 4: Get current spotlight settings"
echo "GET ${BASE_URL}/admin/config/donate-popup"
settings=$(curl -s "${BASE_URL}/admin/config/donate-popup" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")
echo "$settings" | python3 -m json.tool 2>/dev/null
echo ""

# Test 5: Set spotlight to first campaign
echo "Test 5: Set spotlight campaign"
echo "PUT ${BASE_URL}/admin/config/donate-popup"
echo "Setting spotlight to: $campaign_id"
update_response=$(curl -s -X PUT "${BASE_URL}/admin/config/donate-popup" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\":\"${campaign_id}\"}")
echo "$update_response" | python3 -m json.tool 2>/dev/null

spotlight_id=$(echo "$update_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('spotlightCampaignId', 'N/A'))" 2>/dev/null)
if [ "$spotlight_id" == "$campaign_id" ]; then
    echo -e "${GREEN}✓ PASS: Spotlight campaign set successfully${NC}"
else
    echo -e "${RED}✗ FAIL: Spotlight not set correctly${NC}"
fi
echo ""

# Test 6: Public endpoint - With spotlight set
echo "Test 6: Public endpoint with spotlight set"
echo "GET ${BASE_URL}/config/public/donate-popup"
response=$(curl -s "${BASE_URL}/config/public/donate-popup")
echo "$response" | python3 -m json.tool 2>/dev/null
mode=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('mode', 'N/A'))" 2>/dev/null)
returned_id=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('campaign', {}).get('id', 'N/A'))" 2>/dev/null)

if [ "$mode" == "SPOTLIGHT" ] && [ "$returned_id" == "$campaign_id" ]; then
    echo -e "${GREEN}✓ PASS: Returns spotlight campaign${NC}"
else
    echo -e "${RED}✗ FAIL: Expected SPOTLIGHT mode with campaign $campaign_id${NC}"
fi
echo ""

# Test 7: Clear spotlight
echo "Test 7: Clear spotlight"
echo "PUT ${BASE_URL}/admin/config/donate-popup (campaignId: null)"
clear_response=$(curl -s -X PUT "${BASE_URL}/admin/config/donate-popup" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":null}')
echo "$clear_response" | python3 -m json.tool 2>/dev/null

spotlight_id=$(echo "$clear_response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('spotlightCampaignId', 'cleared'))" 2>/dev/null)
if [ "$spotlight_id" == "None" ] || [ "$spotlight_id" == "null" ] || [ "$spotlight_id" == "cleared" ]; then
    echo -e "${GREEN}✓ PASS: Spotlight cleared successfully${NC}"
else
    echo -e "${RED}✗ FAIL: Spotlight not cleared${NC}"
fi
echo ""

# Test 8: Public endpoint - After clearing spotlight
echo "Test 8: Public endpoint after clearing spotlight"
echo "GET ${BASE_URL}/config/public/donate-popup"
response=$(curl -s "${BASE_URL}/config/public/donate-popup")
echo "$response" | python3 -m json.tool 2>/dev/null
mode=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('mode', 'N/A'))" 2>/dev/null)
if [ "$mode" == "FALLBACK" ]; then
    echo -e "${GREEN}✓ PASS: Returns fallback after clearing${NC}"
else
    echo -e "${RED}✗ FAIL: Expected FALLBACK mode${NC}"
fi
echo ""

# Test 9: Invalid campaign ID
echo "Test 9: Try to set invalid campaign ID"
echo "PUT ${BASE_URL}/admin/config/donate-popup (invalid ID)"
error_response=$(curl -s -w "\n%{http_code}" -X PUT "${BASE_URL}/admin/config/donate-popup" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"invalid-campaign-id"}')

http_code=$(echo "$error_response" | tail -n1)
if [ "$http_code" == "400" ]; then
    echo -e "${GREEN}✓ PASS: Returns 400 for invalid campaign${NC}"
else
    echo -e "${YELLOW}⚠ WARNING: Expected 400 status code, got ${http_code}${NC}"
fi
echo ""

# Summary
echo "=============================================="
echo "✅ Testing Complete!"
echo ""
echo "Next steps:"
echo "1. Test frontend: npm run dev"
echo "2. Click 'Donate Now' button"
echo "3. Navigate to /admin/donate-popup-settings"
echo "4. Select a campaign and save"
echo "5. Click 'Donate Now' again to see spotlight"
echo ""
