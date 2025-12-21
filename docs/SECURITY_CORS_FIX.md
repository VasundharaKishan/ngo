# Security & CORS 403 Fix Summary

## Problem
Frontend deployed to Vercel (https://frontend-three-psi-17.vercel.app) received **403 Forbidden** errors when calling backend APIs on Railway.

## Root Causes

### 1. **Incorrect CORS Configuration**
- `allowCredentials(true)` was set but not necessary (no cookies used)
- When `allowCredentials=true`, you cannot use wildcard `*` for headers
- Frontend origin not explicitly added to allowed origins list

### 2. **Missing Logging**
- No visibility into which security rule was causing 403
- No CORS debugging enabled

## Changes Made

### File 1: `SecurityConfig.java`

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/security/SecurityConfig.java`

#### Changes:
1. ✅ Added `@Slf4j` for logging
2. ✅ Added custom `AccessDeniedHandler` to log 403 errors with details
3. ✅ Fixed CORS configuration:
   - Set `allowCredentials(false)` (no cookies used)
   - Explicitly added Vercel URL: `https://frontend-three-psi-17.vercel.app`
   - Specified exact allowed headers instead of wildcard
   - Added `Stripe-Signature` header for webhooks
4. ✅ Cleaned up endpoint rules (removed redundant patterns)
5. ✅ Added documentation comments explaining public vs protected endpoints

#### Key CORS Settings:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:3000",
    frontendUrl,  // From env var: FRONTEND_URL
    "https://frontend-three-psi-17.vercel.app"  // Hardcoded as backup
));

configuration.setAllowCredentials(false);  // No cookies = no credentials needed

configuration.setAllowedHeaders(Arrays.asList(
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Stripe-Signature"  // For Stripe webhooks
));
```

### File 2: `application.yml`

**Location**: `foundation-backend/src/main/resources/application.yml`

#### Changes:
Added debug logging for security and CORS:
```yaml
logging:
  level:
    com.myfoundation.school.security: DEBUG
    org.springframework.security: DEBUG
    org.springframework.web.cors: DEBUG
```

## Environment Variables Required

### Railway Backend:
```bash
FRONTEND_URL=https://frontend-three-psi-17.vercel.app
DATABASE_URL=jdbc:postgresql://...
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Vercel Frontend:
```bash
VITE_API_BASE_URL=https://ngo-production-cd8a.up.railway.app/api
```

## Public Endpoints (No Authentication)

These endpoints are accessible without any authentication:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/campaigns/**` | Browse campaigns, get featured campaigns |
| `GET /api/categories/**` | Browse categories |
| `GET /api/cms/**` | Public content (hero, testimonials, stats, carousel) |
| `GET /api/config/public` | Public site configuration |
| `POST /api/donations/stripe/checkout` | Create Stripe checkout session |
| `POST /api/donations/stripe/webhook` | Stripe webhook handler |
| `GET /actuator/health` | Health check endpoint |

## Protected Endpoints (Require Authentication)

When JWT is fully implemented, these will require authentication:
- `POST /api/admin/**` - Admin operations
- `POST /api/auth/logout` - User logout

## Testing the Fix

### 1. Deploy to Railway
```bash
git add .
git commit -m "Fix CORS and security configuration for production"
git push origin main
```

Railway will auto-deploy from GitHub.

### 2. Check Railway Logs
After deployment, check logs for:
```
Configuring Security Filter Chain with FRONTEND_URL: https://frontend-three-psi-17.vercel.app
CORS allowed origins: [http://localhost:5173, ..., https://frontend-three-psi-17.vercel.app]
```

### 3. Test from Vercel
Open https://frontend-three-psi-17.vercel.app and check:
- Homepage loads without errors
- Featured campaigns appear
- CMS content (testimonials, stats) loads
- Network tab shows 200 OK responses

### 4. Verify CORS Headers
In browser DevTools → Network → Select any API request → Response Headers:
```
Access-Control-Allow-Origin: https://frontend-three-psi-17.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

## Why 304 vs 200 for /api/campaigns?

### HTTP Status Codes:

**200 OK** = Fresh response from server with full data
**304 Not Modified** = Browser cache is still valid, no new data sent

### How it Works:

1. **First Request**:
   ```
   GET /api/campaigns?featured=true
   → Server returns 200 OK with data + ETag: "abc123"
   → Browser caches response
   ```

2. **Second Request** (within cache period):
   ```
   GET /api/campaigns?featured=true
   Headers: If-None-Match: "abc123"
   → Server checks: "abc123" still valid?
   → Server returns 304 Not Modified (no body)
   → Browser uses cached data
   ```

### Benefits:
- ✅ Saves bandwidth (no duplicate data transfer)
- ✅ Faster page loads (browser reads from cache)
- ✅ Reduces server load

### When You See Each:

| Scenario | Status Code |
|----------|-------------|
| First visit | 200 OK |
| Refresh page (Ctrl+R) | 304 Not Modified |
| Hard refresh (Ctrl+Shift+R) | 200 OK |
| Cache expired | 200 OK |
| Data changed on server | 200 OK |

**This is normal and expected behavior!** It means your API is properly implementing HTTP caching.

## Troubleshooting

### Still Getting 403?

1. **Check Railway Environment Variables**:
   ```bash
   railway variables
   ```
   Ensure `FRONTEND_URL=https://frontend-three-psi-17.vercel.app`

2. **Check Railway Logs**:
   ```
   railway logs
   ```
   Look for "Access Denied" messages showing the failing endpoint

3. **Check Deployment Status**:
   - Railway dashboard → Your service
   - Ensure latest commit is deployed
   - Check build logs for errors

### CORS Errors Still Happening?

1. **Verify Vercel URL** matches exactly in SecurityConfig
2. **Check Railway logs** for CORS-related errors
3. **Try hard refresh** (Ctrl+Shift+R) on frontend to clear cache

### Network Issues?

1. **Check Railway service is running**: https://ngo-production-cd8a.up.railway.app/actuator/health
2. **Check Vercel deployment succeeded**
3. **Verify environment variables** in both platforms

## Summary

✅ **Security**: All public endpoints properly configured  
✅ **CORS**: Fixed with explicit origins and headers  
✅ **Logging**: Added debug logging for troubleshooting  
✅ **Webhooks**: Stripe-Signature header allowed  
✅ **Caching**: 304 responses are normal and beneficial  

The 403 errors should now be resolved after deploying these changes to Railway.
