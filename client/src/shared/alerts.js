import { smoothlyFadeoutElement } from "../utils/smoothlyFadeoutElement.js";

const ALERT_TYPES = {
  error: {
    icon: '../assets/error.png',
  },
  success: {
    icon: '../assets/success.png',
  },
  warning: {
    icon: '../assets/warning.png',
  },
  info: {
    icon: '../assets/info.png',
  },
}

let renderedAlerts = 0;
let callbacks = [];

// Alert with assignable callback
export const createAndRenderAlert = ({ type, title, message }, closeCallback) => {
  type = type.toLowerCase();
  if (!ALERT_TYPES.hasOwnProperty(type)) {
    console.error('Type declared for Alert doesn\'t exist!');
    return;
  }
  
  const { icon } = ALERT_TYPES[type];
  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', 'alert-wrapper');
  wrapper.classList.add(type);

  const alertContent = `
    <div id="alert" data-id=${renderedAlerts + 1}>
      <header>
        <img id="icon" src="${icon}" />
        <h1 id="title">${title}</h1>
        <button id="close">X</button>
      </header>
      <div id="content">
        <p id="message">${message}</p>
        <button>OK</button>
      </div>
    </div>
  `;

  wrapper.innerHTML = alertContent;
  const buttons = wrapper.querySelectorAll('button');
  for (const button of buttons) {
    button.addEventListener('click', (_) => fadeAlertOut(wrapper, closeCallback));
  }

  if (renderedAlerts === 0) {
    const siblings = [...document.body.children]
      .filter(el => el.id !== 'alert-wrapper');
    siblings.forEach(sib => sib.classList.add('content-bellow'));
  }
  
  if (closeCallback && !isRepeatedCallback(closeCallback)) {
    callbacks.push(closeCallback);
    document.addEventListener(`alert-closed-${renderedAlerts + 1}`, closeCallback);
  }

  document.body.appendChild(wrapper);
  renderedAlerts++;
}

// Confirm:
// example:
  // setTimeout(() => {
  //   createAndRenderConfirm({
  //     type: 'info',
  //     title: 'Do you accept?',
  //     message: 'Details bla bla bla, accept!?'
  //   }).then(console.log);
  // }, 1000);
export const createAndRenderConfirm = ({ type, title, message }) => {
  type = type.toLowerCase();
  if (!ALERT_TYPES.hasOwnProperty(type)) {
    console.error('Type declared for Alert doesn\'t exist!');
    return;
  }
  
  const { icon } = ALERT_TYPES[type];
  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', 'alert-wrapper');
  wrapper.classList.add(type);

  const alertContent = `
    <div id="alert">
      <header>
        <img id="icon" src="${icon}" />
        <h1 id="title">${title}</h1>
        <button id="close">X</button>
      </header>
      <div id="content">
        <p id="message">${message}</p>
        <div id="buttons">
          <button>Yes</button>
          <button>No</button>
        </div>
      </div>
    </div>
  `;

  wrapper.innerHTML = alertContent;
  const closeButton = wrapper.querySelector('#close');
  closeButton.addEventListener('click', (_) => fadeAlertOut(wrapper));
  
  const siblings = [...document.body.children]
    .filter(el => el.id !== 'alert-wrapper');
  siblings.forEach(sib => sib.classList.add('content-bellow'));
  ;
  document.body.appendChild(wrapper);


  return new Promise((resolve, reject) => {
    const [ confirm, deny ] = [...wrapper.querySelector('#buttons').children];
    try {
      confirm.addEventListener('click', () => {
        fadeAlertOut(wrapper);
        return resolve(true);
      });
      deny.addEventListener('click', () => {
        fadeAlertOut(wrapper);
        return resolve(false)
      });
    }
    catch (error) {
      reject(error);
    }
  });
}

