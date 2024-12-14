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

const moveTo = (path) => {
  if (getCurrentPath() !== path) {
    location.pathname = path;
  }
};

const routes = ['/', '/login', '/home', '/logout'];
// const callbacks = [fetchDraws, null, null, null];

export function router(pathTo) {
  if (!routes.includes(pathTo)) return moveTo('/not-found/');
  if (!checkLogin()) {
    moveTo('/login');
  }
  else if (pathTo === '/logout') {
    handleLogout();
  }
  else if (pathTo === '/home') {
    moveTo('/home')
  }
  else {
    moveTo('/');
  }
}

export default (() => {
  document.addEventListener('DOMContentLoaded', async () => {
    const path = getCurrentPath();
    if (path === '/') return;
    router(path);
  });
})();
