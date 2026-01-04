# Site Settings Configuration System

## Overview
The Site Settings system provides a robust, type-safe configuration management solution with audit tracking and role-based access control.

## Features
- ✅ Type validation (STRING, INTEGER, BOOLEAN, JSON)
- ✅ Public/private setting visibility control
- ✅ Audit trail (updatedAt, updatedBy)
- ✅ Batch update support
- ✅ JWT-based admin authentication
- ✅ Flyway migration for database schema
- ✅ Auto-initialization of default settings

## Database Schema

### Table: `site_settings`
```sql
setting_key         VARCHAR(255)  PRIMARY KEY
setting_value       TEXT          NOT NULL
setting_type        VARCHAR(20)   NOT NULL (STRING|INTEGER|BOOLEAN|JSON)
is_public           BOOLEAN       NOT NULL DEFAULT FALSE
description         TEXT
created_at          TIMESTAMP     NOT NULL
updated_at          TIMESTAMP     NOT NULL
updated_by          VARCHAR(255)
```

### Indexes
- PRIMARY KEY on `setting_key`
- INDEX on `is_public` for fast public settings lookup

## API Endpoints

### Public Endpoint (No Authentication)

#### GET /api/settings/public
Get all public settings (isPublic=true only)

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

### Admin Endpoints (JWT Required)

#### GET /api/admin/settings
Get all settings (admin only)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
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

#### GET /api/admin/settings/{key}
Get specific setting by key

**Example:** `GET /api/admin/settings/homepage.featured_campaigns_count`

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

#### PUT /api/admin/settings
Update settings in batch

**Request Body:**
```json
{
  "homepage.featured_campaigns_count": "5",
  "campaigns_page.items_per_page": "15",
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

If validation fails:
```json
{
  "homepage.featured_campaigns_count": "ERROR: Invalid integer value: abc"
}
```

#### POST /api/admin/settings
Create new setting

**Request Body:**
```json
{
  "key": "new.setting.key",
  "value": "100",
  "type": "INTEGER",
  "isPublic": false,
  "description": "Description of new setting"
}
```

**Response:**
```json
{
  "key": "new.setting.key",
  "value": "100",
  "type": "INTEGER",
  "isPublic": false,
  "description": "Description of new setting",
  "createdAt": "2025-01-19T10:30:00Z",
  "updatedAt": "2025-01-19T10:30:00Z",
  "updatedBy": "admin@example.com"
}
```

## Type Validation Rules

### STRING
- No additional validation
- Any non-empty string accepted

### INTEGER
- Must be valid integer
- Examples: "123", "-456", "0"
- Invalid: "12.5", "abc", "1e5"

### BOOLEAN
- Must be "true" or "false" (case-insensitive)
- Invalid: "yes", "no", "1", "0"

### JSON
- Must start with `{` or `[`
- Basic structural validation only
- Examples: `{"key":"value"}`, `[1,2,3]`

## Default Settings

| Key | Value | Type | Public | Description |
|-----|-------|------|--------|-------------|
| `homepage.featured_campaigns_count` | "3" | INTEGER | ✅ | Number of featured campaigns on homepage |
| `campaigns_page.items_per_page` | "12" | INTEGER | ✅ | Campaigns per page in list view |
| `site.name` | "Yugal Savitri Seva" | STRING | ✅ | Site name in header/footer |
| `site.tagline` | "Empowering communities worldwide" | STRING | ✅ | Site tagline |
| `maintenance.mode` | "false" | BOOLEAN | ❌ | Enable maintenance mode |
| `donate_popup.spotlight_campaign_id` | "" | STRING | ❌ | Featured campaign in donate popup |
| `contact.email` | "info@yugalsavitriseva.org" | STRING | ✅ | Primary contact email |
| `contact.phone` | "+977-1-1234567" | STRING | ✅ | Primary contact phone |

## Usage Examples

### Frontend Integration

#### Fetch Public Settings
```typescript
// In api.ts or similar
export const getPublicSettings = async (): Promise<Record<string, string>> => {
  const response = await fetch(`${API_BASE_URL}/api/settings/public`);
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
};

// In a React component
const [settings, setSettings] = useState<Record<string, string>>({});

useEffect(() => {
  getPublicSettings().then(setSettings);
}, []);

// Usage
const featuredCount = parseInt(settings['homepage.featured_campaigns_count'] || '3');
```

#### Admin: Update Settings
```typescript
export const updateSettings = async (
  updates: Record<string, string>,
  token: string
): Promise<Record<string, string>> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update settings');
  return response.json();
};

// Usage
const results = await updateSettings({
  'homepage.featured_campaigns_count': '5',
  'campaigns_page.items_per_page': '20'
}, authToken);
```

### Backend Service Usage

```java
@Service
@RequiredArgsConstructor
public class CampaignDisplayService {
    
    private final SiteSettingService settingService;
    
    public int getFeaturedCampaignsCount() {
        String value = settingService.getSettingValue(
            "homepage.featured_campaigns_count", 
            "3"
        );
        return Integer.parseInt(value);
    }
    
    public boolean isMaintenanceMode() {
        String value = settingService.getSettingValue(
            "maintenance.mode", 
            "false"
        );
        return Boolean.parseBoolean(value);
    }
}
```

## Security Considerations

1. **Authentication**: Admin endpoints require JWT with `ADMIN` authority
2. **Authorization**: Only authenticated admins can view/modify all settings
3. **Audit Trail**: All updates track `updatedBy` from JWT subject
4. **Public Filtering**: Public endpoint only returns `isPublic=true` settings
5. **Type Validation**: Prevents invalid data types from being stored

## Migration Guide

### From Old SiteConfig to Site Settings

If migrating from the old `site_config` table:

```sql
-- Copy data from old table
INSERT INTO site_settings (setting_key, setting_value, setting_type, is_public, description, created_at, updated_at, updated_by)
SELECT 
    config_key, 
    config_value, 
    'STRING', -- Default type
    CASE 
        WHEN config_key IN ('featured_campaigns_count', 'items_per_page') THEN TRUE
        ELSE FALSE
    END,
    description,
    created_at,
    updated_at,
    'migration'
FROM site_config;

-- Update types for known integer settings
UPDATE site_settings 
SET setting_type = 'INTEGER' 
WHERE setting_key IN ('featured_campaigns_count', 'items_per_page');
```

## Testing

### Manual Testing with curl

```bash
# Get public settings
curl http://localhost:8080/api/settings/public

# Login to get JWT token
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

# Get all settings (admin)
curl http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer $TOKEN"

# Update settings (admin)
curl -X PUT http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "homepage.featured_campaigns_count": "5",
    "campaigns_page.items_per_page": "15"
  }'

