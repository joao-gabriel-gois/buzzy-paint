export const smoothlyFadeoutElement = (element, callback) => {
  element.style.opacity = '1';
  let opacityDescreasingRate = 0.06;
  const interval = setInterval(() => {
    element.style.opacity = `${Number(element.style.opacity) - opacityDescreasingRate}`;
    opacityDescreasingRate += 0.0125 * opacityDescreasingRate;
  }, 25);

  setTimeout(() => {
    clearInterval(interval);
    if (callback) callback();
  }, 390);
}