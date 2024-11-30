
const location = document.location || window.location;
const storage = window.localStorage;
if (!(storage && location)) throw new Error("Browser not supported!");

export const BASE_URL = 'http://localhost:3333';

export async function apiCall (
  method, 
  path,
  options = {}
) {
  try {
    const token = storage.getItem('token');
    path = path.split('/')[1];
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      method: method.toUpperCase(),
      credentials: 'include', // Important for cookies (check if it should be in options...)
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    });

    if (response.status === 401) {
      await handleTokenRefresh();
      // Retry the original request
      return apiCall(method, path, options);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred');
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    router('/login');
    throw error;
  }
};

export async function handleTokenRefresh() {
  try {
    const response = await fetch(`${BASE_URL}/refresh-session`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const { token } = await response.json();
      storage.setItem('token', token);
      return token;
    } else {
      handleLogout();
    }
  } catch (error) {
    handleLogout();
  }
}

export function handleLogout() {
  try {
    fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    storage.removeItem('token');
    router('/login');
  }
}
