import { handleLogout } from './api.js';

const location = document.location || window.location;
const storage = window.localStorage;
if (!(storage && location)) throw new Error("Browser not supported!");

const moveTo = (path) => {
  if (location.pathname !== path) {
    if (location.pathname === '/') {
      return setTimeout(() => window.location.pathname = path, 910);
    }
    location.pathname = path;
  }
};

const routes = ['/', '/login', '/home', '/logout'];

export function router(path) {
  if (!routes.includes(path)) moveTo('/not-found/');
  if (path === '/logout' && checkLogin()) {
    handleLogout();
  }
  else if (checkLogin()) {
    moveTo('/home/');
  }
  else {
    moveTo('/login/')
  }
}

export default (() => {
  document.addEventListener('DOMContentLoaded', () => {
    router(location.pathname.slice(0,location.pathname.length - 1));
  });
})();

function checkLogin() {
  const token = storage.getItem('token');
  return !!token;
}
