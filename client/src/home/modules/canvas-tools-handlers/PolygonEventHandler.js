import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'
export class Polygoner extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      lineThickness: 1,
      lineColor: '#000',
    }

    this.firstLineDone = false;
    this.currentLine = {};
  }

  // 1) Private Event Handler - Event Related Functions
  createLineEvent() {
    const lineEvent = super.createToolEvent('line', {
      line: this.currentLine,
      style: this.currentStyle,
    });

    return lineEvent;
  }

  strokeLineAtCurrentPosition() {
    super.startRenderCall(); // clear for real time lining, overwriting with latest line state
    this.updateContextToCurrentStyle();
    this.context.beginPath();
    this.context.moveTo(...this.currentLine.start);
    this.context.lineTo(...this.currentLine.end);
    this.context.stroke();
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    const position = getRelativeCursorPos(event, this.canvas);
    super.handleOnMouseDown(event);
    if (!this.firstLineDone) {
      this.currentLine = {
        start: position,
        end: position
      };
      return;
    }

    this.currentLine = {
      start: this.currentLine.end,
      end: position
    }
    this.strokeLineAtCurrentPosition();
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    const position = getRelativeCursorPos(event, this.canvas);    
    Object.assign(this.currentLine, {
      end: position,
    });
    
    this.strokeLineAtCurrentPosition();
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    if (!this.firstLineDone) this.firstLineDone = true;
    this.dispacthToolEvent(this.createLineEvent());
  }

  handleStyleSwitch(event) {
    if (Number(event.target.value)) {
      this.handleThicknessChange(event);
    } else {   
      super.handleStyleSwitch(event);
      this.updateContextToCurrentStyle();
    } 
  }

  // 2.a) - Private Class Utils:
  getPreviousInputValue(event) {
    const currentInput = `${event.target.getAttribute('id')}`;
    return this.cursorStyle[currentInput];
  }

  handleThicknessChange(event) {
    super.handleStyleSwitch(event);
    this.updateContextToCurrentStyle();
  }

  updateContextToCurrentStyle() {
    const {
      lineColor,
      lineThickness
    } = this.currentStyle;
    
    // TODO - Create input for selecting line Cap on form
    // this.context.lineCap = "round";
    
    this.context.strokeStyle = lineColor;
    this.context.lineWidth = lineThickness;
  }

  // 3) Public interfaces
  setActiveState(state) {
    if (Boolean(state)) this.updateContextToCurrentStyle();
    else {
      this.currentLine = {};
      this.firstLineDone = false;
    }
    super.setActiveState(state);
  }
}