/// <reference types="vite/client" />

/**
 * Centralized API configuration.
 * Defaults to relative '/api' so it works seamlessly on any origin/port.
 */

export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

/**
 * Helper to build an absolute URL for API calls.
 * @param path The endpoint path (e.g., '/tickets')
 * @returns A URL object
 */
export const getApiUrl = (path: string): URL => {
  const baseUrl = API_BASE_URL.startsWith('/') 
    ? window.location.origin + API_BASE_URL 
    : API_BASE_URL;
    
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + sanitizedPath : baseUrl + sanitizedPath;
  
  return new URL(finalUrl);
};
