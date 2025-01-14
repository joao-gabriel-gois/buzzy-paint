export const addJSONImportEvent = (fileInput) => {
  fileInput.addEventListener('change', () => { 
    const fileLoadPromise = new Promise((resolve, reject) => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (e) => {
          const data = JSON.parse(e.target.result);
          const [ filename ] = file.name.split('.');
          return resolve({
            data,
            filename
          });
        }
        reader.onerror = (err) => {
          alert('ERROR!');
          reject(err);
        }
      }
    });

    fileLoadPromise.then(r => {
      const importEvent = new CustomEvent('import-call', {
        detail: r
      });
      document.dispatchEvent(importEvent);
      eventAdded = true;
    });
  }, false);
}