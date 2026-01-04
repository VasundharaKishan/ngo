/**
 * Authentication Utilities
 * 
 * This module provides authentication-related helper functions for secure API communication.
 * JWT tokens are stored in httpOnly cookies (not localStorage) for enhanced security.
 * CSRF protection is implemented using the Double Submit Cookie pattern.
 * 
 * @module utils/auth
 */

/**
 * Get the authentication token (deprecated - kept for backwards compatibility).
 * 
 * Note: JWT is now stored in httpOnly cookies and not accessible from JavaScript.
 * This function always returns null as tokens are handled server-side.
 * 
 * @returns null - JWT tokens are in httpOnly cookies
 * @deprecated Use authFetch instead, which automatically handles cookies
 */
export const getAuthToken = (): string | null => {
  // JWT is in httpOnly cookie, not accessible from JavaScript
  // This function is kept for compatibility but always returns null
  return null;
};

/**
 * Add authentication headers (deprecated - kept for backwards compatibility).
 * 
 * Note: With httpOnly cookie authentication, no manual header addition is needed.
 * JWT cookie is automatically sent when using credentials: 'include' in fetch.
 * 
 * @param headers - Optional headers object to pass through
 * @returns The same headers object unchanged
 * @deprecated Use authFetch instead, which handles authentication automatically
 */
export const withAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  // No need to manually add Authorization header
  // JWT cookie is automatically sent with credentials: 'include'
  return headers;
};

/**
 * Authenticated fetch wrapper with automatic CSRF protection and cookie handling.
 * 
 * This function wraps the native fetch API to:
 * - Automatically include httpOnly cookies (credentials: 'include')
 * - Extract and send CSRF token from cookies for protection against CSRF attacks
 * - Set Content-Type header for JSON payloads (but not for FormData)
 * 
 * **Security Features:**
 * - httpOnly cookies prevent XSS attacks
 * - CSRF tokens prevent cross-site request forgery
 * - Automatic credential inclusion for authenticated requests
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns Promise from fetch with authentication and CSRF protection
 * 
 * @example
 * // GET request
 * const response = await authFetch('/api/admin/campaigns');
 * 
 * @example
 * // POST request with JSON body
 * const response = await authFetch('/api/admin/campaigns', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'New Campaign' })
 * });
 * 
 * @example
 * // POST request with FormData (no Content-Type needed)
 * const formData = new FormData();
 * formData.append('file', file);
 * const response = await authFetch('/api/admin/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 */
export const authFetch = (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});

  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Get CSRF token from cookie and include in header
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers.set('X-XSRF-TOKEN', csrfToken);
  }

  // Include credentials to send httpOnly cookies
  return fetch(url, { 
    ...options, 
    headers,
    credentials: 'include' // Send cookies with every request
  });
};

/**
 * Extract CSRF token from browser cookies.
 * 
 * Implements the Double Submit Cookie pattern for CSRF protection.
 * The server sets XSRF-TOKEN cookie, and we read it to send back in X-XSRF-TOKEN header.
 * 
 * @returns The CSRF token string if found, null otherwise
 * @internal This is a private helper function
 */
function getCsrfToken(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) {
    const token = parts.pop()?.split(';').shift();
    return token || null;
  }
  return null;
}
