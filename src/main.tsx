import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Fetch Interceptor to automatically add JWT auth header
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const userString = sessionStorage.getItem('user');
  let token = '';
  if (userString) {
    try {
      const user = JSON.parse(userString);
      token = user.token || '';
    } catch (e) {
      console.error('Failed to parse user from sessionStorage', e);
    }
  }

  const urlStr = typeof input === 'string' 
    ? input 
    : (input instanceof URL 
        ? input.toString() 
        : (input && typeof input === 'object' && 'url' in input 
            ? (input as any).url 
            : ''));
            
  const isApiRequest = typeof urlStr === 'string' && (urlStr.startsWith('/api') || urlStr.includes('/api/') || urlStr.includes(':5000/api'));

  let fetchPromise;
  if (isApiRequest && token) {
    // Clone init to prevent modifying frozen/sealed objects in strict mode
    const newInit = { ...init };
    const headers = new Headers(newInit.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    newInit.headers = headers;
    fetchPromise = originalFetch(input, newInit);
  } else {
    fetchPromise = originalFetch(input, init);
  }

  return fetchPromise.then((response) => {
    if (response.status === 401 && isApiRequest && !urlStr.includes('/api/login')) {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('settings');
      window.location.href = '/login';
    }
    return response;
  });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
