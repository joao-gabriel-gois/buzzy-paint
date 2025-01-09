import { storage as strg, sleep } from "./global.js";
import { router as rtr} from "./router.js";
import { createAndRenderAlert } from '../../shared/alerts.js';
import { addCSSClass } from "../utils/cssUtils.js";

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
    // currently working only for /path routes. /path/to/anything might fail
    // we can adjust it later, no need for now
    path = path.split('/').find(str => str !== '');
    method = method.toUpperCase();

    return fetch(`${host}/${path}`, {
      method: method.toUpperCase(),
      ...options
    });
  }

  async function handleTabsDataFetching(attempt = 0, retriesLimit = 3) {
    const token = storage.getItem(tokenStorageKey);
    if (!token) router('/login');
    try {
      const resp = await api.get('/draws', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
      });

      let currentUserId = null;
    
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
      else if (resp.status === 400) {
        storage.removeItem(tokenStorageKey);
      }
      else if (resp.status === 404) {
        // Render Error message
        console.log('Draws not found for this users')
      }
      else if (resp.status === 200) {
        const { user_id, data } = await resp.json();
        currentUserId = user_id;
        const currentTabsDataState = storage.getItem(`${user_id}@${tabsDataStorageKey}`);
        if (!currentTabsDataState) {
          storage.setItem(`${user_id}@${tabsDataStorageKey}`, data);
        }
        else {
          console.log('(Api.handleTabsDataFetching) deciding the most recent state\n', currentTabsDataState.timestamp, 'X', data.timestamp);
          const latestState = currentTabsDataState.timestamp > data.timestamp ? currentTabsDataState : data;
          storage.setItem(`${user_id}@${tabsDataStorageKey}`, latestState);
        }
      }
      return router('/home', currentUserId);
    } catch (error) {
      console.error('Not able to fetch draws. Error:', error);
      // throw new Error('Not able to fetch draws. Error:', error);
    }
  }
  
  async function handleTabsDataSaving(data, hasDraws = true) {
    const token = storage.getItem(tokenStorageKey);
    if (hasDraws) {
      try {
        const response = await api.put('/draws', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.value}`
          },
          body: JSON.stringify(data)       
        })
        if (response.status === 401) {
          const refreshed = await handleTokenRefresh();
          if (!refreshed) {
            createAndRenderAlert(
              {
                type: 'warning',
                title: 'Expired Session!',
                message: 'Your session is expired, you\'ll need to login again.'
              },
              () => router('/logout')
            );   
          }
        }
        else if (response.status === 404) {
          createAndRenderAlert(
            {
              type: 'error',
              title: 'Not found!',
              message: 'You have a document assigned but it could not be found. Forcing logout.'
            },
            () => router('/logout')
          );
        }
        else if (response.status === 422) {
          return await handleTabsDataSaving(data, false);
        }
        else if (response.status === 200) {
          return response;
        }
        console.error('Server is probably unavailable', response);
        createAndRenderAlert(
          {
            type: 'error',
            title: 'Unexpected response!',
            message: 'The response received is not expected. Forcing logout.'
          },
          () => router('/logout')
        );
      }
      catch(error) {
        console.error('tabsManager.saveTabsData() PUT-> Error:', error);
        throw new Error('tabsManager.saveTabsData() PUT-> Error:', error);
      }
    }
    try {
      const response = await api.post('/draws', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(data)
      })
      if (response.status === 401) {
        const refreshed = await handleTokenRefresh();
        if (!refreshed) {
          createAndRenderAlert(
            {
              type: 'warning',
              title: 'Expired Session!',
              message: 'Your session is expired, you\'ll need to login again.'
            },
            () => router('/logout')
          );  
        }
      }
      else if (response.status === 404) {
        createAndRenderAlert(
          {
            type: 'error',
            title: 'Not Saved!',
              message: 'It was not possible to save your first tabs state.'
          },
          () => router('/logout')
        );
      }
      if (response.status === 422) {
        console.error('Api identified this user with an already saved Draw but update was also not possible!');
        createAndRenderAlert(
          {
            type: 'error',
            title: 'Update failed!',
            message: 'You should have assigned tabs, but it was not possible to update.'
          },
          () => router('/logout')
        );
      }
      return response;
    }
    catch(error) {
      console.error('BuzzyPaintAPI.handleTabsDataSaving POST-> Error:', error);
      throw new Error('BuzzyPaintAPI.handleTabsDataSaving POST-> Error:', error);
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

  async function handleCreateAccount(createUserDTO) {
    try {
      const response = await api.post('/users', {
        body: JSON.stringify(createUserDTO),
        headers: {'Content-Type': 'application/json'}
      });

      const data = await response.json();

      if (response.ok || response.created) {
        // const success = renderSuccessModal();
        createAndRenderAlert(
          {
            type: 'success',
            title: 'Account created!',
              message: 'Your account has been successfully created. Moving to login page.'
          },
          () => router('/login')
        );
      }
      else if (data.error) { // maybe check by status
        createAndRenderAlert({
          type: 'error',
          title: data.error.name,
          message: data.error.message
        });
        renderValidationErrorFromResponse(data.error);
      }
    }
    catch(error) {
      error.message = error.message + ', server is probably down.';
      createAndRenderAlert({
        type: 'error',
        title: 'Connection Failure',
        message: error.message
      });
      renderValidationErrorFromResponse(error);
    }
  }

  async function handleLogin(email, password) {
    // const deviceInfo = getDeviceInfo();
    try {
      const response = await api.post('/login', {
        body: JSON.stringify({ email, password }),
        headers: {'Content-Type': 'application/json'},
        credentials: 'include'
      });
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
        createAndRenderAlert({
          type: 'error',
          title: data.error.name,
          message: data.error.message
        });

        renderValidationErrorFromResponse(data.error);
        console.log("ERROR: ", data.error);
      }
    }
    catch (error) {
      error.message = error.message + ', server is probably down.';
      createAndRenderAlert({
        type: 'error',
        title: 'Connection Failure',
        message: error.message
      });
      renderValidationErrorFromResponse(error);
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
    handleCreateAccount,
    handleTokenRefresh,
    handleLogin,
    handleLogout,
    checkLogin,
    handleTabsDataFetching,
    handleTabsDataSaving
  }
}

export const {
  handleCreateAccount,
  handleTokenRefresh,
  handleLogin,
  handleLogout,
  checkLogin,
  handleTabsDataFetching,
  handleTabsDataSaving
} = BuzzyPaintAPI();


function renderValidationErrorFromResponse(response) {
  const submit = document.querySelector('[type="submit"]');
  const currentMessage = submit.nextElementSibling;
  if (
    currentMessage
    && currentMessage.tagName === 'P'
  ) currentMessage.remove();
  const p = document.createElement('p');
  addCSSClass(p, 'validation');

  p.innerText = response.message;
  submit.insertAdjacentElement('afterend', p);
  if (response.issues) {
    response.issues.forEach(issue => {
      const element = document.querySelector(`[name="${issue.path}"]`);
      const currentElementMessage = element.nextElementSibling;
      if (currentElementMessage.tagName === 'P') currentElementMessage.remove();
      const p2 = document.createElement('p');
      addCSSClass(p2, 'validation');
      p2.innerText = issue.message;
      element.insertAdjacentElement('afterend', p2);
    });
  }
}