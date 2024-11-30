import { router } from "../js/router.js";
import { BASE_URL } from "../js/api.js";

const { navigator } = window;
const { screen } = window;
if (!(navigator && screen)) throw new Error('Browser not supported!');


const storage = window.localStorage;
const $ = (queryTerm) => document.querySelector(queryTerm);

document.addEventListener('DOMContentLoaded', () => {
  const email = $('[name="email"]');
  const password = $('[name="password"]');
  const submit = $('[type="submit"]');

  submit.addEventListener('click', (event) => {
    event.preventDefault();
    handleLogin(email.value, password.value);
  })
});

async function handleLogin(email, password) {
  // const deviceInfo = getDeviceInfo();
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();
    if (data.token) {
      storage.setItem('token', data.token);
      // setDeviceId
      router('/');
    }
    else if (data.error) {
      console.log("ERRO: ", data.error);
    }
  } catch (error) {
    console.error('Login failed', error);
  }
};

// function getDeviceInfo() {
//   const {
//     userAgent,
//     languages,
//     userAgentData
//   } = navigator;
//   return {
//     userAgent,
//     languages: languages.join(' '),
//     platform: userAgentData.platform,
//     browserDetails: userAgentData
//       .brands
//       .reduce((acc, result) => ({
//         brand: acc.brand + '.' + result.brand,
//         version: acc.version + '.' + result.version
//       }) , {brand: '', version: ''}),
//     isMobile: userAgentData.mobile,
//     screenWidth: screen.width,
//     screenHeight: screen.height
//   }
// }