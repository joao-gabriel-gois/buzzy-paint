export default class CanvasEventListener {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');
    this.canvasSize = {
      real: {
        width: this.canvas.width,
        height: this.canvas.height,
      },
      style: {
        width: Number(window.getComputedStyle(this.canvas).width.match(/\d+/g)[0]),
        height: Number(window.getComputedStyle(this.canvas).height.match(/\d+/g)[0]),
      },
    };;

    this.eventQueue = [];
    
    this.zoomCurrentRate = 1;
    this.zoomPreviousRate = 1;
    this.isZoomActive = false;

    // Bindings
    // this.rewritePoint = this.rewritePoint.bind(this);
    this.onDraw = this.onDraw.bind(this);
    this.onLine = this.onLine.bind(this);
    this.onWrite = this.onWrite.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.onErase = this.onErase.bind(this);
    this.renderCurrentState = this.renderCurrentState.bind(this);
    this.onExportCall = this.onExportCall.bind(this);
    this.onImportCall = this.onImportCall.bind(this);
    this.onDownloadCall = this.onDownloadCall.bind(this);
    this.paintBackground = this.paintBackground.bind(this);
    this.onStopCall = this.onStopCall.bind(this);
  }

  redrawSequences(event) {
    // console.log(sequenceObj);
    const { sequence, style } = event;
    const drawThicknessRate = 1 + style.drawThickness / 8;
    this.context.strokeStyle = style.drawColor;
    this.context.lineWidth = drawThicknessRate;

    [...sequence].forEach((point, index) => {
      if (!index) {
        this.context.beginPath();
        this.context.moveTo(...point);
        return;
      } 
      this.context.lineTo(...point);
      this.context.moveTo(...point);
    });

    this.context.stroke();
  }

  redrawLines(event) {
    const { line, style } = event;
    const lineThicknessRate = 1 + style.lineThickness / 8;
    this.context.strokeStyle = style.lineColor;
    this.context.lineWidth = lineThicknessRate;
    // console.log("lines state\n", line);
    this.context.beginPath();
    this.context.moveTo(...line.start);
    this.context.lineTo(...line.end);
    this.context.stroke();
  }

  rewritePoints(event) {
    const { position } = event;
    const { 
      fontSize,
      fontFamily,
      innerText,
      textColor
    } = event.style;

    this.context.fillStyle = textColor;
    this.context.font = `${fontSize}pt ${
      !!fontFamily ? fontFamily : 'Arial'
    }`;
    
    this.context.fillText(innerText, ...position);
  }

  applyZoom() {
    const invertedPreviousZoomRate = 1 / this.zoomPreviousRate;
    const zoomfactor = this.zoomCurrentRate;
    const { width, height } = this.canvasSize.real;

    // I'm using tranform this way in order to get a centered zoom
    // scale does not provide this possibily

    // First we invert whatever other zoom might happened here before
    this.context.transform(
      invertedPreviousZoomRate, 0, 0,
      invertedPreviousZoomRate,
      -(invertedPreviousZoomRate - 1) * width / 2,
      -(invertedPreviousZoomRate - 1) * height / 2
    );
    
    // Then we apply the new zoom
    this.context.transform(
      zoomfactor, 0, 0,
      zoomfactor,
      -(zoomfactor - 1) * width / 2,
      -(zoomfactor - 1) * height / 2
    );

    this.zoomPreviousRate = this.zoomCurrentRate;
  }

  applyErasing(event) {
    this.context.fillStyle = getComputedStyle(this.canvas).backgroundColor;
    // console.log('Applying erasing with canvas element color.\nBG Color', this.context.fillStyle);
    const size = event.eraserSize;
    event.sequence.forEach(point => {
      const { position } = point;
      // console.log(`\tpos:(${position[0]}, ${position[1]})| size: ${size}`);
      const ratio = this.canvasSize.style.width / this.canvasSize.real.width;
      if (event.isPng)
        this.context.clearRect(position[0] - size / 2, position[1] - size / 2, size * ratio , size * ratio);
      else 
        this.context.fillRect(position[0] - size / 2, position[1] - size / 2, size * ratio , size * ratio);

    })
  }

  renderCurrentState(cb) {
    this.context.clearRect(0, 0, this.canvasSize.real.width, this.canvasSize.real.height);
    cb && cb();
    
    if (this.isZoomActive) {
      this.applyZoom();
    }
    
    this.eventQueue.forEach(event => {
      switch(event.type) {
        case 'DRAW':
          this.redrawSequences(event);
          break;
        case 'LINE':
          this.redrawLines(event);
          break;
        case 'WRITE':
          this.rewritePoints(event)
          break;
        case 'ERASE': 
          event = {
            ...event,
            isPng: !cb
          }
          this.applyErasing(event);
          break;  
      }
    });
  }

  onDraw(event) {
    const { sequenceArray, style } = event.detail;
    const sequence = sequenceArray.map(sequenceObj => sequenceObj.position); 

    this.eventQueue.push({
      type: 'DRAW',
      sequence,
      style, // if you put style directly it will always change all drawSequences style to latest
    });
  }


  onLine(event) {
    const { line, style } = event.detail;
    // console.log(event.detail);

    this.eventQueue.push({
      type: 'LINE',
      line,
      style, // if you put style directly it will always change all drawSequences style to latest
    });
  }

  onWrite(event) {
    const writtenPoint = event.detail;

    this.eventQueue.push({
      type: 'WRITE',
      ...writtenPoint
    });
  }

  onZoom(event) {
    const { zoom, state }= event.detail;
    
    this.isZoomActive = state;

    this.zoomCurrentRate = zoom;
  }

  onErase(event) {
    this.eventQueue.push({
      type: 'ERASE',
      ...event.detail
    });
  }

  onExportCall(_) {
    // console.log('2)CANVAS> dispatching queue value through export event');
    const exportEvent = new CustomEvent('export', {
      detail: this.eventQueue
    });
    document.dispatchEvent(exportEvent);
  }
  
  onImportCall(event) {
    this.eventQueue = event.detail;
    this.renderCurrentState();
  }

  onDownloadCall(event) {
    const { isPng, filename } = event.detail;
    const ext = `image/${isPng ? 'png' : 'jpeg'}`;
    const image = this.canvas.toDataURL(ext)
    .replace(ext, "image/octet-stream");
    const downloadHiddenAnchor = document.createElement('a');
    downloadHiddenAnchor.setAttribute("href", image);
    downloadHiddenAnchor.setAttribute("download", filename + `.${isPng ? 'png' : 'jpg'}`);
    downloadHiddenAnchor.style.display = 'none';
    this.renderCurrentState(!isPng && this.paintBackground);
    downloadHiddenAnchor.click();
    downloadHiddenAnchor.remove();
  }

  onStopCall(_) {
    this.eventQueue.push(this.eventQueueElTest);
    console.log("received canvas-destroy-call");
    document.dispatchEvent(
      new CustomEvent('canvas-stop', { detail: { eventQueue: this.eventQueue } })
    );
  }

  paintBackground() {
    this.context.fillStyle = getComputedStyle(this.canvas).backgroundColor;
    this.context.fillRect(0, 0, this.canvasSize.real.width, this.canvasSize.real.height);
  }

  start() {
    this.canvas.addEventListener('draw', this.onDraw);
    this.canvas.addEventListener('line', this.onLine);
    this.canvas.addEventListener('write', this.onWrite);
    this.canvas.addEventListener('zoom', this.onZoom);
    this.canvas.addEventListener('erase', this.onErase);
    this.canvas.addEventListener('render-call', this.renderCurrentState);
    document.addEventListener('export-call', this.onExportCall);
    document.addEventListener('import-call', this.onImportCall);
    document.addEventListener('download-call', this.onDownloadCall);
    
    document.addEventListener('canvas-stop-call', this.onStopCall);
  }

  stop() {
    this.canvas.removeEventListener('draw', this.onDraw);
    this.canvas.removeEventListener('line', this.onLine);
    this.canvas.removeEventListener('write', this.onWrite);
    this.canvas.removeEventListener('zoom', this.onZoom);
    this.canvas.removeEventListener('erase', this.onErase);
    this.canvas.removeEventListener('render-call', this.renderCurrentState);
    document.removeEventListener('export-call', this.onExportCall);
    document.removeEventListener('import-call', this.onImportCall);
    document.removeEventListener('download-call', this.onDownloadCall);
    
    document.removeEventListener('canvas-stop-call', this.onStopCall);
  }
}
