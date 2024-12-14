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

storage.setItem = (itemKey, itemValue) => (
  localStorage.setItem(
    itemKey,
    objectToBase64(itemValue)
  )
);

export {
  storage,
  location
};


//Utils;
function base64ToObject(base) {
  return JSON.parse(atob(base));
}

function objectToBase64(object) {
  return btoa(JSON.stringify(object));
}

// Utils
export async function sleep(secs) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), secs * 1000)
  });
}


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