import { handleTabsDataFetching } from './shared/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  animateLoadingText('#bottom-side p');
  handleTabsDataFetching();
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
    
  }, 800);
}
