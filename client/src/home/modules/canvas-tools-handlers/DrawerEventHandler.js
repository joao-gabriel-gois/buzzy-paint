import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'

export class Drawer extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      drawLineWidth: 1,
      drawColor: '#000',
    }
    /**
     * @typedef {[number, number]} Point
     * @typedef {Point[]} Sequence
     * @type {Sequence}
    */
    this.currentDrawSequence = [];
  }

  createDrawEvent() {
    const drawEvent = super.createToolEvent('draw', {
      sequence: this.currentDrawSequence,
      style: this.currentStyle,
    });

    return drawEvent;
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    super.handleOnMouseDown(event);
    const { drawLineWidth, drawColor } = this.currentStyle;
    this.context.strokeStyle = drawColor;
    this.context.lineWidth = drawLineWidth;
    
    const position = getRelativeCursorPos(event, this.canvas);
    this.context.beginPath();
    this.context.moveTo(...position);

    this.currentDrawSequence.push(position);
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event); 
    const position = getRelativeCursorPos(event, this.canvas);
    this.context.lineTo(...position);
    this.context.moveTo(...position);
    this.context.stroke();

    this.currentDrawSequence.push(position);
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    
    const position = getRelativeCursorPos(event, this.canvas);    
    this.context.lineTo(...position);
    this.context.moveTo(...position);
    this.context.stroke();

    this.currentDrawSequence.push(position);
    
    super.dispacthToolEvent(this.createDrawEvent());
    this.currentDrawSequence = [];
  }

  handleStyleSwitch(event) {
    super.handleStyleSwitch(event);
    this.updateContextToCurrentStyle();
  }

  updateContextToCurrentStyle() {
    const {
      drawColor,
      drawLineWidth
    } = this.currentStyle;
    
    this.context.strokeStyle = drawColor;
    this.context.lineWidth = drawLineWidth;
  }

  setActiveState(state) {
    if (Boolean(state)) this.context.strokeStyle = this.currentStyle.drawColor;
    super.setActiveState(state);
  }
}