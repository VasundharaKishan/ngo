# Contact Settings - Verification Checklist

Use this checklist to verify the contact settings implementation is working correctly.

## ✅ Pre-Flight Checks

### Backend Verification
- [x] Code compiles successfully (`mvn clean compile`)
- [x] Entity `ContactSettings` exists with proper annotations
- [x] Repository `ContactSettingsRepository` extends JpaRepository
- [x] Service `ContactSettingsService` implements business logic
- [x] Admin controller secured with `@PreAuthorize("hasAuthority('ADMIN')")`
- [x] Public controller endpoint exists at `/api/config/public/contact`
- [x] Security config allows public access to `/api/config/public/**`
- [x] Security config requires admin role for `/api/admin/config/**`
- [x] Data initialization seeds default contact settings

### Frontend Verification
- [x] Code compiles successfully (`npm run build`)
- [x] `AdminContactSettings.tsx` component exists
- [x] Route configured in `App.tsx` at `/admin/contact-settings`
- [x] Navigation link in `AdminLayout.tsx` sidebar
- [x] Uses `authFetch` for authenticated API calls
- [x] Toast notifications for success/error messages

### Database Verification
- [x] JPA configured with `ddl-auto: update` to create table automatically
- [x] Table name: `contact_settings`
- [x] Uses JSON column for locations storage

---

## 🧪 Testing Steps

### 1. Start Backend
```bash
cd foundation-backend
mvn spring-boot:run
```

**Expected Output:**
- Application starts on port 8080
- Logs show: `"Initializing default contact settings..."`
- Logs show: `"Contact settings initialized successfully"`
- No errors related to ContactSettings

### 2. Test Public Endpoint (No Auth Required)

#### Using curl:
```bash
curl http://localhost:8080/api/config/public/contact
```

#### Expected Response:
```json
{
  "email": "hopefoundationysv@gmail.com",
  "locations": [
    {
      "label": "Ireland",
      "lines": ["4 Sorrel Green", "Sorrel Woods", "Blessington", "Ireland"],
      "postalLabel": "Eircode",
      "postalCode": "W91PR6F",
      "mobile": "+353 899540707"
    },
    {
      "label": "India",
      "lines": ["Yugal Savitri Bhavan", "Building Number 88", "Hazaribagh", "Jharkhand", "India"],
      "postalLabel": "Pincode",
      "postalCode": "829301",
      "mobile": "+91 9987379321"
    }
  ]
}
```

**Status Code:** `200 OK`

### 3. Test Admin Endpoint (Auth Required)

#### Get JWT Token First:
```bash
# Login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Extract token from response
```

#### Get Contact Settings:
```bash
curl http://localhost:8080/api/admin/config/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** `200 OK` with contact data

#### Update Contact Settings:
```bash
curl -X PUT http://localhost:8080/api/admin/config/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "locations": [
      {
        "label": "Ireland",
        "lines": ["New Address Line 1", "New Address Line 2"],
        "postalLabel": "Eircode",
        "postalCode": "A12B345",
        "mobile": "+353 123456789"
      }
    ]
  }'
```

**Expected:** `200 OK` with updated data

### 4. Test Validation

#### Invalid Email:
```bash
curl -X PUT http://localhost:8080/api/admin/config/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "locations": [{"label":"Test","lines":["Test"],"postalLabel":"ZIP","postalCode":"12345","mobile":"+1234567890"}]
  }'
```

**Expected:** `400 Bad Request`

#### Empty Locations:
```bash
curl -X PUT http://localhost:8080/api/admin/config/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "locations": []
  }'
```

**Expected:** `400 Bad Request`

### 5. Start Frontend
```bash
cd foundation-frontend
npm run dev
```

**Expected Output:**
- Dev server starts on port 5173 (or similar)
- No compilation errors

### 6. Test Admin UI

1. **Navigate to:** `http://localhost:5173/admin/login`
2. **Login** with admin credentials
3. **Click** "Contact Info" (📞) in the sidebar
4. **Verify:**
   - Page loads without errors
   - Email field shows current value
   - Ireland location fields populated
   - India location fields populated
