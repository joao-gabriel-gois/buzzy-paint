import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'

const MIN_DRAW_LINE_WIDTH = 1;

export class Drawer extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      drawLineWidth: 1,
      drawColor: '#000',
    }
    
    // array of positions of current draw
    this.currentDrawSequence = [];
  }

  // 1) Private Event Handler - Event Related Functions
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
    if (event.target.value === "") return;
    const { drawLineWidth } = this.currentStyle;
    super.handleStyleSwitch(event);
    const updatedDrawLineWidth = Number(this.currentStyle.drawLineWidth);
    if (updatedDrawLineWidth === drawLineWidth) {
      return;
    }
    else if (isNaN(updatedDrawLineWidth)) {
      this.currentStyle.drawLineWidth = drawLineWidth;
      console.log('drawLineWidth is NaN:', event.target.value);
      this.updateContextToCurrentStyle();
      return;
    }
    this.currentStyle.drawLineWidth = (
      updatedDrawLineWidth <= MIN_DRAW_LINE_WIDTH
        ? MIN_DRAW_LINE_WIDTH
        : updatedDrawLineWidth
    );
    event.target.value = this.currentStyle.drawLineWidth;
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

  // 3) Public interfaces
  setActiveState(state) {
    if (Boolean(state)) this.context.strokeStyle = this.currentStyle.drawColor;
    super.setActiveState(state);
  }
}