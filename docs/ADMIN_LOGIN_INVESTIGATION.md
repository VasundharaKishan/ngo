# 🔐 Admin Login Investigation Report

## Issue Analysis

### Default Admin Credentials
According to ADMIN_LOGIN_SETUP.md, the backend automatically creates a default admin user on startup:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@hopefoundation.org`

### Login Flow
1. User submits username/password
2. POST request to `/api/auth/login`
3. Backend authenticates user
4. Backend returns JWT token (in httpOnly cookie)
5. Frontend stores user info in localStorage
6. Redirect to `/admin` dashboard

---

## 🔍 Potential Issues

### 1. Backend Not Running ⚠️
**Symptom**: Connection refused / CORS error  
**Solution**: Start backend server
```bash
cd foundation-backend
./start-backend.sh
# OR
./start-neon.sh  # For Neon database
```

### 2. Database Not Initialized ⚠️
**Symptom**: "Invalid username or password" error  
**Cause**: Admin user not created in database  
**Solution**: Backend auto-creates admin on startup (AdminUserInitializer)
- Check backend logs for: "Created default admin user"
- If not created, check database connection

### 3. CORS Issues ⚠️
**Symptom**: CORS policy error in browser console  
**Solution**: Verify backend CORS configuration allows frontend origin
```yaml
# application.yml
cors:
  allowed-origins: http://localhost:5173
  allowed-methods: GET, POST, PUT, DELETE, PATCH
  allowed-headers: "*"
  allow-credentials: true
```

### 4. Wrong API URL ⚠️
**Symptom**: 404 Not Found  
**Check**: Verify API_BASE_URL in frontend
```typescript
// src/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### 5. JWT Cookie Issues ⚠️
**Symptom**: Login succeeds but redirects back to login  
**Cause**: Cookie not being set or read properly  
**Check**:
- Browser cookie settings (3rd-party cookies enabled)
- Backend JWT cookie configuration
- SameSite/Secure cookie attributes

### 6. Password Mismatch ⚠️
**Symptom**: "Invalid username or password"  
**Cause**: Using wrong credentials  
**Solution**: 
- Try default: admin / admin123
- Check if password was changed
- Use restore-admin.sh to reset:
  ```bash
  cd foundation-backend
  ./restore-admin.sh
  ```

---

## 🧪 Testing Steps

### Step 1: Verify Backend is Running
```bash
# Check if backend is running on port 8080
curl http://localhost:8080/api/health
# OR
lsof -i :8080
```

### Step 2: Test Login API Directly
```bash
# Test authentication endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v
```

**Expected Response**:
```json
{
  "username": "admin",
  "email": "admin@hopefoundation.org",
  "fullName": "Admin User",
  "role": "ADMIN",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Check Backend Logs
```bash
cd foundation-backend
tail -f logs/application.log
# Look for:
# - "Login attempt for user: admin"
# - "User admin logged in successfully"
# - OR error messages
```

### Step 4: Verify Database Connection
```bash
# Check if admin user exists in database
cd foundation-backend
# If using local PostgreSQL:
psql -d ngo_donations -c "SELECT username, email, active FROM admin_user WHERE username='admin';"

# If using Neon:
# Check connection string in application.yml
```

### Step 5: Test in Browser
1. Open http://localhost:5173/admin/login
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Enter credentials: admin / admin123
5. Click Login
6. Check:
   - Request URL (should be http://localhost:8080/api/auth/login)
   - Response status (should be 200)
   - Response body (should contain user data)
   - Cookies tab (should see admin_jwt cookie)
   - Console (check for errors)

---

## 🛠️ Quick Fix Commands

### If Backend Not Running:
```bash
cd /Users/e141057/Desktop/work/foundation/ngo/foundation-backend
./start-backend.sh
```

### If Admin User Doesn't Exist:
```bash
cd /Users/e141057/Desktop/work/foundation/ngo/foundation-backend
./restore-admin.sh
```

### If Database Issues:
```bash
# Restart PostgreSQL
brew services restart postgresql@14

