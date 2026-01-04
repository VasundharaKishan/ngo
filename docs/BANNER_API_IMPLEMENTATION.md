# Backend API Implementation Guide - Development Banner Feature

## Overview
Admin-controlled development banner feature that allows admins to toggle the banner on/off and customize the message.

## Database Schema

### Option 1: Use Existing `cms_content` Table (Recommended)
No schema changes needed. Store banner settings as:
```sql
INSERT INTO cms_content (section, key, value, content_type, active)
VALUES ('site-settings', 'development_banner', 'This website is under development', 'text', true);
```

### Option 2: Create New `site_settings` Table (Alternative)
```sql
CREATE TABLE site_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (setting_key, setting_value, active)
VALUES ('development_banner', 'This website is under development', true);
```

## Required API Endpoints

### 1. GET Banner Settings (Public - No Auth Required)
**Endpoint:** `GET /api/cms/content/site-settings`

**Purpose:** Frontend Layout component fetches banner settings on page load

**Response:**
```json
[
  {
    "id": 1,
    "section": "site-settings",
    "key": "development_banner",
    "value": "This website is under development",
    "contentType": "text",
    "active": true
  }
]
```

**Implementation Notes:**
- Filter CMS content by section='site-settings'
- Return array of settings
- Frontend will find 'development_banner' key

### 2. GET Admin CMS Content (Admin Only - Auth Required)
**Endpoint:** `GET /api/admin/cms/content/site-settings`

**Purpose:** Admin page loads current banner settings

**Headers:** `Authorization: Bearer {token}`

**Response:** Same as above

### 3. POST/PUT Save Banner Settings (Admin Only - Auth Required)
**Endpoint:** `POST /api/admin/cms/content`

**Purpose:** Save or update banner settings

**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "section": "site-settings",
  "key": "development_banner",
  "value": "This website is under development",
  "contentType": "text",
  "active": true
}
```

**Logic:**
- Check if record with key='development_banner' exists
- If exists: UPDATE the record
- If not exists: INSERT new record
- Return updated record

**Response:**
```json
{
  "id": 1,
  "section": "site-settings",
  "key": "development_banner",
  "value": "This website is under development",
  "contentType": "text",
  "active": true
}
```

## Java Controller Example (If using Spring Boot)

```java
@RestController
@RequestMapping("/api")
public class CMSController {
    
    @Autowired
    private CMSContentRepository cmsContentRepository;
    
    // Public endpoint - no auth required
    @GetMapping("/cms/content/site-settings")
    public ResponseEntity<List<CMSContent>> getSiteSettings() {
        List<CMSContent> settings = cmsContentRepository
            .findBySection("site-settings");
        return ResponseEntity.ok(settings);
    }
    
    // Admin endpoint - requires authentication
    @GetMapping("/admin/cms/content/site-settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CMSContent>> getAdminSiteSettings() {
        List<CMSContent> settings = cmsContentRepository
            .findBySection("site-settings");
        return ResponseEntity.ok(settings);
    }
    
    // Admin endpoint - save/update settings
    @PostMapping("/admin/cms/content")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CMSContent> saveCMSContent(
            @RequestBody CMSContent content) {
        
        // Check if record exists with same section and key
        Optional<CMSContent> existing = cmsContentRepository
            .findBySectionAndKey(content.getSection(), content.getKey());
        
        if (existing.isPresent()) {
            // Update existing
            CMSContent existingContent = existing.get();
            existingContent.setValue(content.getValue());
            existingContent.setActive(content.isActive());
            existingContent.setUpdatedAt(LocalDateTime.now());
            CMSContent saved = cmsContentRepository.save(existingContent);
            return ResponseEntity.ok(saved);
        } else {
            // Create new
            content.setCreatedAt(LocalDateTime.now());
            CMSContent saved = cmsContentRepository.save(content);
            return ResponseEntity.ok(saved);
        }
    }
}
```

## Repository Interface (Spring Data JPA)

```java
public interface CMSContentRepository extends JpaRepository<CMSContent, Long> {
    List<CMSContent> findBySection(String section);
    Optional<CMSContent> findBySectionAndKey(String section, String key);
}
```

## Testing the Implementation

### 1. Test Public Endpoint
```bash
curl http://localhost:8080/api/cms/content/site-settings
```

### 2. Test Admin GET (with auth token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/admin/cms/content/site-settings
```

### 3. Test Admin POST (save settings)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "site-settings",
    "key": "development_banner",
    "value": "Website under maintenance",
    "contentType": "text",
    "active": true
  }' \
  http://localhost:8080/api/admin/cms/content
```

## Frontend Integration Summary

### 1. Layout Component (Public)
- Fetches banner settings on page load: `GET /api/cms/content/site-settings`
- Conditionally renders banner if `active: true`
- Displays custom message from `value` field

### 2. Admin Settings Page
- Located at `/admin/site-settings` in sidebar
- Loads current settings: `GET /api/admin/cms/content/site-settings`
- Toggle switch for enabled/disabled
- Text input for custom message
- Preview of how banner will look
- Saves via: `POST /api/admin/cms/content`

## Next Steps

1. Implement the backend endpoints as described above
2. Test the API endpoints using curl or Postman
3. Verify the frontend can fetch and display the banner
4. Test admin interface for saving settings
5. Confirm changes appear on public site immediately

## Notes

- No authentication required for public GET endpoint
- Admin endpoints require JWT token in Authorization header
- Frontend already implemented and ready to use
- Banner appears at top of all pages when enabled
- Sticky positioning keeps banner visible when scrolling
