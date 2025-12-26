# Admin Login Setup - Complete Guide

## ✅ Problem Solved: Auto-Admin Creation on Startup

The backend now **automatically** creates the default admin user on every startup if it doesn't exist.

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@hopefoundation.org`

⚠️ **Important**: Change the password after first login!

---

## How It Works

### 1. Automatic Admin Creation
The [`AdminUserInitializer`](src/main/java/com/myfoundation/school/config/AdminUserInitializer.java) component runs on application startup:

```java
@EventListener(ApplicationReadyEvent.class)
public void ensureDefaultAdminExists() {
    authService.initializeDefaultAdmin();
}
```

### 2. Smart Initialization Logic
[`AuthService.initializeDefaultAdmin()`](src/main/java/com/myfoundation/school/auth/AuthService.java#L243-L263) checks if `admin@hopefoundation.org` exists:
- If **exists**: Logs "Admin user already exists" and skips
- If **doesn't exist**: Creates admin with BCrypt hashed password

### 3. Works with Any Database
- ✅ Local PostgreSQL (default: `localhost:5432/ngo_donations`)
- ✅ Neon Cloud Database (production)

---

## Database Setup

### Local Database (Development)
The backend uses local PostgreSQL by default as configured in `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ngo_donations?sslmode=prefer
    username: e141057
    password: 
```

**Start backend locally:**
```bash
mvn spring-boot:run -DskipTests
```

### Neon Cloud Database (Production)
For production deployment, use Neon PostgreSQL:

**Start with Neon database:**
```bash
./start-neon.sh
```

Or manually:
```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
export SPRING_DATASOURCE_USERNAME=neondb_owner
export SPRING_DATASOURCE_PASSWORD=npg_zC7GDKo2JeUq
mvn spring-boot:run -DskipTests
```

---

## Testing Login

### Test with cURL
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "username": "admin",
  "email": "admin@hopefoundation.org",
  "fullName": "System Administrator",
  "role": "ADMIN"
}
```

**Error Response:**
```json
{
  "error": "Invalid username or password"
}
```

### Test from Frontend
1. Navigate to `http://localhost:5173/admin/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. Click "Login"

---

## Troubleshooting

### Login Fails After Restart

**Symptom**: Login returns 401 Unauthorized after backend restart

**Solution**: This is now **automatically fixed**! The `AdminUserInitializer` creates the admin on startup.

### Verify Admin User Exists

**Local Database:**
```bash
psql -U e141057 -d ngo_donations -c "SELECT username, email, active FROM admin_users WHERE email = 'admin@hopefoundation.org';"
```

**Neon Database:**
```bash
PGPASSWORD="npg_zC7GDKo2JeUq" psql "postgresql://neondb_owner@ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" -c "SELECT username, email, active FROM admin_users WHERE email = 'admin@hopefoundation.org';"
```

### Backend Not Starting

Check logs:
```bash
tail -f logs/backend.log
```

Look for:
- ✅ `Started FoundationApplication`
- ✅ `Tomcat started on port 8080`
- ✅ `Ensuring default admin user exists...`
- ✅ `Default admin user check completed`

---

## Manual Admin Creation (If Needed)

If automatic creation fails, use the `/api/auth/initialize` endpoint:

```bash
curl -X POST http://localhost:8080/api/auth/initialize
```

**Note**: This endpoint is protected and only works when:
- `app.allow-admin-bootstrap=true` (default)
- Called after backend has fully started

---

## Security Notes

### Password Security
- Default password `admin123` uses BCrypt with cost factor 12
- Hash stored in database starts with `$2a$12$`
- **Never** store plain text passwords

### Production Checklist
- [ ] Change default admin password immediately
- [ ] Update `JWT_SECRET` in production environment
- [ ] Set `SQL_INIT_MODE=never` to prevent sample data reload
- [ ] Use strong database credentials
- [ ] Enable HTTPS/TLS for API endpoints

---

## Environment Variables

### Required for Neon Database
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-mute-scene-abnd9qj2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_zC7GDKo2JeUq
```

### Optional
```bash
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION_MINUTES=60
ALLOW_ADMIN_BOOTSTRAP=true
```

---

## Key Files Modified

1. **[AdminUserInitializer.java](src/main/java/com/myfoundation/school/config/AdminUserInitializer.java)** - Auto-creates admin on startup
2. **[AuthService.java](src/main/java/com/myfoundation/school/auth/AuthService.java)** - Fixed to check by email, not count
3. **[application.yml](src/main/resources/application.yml)** - Set `sql.init.mode=never`
4. **[start-neon.sh](start-neon.sh)** - Convenience script for Neon database

---

## Summary

✅ **Login now works automatically** on every backend startup  
✅ **No manual intervention required**  
✅ **Works with both local and cloud databases**  
✅ **Credentials**: `admin` / `admin123`  

**You're all set! 🎉**
