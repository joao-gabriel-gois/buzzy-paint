import { handleLogin } from "../shared/api.js";
import '../shared/validator.js';
const $ = (queryTerm) => document.querySelector(queryTerm);

document.addEventListener('DOMContentLoaded', () => {
  const email = $('[name="email"]');
  const password = $('[name="password"]');
  const submit = $('[type="submit"]');

  // add frontend-side validation here

  submit.addEventListener('click', (event) => {
    event.preventDefault();
    handleLogin(email.value, password.value);
  });
});
