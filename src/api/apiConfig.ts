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
window.fetch = async (input, init) => {
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
          init = init || {};
          let headers: Headers;
          if (init.headers instanceof Headers) {
            headers = init.headers;
          } else if (Array.isArray(init.headers)) {
            headers = new Headers(init.headers);
          } else {
            headers = new Headers(init.headers || {});
          }

          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${user.token}`);
          }
          init.headers = headers;
        }
      }
    } catch (e) {
      console.error('Failed to add auth header to fetch:', e);
    }
  }
  return originalFetch(input, init);
};
