export function fromRGBtoHex(rgbString) {
  const rgbNumberArray = rgbString
    .split('(')[1]
    .split(')')[0]
    .split(',')
    .map(color => Number(color.trim()));

  const decToHex = {
    10: 'A',
    11: 'B',
    12: 'C',
    13: 'D',
    14: 'E',
    15: 'F',
  };
  
  let hex = '#'
  for (const color of  rgbNumberArray) {
    if (color > 255 || color < 0) {
      throw new Error("Invalid Argument: fromRGBtoHex only accepts RGB valid values (from 0 to 255)");
    }
    const result = color / 16;
    if (isNaN(result)) {
      throw new Error("Invalid Argument: fromRGBtoHex only accepts valid hexadecimal characters");
    }

    const int = Math.floor(result);
    const dec = result - int;

    hex += int > 9 ? decToHex[int] : int;
    const decAsUnit = Math.floor(dec * 16);
    hex += dec > 0 ? (
      decAsUnit > 9 ? decToHex[decAsUnit] : decAsUnit
    ): '';
    
    if (dec === 0) {
      hex += '0';
    } 
  }

  return hex;
}

export function fromHexToRGB(hexString) {
  hexString = hexString[0] === "#" ? hexString.split("#")[1] : hexString;
  const hexToDec = {
    'A': 10,
    'B': 11,
    'C': 12,
    'D': 13,
    'E': 14,
    'F': 15,
  };
  const rgb = []
  if (hexString.length === 6) {
    let lastNum;
    for (let i = 0; i < hexString.length; i++) {
      const char = hexString[i].toUpperCase();
      const decValue = isNaN(Number(char)) ? hexToDec[char] : Number(char);
      if (isNaN(decValue)) {
        throw new Error("Invalid Argument: fromHexToRGB only accepts valid hexadecimal characters");
      }
      if (i % 2 === 0) {
        lastNum = decValue;
      }
      else {
        rgb.push((lastNum * 16) + decValue);
        lastNum = 1;
      }
    }
  }
  else if (hexString.length === 3) {
    for (const c of hexString.split('')) {
      const color = c.toUpperCase();
      const decValue = isNaN(Number(color)) ? hexToDec[color] : Number(color);
      if (isNaN(decValue)) {
        throw new Error("Invalid Argument: fromHexToRGB only accepts valid hexadecimal characters");
      }
      rgb.push(decValue * 16 + decValue);
    }
  }
  else {
    throw new Error(
      "Invalid Argument:"
      + " fromHexToRGB only accepts valid color hex strings"
      + " (like #000, 000, #FAB239 or FAB239)." 
    );
  }

  return `rgb(${rgb.join(',')})`
}