# Create new setting (admin)
curl -X POST http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test.new_setting",
    "value": "test value",
    "type": "STRING",
    "isPublic": false,
    "description": "Test setting"
  }'
```

## Troubleshooting

### Settings not appearing in public API
- Check `is_public` flag is set to `true`
- Verify setting exists in database: `SELECT * FROM site_settings WHERE setting_key = 'your.key';`

### Type validation errors
- Ensure value matches declared type (e.g., "123" for INTEGER, "true"/"false" for BOOLEAN)
- Check SiteSettingService.validateValue() method for exact rules

### Admin endpoints return 403 Forbidden
- Verify JWT token is valid and not expired
- Ensure user has `ADMIN` authority (not just `ROLE_ADMIN`)
- Check SecurityConfig allows JWT authentication

### Migration fails
- Check Flyway version numbering (must be sequential: V4, V5, etc.)
- Verify database connection and permissions
- Check application.yml for `spring.flyway.enabled=true`

## File Structure

```
foundation-backend/src/main/java/com/myfoundation/school/settings/
├── SiteSetting.java                    # JPA Entity
├── SiteSettingRepository.java          # JPA Repository
├── SiteSettingService.java             # Business Logic
├── AdminSiteSettingController.java     # Admin REST API
├── PublicSiteSettingController.java    # Public REST API
└── SiteSettingConfig.java              # Startup Configuration

foundation-backend/src/main/resources/db/migration/
└── V4__create_site_settings_table.sql  # Flyway Migration
```

## Next Steps

1. ✅ Run the application to execute Flyway migration
2. ✅ Test public endpoint: `GET /api/settings/public`
3. ✅ Test admin endpoints with JWT token
4. 🔲 Create frontend admin UI for settings management
5. 🔲 Add caching layer (Redis) for frequently accessed settings
6. 🔲 Implement settings versioning/history
7. 🔲 Add import/export functionality for settings

## Support

For issues or questions:
- Check logs: `tail -f logs/application.log`
- Database: Connect to PostgreSQL and query `site_settings` table
- API documentation: Swagger UI at `/swagger-ui.html` (if configured)
