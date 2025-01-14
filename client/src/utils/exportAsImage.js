export const exportAsImage = () => {
  const filename = prompt('Choose a filename:');
  if (!filename) return;
  const transparent = confirm('Do you want a transparent background?');
  const downloadEvent = new CustomEvent('download-call', {
    detail: {
      isPng: transparent,
      filename: filename
    }
  });
  document.dispatchEvent(downloadEvent);
}