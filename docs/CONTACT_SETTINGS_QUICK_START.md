# Contact Settings - Quick Start Guide

## 🎯 What is This?

Admin-managed contact settings that allow administrators to update the organization's contact information (email and office locations) through the admin portal. Changes are immediately reflected on the public website.

---

## 🚀 For Administrators

### Accessing the Feature

1. **Login** to admin portal: `https://your-domain.com/admin/login`
2. **Navigate** to sidebar → Click "📞 Contact Info"
3. **Edit** the contact details:
   - Email address
   - Ireland office location
   - India office location
4. **Save** changes

### What You Can Edit

#### Email Address
- Main contact email for the foundation
- Must be a valid email format
- Example: `hopefoundationysv@gmail.com`

#### Office Locations (Ireland & India)
For each location:
- **Label** - Office name (e.g., "Ireland", "India")
- **Address Lines** - Street address (one line per row)
- **Postal Label** - Type of postal code (e.g., "Eircode", "Pincode")
- **Postal Code** - Actual code (e.g., "W91PR6F")
- **Mobile Number** - Contact phone with country code (e.g., "+353 899540707")

### Tips
- ✅ All fields are required
- ✅ Changes take effect immediately after saving
- ✅ Address lines: Enter each line on a separate row
- ✅ Mobile: Include country code (e.g., +353 for Ireland)

---

## 💻 For Developers

### Quick Setup

#### 1. Backend (Already Implemented)
No setup needed! Everything is already configured:
- ✅ Entity and repository created
- ✅ Service layer implemented
- ✅ Controllers (public + admin) ready
- ✅ Security configured
- ✅ Auto-initialization enabled

#### 2. Frontend (Already Implemented)
No setup needed! Everything is already configured:
- ✅ Admin UI page created
- ✅ Routing configured
- ✅ Navigation link added
- ✅ API client integrated

### API Endpoints

#### Public Endpoint (No Auth)
```http
GET /api/config/public/contact
```

**Response:**
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
    }
  ]
}
```

#### Admin Endpoint (JWT Required)
```http
GET /api/admin/config/contact
PUT /api/admin/config/contact
```

**PUT Request Body:**
```json
{
  "email": "newemail@example.com",
  "locations": [
    {
      "label": "Ireland",
      "lines": ["New Address"],
      "postalLabel": "Eircode",
      "postalCode": "W91PR6F",
      "mobile": "+353 899540707"
    }
  ]
}
```

### Using in Your Code

#### Fetch Contact Info (JavaScript/React)
```javascript
// Public endpoint - no auth needed
const response = await fetch('/api/config/public/contact');
const contactInfo = await response.json();

console.log(contactInfo.email); // "hopefoundationysv@gmail.com"
console.log(contactInfo.locations[0].label); // "Ireland"
```

#### Display in Footer Component
```tsx
import { useEffect, useState } from 'react';

function Footer() {
  const [contact, setContact] = useState(null);

  useEffect(() => {
    fetch('/api/config/public/contact')
      .then(res => res.json())
      .then(data => setContact(data));
  }, []);

  if (!contact) return <div>Loading...</div>;

  return (
    <footer>
      <p>Email: {contact.email}</p>
      {contact.locations.map(loc => (
        <div key={loc.label}>
          <h3>{loc.label}</h3>
          {loc.lines.map((line, i) => <p key={i}>{line}</p>)}
          <p>{loc.postalLabel}: {loc.postalCode}</p>
          <p>Mobile: {loc.mobile}</p>
        </div>
      ))}
    </footer>
  );
}
```

---

## 🔧 Testing

### Manual Test (curl)

#### 1. Test Public Endpoint
```bash
curl http://localhost:8080/api/config/public/contact
```

**Expected:** JSON response with contact data

#### 2. Test Admin Update (with JWT)
```bash
# First, get JWT token by logging in
TOKEN="your_jwt_token_here"

# Update contact info
curl -X PUT http://localhost:8080/api/admin/config/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "locations": [{
      "label": "Test Office",
      "lines": ["Test Address"],
      "postalLabel": "ZIP",
      "postalCode": "12345",
      "mobile": "+1234567890"
    }]
  }'
```

**Expected:** `200 OK` with updated data

### Run Integration Tests
```bash
cd foundation-backend
mvn test -Dtest=ContactSettingsIntegrationTest
```

---

## 📦 What's Included

### Backend Files
- `ContactSettings.java` - JPA entity
- `ContactSettingsRepository.java` - Data access
- `ContactSettingsService.java` - Business logic
- `AdminContactController.java` - Admin API
- `PublicConfigController.java` - Public API
- `ContactInfoRequest.java` - DTO for updates
- `ContactInfoResponse.java` - DTO for responses
- `ContactLocation.java` - Location data structure
- `ContactSettingsIntegrationTest.java` - Tests

### Frontend Files
- `AdminContactSettings.tsx` - Admin UI page
- Route: `/admin/contact-settings`
- Sidebar link: "📞 Contact Info"

### Database
- Table: `contact_settings`
- Auto-created by JPA
- Default data seeded on first run

---

## 🔒 Security

### Public Access
- **GET** `/api/config/public/contact` → No authentication required
- Safe to call from anywhere
- Used for displaying contact info on website

### Admin Access
- **PUT** `/api/admin/config/contact` → Requires JWT token + ADMIN role
- Only authenticated admins can update
- Changes are logged

---

## 📚 Documentation

For more details, see:
- **Implementation Details:** `/docs/CONTACT_SETTINGS_IMPLEMENTATION.md`
- **Verification Checklist:** `/docs/CONTACT_SETTINGS_VERIFICATION.md`

---

## ❓ FAQ

### Q: How do I add more locations?
**A:** Currently, the UI is designed for Ireland and India locations. To add more, you would need to:
1. Modify `AdminContactSettings.tsx` to add more location forms
2. The backend already supports multiple locations via the array

### Q: Can I remove a location?
**A:** Yes, but you must have at least one location (validation requirement). Update the `locations` array in the PUT request.

### Q: Are changes reflected immediately?
**A:** Yes! After saving in the admin portal, the public API immediately returns the updated values.

### Q: What happens if the email is invalid?
**A:** The backend validates the email format. Invalid emails will return a `400 Bad Request` error.

### Q: Can multiple admins edit simultaneously?
**A:** Yes, but the last save wins. There's no conflict detection. This is typically not an issue for configuration data that changes infrequently.

---

**Need Help?** Check the full implementation guide or verification checklist in the `/docs` folder.
