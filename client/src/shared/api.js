import { storage as strg, sleep } from "./global.js";
import { router as rtr} from "./router.js";
//example:
/*
  api.get('/draws', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  api.post('/refresh-session', { credentials: 'include'});
  api.post('/login', {
    body: {
      email: 'blabla@bla.bla,
      password: 'supersecret'
    },
    credentials: 'include'
  });
*/

const BASE_URL = 'http://127.0.0.1:3333';

const deps = {
  baseURL: BASE_URL,
  tabsDataStorageKey: 'tabsData',
  tokenStorageKey: 'token',
  acceptedMethods: [
    'get',
    'post',
    'put',
    'delete'
  ],
  router: rtr,
  storage: strg,
}

// No npm in the frontend, so this is my axios (:
function BuzzyPaintAPI(dependencies = deps) {
  const {
    baseURL,
    tabsDataStorageKey,
    tokenStorageKey,
    acceptedMethods,
    router,
    storage,
  } = dependencies;


  const api = {};
  acceptedMethods.forEach(method => {
    Object.assign(api, {
      [method]: apiCall.bind(null, method, baseURL)
    });  
  });  

  async function apiCall(method, host, path, options) {
    path = path.split('/').find(str => str !== '');
    method = method.toUpperCase();
    return fetch(`${host}/${path}`, {
      method: method.toUpperCase(),
      ...options
    });
  }

  async function handleTabsDataFetching(attempt = 0, retriesLimit = 3) {
    const token = storage.getItem(tokenStorageKey);
    try {
      const resp = await api.get('/draws', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    
      if (resp.status === 401) {
        const refreshed = await handleTokenRefresh();
        if (!refreshed) {
          return router('/logout');
        }
        if (attempt < retriesLimit) {
          await sleep((attempt + 1) * 1.75);
          return await handleTabsDataFetching(++attempt);
        }
      }
      // TODO> handle unauth preserving tabsData state if there is any
      else if (resp.status === 400) {
        // by removing token the /home routing will move user to /login instead, as expected
        storage.removeItem(tokenStorageKey);
      }
      else if (resp.status === 404 || resp.status === 422) {
        // either user is not found or it doesn't have any draw yet
        // in this case its tabsData storage item should return null, always
        const currentTabsData = storage.getItem(tabsDataStorageKey);
        if (currentTabsData) storage.removeItem(tabsDataStorageKey);
      }
      else if (resp.status === 200) {
        const { data } = await resp.json();
        storage.setItem(tabsDataStorageKey, data);
      }
      return router('/home');
    } catch (error) {
      console.error('Not able to fetch draws. Error:', error);
      throw new Error('Not able to fetch draws. Error:', error);
    }
  }
  
  async function handleTabsDataSaving(data, hasDraws = true) {
    // save storage state before updating
    const token = storage.getItem(tokenStorageKey);
    // update current storage
    storage.setItem(tabsDataStorageKey, data);
    if (hasDraws) {
      try {
        const response = await api.put('/draws', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)       
        })
        if (response.status === 401) {
          const refreshed = await handleTokenRefresh();
          if (!refreshed) {
            alert('Your session is expired, you\'ll need to login again!');
            return router('/logout');
          }
        }
        else if (response.status === 404) {
          alert('Something went really wrong with your serssion! Force logout!');
          return router('/logout');
        }
        else if (response.status === 422) {
          return await handleTabsDataSaving(data, false);
        }
        else if (response.status === 200) {
          return response;
        }
        console.error('Server is probably unavailable', response);
        throw new Error('Server is probably unavailable', response);
      }
      catch(error) {
        console.error('tabsManager.saveTabsData() PUT-> Error:', error);
      }
    }
    try {
      const response = await api.post('/draws', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (response.status === 401) {
        const refreshed = await handleTokenRefresh();
        if (!refreshed) {
          alert('Your session is expired, you\'ll need to login again!');
          return router('/logout');
        }
      }
      else if (response.status === 404) {
        alert('Something went really wrong with your serssion! Force logout!');
        return router('/logout');
      }
      if (response.status === 422) {
        console.error('Api identified this user with an already saved Draw but update was also not possible!');
        throw new Error('Api identified this user with an already saved Draw but update was also not possible!');
      }
      return response;
    }
    catch(error) {
      console.error('tabsManager.saveTabsData() POST-> Error:', error);
    }
  }  

  async function handleTokenRefresh() {
    try {
      const response = await api.post('/refresh-session', {
        credentials: 'include'
      });

      if (response.ok) {
        const { token } = await response.json();
        storage.setItem(tokenStorageKey, token);
        return token;
      }
      handleLogout();
    } catch (error) {
      console.error("Handle Refresh Token ERROR:", error)
      handleLogout();
    }
  }

  async function handleLogin(email, password) {
    // const deviceInfo = getDeviceInfo();
    try {
      const response = await api.post('/login', {
        body: JSON.stringify({ email, password }),
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
      })
      // const response = await fetch(`${BASE_URL}/login`, {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password }),
      //   headers: {'Content-Type': 'application/json'},
      //   credentials: 'include'
      // });
      const data = await response.json();
      if (data.token) {
        storage.setItem(tokenStorageKey, data.token);
        router('/');
      }
      else if (data.error) {
        console.log("ERROR: ", data.error);
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  };
  
  function handleLogout() {
    // dispatch clean token!
    storage.removeItem(tokenStorageKey);
    router('/login');
  }

  function checkLogin() {
    const token = storage.getItem(tokenStorageKey);
    return !!token;
  }

  return {
    handleTokenRefresh,
    handleLogin,
    handleLogout,
    checkLogin,
    handleTabsDataFetching,
    handleTabsDataSaving
  }
}

export const {
  handleTokenRefresh,
  handleLogin,
  handleLogout,
  checkLogin,
  handleTabsDataFetching,
  handleTabsDataSaving
} = BuzzyPaintAPI();