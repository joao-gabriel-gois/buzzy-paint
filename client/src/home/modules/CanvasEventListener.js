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
    this.onCanvasEvent = this.onCanvasEvent.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.renderCurrentState = this.renderCurrentState.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.paintBackground = this.paintBackground.bind(this);
  }

  static getNumberOfInstances() {
    return CanvasEventListener.#instancesCount;
  }

  redrawSequence(event) {
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

  redrawLine(event) {
    const { line, style } = event;
    this.context.strokeStyle = style.lineColor;
    this.context.lineWidth = style.lineThickness;
    this.context.beginPath();
    this.context.moveTo(...line.start);
    this.context.lineTo(...line.end);
    this.context.stroke();
  }

  rewriteAtPoint(event) {
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

  redrawRectangle(event) {
    const {
      rect,
      style,
    } = event;
    const { x, y, width, height } = rect;

    if (style.filled) {
      this.context.fillStyle = style.fillColor;
      this.context.fillRect(x, y, width, height);
    }
    if (style.stroked) {
      this.context.strokeStyle = style.rectOutlineColor;
      this.context.lineWidth = style.rectThickness;
      this.context.strokeRect(x, y, width, height);
    }
  }

  redrawEllipse(event) {
    const {
      ellipse,
      style,
    } = event;
    const { x, y, radiusWidth, radiusHeight } = ellipse;

    if (style.filled) {
      this.context.fillStyle = style.ellipseFillColor;
      this.context.beginPath();
      this.context.ellipse(x, y, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.fill();
    }
    if (style.stroked) {
      this.context.strokeStyle = style.ellipseOutlineColor;
      this.context.lineWidth = style.ellipseThickness;
      this.context.beginPath();
      this.context.ellipse(x, y, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.stroke();
    }
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
      event.sequence.forEach(point => {
        this.context.clearRect(point[0] - size / 2, point[1] - size / 2, size, size);
      });
      this.context.closePath();
      return;
    }

    event.sequence.forEach(point => {
        this.context.fillStyle = getStyle(this.canvas).backgroundColor;
        this.context.fillRect(point[0] - size / 2, point[1] - size / 2, size, size);
    });
    this.context.closePath();
  }

  renderCurrentState(cb) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // JPG case for exporting images, cb shoud paintBackground before exporting
    if (cb && !(cb instanceof Event)) cb();

    if (this.isZoomActive) 
      this.applyZoom();
    
    for (let event of this.eventQueue) {
      switch(event.type) {
        case 'DRAW':
          this.redrawSequence(event);
          break;
        case 'LINE':
          this.redrawLine(event);
          break;
        case 'WRITE':
          this.rewriteAtPoint(event);
          break;
        case 'RECT':
          this.redrawRectangle(event);
          break;
        case 'ELLIPSE':
          this.redrawEllipse(event);
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
    if (this.undoStack.length > 60) {
      this.undoStack = [];
    } 
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
      console.log('undo')
      this.undo();
    }
    else if (event.ctrlKey && event.key === 'y') {
      console.log('redo')
      this.redo();
    }
  } 
  
  onCanvasEvent(event) {
    let { detail, type } = event;
    type = type.toUpperCase();
    Object.assign(detail, { type });
    this.eventQueue.push(detail);
    this.undoStack = [];
  }

  onZoom(event) {
    const { zoom, state } = event.detail;
    this.isZoomActive = state;
    this.zoomCurrentRate = zoom;
  }

  paintBackground() {
    this.context.fillStyle = getStyle(this.canvas).backgroundColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    this.canvas.addEventListener('draw', this.onCanvasEvent);
    this.canvas.addEventListener('line', this.onCanvasEvent);
    this.canvas.addEventListener('write', this.onCanvasEvent);
    this.canvas.addEventListener('rect', this.onCanvasEvent);
    this.canvas.addEventListener('ellipse', this.onCanvasEvent);
    this.canvas.addEventListener('zoom', this.onZoom);
    this.canvas.addEventListener('erase', this.onCanvasEvent);
    this.canvas.addEventListener('render-call', this.renderCurrentState);
    document.addEventListener('keydown', this.onKeyDown);
  }

  stop() {
    this.canvas.removeEventListener('draw', this.onCanvasEvent);
    this.canvas.removeEventListener('line', this.onCanvasEvent);
    this.canvas.removeEventListener('write', this.onCanvasEvent);
    this.canvas.removeEventListener('zoom', this.onZoom);
    this.canvas.removeEventListener('rect', this.onCanvasEvent);
    this.canvas.removeEventListener('ellipse', this.onCanvasEvent);
    this.canvas.removeEventListener('erase', this.onCanvasEvent);
    this.canvas.removeEventListener('render-call', this.renderCurrentState);
    document.removeEventListener('keydown', this.onKeyDown);
  }
}