// setTimeout(() => {
//   createAndRenderPrompt({
//     type: 'info',
//     title: 'Do you accept?',
//     message: 'Details bla bla bla, please fill it and confirm:'
//   }).then(console.log);
// }, 1000);
export const createAndRenderPrompt = ({ type, title, message, checkboxTitle = null }) => { // confirm the string if user sent it, otherwise send false;
  type = type.toLowerCase();
  if (!ALERT_TYPES.hasOwnProperty(type)) {
    console.error('Type declared for Alert doesn\'t exist!');
    return;
  }
  
  const { icon } = ALERT_TYPES[type];
  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', 'alert-wrapper');
  wrapper.classList.add(type);

  const alertContent = `
    <div id="alert">
      <header>
        <img id="icon" src="${icon}" />
        <h1 id="title">${title}</h1>
        <button id="close">X</button>
      </header>
      <div id="content">
        <p id="message">${message}</p>
        <input type="text" id="prompt" />
        ${checkboxTitle !== null
          ?
            `<div id="checkbox-wrapper">
              <label for="checkbox">${checkboxTitle}</label>
              <input type="checkbox" id="checkbox" name="checkbox" />
            </div>`
          : ''
        }
      </div>
        <div id="buttons">
          <button>Confirm</button>
          <button>Cancel</button>
        </div>
      </div>
    </div>
  `;

  wrapper.innerHTML = alertContent;
  console.log(wrapper);
  const closeButton = wrapper.querySelector('#close');
  closeButton.addEventListener('click', (_) => fadeAlertOut(wrapper));
  
  const siblings = [...document.body.children]
    .filter(el => el.id !== 'alert-wrapper');
  siblings.forEach(sib => sib.classList.add('content-bellow'));
  
  const [ confirm, cancel ] = [...wrapper.querySelector('#buttons').children];
  confirm.setAttribute('disabled', true);

  const input = wrapper.querySelector('#prompt');
  const checkbox = wrapper.querySelector('#checkbox');
  input.addEventListener('input', (e) => {
    if (input.value.length > 0) confirm.removeAttribute('disabled');
    else confirm.setAttribute('disabled', true);
  });
  document.body.appendChild(wrapper);


  return new Promise((resolve, reject) => {
    confirm.addEventListener('click', () => {
      fadeAlertOut(wrapper);
      const finalResponse = {
        text: input.value.trim(),
      }
      if (checkbox) {
        Object.assign(
          finalResponse,
          {
            checkbox: checkbox.checked
          }
        )
      };
      return resolve(finalResponse);
    });
    cancel.addEventListener('click', () => {
      fadeAlertOut(wrapper);
      return resolve(false)
    });
  });
}

function fadeAlertOut(wrapper, confirmationCallback, siblings = [...document.body.children]) {
  if (confirmationCallback) {
    const alertId = wrapper.firstElementChild.getAttribute('data-id');
    const notifyEvent = new Event(`alert-closed-${alertId}`);
    document.dispatchEvent(notifyEvent);
    document.removeEventListener(`alert-closed-${alertId}`, confirmationCallback);
    const callbackIndex = Number(alertId) - 1;
    callbacks = [
      ...callbacks.slice(0, callbackIndex),
      ...callbacks.slice(callbackIndex + 1, callbacks.length)
    ];
  };
  smoothlyFadeoutElement(wrapper, () => {
    if (renderedAlerts === 1)
      siblings.forEach(sib => sib.classList.remove('content-bellow'));
    wrapper.remove();
    renderedAlerts--;
  });
}

function isRepeatedCallback(callback) {
  for (let i = 0; i < callbacks.length; i++) {
    if (isSameFunction(callback, callbacks[i])) {
      return true;
    }
  }
  return false;
}

function isSameFunction(fn1, fn2) {
  let first = String(fn1).split('{');
  let second = String(fn2).split('{');
  
  if (first.length === 2) 
    first = first[1].trim();
  else {
    first = String(fn1).split('>')[1];
    if (!first) throw new Error('First argument is not a function!');
    first = first.trim();
  }
  if (second.length === 2)
    second = second[1].trim();
  else {
    second = String(fn2).split('>')[1];
    if (!second) throw new Error('Second argument is not a function!');
    second = second.trim();
  }
  
  first = first.replaceAll('\n', '').replaceAll(';', '');
  if (first[first.length - 1] === '}') first = first.slice(0, first.length - 1);
  if (second[second.length - 1] === '}') second = second.slice(0, second.length - 1);
  first = first.trim();
  second = second.trim();
  
  return first === second;
}
