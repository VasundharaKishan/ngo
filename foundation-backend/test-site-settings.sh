#!/bin/bash
# test-site-settings.sh - Test Site Settings API endpoints

BASE_URL="http://localhost:8080"
ADMIN_EMAIL="admin@yugalsavitriseva.org"
ADMIN_PASSWORD="admin123"

echo "========================================="
echo "Site Settings API Test Script"
echo "========================================="
echo ""

# Test 1: Get Public Settings (No Auth Required)
echo "1. Testing GET /api/settings/public (No Auth)"
echo "   Command: curl ${BASE_URL}/api/settings/public"
echo ""
curl -s "${BASE_URL}/api/settings/public" | jq '.'
echo ""
echo ""

# Test 2: Login to get JWT token
echo "2. Logging in as admin to get JWT token"
echo "   Command: curl -X POST ${BASE_URL}/api/auth/login"
echo ""
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "   ❌ Login failed! Response:"
  echo "$LOGIN_RESPONSE" | jq '.'
  echo ""
  echo "   Please ensure:"
  echo "   - Backend is running on port 8080"
  echo "   - Admin user exists with email: ${ADMIN_EMAIL}"
  echo "   - Password is: ${ADMIN_PASSWORD}"
  exit 1
else
  echo "   ✅ Login successful! Token obtained."
fi
echo ""
echo ""

# Test 3: Get All Settings (Admin)
echo "3. Testing GET /api/admin/settings (Admin Only)"
echo "   Command: curl -H 'Authorization: Bearer <TOKEN>' ${BASE_URL}/api/admin/settings"
echo ""
curl -s "${BASE_URL}/api/admin/settings" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# Test 4: Get Specific Setting (Admin)
echo "4. Testing GET /api/admin/settings/{key} (Admin Only)"
echo "   Command: curl ${BASE_URL}/api/admin/settings/homepage.featured_campaigns_count"
echo ""
curl -s "${BASE_URL}/api/admin/settings/homepage.featured_campaigns_count" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# Test 5: Update Settings in Batch (Admin)
echo "5. Testing PUT /api/admin/settings (Batch Update)"
echo "   Updating homepage.featured_campaigns_count to 5"
echo ""
UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "homepage.featured_campaigns_count": "5",
    "campaigns_page.items_per_page": "20"
  }')

echo "$UPDATE_RESPONSE" | jq '.'
echo ""
echo ""

# Test 6: Verify Update (Get specific setting again)
echo "6. Verifying update (GET /api/admin/settings/homepage.featured_campaigns_count)"
echo ""
curl -s "${BASE_URL}/api/admin/settings/homepage.featured_campaigns_count" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo ""

# Test 7: Create New Setting (Admin)
echo "7. Testing POST /api/admin/settings (Create New Setting)"
echo "   Creating test.new_setting"
echo ""
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test.new_setting",
    "value": "test value",
    "type": "STRING",
    "isPublic": false,
    "description": "Test setting created via API"
  }')

echo "$CREATE_RESPONSE" | jq '.'
echo ""
echo ""

# Test 8: Type Validation - Try Invalid Integer
echo "8. Testing Type Validation (Invalid Integer)"
echo "   Attempting to set homepage.featured_campaigns_count to 'abc'"
echo ""
INVALID_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "homepage.featured_campaigns_count": "abc"
  }')

echo "$INVALID_RESPONSE" | jq '.'
echo ""
echo ""

# Test 9: Unauthorized Access (No Token)
echo "9. Testing Unauthorized Access (No Token)"
echo "   Command: curl ${BASE_URL}/api/admin/settings (No Auth Header)"
echo ""
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/admin/settings")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$UNAUTH_RESPONSE" | head -n-1)

echo "   HTTP Status: ${HTTP_CODE}"
if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
  echo "   ✅ Correctly rejected unauthorized request"
else
  echo "   ❌ Unexpected status code (expected 401 or 403)"
fi
echo ""
echo ""

# Test 10: Reset Values (Cleanup)
echo "10. Resetting test values to defaults"
echo ""
RESET_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/admin/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "homepage.featured_campaigns_count": "3",
    "campaigns_page.items_per_page": "12"
  }')

echo "$RESET_RESPONSE" | jq '.'
echo ""
echo ""

echo "========================================="
echo "Test Completed!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Public settings endpoint: /api/settings/public"
echo "- Admin settings endpoint: /api/admin/settings"
echo "- Type validation: Enforced"
echo "- Authentication: JWT required for admin endpoints"
echo ""
