export function hasCSSClass(element, className) {
  return element.classList.contains(className);
}

export function addCSSClass(element, className) {
  element.classList.add(className);
  return element;
}

export function removeCSSClass(element, className) {
  element.classList.remove(className);
  return element;
}

export const getStyle = el => window.getComputedStyle(el);