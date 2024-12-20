import { addCSSClass, getStyle } from '../utils/cssUtils.js';

const inputs = [...document.querySelectorAll('input')];

export default (() => {
  document.addEventListener('DOMContentLoaded', (_) => {
    for (const input of inputs) {
      input.addEventListener('input', event => {
        inputChangeCallback(event);
      });
    }
  });
})();

const repeated = {
  names: {
    message: 'Apenas letras e espaços são aceitos para o nome',
    callback: validateName,
  },
  passwords: {
    message: 'A senha precisa ter ao menos 10 caractéres, incluindo uma letra maíúscula, um número e um caractere especial.',
    callback: validatePassword
  }
}

const INPUT_NAMES = {
  email: {
    message: 'Formato inválido para email, verifique erros de digitação.',
    callback: validateEmail
  },
  username: {
    message: "Deve ter de 4 a 12 caractéres e conter letras, números ou os caracteres '.', '_', '%', '+' ou '-'",
    callback: validateUsername
  },
  lastname: repeated.names,
  firstname: repeated.names,
  password: repeated.passwords,
  confirmpassword: repeated.passwords
}

function inputChangeCallback(event) {
  const eventType = event.target.name.toLowerCase();
  if (!INPUT_NAMES.hasOwnProperty(eventType)) {
    console.warn('Input Type has no assigned callback');
    return;
  }
  renderValidationErrorsIfAny(event.target, eventType);
}

function renderValidationErrorsIfAny(input, eventType) {
  let currentMessage = input.nextElementSibling;
  const parent = input.parentElement;
  if (currentMessage.tagName === 'P') currentMessage.remove();
  const p = document.createElement('p');
  addCSSClass(p, 'validation');
  // p.style.width = `${parseInt(getStyle(parent).width) + parseInt(getStyle(parent).paddingLeft) * 2.4}px`;

  const { message, callback: validate } = INPUT_NAMES[eventType];
  p.innerText = message;
  const submit = parent.querySelector('[type="submit"]');
  if (!validate(input)) {
    input.insertAdjacentElement('afterend', p);
    submit.setAttribute('disabled', true);
    return;
  }
  currentMessage = input.nextElementSibling;
  if (currentMessage.tagName === 'P') currentMessage.remove();
  else if (readyToSubmit()) submit.removeAttribute('disabled'

  );
  else if (input.name === 'confirmPassword') {
    p.innerText = "Confirme o password corretamente, os campos não estão iguais."
    input.insertAdjacentElement('afterend', p);
  }
}

function readyToSubmit() {
  let filled = true;
  for (const input of inputs) {
    filled = filled && input.value.length > 0;
  }
  const formChildren = [...document.querySelector('form').children];
  const hasP = formChildren.some(el => el.tagName === 'P');

  const [psswd, confirmPsswd] = formChildren.filter(el => el.type === 'password');
  if (!psswd || !confirmPsswd)
    return filled && !hasP;
  return filled && !hasP && psswd.value === confirmPsswd.value;
}


function validateEmail(emailInput) {
  const emailRule = new RegExp(
    "^[a-zA-Z0-9][a-zA-Z0-9._%+-]+[a-zA-Z0-9]"
    + "@[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]"
    + "\.[a-zA-Z]{2,7}$",
    'g'
  );
  return emailRule.test(emailInput.value.trim())
}

function validatePassword(passwordInput) {
  const passwordRule = new RegExp(
    "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)"
    + "(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,"
    + ".<>\\/?])(?!.{0,10}$).+$",
    "g"
  );

  return passwordRule.test(passwordInput.value.trim());
}

function validateUsername(usernameInput) {
  const usernameRule = new RegExp(
    '^[a-zA-Z0-9._%+-]{4,12}$',
    'g'
  );

  return usernameRule.test(usernameInput.value.trim());
}

function validateName(nameInput) {
  const nameRule = new RegExp(
    `^(?=.{1,23}$)[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$`
  );

  return nameRule.test(nameInput.value.trim());
}

