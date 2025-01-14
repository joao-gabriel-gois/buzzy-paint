import { getInstanceName } from '../../utils/eventUtils.js'
import { getStyle } from '../../utils/cssUtils.js';

export class CanvasEventListener {
  static #instancesCount = 0;

  constructor(canvasReference, data = { eventQueue: [], undoStack: [] })  {
    CanvasEventListener.#instancesCount++;
    this.canvas = document.querySelector(canvasReference);
    this.context = this.canvas.getContext('2d');
    
    this.eventQueue = data.eventQueue;
    this.undoStack = data.undoStack;

    this.zoomCurrentRate = 1;
    this.zoomPreviousRate = 1;
    this.isZoomActive = false;

    // Bindings
    this.onDraw = this.onDraw.bind(this);
    this.onLine = this.onLine.bind(this);
    this.onWrite = this.onWrite.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.onErase = this.onErase.bind(this);
    this.renderCurrentState = this.renderCurrentState.bind(this);

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  static getNumberOfInstances() {
    return CanvasEventListener.#instancesCount;
  }

  redrawSequences(event) {
    const { sequence, style } = event;
    const drawThicknessRate = 1 + style.drawThickness / 8;
    this.context.strokeStyle = style.drawColor;
    this.context.lineWidth = drawThicknessRate;

    sequence.forEach((point, index) => {
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
    const { width, height } = this.canvas;

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
    const size = event.eraserSize;
    this.context.beginPath();
    if (event.isPng) {
      console.log('we are about to use clearRect')
      event.sequence.forEach(point => {
        const { position } = point;
        this.context.clearRect(position[0] - size / 2, position[1] - size / 2, size, size);
      });
      this.context.closePath();
      return;
    }

    event.sequence.forEach(point => {
      const { position } = point;
        this.context.fillStyle = getStyle(this.canvas).backgroundColor;
        console.log('we are about to use fillRect')
        this.context.fillRect(position[0] - size / 2, position[1] - size / 2, size, size);
    });
    this.context.closePath();
  }

  renderCurrentState(cb) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Download (export) image case, painting background first (cb)
    if (cb && !(cb instanceof Event)) {
      console.log('JPG CASE:', cb);
      // this.context.save();
      cb();
      // this.context.restore();
    }

    if (this.isZoomActive) 
      this.applyZoom();
    
    for (let event of this.eventQueue) {
      switch(event.type) {
        case 'DRAW':
          this.redrawSequences(event);
          break;
        case 'LINE':
          this.redrawLines(event);
          break;
        case 'WRITE':
          this.rewritePoints(event);
          break;
        case 'ERASE': 
          event = {
            ...event,
            isPng: !cb
          }
          this.applyErasing(event);
          break;  
      }
    };
  }

  undo() {
    if (this.undoStack.length > 60) 
      this.undoStack = [];
    
    const removedEvent = this.eventQueue.pop();
    if (removedEvent) {
      this.undoStack.push(removedEvent);
      this.renderCurrentState();
    }
  }

  redo() {
    const reAddedEvent = this.undoStack.pop();
    if (reAddedEvent) {
      this.eventQueue.push(reAddedEvent);
      this.renderCurrentState();
    }
  }

  onKeyDown(event) {
    if (event.ctrlKey && event.key === 'z') {
      this.undo();
    }
    else if (event.ctrlKey && event === 'y') {
      this.redo();
    }
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
    const { zoom, state } = event.detail;
    this.isZoomActive = state;
    this.zoomCurrentRate = zoom;
  }

  onErase(event) {
    this.eventQueue.push({
      type: 'ERASE',
      ...event.detail
    });
  }

  paintBackground() {
    this.context.fillStyle = getStyle(this.canvas).backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    this.canvas.addEventListener('draw', this.onDraw);
    this.canvas.addEventListener('line', this.onLine);
    this.canvas.addEventListener('write', this.onWrite);
    this.canvas.addEventListener('zoom', this.onZoom);
    this.canvas.addEventListener('erase', this.onErase);
    this.canvas.addEventListener('render-call', this.renderCurrentState);
    document.addEventListener('keydown', this.onKeyDown);
  }

  stop() {
    this.canvas.removeEventListener('draw', this.onDraw);
    this.canvas.removeEventListener('line', this.onLine);
    this.canvas.removeEventListener('write', this.onWrite);
    this.canvas.removeEventListener('zoom', this.onZoom);
    this.canvas.removeEventListener('erase', this.onErase);
    this.canvas.removeEventListener('render-call', this.renderCurrentState);
    document.removeEventListener('keydown', this.onKeyDown);
  }
}