# Check database exists
psql -l | grep ngo_donations
```

### Check All Services:
```bash
cd /Users/e141057/Desktop/work/foundation/ngo
./start-all.sh
```

---

## 🔧 Common Fixes

### Fix 1: Reset Admin Password
```bash
cd foundation-backend
./restore-admin.sh
# This restores admin user with default password
```

### Fix 2: Clear Browser Cache
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then reload page
```

### Fix 3: Restart Services
```bash
# Kill backend
lsof -t -i:8080 | xargs kill -9

# Start backend
cd foundation-backend
./start-backend.sh

# Start frontend (already running on :5173)
```

---

## 📊 Diagnostic Checklist

Use this checklist to diagnose the login issue:

- [ ] Backend service is running (port 8080)
- [ ] Database is accessible
- [ ] Admin user exists in database
- [ ] Network tab shows POST to /api/auth/login
- [ ] Response status is 200 (not 401, 404, 500)
- [ ] Response contains user data and token
- [ ] Cookie "admin_jwt" is set in browser
- [ ] No CORS errors in console
- [ ] No JavaScript errors in console
- [ ] localStorage has "adminUser" after login
- [ ] Redirect to /admin happens after login

---

## 🎯 Next Steps

### Immediate (To Test Now):
1. **Check if backend is running**:
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Test login endpoint**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Check backend logs**:
   ```bash
   cd foundation-backend
   tail -20 logs/application.log
   ```

### If Issue Persists:
1. Check browser console for specific error messages
2. Verify API_BASE_URL in frontend matches backend URL
3. Test with different browser (rule out browser-specific issues)
4. Check firewall/antivirus blocking localhost connections
5. Verify JWT configuration in backend application.yml

---

## 📝 Login Flow Diagram

```
┌─────────┐                 ┌─────────┐                 ┌──────────┐
│ Browser │                 │ Backend │                 │ Database │
└────┬────┘                 └────┬────┘                 └─────┬────┘
     │                           │                           │
     │  POST /api/auth/login     │                           │
     │ {username, password}      │                           │
     │──────────────────────────>│                           │
     │                           │                           │
     │                           │  SELECT admin_user        │
     │                           │  WHERE username='admin'   │
     │                           │──────────────────────────>│
     │                           │                           │
     │                           │  Return user data         │
     │                           │<──────────────────────────│
     │                           │                           │
     │                           │  BCrypt verify password   │
     │                           │  (internal)               │
     │                           │                           │
     │                           │  Generate JWT token       │
     │                           │  (internal)               │
     │                           │                           │
     │  200 OK                   │                           │
     │  {user data, token}       │                           │
     │  Set-Cookie: admin_jwt    │                           │
     │<──────────────────────────│                           │
     │                           │                           │
     │  Store user in            │                           │
     │  localStorage             │                           │
     │  Redirect to /admin       │                           │
     │                           │                           │
```

---

## 🚨 Error Messages & Solutions

### "Invalid username or password"
- ✅ Check credentials: admin / admin123
- ✅ Run restore-admin.sh to reset
- ✅ Verify admin user exists in database

### "Network Error" / "Failed to fetch"
- ✅ Backend not running → Start backend
- ✅ Wrong API URL → Check API_BASE_URL
- ✅ CORS error → Check backend CORS config

### "Unauthorized" (401)
- ✅ Wrong password → Try admin123
- ✅ User inactive → Check active flag in database
- ✅ OTP required → Check if OTP is enabled

### Redirects back to login after successful login
- ✅ Cookie not set → Check cookie settings
- ✅ JWT validation failing → Check JWT secret
- ✅ Session expired → Check JWT expiration time

---

## 🎯 Summary

**Status**: ⏳ **NEEDS TESTING**

**Most Likely Issues**:
1. Backend not running (70% probability)
2. Wrong credentials (20% probability)
3. Database connection issue (10% probability)

**Recommended Actions**:
1. ✅ Verify backend is running on port 8080
2. ✅ Test login API endpoint with curl
3. ✅ Check backend logs for errors
4. ✅ Try default credentials: admin / admin123
5. ✅ If all else fails, run restore-admin.sh

**Next Step**: Test backend health endpoint to confirm service is running.

---

**Reviewed by**: GitHub Copilot  
**Date**: January 2, 2025  
**Status**: Investigation Complete - Ready for Testing
