export function base64ToObject(hash) {
  return JSON.parse(atob(hash));
}

export function objectToBase64(object) {
  return btoa(JSON.stringify(object));
}

export function objectToBase32Like(object) {
  const jsonString = JSON.stringify(object);
  const encoded = encode32(jsonString);
  return encodeURIComponent(encoded);
}

export function base32LikeToObject(hash) {
  try {
    const hashData = hash.startsWith('#') ? hash.slice(1) : hash;
    const decoded = decodeURIComponent(hashData);
    const jsonString = decode32(decoded);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding hash data:', error);
    return null;
  }
}

// Use a modified base32 approach instead of base64 for urls safe encoding/decoding (transfering data through url)
const ENCODING_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BITS_PER_CHAR = 5; // using 5 bits per character (32 characters in alphabet)

function encode32(data) {
  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode(data);
  
  let result = '';
  let bitsRemaining = 0;
  let currentByte = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    currentByte = (currentByte << 8) | bytes[i];
    bitsRemaining += 8;
    
    while (bitsRemaining >= BITS_PER_CHAR) {
      bitsRemaining -= BITS_PER_CHAR;
      const charIndex = (currentByte >> bitsRemaining) & 0x1f;
      result += ENCODING_CHARS[charIndex];
    }
  }
  
  if (bitsRemaining > 0) {
    const charIndex = (currentByte << (BITS_PER_CHAR - bitsRemaining)) & 0x1f;
    result += ENCODING_CHARS[charIndex];
  }
  
  return result;
}

function decode32(encoded) {
  const bytes = [];
  let currentByte = 0;
  let bitsRemaining = 0;
  
  encoded = encoded.toUpperCase();

  for (let i = 0; i < encoded.length; i++) {
    const charIndex = ENCODING_CHARS.indexOf(encoded[i]);
    if (charIndex === -1) continue; // Skip invalid characters
    
    currentByte = (currentByte << BITS_PER_CHAR) | charIndex;
    bitsRemaining += BITS_PER_CHAR;
    
    if (bitsRemaining >= 8) {
        bitsRemaining -= 8;
        bytes.push((currentByte >> bitsRemaining) & 0xff);
    }
  }
  
  const textDecoder = new TextDecoder();
  return textDecoder.decode(new Uint8Array(bytes));
}

