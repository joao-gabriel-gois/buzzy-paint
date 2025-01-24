import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'
import { getStyle } from '../../../utils/cssUtils.js'

export class Eraser extends ToolEventHandler {
  constructor(elements) {
    super(elements);

    this.currentEraseSequence = [];
    this.currentStyle.eraserSize = 35;
    this.tooltipDiv = document.createElement('div');
    this.cursorStyle = 'none';

    this.updateEraserTooltip = this.updateEraserTooltip.bind(this);
  }

  createEraseEvent() {
    const eraseEvent = super.createToolEvent('erase', {
      sequence: this.currentEraseSequence,
      eraserSize: this.currentStyle.eraserSize,
    });

    return eraseEvent;
  }

  handleOnMouseDown(event) {
    super.handleOnMouseDown(event);
    this.context.fillStyle = getStyle(this.canvas).backgroundColor;
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    this.currentEraseSequence.push({
      position: [x, y],
    });
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    
    this.currentEraseSequence.push({
      position: [x, y],
    });
    const size = this.currentStyle.eraserSize;
    // super.dispacthToolEvent(this.createEraseEvent());
    this.context.fillRect(x - size / 2, y - size / 2, size, size)
  }

  handleOnMouseUp(event) {
    super.handleOnMouseUp(event);
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    
    const size = this.currentStyle.eraserSize;
    this.currentEraseSequence.push({
      position: [x, y],
    });

    super.dispacthToolEvent(this.createEraseEvent());
    this.context.fillRect(x - size / 2, y - size / 2, size, size)

    this.currentEraseSequence = [];

  }


  // Tooltips and separete mouse move event for it
  addEraserTooltip() {
    this.tooltipDiv.classList.add('erase-tooltip-added');
    document.body.append(this.tooltipDiv);
  }

  updateEraserTooltip(event) {
    const [cx, cy] = getRelativeCursorPos(event, this.canvas);
    let {
      border
    } = getStyle(this.tooltipDiv);
    border = parseInt(border);

    this.tooltipDiv.style.display = 'inherit';  
    
    const [x, y] = [event.pageX, event.pageY];
    const ratioW = Math.ceil(parseFloat(getStyle(this.canvas).width)) / this.canvas.width;
    const ratioH = Math.ceil(parseFloat(getStyle(this.canvas).height)) / this.canvas.height;
    const sizeW = this.currentStyle.eraserSize * ratioW;
    const sizeH = this.currentStyle.eraserSize * ratioH;
    const [ minBoundX, minBoundY ] = [
      sizeW / 2,
      sizeH / 2,
    ];
    const [ maxBoundX, maxBoundY ] = [
      this.canvas.width - minBoundX,
      this.canvas.height - minBoundY
    ]

    if (
      cx <  minBoundX || cx > maxBoundX
        || cy < minBoundY  || cy > maxBoundY
    ) {
      this.removeEraserTooltip();
    }
    else {
      this.addEraserTooltip();
    }

    const left = x - sizeW / 2 - border; // discounting the border
    const top = y - sizeH / 2 - border; // idem;

    this.tooltipDiv.style.left = `${left}px`;
    this.tooltipDiv.style.top = `${top}px`;
    this.tooltipDiv.style.width = `${sizeW - ratioW * border}px`;
    this.tooltipDiv.style.height = `${sizeH - ratioH * border}px`;
  }

  removeEraserTooltip() {
    // this.tooltipDiv.setAttribute('style', 'display: none;');
    this.tooltipDiv.classList.remove('erase-tooltip-added');
  }

  start() {
    this.canvas.style.cursor = 'none';
    super.start();
    this.addEraserTooltip();
    document.addEventListener('mousemove', this.updateEraserTooltip);
  }
  
  stop() {
    super.stop();
    this.removeEraserTooltip();
    document.removeEventListener('mousemove', this.updateEraserTooltip);
    this.canvas.style.cursor = 'default';
  }
}