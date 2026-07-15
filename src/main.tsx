import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Fetch Interceptor to automatically add JWT auth header
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
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

  if (isApiRequest && token) {
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    init.headers = headers;
  }

  const response = await originalFetch(input, init);

  if (response.status === 401 && isApiRequest && !urlStr.includes('/api/login')) {
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