5. **Edit** email or address details
6. **Click** "Save Contact Information"
7. **Verify:**
   - Success toast appears
   - Page reloads with updated values
8. **Refresh** the page
9. **Verify:**
   - Changes persist

### 7. Test Error Handling

#### In Admin UI:
1. Clear the email field
2. Click Save
3. **Expected:** Error toast: "Please enter a valid email address"

#### In Admin UI:
1. Enter invalid email (e.g., "notanemail")
2. Click Save
3. **Expected:** Error toast from backend validation

### 8. Run Integration Tests
```bash
cd foundation-backend
mvn test -Dtest=ContactSettingsIntegrationTest
```

**Expected Output:**
```
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0

[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

## 🔍 Database Verification

### Connect to Database

#### If using PostgreSQL locally:
```bash
psql -h localhost -U neondb_owner -d neondb
```

#### Check table exists:
```sql
\d contact_settings
```

**Expected Output:**
```
                         Table "public.contact_settings"
    Column     |           Type           | Collation | Nullable |   Default
---------------+--------------------------+-----------+----------+-------------
 id            | character varying(255)   |           | not null |
 email         | character varying(255)   |           | not null |
 locations_json| text                     |           |          |
 created_at    | timestamp without time...|           | not null |
 updated_at    | timestamp without time...|           | not null |
Indexes:
    "contact_settings_pkey" PRIMARY KEY, btree (id)
```

#### Check data:
```sql
SELECT * FROM contact_settings;
```

**Expected:** One row with default contact data

---

## ✅ Success Criteria

### Backend
- [ ] Public GET endpoint returns contact data (200 OK)
- [ ] Admin GET requires authentication (401 without token)
- [ ] Admin PUT updates contact data (200 OK with token)
- [ ] Validation rejects invalid email (400)
- [ ] Validation rejects empty locations (400)
- [ ] All integration tests pass

### Frontend
- [ ] Admin UI page loads without errors
- [ ] Form fields populated with current data
- [ ] Save button calls API successfully
- [ ] Success toast appears after save
- [ ] Error toast appears for validation errors
- [ ] Changes persist after page refresh
- [ ] Navigation link visible in sidebar

### Database
- [ ] Table `contact_settings` exists
- [ ] Default data seeded on first run
- [ ] Updates persist correctly
- [ ] JSON column stores locations properly

### Security
- [ ] Public endpoint accessible without auth
- [ ] Admin endpoints require JWT token
- [ ] Admin endpoints require ADMIN role
- [ ] CORS configured correctly

---

## 🐛 Troubleshooting

### Issue: Public endpoint returns 401 Unauthorized
**Solution:** Check `SecurityConfig.java` has `/api/config/public/**` in `permitAll()` list

### Issue: Admin endpoint returns 403 Forbidden
**Solution:** Verify JWT token is valid and user has ADMIN authority

### Issue: Table not created
**Solution:** Check `application.yml` has `spring.jpa.hibernate.ddl-auto: update`

### Issue: Default data not seeded
**Solution:** Check `DataInitializer` runs and `initializeContactSettings()` is called

### Issue: Frontend API calls fail with CORS error
**Solution:** Verify backend CORS configuration allows frontend origin

### Issue: Admin UI doesn't load
**Solution:** Check route is configured in `App.tsx` and user is authenticated

---

## 📊 Expected Log Output

### Backend Startup Logs (Successful):
```
INFO ... - Starting FoundationApplication
INFO ... - Configuring Security Filter Chain with FRONTEND_URL: http://localhost:5173
INFO ... - Initializing default contact settings...
INFO ... - Initialized default contact settings
INFO ... - Contact settings initialized successfully
INFO ... - Started FoundationApplication in 3.456 seconds
```

### API Request Logs:
```
INFO ... - GET /api/config/public/contact - Fetching public contact information
INFO ... - PUT /api/admin/config/contact - Updating contact information
INFO ... - Contact information updated successfully
```

---

**Status:** Ready for Testing  
**Created:** 2025-12-25
