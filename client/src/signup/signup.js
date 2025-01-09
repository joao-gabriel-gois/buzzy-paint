import { handleCreateAccount } from "../shared/api.js";
import '../shared/validator.js';
const $ = (queryTerm) => document.querySelector(queryTerm);

document.addEventListener('DOMContentLoaded', () => {
  const firstName = $('[name="firstName"]');
  const lastName = $('[name="lastName"]');
  const username = $('[name="username"]');
  const email = $('[name="email"]');
  const password = $('[name="password"]');
  const confirmPassword = $('[name="confirmPassword"]');
  
  const submit = $('[type="submit"]');

  // add frontend-side validation here

  submit.addEventListener('click', (event) => {
    event.preventDefault();
    handleCreateAccount({
      firstName: firstName.value,
      lastName: lastName.value,
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });
  });
});
