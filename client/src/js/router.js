const location = document.location || window.location;
const storage = window.localStorage;
if (!(storage || location)) throw new Error("Browser not supported!");

export const BASE_URL = 'http://localhost:3333';

const routeTo = (path) => {
  location.pathname = path;
};

// export function router() {
//   let oldHref = document.location.pathname;
//   const body = document.querySelector('body');
//   const observer = new MutationObserver(mutations => {
//     if (oldHref !== document.location.pathname) {
//       oldHref = document.location.pathname;
//       routerHandler('/');
//     }
//   });
//   observer.observe(body, { childList: true, subtree: true });
// };

export function router(path) {
  if (path === '/' || path === '/login') {
    console.log('authed route:', path);
    checkLogin('/home');
  }
  else if(path === '/home') {
    checkLogin();
  }
  else if (path === '/logout') {
    handleLogout();
  }
  else {
    routeTo('/not-found')
  }
};

async function checkLogin(destinationPath) {
  try {
    console.log('checkLogin: inside!');
    const token = storage.getItem('token');
    if (!token) {
      console.log('checkLogin: no token!')
      return routeTo('/login');
    }
    // const response = await apiCall('GET', '/draws');
    if (destinationPath) {
      console.log('checkLogin: inside destination path!')
      return routeTo(destinationPath);
    }
  } catch (error) {
    routeTo('/login');
  }
  console.log('checkLogin: leaving!');

  return;
}

// function loadHomeData() {
//     const token = storage.getItem('token');
//     if (!token) {
//       router('/login');
//       return false;
//     }
// }

async function apiCall (
  method, 
  path, 
  options = {}
) {
  try {
    const token = storage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      method: method.toUpperCase(),
      credentials: 'include', // Important for cookies
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

async function handleTokenRefresh() {
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

function handleLogout() {
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
