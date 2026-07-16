/// <reference types="vite/client" />

/**
 * Centralized API configuration.
 * Uses environment variable if available, otherwise defaults to '/api'.
 * 
 * When using 'new URL()', always provide window.location.origin as the second argument
 * if the API_BASE_URL is a relative path.
 */

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

/**
 * Helper to build an absolute URL for API calls.
 * This ensures that 'new URL()' never fails due to a missing base.
 * @param path The endpoint path (e.g., '/tickets')
 * @returns A URL object
 */
export const getApiUrl = (path: string): URL => {
  const baseUrl = API_BASE_URL.startsWith('/') 
    ? window.location.origin + API_BASE_URL 
    : API_BASE_URL;
    
  // Ensure we don't have double slashes if path also starts with /
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + sanitizedPath : baseUrl + sanitizedPath;
  
  return new URL(finalUrl);
};

// Global Fetch Interceptor to attach JWT token
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        let urlString = '';
        if (typeof input === 'string') {
          urlString = input;
        } else if (input instanceof URL) {
          urlString = input.toString();
        } else if (input && (input as any).url) {
          urlString = (input as any).url;
        }

        const isApi = urlString.includes('/api/') || urlString.startsWith('/api/') || urlString.includes(API_BASE_URL);
        const isLogin = urlString.includes('/login');

        if (isApi && !isLogin) {
          // Clone init to prevent modifying frozen/sealed objects in strict mode
          const newInit = { ...init };
          let headers: Headers;
          if (newInit.headers instanceof Headers) {
            headers = newInit.headers;
          } else if (Array.isArray(newInit.headers)) {
            headers = new Headers(newInit.headers);
          } else {
            headers = new Headers(newInit.headers || {});
          }

          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${user.token}`);
          }
          newInit.headers = headers;
          return originalFetch(input, newInit);
        }
      }
    } catch (e) {
      console.error('Failed to add auth header to fetch:', e);
    }
  }
  return originalFetch(input, init);
};
