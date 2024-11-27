import { router, BASE_URL } from "../js/router.js";

router('/login');

const storage = window.localStorage;
const $ = (queryTerm) => document.querySelector(queryTerm);
const handleLogin = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({email, password}),
      headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();
    if (data.token) {
      storage.setItem('token', data.token);
      router('/');
    }
    else if (data.error) {
      console.log("ERRO: ", data.error);
    }
  } catch (error) {
    console.error('Login failed', error);
  }
};


document.addEventListener('DOMContentLoaded', () => {
  const email = $('[name="email"]');
  const password = $('[name="password"]');
  const submit = $('[type="submit"]');

  submit.addEventListener('click', (event) => {
    event.preventDefault();
    handleLogin(email.value, password.value);
  })
});