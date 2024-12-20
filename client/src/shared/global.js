import { base64ToObject, objectToBase64, base32LikeToObject} from '../utils/encodingUtils.js';
import { createAndRenderAlert } from '../shared/alerts.js';
// const { localStorage, navigator, screen } = window;
// if (
//   !(localStorage && location && navigator && screen)
// ) throw new Error("Browser not supported!");
const { localStorage, location, btoa, atob } = window;
if (
  !(localStorage && location && btoa && atob)
) throw new Error("Browser not supported!");

const storage = {};

storage.getItem = (itemKey) => {
  const item = localStorage.getItem(itemKey);
  if (item) return base64ToObject(item);
  return null;
};

storage.removeItem = (itemKey) => {
  localStorage.removeItem(itemKey);
};

storage.setItem = (itemKey, itemValue) => {
  const isObject = typeof itemValue === 'object' && !Array.isArray(itemValue) && itemValue !== null;
  if (isObject) {
    Object.assign(itemValue, { timestamp: Date.now()});
  }
  else if (itemValue !== null) {
    itemValue = {
      value: itemValue,
      timestamp: Date.now()
    }
  }

  localStorage.setItem(
    itemKey,
    objectToBase64(itemValue)
  )
};

function getDataFromURLHash() {
  const urlRawData = location.hash ? location.hash.slice(1, location.hash.length) : null;
  if (!urlRawData) {
    console.error('Not able to get URL data!', urlRawData);
    createAndRenderAlert({
      type: 'error',
      title: 'No user data!',
      message: 'Something went wrong after user login, no data could be transfered between routes.'
    });
    return null;
  }

  console.log(urlRawData);

  let data;
  try {
    data = base32LikeToObject(urlRawData);
  }
  catch (error) {
    console.error('Error parsing data from base32like!', data);
    createAndRenderAlert({
      type: 'error',
      title: 'Parsing Failure!',
      message: 'Something went wrong with parsing the data.'
    });
    return null;
  }

  if (!data) {
    console.error('No value for user id even after parsing!', data);
    createAndRenderAlert({
      type: 'error',
      title: 'Data not found!',
      message: 'Something went wrong with user data even after succesfully parsing.'
    });
    return null;
  }

  return data;
}

async function sleep(secs) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), secs * 1000)
  });
}

export {
  storage,
  location,
  getDataFromURLHash,
  sleep
};




// Old approach to include unique identifier
// and assign it to the storage key... Useless for
// this purpose once localStorage is already unique
// per device and domain/port. 

// async function GenerateCustomGlobals() {
//   const deviceId = await createFingerprint();

//   // const storage = Object.assign({}, localStorage);
//   const storage = localStorage;

//   storage.getItem = (itemKey) => {
//     const item = localStorage.getItem(
//       `${deviceId}@${location.host}:${itemKey}`
//     );
//     if (item) return base64ToObject(item);
//     return null;
//   };

//   storage.removeItem = (itemKey) => (
//     localStorage.removeItem(
//       `${deviceId}@${location.host}:${itemKey}`
//     )
//   );

//   storage.setItem = (itemKey, itemValue) => (
//     localStorage.setItem(
//       `${deviceId}@${location.host}:${itemKey}`,
//       objectToBase64(itemValue)
//     )
//   );

//   return { storage, location };
// }

// const global = GenerateCustomGlobals();
// export default await global;

// function createFingerprint(deviceInfo = getDeviceInfo()) {
//   return digest(objectToBase64(deviceInfo));
// }

// function getDeviceInfo() {
//   const {
//     userAgent,
//     languages,
//     userAgentData
//   } = navigator;
//   return {
//     userAgent,
//     languages: languages.join(' '),
//     browserDetails: userAgentData
//       .brands
//       .reduce((acc, result) => ({
//          brand: acc.brand + '.' + result.brand,
//          version: acc.version + '.' + result.version
//     }), { brand: '', version: ''}),
//     isMobile: userAgentData.mobile,
//     screenWidth: screen.width,
//     screenHeight: screen.height
//   }
// }


// async function digest(message, algo = 'SHA-1') {
//   return Array.from(
//     new Uint8Array(
//       await crypto.subtle.digest(algo, new TextEncoder().encode(message))
//     ),
//     (byte) => byte.toString(16).padStart(2, '0')
//   ).join('');
// }