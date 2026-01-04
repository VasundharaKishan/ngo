# Site Settings System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Application                        │
│                     (React + TypeScript + Vite)                     │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │                                  │
               │ GET /api/settings/public         │ GET/PUT/POST
               │ (No Authentication)              │ /api/admin/settings
               │                                  │ (JWT Required)
               ▼                                  ▼
┌──────────────────────────────┐  ┌──────────────────────────────────┐
│ PublicSiteSettingController  │  │  AdminSiteSettingController      │
│  @RestController             │  │  @RestController                 │
│  @RequestMapping             │  │  @PreAuthorize('ADMIN')          │
│  ("/api/settings")           │  │  @RequestMapping                 │
│                              │  │  ("/api/admin/settings")         │
│  - getPublicSettings()       │  │  - getAllSettings()              │
│    Returns: Map<String,      │  │    Returns: List<SiteSetting>    │
│             String>          │  │  - getSetting(key)               │
│    Only isPublic=true        │  │  - updateSettings(Map)           │
│                              │  │    Request: {"key": "value"}     │
│                              │  │    Response: {"key": "SUCCESS"}  │
│                              │  │  - createSetting(request)        │
└──────────────┬───────────────┘  └────────────────┬─────────────────┘
               │                                   │
               │                                   │
               └───────────────┬───────────────────┘
                               │
                               ▼
                  ┌────────────────────────────┐
                  │   SiteSettingService       │
                  │   @Service                 │
                  │   Business Logic Layer     │
                  │                            │
                  │ • getPublicSettings()      │
                  │   - Filters isPublic=true  │
                  │                            │
                  │ • getAllSettings()         │
                  │   - Returns all            │
                  │                            │
                  │ • getSetting(key)          │
                  │   - Single lookup          │
                  │                            │
                  │ • updateSettings(Map)      │
                  │   - Batch update           │
                  │   - Type validation        │
                  │   - Tracks updatedBy       │
                  │                            │
                  │ • validateValue(type)      │
                  │   - STRING: non-empty      │
                  │   - INTEGER: valid int     │
                  │   - BOOLEAN: true/false    │
                  │   - JSON: starts {/[       │
                  │                            │
                  │ • initializeDefaultSettings│
                  │   - Creates missing        │
                  └─────────────┬──────────────┘
                                │
                                ▼
                  ┌────────────────────────────┐
                  │  SiteSettingRepository     │
                  │  @Repository               │
                  │  JpaRepository<SiteSetting,│
                  │                String>     │
                  │                            │
                  │ • findByKey(String)        │
                  │ • findByIsPublicTrue()     │
                  │ • save(SiteSetting)        │
                  │ • findAll()                │
                  └─────────────┬──────────────┘
                                │
                                ▼
                  ┌────────────────────────────┐
                  │      PostgreSQL DB         │
                  │                            │
                  │  Table: site_settings      │
                  │  ┌──────────────────────┐  │
                  │  │ setting_key (PK)     │  │
                  │  │ setting_value        │  │
                  │  │ setting_type (ENUM)  │  │
                  │  │ is_public (BOOLEAN)  │  │
                  │  │ description          │  │
                  │  │ created_at           │  │
                  │  │ updated_at           │  │
                  │  │ updated_by           │  │
                  │  └──────────────────────┘  │
                  │                            │
                  │  Indexes:                  │
                  │  • PRIMARY KEY: setting_key│
                  │  • idx_site_settings_public│
                  └────────────────────────────┘
```

## Request Flow Diagrams

### 1. Public Settings Flow (No Authentication)

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET /api/settings/public
     ▼
┌──────────────────────────────┐
│ PublicSiteSettingController  │
│ getPublicSettings()          │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ SiteSettingService           │
│ getPublicSettings()          │
│ - Filters isPublic=true      │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ SiteSettingRepository        │
│ findByIsPublicTrue()         │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
│ SELECT * FROM site_settings  │
│ WHERE is_public = true       │
└────┬─────────────────────────┘
     │ List<SiteSetting>
     ▼
┌──────────────────────────────┐
│ SiteSettingService           │
│ Convert to Map<String,String>│
└────┬─────────────────────────┘
     │ {"key": "value", ...}
     ▼
┌─────────┐
│ Browser │
│ Response│
└─────────┘
```

### 2. Admin Update Flow (JWT Required)

```
┌─────────┐
│ Admin   │
│ Browser │
└────┬────┘
     │ PUT /api/admin/settings
     │ Authorization: Bearer <JWT>
     │ Body: {"key1": "value1", "key2": "value2"}
     ▼
┌──────────────────────────────┐
│ Spring Security Filter       │
│ - Validates JWT              │
│ - Checks ADMIN authority     │
└────┬─────────────────────────┘
     │ ✅ Authorized
     ▼
┌──────────────────────────────┐
│ AdminSiteSettingController   │
│ updateSettings(updates)      │
│ @PreAuthorize('ADMIN')       │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ SiteSettingService           │
│ updateSettings(Map)          │
│ @Transactional               │
└────┬─────────────────────────┘
     │
     │ For each key-value pair:
     │
     ├──► Get setting from DB
     │    (findByKey)
     │
     ├──► Validate value type
     │    (validateValue)
     │    - INTEGER: parseInt()
     │    - BOOLEAN: true/false
     │    - JSON: starts with {/[
     │    - STRING: non-empty
     │
     ├──► Update setting
     │    - setValue()
     │    - setUpdatedBy(JWT subject)
     │    - setUpdatedAt(now)
     │
     └──► Save to DB
          (repository.save)
     │
     │ Result: {"key1": "SUCCESS", "key2": "ERROR: ..."}
     ▼
┌─────────┐
│ Admin   │
│ Browser │
│ Response│
└─────────┘
```

## Entity Relationships

```
┌────────────────────────────────────────────────┐
│              SiteSetting Entity                │
├────────────────────────────────────────────────┤
│ @Id                                            │
│ - key: String (PK)                             │
│                                                │
│ @Column                                        │
│ - value: String (TEXT)                         │
│ - type: SettingType (ENUM)                     │
│   ├─ STRING                                    │
│   ├─ INTEGER                                   │
│   ├─ BOOLEAN                                   │
│   └─ JSON                                      │
│ - isPublic: boolean                            │
│ - description: String (TEXT)                   │
│                                                │
│ @Column (Audit)                                │
│ - createdAt: Instant                           │
│ - updatedAt: Instant                           │
│ - updatedBy: String                            │
│                                                │
│ @PrePersist                                    │
│ - onCreate() → set timestamps                  │
│                                                │
│ @PreUpdate                                     │
│ - onUpdate() → update timestamp                │
└────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layer                           │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌─────────────────┐               ┌──────────────────────┐
│ Public Endpoint │               │  Admin Endpoints     │
│                 │               │                      │
│ /api/settings/  │               │ /api/admin/settings  │
│      public     │               │                      │
│                 │               │ @PreAuthorize        │
│ ❌ No Auth      │               │ ("hasAuthority       │
│ ✅ Everyone     │               │  ('ADMIN')")         │
│                 │               │                      │
│ Returns only:   │               │ ✅ JWT Required      │
│ isPublic=true   │               │ ✅ ADMIN authority   │
└─────────────────┘               │                      │
                                  │ Tracks updatedBy     │
                                  │ from JWT subject     │
                                  └──────────────────────┘
```

## Type Validation Flow

```
┌──────────────────────────────────────────────────────────────┐
│         SiteSettingService.validateValue(value, type)        │
└──────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┬──────────┬─────────┐
        │                  │                  │          │         │
        ▼                  ▼                  ▼          ▼         ▼
┌───────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────┐  ┌──────┐
│    STRING     │  │   INTEGER    │  │  BOOLEAN   │  │ JSON│  │ Other│
├───────────────┤  ├──────────────┤  ├────────────┤  ├─────┤  ├──────┤
│ Check:        │  │ Check:       │  │ Check:     │  │Check│  │ No   │
│ • Non-empty   │  │ • parseInt() │  │ • "true" or│  │• {  │  │ extra│
│   string      │  │   succeeds   │  │   "false"  │  │• [  │  │checks│
│               │  │              │  │ • Case-    │  │     │  │      │
│ Valid:        │  │ Valid:       │  │   insens.  │  │Valid│  │Valid:│
│ "hello"       │  │ "123"        │  │            │  │{..} │  │ Any  │
│ "test value"  │  │ "-456"       │  │ Valid:     │  │[..] │  │      │
│               │  │ "0"          │  │ "true"     │  │     │  │      │
│ Invalid:      │  │              │  │ "false"    │  │Inval│  │      │
│ ""            │  │ Invalid:     │  │ "True"     │  │"abc"│  │      │
│ null          │  │ "12.5"       │  │ "FALSE"    │  │"123"│  │      │
│               │  │ "abc"        │  │            │  │     │  │      │
│               │  │ "1e5"        │  │ Invalid:   │  │     │  │      │
│               │  │              │  │ "yes"      │  │     │  │      │
│               │  │              │  │ "1"        │  │     │  │      │
└───────────────┘  └──────────────┘  └────────────┘  └─────┘  └──────┘
```

## Database Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Application Startup (Spring Boot)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │      Flyway Migration       │
              │ spring.flyway.enabled=true  │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Check: flyway_schema_history│
              │ Last version: V3            │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ Execute V4__create_site_    │
              │ settings_table.sql          │
              │                             │
              │ 1. CREATE TABLE             │
              │ 2. CREATE INDEX             │
              │ 3. INSERT defaults (8 rows) │
              │ 4. ADD COMMENTS             │
              └─────────────┬───────────────┘
                            │ ✅ Success
                            ▼
              ┌─────────────────────────────┐
              │ Update flyway_schema_history│
              │ version=4, success=true     │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   SiteSettingConfig         │
              │   @Bean CommandLineRunner   │
              │   initializeSettings()      │
              │                             │
              │ - Calls service.initialize  │
              │   DefaultSettings()         │
              │ - Creates missing keys      │
              └─────────────┬───────────────┘
                            │ ✅ Complete
                            ▼
              ┌─────────────────────────────┐
              │   Application Ready         │
              │   - site_settings: 8 rows   │
              │   - Endpoints: Active       │
              └─────────────────────────────┘
```

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                      Spring Boot App                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────┐   ┌──────────────────┐   ┌─────────────┐
│ Controllers │   │    Services      │   │   Config    │
│ (REST API)  │   │  (Business Logic)│   │  (Startup)  │
├─────────────┤   ├──────────────────┤   ├─────────────┤
│ • Admin     │──►│ • SiteSetting    │   │ • CORS      │
│   Controller│   │   Service        │   │ • CommandLine│
│             │   │   - Validation   │   │   Runner    │
│ • Public    │──►│   - Filtering    │   └─────────────┘
│   Controller│   │   - Updates      │
└─────────────┘   └────────┬─────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Repositories   │
                  │  (Data Access)  │
                  ├─────────────────┤
                  │ • SiteSetting   │
                  │   Repository    │
                  │   - findByKey   │
                  │   - findByPublic│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Entities      │
                  │  (JPA Models)   │
                  ├─────────────────┤
                  │ • SiteSetting   │
                  │   - key (PK)    │
                  │   - value       │
                  │   - type (ENUM) │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Database      │
                  │  (PostgreSQL)   │
                  ├─────────────────┤
                  │ • site_settings │
                  └─────────────────┘
```

---

**Architecture Documentation**  
**Created**: January 19, 2025  
**System**: Site Settings Configuration  
**Tech Stack**: Spring Boot + JPA + PostgreSQL + JWT
