import './js/router.js';

document.addEventListener('DOMContentLoaded', () => {
  animateLoadingText('#bottom-side p');
});


function animateLoadingText(textSelector) {
  const p = document.querySelector(textSelector);
  const text = p.innerText;
  const originalMarginLeft = getComputedStyle(p).marginRight;
  let margin = 0;
  setInterval(() => {
    if (p.innerText.length < text.length + 3) {
      p.innerText += '.';
      margin += 0.7;
      p.style.marginRight = `-${margin}rem`
      return;
    }
    p.innerText = text;
    p.style.marginRight = originalMarginLeft;
    margin = 0;
    
  }, 1200);
}