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

// Fetch interceptor is defined globally in src/main.tsx to guarantee early execution.
