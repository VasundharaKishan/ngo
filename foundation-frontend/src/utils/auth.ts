/**
 * Authentication Utilities
 * 
 * This module provides authentication-related helper functions for secure API communication.
 * JWT tokens are stored in httpOnly cookies (not localStorage) for enhanced security.
 * CSRF protection is implemented using the Double Submit Cookie pattern.
 * 
 * @module utils/auth
 */

import { API_BASE_URL } from '../config/constants';

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
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const makeRequest = () => {
    const headers = new Headers(options.headers || {});

    // Only set Content-Type for non-FormData bodies
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Get CSRF token from cookie and include in header for mutation requests
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      const csrfToken = getCsrfToken();
      console.log('[authFetch] CSRF Token from cookie:', csrfToken);
      console.log('[authFetch] All cookies:', document.cookie);
      if (csrfToken) {
        headers.set('X-XSRF-TOKEN', csrfToken);
      } else {
        console.warn('[authFetch] No CSRF token found in cookies for', options.method, 'request!');
      }
    }

    // Include credentials to send httpOnly cookies
    return fetch(url, { 
      ...options, 
      headers,
      credentials: 'include' // Send cookies with every request
    });
  };

  // Make the initial request
  const response = await makeRequest();

  // If we get a 403 and it's a CSRF error, refresh the token and retry once
  if (response.status === 403 && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    try {
      const errorBody = await response.clone().json();
      if (errorBody.message && errorBody.message.includes('CSRF')) {
        console.log('[authFetch] CSRF error detected, refreshing token and retrying...');
        
        // Refresh CSRF token
        const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!csrfResponse.ok) {
          console.error('[authFetch] Failed to refresh CSRF token:', csrfResponse.status);
          return response; // Return original error response
        }
        
        // Wait a bit for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify token was set
        const newToken = getCsrfToken();
        console.log('[authFetch] New CSRF token after refresh:', newToken);
        
        if (!newToken) {
          console.error('[authFetch] CSRF token still not available after refresh');
          return response; // Return original error response
        }
        
        // Retry the original request
        console.log('[authFetch] Retrying request with new CSRF token');
        return makeRequest();
      }
    } catch (e) {
      // If we can't parse the error or refresh fails, return original response
      console.error('[authFetch] Failed to refresh CSRF token:', e);
    }
  }

  return response;
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
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}
