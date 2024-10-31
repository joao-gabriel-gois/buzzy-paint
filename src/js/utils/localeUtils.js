// it can became a json file in future with fetchLocaleContent
// but there is no reason to fetch as file with this size for now
const localeContent = {
  "BR": [
    [ "Lápis", "Cor", "Grossura do Traço" ],
    [ "Linha", "Cor", "Grossura do Traço" ],
    [ "Texto", "Tamanho da Fonte", "Cor do Texto", "Tipo da Fonte" ],
    [ "Zoom", "Escala do Zoom" ],
    [ "Borracha", "Tamanho" ]
  ],
  "EN": [
    [ "Pencil", "Color", "Thickness" ],
    [ "Line", "Color", "Thickness" ],
    [ "Text", "Font Size", "Text Color", "Font Family" ],
    [ "Zoom In", "Zoom Scale" ],
    [ "Erase", "Size" ]
  ]
}

async function getClientIP() {
  try {
    const response = await fetch(
      'https://api.ipify.org?format=json'
    );
    return (await response.json()).ip;
  }
  catch (e) {
    console.error('Not able to get client IP', e);
    return false;
  }
}

async function getClientCountryByIP(ip) {
  try {
    const response = await fetch(`https://api.country.is/${ip}`);
    return (await response.json());
  }
  catch (e) {
    console.error('Not able to get client country', e);
    return false;
  }
}

async function getClientCountryCode() {
  try {
    const ip =  await getClientIP();
    return (await getClientCountryByIP(ip)).country;
  }
  catch (e) {
    return 'EN';
  }
}

async function getLocaleContent(content = localeContent) {
  try {
    let locale = await getClientCountryCode();
    locale = locale === 'BR' ? locale : 'EN';
    return content[locale];
  }
  catch(e) {
    throw new Error('Not able to load content', e);
  }
}

// export async function fetchLocaleContent(contentFilePath) {
//   try {
//     const content = (
//       await (await fetch(contentFilePath)).json()
//     ); 
//     let locale = await getClientCountryCode();
//     locale = locale === 'BR' ? locale : 'EN';
//     return content[locale];
//   }
//   catch(e) {
//     throw new Error('Not able to load content', e);
//   }
// }
