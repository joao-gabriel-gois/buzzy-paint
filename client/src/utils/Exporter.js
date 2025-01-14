
function downloadObjectAsJson(exportObj, exportName){
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  const downloadHiddenAnchor = document.createElement('a');
  downloadHiddenAnchor.setAttribute("href", dataStr);
  downloadHiddenAnchor.setAttribute("download", exportName + ".json");
  downloadHiddenAnchor.style.display = 'none';
  downloadHiddenAnchor.click();
  downloadHiddenAnchor.remove();
}

export class Exporter {
  constructor() {
    this.exportCallback = this.exportCallback.bind(this);
    document.addEventListener('export', this.exportCallback);
  }

  start() {
    // console.log('1) EXPORTER>start called');
    const exportEvent = new Event('export-call');
    document.dispatchEvent(exportEvent);
    console.log(exportEvent);
  }
  
  exportCallback(event) {
    // console.log('3)EXPORT>export callback called with value received:', event);

    const filename = this.renderDownloadDialog();
    if (!filename) return;
    downloadObjectAsJson(event.detail, filename);
  }

  renderDownloadDialog() {
    // criar modal mais interessante
    return alert('Escolha um nome de arquivo.');
  }
    
  stop() { return; }
}