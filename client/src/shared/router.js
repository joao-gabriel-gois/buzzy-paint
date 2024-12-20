import { objectToBase32Like } from '../utils/encodingUtils.js';
import { objectToBase64 } from '../utils/encodingUtils.js';
import { handleLogout, checkLogin } from './api.js';
import { location } from './global.js';

// NEED TO TEST NEW CALLBACK APPROACH FOR FETCHING DRAWS
const getCurrentPath = () => {
  const path = location.pathname;
  return path.length > 1
          ? path.slice(0, path.length - 1)
          : path;
}

// const getPreviousPath = () => {
//   const splittedHref = document.referrer.split('/');
//   const prev = splittedHref.at(-2);
//   if (
//     splittedHref[2] === location.host
//   ) return (prev !== location.host ? '/' + prev : '/'); 
//   return null;
// }

const moveTo = (path, data = null) => {
  const hash = !!data ? `#${data}` : '';
  if (getCurrentPath() !== path) {
    location.href = location.protocol + '//' + location.hostname + ':' + location.port + path + hash;
  }
};

const routes = ['/', '/login', '/home', '/logout', '/signup'];
// const callbacks = [fetchDraws, null, null, null];

export function router(pathTo, data) {
  data = data ? objectToBase32Like(data) : '';
  console.log('current data:', data);
  
  if (!routes.includes(pathTo)) return moveTo('/not-found/');
  if (!checkLogin() && pathTo !== '/signup') {
    moveTo('/login');
  }
  else if (pathTo === '/logout') {
    handleLogout();
  }
  else if (pathTo === '/home') {
    moveTo('/home', data);
  }
  else if (pathTo === '/signup') {
    moveTo('/signup');
  }
  else {
    moveTo('/', data);
  }
}

export default (() => {
  document.addEventListener('DOMContentLoaded', async () => {
    const path = getCurrentPath();
    if (path === '/') return;
    router(path);
  });
})();
