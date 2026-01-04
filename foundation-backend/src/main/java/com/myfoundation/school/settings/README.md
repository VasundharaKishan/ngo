# Site Settings Package

## Package: `com.myfoundation.school.settings`

This package provides a complete site configuration management system with type validation, audit tracking, and role-based access control.

## Package Structure

```
settings/
├── SiteSetting.java               # JPA Entity
├── SiteSettingRepository.java     # JPA Repository
├── SiteSettingService.java        # Business Logic
├── AdminSiteSettingController.java # Admin REST API
├── PublicSiteSettingController.java # Public REST API
└── SiteSettingConfig.java         # Startup Configuration
```

## Quick Start

### 1. Get Public Settings (Frontend)

```typescript
const response = await fetch('http://localhost:8080/api/settings/public');
const settings: Record<string, string> = await response.json();

const featuredCount = parseInt(settings['homepage.featured_campaigns_count'] || '3');
```

### 2. Admin Operations (With JWT)

```typescript
// Update settings
const response = await fetch('http://localhost:8080/api/admin/settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    'homepage.featured_campaigns_count': '5'
  })
});
```

## Component Overview

### SiteSetting.java
**Purpose**: JPA Entity representing a configuration setting

**Key Fields**:
- `key` (PK) - Unique setting identifier
- `value` - String value (stored as TEXT)
- `type` - SettingType enum (STRING, INTEGER, BOOLEAN, JSON)
- `isPublic` - Whether exposed via public API
- `description` - Human-readable description
- `createdAt`, `updatedAt`, `updatedBy` - Audit fields

**Lifecycle Hooks**:
- `@PrePersist` - Sets createdAt and updatedAt on insert
- `@PreUpdate` - Updates updatedAt on modification

### SiteSettingRepository.java
**Purpose**: JPA Repository for database access

**Methods**:
- `findByKey(String key)` - Get setting by key
- `findByIsPublicTrue()` - Get all public settings

### SiteSettingService.java
**Purpose**: Business logic layer with validation

**Public Methods**:

```java
// Get all public settings (no auth required)
Map<String, String> getPublicSettings()

// Get all settings (admin only)
List<SiteSetting> getAllSettings()

// Get single setting
SiteSetting getSetting(String key)

// Get with default fallback
String getSettingValue(String key, String defaultValue)

// Batch update (admin only)
Map<String, String> updateSettings(Map<String, String> updates)

// Create or update single setting (admin only)
SiteSetting createOrUpdateSetting(String key, String value, 
                                   SettingType type, boolean isPublic, 
                                   String description)

// Initialize defaults on startup
void initializeDefaultSettings()
```

**Type Validation**:
- **STRING**: Non-empty string
- **INTEGER**: Valid integer (parseInt succeeds)
- **BOOLEAN**: "true" or "false" (case-insensitive)
- **JSON**: Starts with `{` or `[`

### AdminSiteSettingController.java
**Purpose**: Admin REST API (JWT required)

**Endpoints**:
```
GET    /api/admin/settings           # Get all settings
GET    /api/admin/settings/{key}     # Get specific setting
PUT    /api/admin/settings           # Batch update
POST   /api/admin/settings           # Create new setting
```

**Security**: `@PreAuthorize("hasAuthority('ADMIN')")`

### PublicSiteSettingController.java
**Purpose**: Public REST API (no authentication)

**Endpoints**:
```
GET    /api/settings/public          # Get public settings
```

**Returns**: Only settings with `isPublic=true`

### SiteSettingConfig.java
**Purpose**: Application startup configuration

**Functionality**:
- Implements `CommandLineRunner`
- Calls `initializeDefaultSettings()` on startup
- Ensures default settings exist

## Default Settings

| Key | Value | Type | Public |
|-----|-------|------|:------:|
| homepage.featured_campaigns_count | "3" | INTEGER | ✅ |
| campaigns_page.items_per_page | "12" | INTEGER | ✅ |
| site.name | "Yugal Savitri Seva" | STRING | ✅ |
| site.tagline | "Empowering communities worldwide" | STRING | ✅ |
| maintenance.mode | "false" | BOOLEAN | ❌ |
| donate_popup.spotlight_campaign_id | "" | STRING | ❌ |
| contact.email | "info@yugalsavitriseva.org" | STRING | ✅ |
| contact.phone | "+977-1-1234567" | STRING | ✅ |

## Type Safety

### SettingType Enum
```java
public enum SettingType {
    STRING,   // Any non-empty string
    INTEGER,  // Valid integer: "123", "-456"
    BOOLEAN,  // "true" or "false" (case-insensitive)
    JSON      // Starts with { or [
}
```

### Validation Examples

```java
// ✅ Valid INTEGER
"123", "-456", "0"

// ❌ Invalid INTEGER
"12.5", "abc", "1e5"

// ✅ Valid BOOLEAN
"true", "false", "True", "FALSE"

// ❌ Invalid BOOLEAN
"yes", "no", "1", "0"

// ✅ Valid JSON
"{\"key\":\"value\"}", "[1,2,3]"

// ❌ Invalid JSON
"invalid", "123"
```

