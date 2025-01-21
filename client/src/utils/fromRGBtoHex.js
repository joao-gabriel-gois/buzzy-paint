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
    const result = color / 16;
    const int = Math.floor(result);
    const dec = result - int;

    hex += int > 9 ? decToHex[int] : int;
    const decAsUnit = Math.floor(dec * 16);
    hex += dec > 0 ? (
      decAsUnit > 9 ? decToHex[decAsUnit] : decAsUnit
    ): '';
  }

  return hex;
}