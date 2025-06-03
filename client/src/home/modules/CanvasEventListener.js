
export class CanvasEventListener {
  static #instancesCount = 0;

  constructor(
    canvasReference,
    data = {
      eventQueue: [],
      undoStack: []
    },
  ) {
    CanvasEventListener.#instancesCount++;
    this.canvas = document.querySelector(canvasReference);
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.wholeCanvasImageData = null;
    
    this.eventQueue = data.eventQueue;
    this.undoStack = data.undoStack;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvasContext = null;

    this.zoomCurrentRate = 1;
    this.zoomPreviousRate = 1;
    this.isZoomActive = false;

    this.onCanvasEvent = this.onCanvasEvent.bind(this);
    this.onZoom = this.onZoom.bind(this);
    this.renderCurrentState = this.renderCurrentState.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  static getNumberOfInstances() {
    return CanvasEventListener.#instancesCount;
  }

  redrawSequence(event) {
    const { sequence, style } = event;
    const { drawLineWidth, drawColor } = style;
    this.context.strokeStyle = drawColor;
    this.context.lineWidth = drawLineWidth;

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
    this.context.lineWidth = style.lineWidth;
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
      fontFamily ? fontFamily : 'Arial'
    }`;
    
    this.context.fillText(innerText, ...position);
  }

  redrawRectangle(event) {
    const {
      rect,
      style,
    } = event;
    const { x, y, width, height } = rect;

    if (style.rectFilled) {
      this.context.fillStyle = style.rectFillColor;
      this.context.fillRect(x, y, width, height);
    }
    if (style.rectStroked) {
      this.context.strokeStyle = style.rectOutlineColor;
      this.context.lineWidth = style.rectLineWidth;
      this.context.strokeRect(x, y, width, height);
    }
  }

  redrawEllipse(event) {
    const {
      ellipse,
      style,
    } = event;
    const { x, y, radiusWidth, radiusHeight } = ellipse;

    if (style.ellipseFilled) {
      this.context.fillStyle = style.ellipseFillColor;
      this.context.beginPath();
      this.context.ellipse(x, y, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.fill();
    }
    if (style.ellipseStroked) {
      this.context.strokeStyle = style.ellipseOutlineColor;
      this.context.lineWidth = style.ellipseLineWidth;
      this.context.beginPath();
      this.context.ellipse(x, y, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.stroke();
    }
  }
  
  cropAndMove(event) {
    const {
      x: firstX,
      y: firstY,
      width,
      height
    } = event.firstSelection;
    const {
      dataPosition,
      firstEventOfTheChain,
      style,
    } = event;
    
    if (firstEventOfTheChain) {
      const imageDataParameters = [firstX, firstY, width, height];
      this.cropSelectionData = this.context.getImageData(...imageDataParameters);
      this.context.clearRect(...imageDataParameters);
      this.wholeCanvasImageData = this.context.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
    }
    else {
      this.context.putImageData(this.wholeCanvasImageData, 0, 0);
    }
    
    if (!this.cropSelectionData) {
      console.error("(CanvasEventListener) Strange scenario, can't find selection data!");
      return;
    }
    
    let [x, y] = dataPosition;
    if (!(x && y)) {
      x = firstX;
      y = firstY;
    }
    
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    if (!this.offscreenCanvasContext) {
      this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
    }
    this.offscreenCanvasContext.clearRect(0, 0, width, height);
    this.offscreenCanvasContext.putImageData(this.cropSelectionData, 0, 0);
    
    this.context.save();

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const angle = style.rotationDegree;

    this.context.translate(centerX, centerY);
    this.context.rotate(angle);
    this.context.drawImage(
      this.offscreenCanvas, 
      -width / 2, -height / 2, // centered around rotation point
      width, height
    );
    
    this.context.restore();
  }

  applyZoom() {
    const invertedPreviousZoomRate = 1 / this.zoomPreviousRate;
    const zoomfactor = this.zoomCurrentRate;
    const { width, height } = this.canvas;
    // I'm using tranform this way in order to get a centered zoom
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
    event.sequence.forEach(point => {
      this.context.clearRect(point[0] - size / 2, point[1] - size / 2, size, size);
    });
    this.context.closePath();
  }

  renderCurrentState(event) {
    let cleanImage;
    if (event && event.detail) {
      cleanImage = event.detail.cleanImage;
    }

    if (this.isZoomActive) this.applyZoom();
    
    if (!cleanImage && this.wholeCanvasImageData) {
      this.context.putImageData(this.wholeCanvasImageData, 0, 0);
      return;
    }

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let event of this.eventQueue) {
      this.renderEvent(event);
    };
    this.wholeCanvasImageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  renderEvent(event) {
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
      case 'CROP-AND-MOVE':
        this.cropAndMove(event);
        break;
      case 'ERASE':
        this.applyErasing(event);
        break;  
    }
  }

  undo() {
    const removedEvent = this.eventQueue.pop();
    if (removedEvent) {
      this.undoStack.push(removedEvent);
      this.renderCurrentState({
        detail: { cleanImage: true }
      });
    }
  }

  redo() {
    const reAddedEvent = this.undoStack.pop();
    if (reAddedEvent) {
      this.eventQueue.push(reAddedEvent);
      this.renderCurrentState({
        detail: { cleanImage: true }
      });
    }
  }

  onKeyDown(event) {
    if (event.ctrlKey && event.key === 'z') {
      this.undo();
    }
    else if (event.ctrlKey && event.key === 'y') {
      this.redo();
    }
  } 
  
  onCanvasEvent(event) {
    let { detail, type } = event;
    type = type.toUpperCase();
    Object.assign(detail, { type });
    this.eventQueue.push(detail);
    this.wholeCanvasImageData = this.context.getImageData(
      0, 0,
      this.canvas.width,
      this.canvas.height
    );
    this.undoStack = [];
  }

  onZoom(event) {
    const { zoom, state } = event.detail;
    this.isZoomActive = state;
    this.zoomCurrentRate = zoom;
  }

  start() {
    this.canvas.addEventListener('draw', this.onCanvasEvent);
    this.canvas.addEventListener('line', this.onCanvasEvent);
    this.canvas.addEventListener('write', this.onCanvasEvent);
    this.canvas.addEventListener('rect', this.onCanvasEvent);
    this.canvas.addEventListener('ellipse', this.onCanvasEvent);
    this.canvas.addEventListener('zoom', this.onZoom);
    this.canvas.addEventListener('erase', this.onCanvasEvent);
    this.canvas.addEventListener('crop-and-move', this.onCanvasEvent);
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
    this.canvas.removeEventListener('crop-and-move', this.onCanvasEvent);
    this.canvas.removeEventListener('render-call', this.renderCurrentState);
    document.removeEventListener('keydown', this.onKeyDown);
  }
}


