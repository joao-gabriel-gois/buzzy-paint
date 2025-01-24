import { createAndRenderPrompt } from "../shared/alerts.js";

export const handleImageDownload = () => {
  createAndRenderPrompt({
    type: 'info',
    title: 'Image Details',
    message: 'Choose the filename and the transparency settings:',
    checkboxTitle: 'Transparent: ',
  }).then(response => {
    if (!response) return;
    const { text, checkbox } = response;
    const downloadEvent = new CustomEvent('download-call', {
      detail: {
        isPng: checkbox,
        filename: text
      }
    });
    document.dispatchEvent(downloadEvent);
  });
}