## Security Model

### Public Endpoint
- **Path**: `/api/settings/public`
- **Authentication**: None required
- **Authorization**: Everyone
- **Returns**: Only `isPublic=true` settings
- **Use Case**: Frontend configuration

### Admin Endpoints
- **Path**: `/api/admin/settings/*`
- **Authentication**: JWT Bearer token required
- **Authorization**: `ADMIN` authority
- **Audit**: Tracks `updatedBy` from JWT subject
- **Use Case**: Admin dashboard, system configuration

## Audit Trail

Every setting update records:
- `updatedAt` - Timestamp of last modification
- `updatedBy` - Username from JWT (e.g., "admin@example.com")

Retrieved from: `SecurityContextHolder.getContext().getAuthentication().getName()`

## Exception Handling

### Custom Exceptions

```java
// Thrown when setting key not found
SiteSettingService.SettingNotFoundException

// Thrown when value doesn't match type
SiteSettingService.InvalidSettingValueException
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Valid request processed |
| 400 | Bad Request | Invalid value for type |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Not ADMIN authority |
| 404 | Not Found | Setting key doesn't exist |

## Usage Examples

### Backend Service Integration

```java
@Service
@RequiredArgsConstructor
public class CampaignDisplayService {
    
    private final SiteSettingService settingService;
    
    public int getFeaturedCount() {
        String value = settingService.getSettingValue(
            "homepage.featured_campaigns_count", 
            "3"
        );
        return Integer.parseInt(value);
    }
}
```

### Admin Update Operation

```java
Map<String, String> updates = Map.of(
    "homepage.featured_campaigns_count", "5",
    "campaigns_page.items_per_page", "20"
);

Map<String, String> results = settingService.updateSettings(updates);
// {"homepage.featured_campaigns_count": "SUCCESS", ...}
```

### Type Validation

```java
// This will throw InvalidSettingValueException
settingService.updateSettings(Map.of(
    "homepage.featured_campaigns_count", "abc" // ❌ Not an integer
));

// This succeeds
settingService.updateSettings(Map.of(
    "homepage.featured_campaigns_count", "5" // ✅ Valid integer
));
```

## Testing

### Automated Test Script
```bash
cd foundation-backend
./test-site-settings.sh
```

### Manual cURL Tests

```bash
# Get public settings
curl http://localhost:8080/api/settings/public

# Get JWT token
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
  -d '{"homepage.featured_campaigns_count": "5"}'
```

## Database Schema

```sql
CREATE TABLE site_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL 
        CHECK (setting_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'JSON')),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(255)
);

CREATE INDEX idx_site_settings_public ON site_settings(is_public);
```

## Configuration

### application.yml

```yaml
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000}
```

## Dependencies

### Maven (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

## Migration

### Flyway Migration: V4__create_site_settings_table.sql

Located: `src/main/resources/db/migration/`

Executes on application startup (if not already applied).

## Best Practices

### 1. Use Type-Safe Keys
```java
// Define constants
public static final String KEY_FEATURED_COUNT = "homepage.featured_campaigns_count";

// Use in code
String value = settingService.getSettingValue(KEY_FEATURED_COUNT, "3");
```

### 2. Always Provide Defaults
```java
// ✅ Good: Provides fallback
String value = settingService.getSettingValue("key", "default");

// ❌ Avoid: No fallback, may throw exception
String value = settingService.getSetting("key").getValue();
```

### 3. Validate Before Update
```java
try {
    settingService.updateSettings(updates);
} catch (InvalidSettingValueException e) {
    // Handle validation error
    log.error("Invalid value: {}", e.getMessage());
}
```

### 4. Mark Public Settings Carefully
Only set `isPublic=true` for settings safe to expose:
- ✅ UI configuration (featured count, page size)
- ✅ Public contact info
- ❌ API keys, secrets
- ❌ Internal configuration

## Documentation Links

- **Full Documentation**: [SITE_SETTINGS_CONFIGURATION.md](../../../../docs/SITE_SETTINGS_CONFIGURATION.md)
- **API Quick Reference**: [SITE_SETTINGS_API_QUICK_REFERENCE.md](../../../../docs/SITE_SETTINGS_API_QUICK_REFERENCE.md)
- **Architecture Diagram**: [SITE_SETTINGS_ARCHITECTURE.md](../../../../docs/SITE_SETTINGS_ARCHITECTURE.md)
- **Implementation Summary**: [SITE_SETTINGS_IMPLEMENTATION_SUMMARY.md](../../../../docs/SITE_SETTINGS_IMPLEMENTATION_SUMMARY.md)

## Support

**Logs**: `tail -f logs/application.log`  
**Database**: `SELECT * FROM site_settings;`  
**Test Script**: `./test-site-settings.sh`

---

**Package Version**: 1.0  
**Created**: January 19, 2025  
**Maintained By**: Foundation Backend Team
