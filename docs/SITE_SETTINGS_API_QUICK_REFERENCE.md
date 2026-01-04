# Site Settings API - Quick Reference

## Base URL
```
http://localhost:8080
```

## Public Endpoint (No Authentication)

### Get Public Settings
```http
GET /api/settings/public
```

**Response:**
```json
{
  "homepage.featured_campaigns_count": "3",
  "campaigns_page.items_per_page": "12",
  "site.name": "Yugal Savitri Seva",
  "site.tagline": "Empowering communities worldwide",
  "contact.email": "info@yugalsavitriseva.org",
  "contact.phone": "+977-1-1234567"
}
```

---

## Admin Endpoints (JWT Required)

### Authentication
First, obtain a JWT token:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yugalsavitriseva.org",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer"
}
```

Use the token in subsequent requests:
```
Authorization: Bearer <token>
```

---

### Get All Settings
```http
GET /api/admin/settings
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "key": "homepage.featured_campaigns_count",
    "value": "3",
    "type": "INTEGER",
    "isPublic": true,
    "description": "Number of featured campaigns to show on homepage",
    "createdAt": "2025-01-19T10:00:00Z",
    "updatedAt": "2025-01-19T10:00:00Z",
    "updatedBy": "system"
  },
  ...
]
```

---

### Get Specific Setting
```http
GET /api/admin/settings/{key}
Authorization: Bearer <token>
```

**Example:**
```bash
curl http://localhost:8080/api/admin/settings/homepage.featured_campaigns_count \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "key": "homepage.featured_campaigns_count",
  "value": "3",
  "type": "INTEGER",
  "isPublic": true,
  "description": "Number of featured campaigns to show on homepage",
  "createdAt": "2025-01-19T10:00:00Z",
  "updatedAt": "2025-01-19T10:00:00Z",
  "updatedBy": "admin@example.com"
}
```

---

### Update Settings (Batch)
```http
PUT /api/admin/settings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "homepage.featured_campaigns_count": "5",
  "campaigns_page.items_per_page": "20",
  "maintenance.mode": "false"
}
```

**Response:**
```json
{
  "homepage.featured_campaigns_count": "SUCCESS",
  "campaigns_page.items_per_page": "SUCCESS",
  "maintenance.mode": "SUCCESS"
}
```

**Error Response (Invalid Value):**
```json
{
  "homepage.featured_campaigns_count": "ERROR: Invalid integer value: abc"
}
```

---

### Create New Setting
```http
POST /api/admin/settings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "key": "custom.new_setting",
  "value": "100",
  "type": "INTEGER",
  "isPublic": false,
  "description": "Description of the new setting"
}
```

**Response:**
```json
{
  "key": "custom.new_setting",
  "value": "100",
  "type": "INTEGER",
  "isPublic": false,
  "description": "Description of the new setting",
  "createdAt": "2025-01-19T11:00:00Z",
  "updatedAt": "2025-01-19T11:00:00Z",
  "updatedBy": "admin@example.com"
}
```

---

## Type Validation Rules

| Type | Valid Examples | Invalid Examples |
|------|----------------|------------------|
| **STRING** | `"hello"`, `"test value"`, `"123"` | (empty string) |
| **INTEGER** | `"123"`, `"-456"`, `"0"` | `"12.5"`, `"abc"`, `"1e5"` |
| **BOOLEAN** | `"true"`, `"false"`, `"True"`, `"FALSE"` | `"yes"`, `"no"`, `"1"`, `"0"` |
| **JSON** | `"{\"key\":\"value\"}"`, `"[1,2,3]"` | `"invalid"`, `"123"` |

---

## Common Use Cases

### 1. Get Homepage Featured Count
```bash
# Public way (no auth)
curl http://localhost:8080/api/settings/public | jq -r '.["homepage.featured_campaigns_count"]'

# Admin way (with details)
curl http://localhost:8080/api/admin/settings/homepage.featured_campaigns_count \
  -H "Authorization: Bearer <token>" | jq -r '.value'
```

### 2. Enable Maintenance Mode
```bash
curl -X PUT http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maintenance.mode": "true"}'
```

### 3. Update Multiple Settings at Once
```bash
curl -X PUT http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "homepage.featured_campaigns_count": "5",
    "campaigns_page.items_per_page": "15",
    "site.tagline": "Making a difference together"
  }'
```

### 4. Add Custom Setting
```bash
curl -X POST http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "email.max_retries",
    "value": "3",
    "type": "INTEGER",
    "isPublic": false,
    "description": "Maximum email send retries"
  }'
```

---

## Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| **200** | Success | Request completed successfully |
| **400** | Bad Request | Invalid value for setting type |
| **401** | Unauthorized | Missing or invalid JWT token |
| **403** | Forbidden | User doesn't have ADMIN authority |
| **404** | Not Found | Setting key doesn't exist |
| **500** | Server Error | Database or internal error |

---

## Testing Script

Run the automated test suite:
```bash
cd foundation-backend
./test-site-settings.sh
```

This script tests:
- ✅ Public settings endpoint (no auth)
- ✅ Admin authentication
- ✅ Get all settings
- ✅ Get specific setting
- ✅ Batch update
- ✅ Create new setting
- ✅ Type validation
- ✅ Unauthorized access rejection

---

## Default Settings Reference

| Key | Default Value | Type | Public | Description |
|-----|---------------|------|:------:|-------------|
| `homepage.featured_campaigns_count` | `"3"` | INTEGER | ✅ | Featured campaigns on homepage |
| `campaigns_page.items_per_page` | `"12"` | INTEGER | ✅ | Campaigns per page in list |
| `site.name` | `"Yugal Savitri Seva"` | STRING | ✅ | Site name |
| `site.tagline` | `"Empowering communities worldwide"` | STRING | ✅ | Site tagline |
| `maintenance.mode` | `"false"` | BOOLEAN | ❌ | Maintenance mode toggle |
| `donate_popup.spotlight_campaign_id` | `""` | STRING | ❌ | Featured campaign in popup |
| `contact.email` | `"info@yugalsavitriseva.org"` | STRING | ✅ | Primary email |
| `contact.phone` | `"+977-1-1234567"` | STRING | ✅ | Primary phone |

---

## Frontend Integration

### React/TypeScript Example

```typescript
// Fetch public settings
const usePublicSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  
  useEffect(() => {
    fetch('http://localhost:8080/api/settings/public')
      .then(res => res.json())
      .then(setSettings);
  }, []);
  
  return settings;
};

// Usage
const HomePage = () => {
  const settings = usePublicSettings();
  const featuredCount = parseInt(
    settings['homepage.featured_campaigns_count'] || '3'
  );
  
  return <FeaturedCampaigns count={featuredCount} />;
};
```

### Admin Settings Update

```typescript
const updateSettings = async (
  updates: Record<string, string>,
  token: string
) => {
  const response = await fetch('http://localhost:8080/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  return response.json();
};

// Usage
const results = await updateSettings({
  'homepage.featured_campaigns_count': '5'
}, authToken);
```

---

## Support

**Full Documentation**: [SITE_SETTINGS_CONFIGURATION.md](SITE_SETTINGS_CONFIGURATION.md)  
**Implementation Summary**: [SITE_SETTINGS_IMPLEMENTATION_SUMMARY.md](SITE_SETTINGS_IMPLEMENTATION_SUMMARY.md)

**Logs**: `tail -f foundation-backend/logs/application.log`  
**Database**: `SELECT * FROM site_settings;`
