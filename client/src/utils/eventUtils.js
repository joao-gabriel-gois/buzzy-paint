export const getInstanceName = (event) => (
  event
    ? Object.getPrototypeOf(event) 
        .constructor
        .name
    : ''
);

export function getRelativeCursorPos(event, element) {
  const rect = element.getBoundingClientRect();
  const fixedPos = [
    event.clientX - rect.left,
    event.clientY - rect.top
  ];
  
  return [
    Math.floor(fixedPos[0] / rect.width * element.width),
    Math.floor(fixedPos[1] / rect.height * element.height),
  ]
}