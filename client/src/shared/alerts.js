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


export const createAndRenderAlert = ({ type, title, message }, confirmationCallback) => {
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
        <button>OK</button>
      </div>
    </div>
  `;

  wrapper.innerHTML = alertContent;
  const buttons = wrapper.querySelectorAll('button');
  for (const button of buttons) {
    button.addEventListener('click', fadeAlertOut);
  }
  
  const siblings = [...document.body.children]
    .filter(el => el.id !== 'alert-wrapper');
  siblings.forEach(sib => sib.classList.add('content-bellow'));
  
  document.body.classList.add('alert-running');
  document.body.appendChild(wrapper);
  if (confirmationCallback) {
    document.addEventListener('alert-closed', confirmationCallback);
  }

  return wrapper;
  
  function fadeAlertOut(event) {
    if (confirmationCallback) {
      const notifyEvent = new Event('alert-closed');
      document.dispatchEvent(notifyEvent);
    }
    document.body.classList.remove('alert-running');
    console.log('Click event is working!', event);
    siblings.forEach(sib => sib.classList.remove('content-bellow'));
    wrapper.remove();
  }
}
