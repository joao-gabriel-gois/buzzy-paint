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
    this.previousLines = [];
    this.undoStackedLastLines = [];

    this.undoCounter = 0;

    this.onKeyDown = this.onKeyDown.bind(this);
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
    this.undoStackedLastLines = [];
    super.handleOnMouseDown(event);
    if (!this.firstLineDone) {
      this.currentLine = {
        start: position,
        end: position
      };
      return;
    }

    this.previousLines.push(this.currentLine);
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
    super.handleOnMouseUp(event);
    this.cursorStyle = 'crosshair';
    if (!this.firstLineDone) {
      this.firstLineDone = true;
    }
    this.dispacthToolEvent(this.createLineEvent());
  }

  onKeyDown(event) {
    // Not sure if it is covering all the cases yet
    if (event.ctrlKey && event.key === 'z') {
      this.undoStackedLastLines.push(this.currentLine);
      if (this.previousLines.length === 0) {
        return this.resetCurrentState();
      }
      this.currentLine = this.previousLines.pop();
      this.canvas.dispatchEvent(new Event('render-call'));
    }
    else if (event.ctrlKey && event.key === 'y') {
      event.preventDefault();
      if (this.undoStackedLastLines.length === 0){
        return;
      } 
      this.previousLines.push(this.currentLine);
      this.currentLine = this.undoStackedLastLines.pop();
      this.canvas.dispatchEvent(new Event('render-call'));
    }
  }
  
  resetCurrentState() {
    this.firstLineDone = false;
    this.currentLine = {};
    this.previousLines = [];
    this.undoStackedLastLines = [];
    this.canvas.style.cursor = 'default';
  }

  handleStyleSwitch(event) {
    if (Number(event.target.value)) {
      this.handleThicknessChange(event);
    } else {   
      super.handleStyleSwitch(event);
      this.updateContextToCurrentStyle();
    } 
  }

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

  setActiveState(state) {
    if (Boolean(state)) {
      this.updateContextToCurrentStyle();
      document.addEventListener('keydown', this.onKeyDown);
    }
    else {
      this.resetCurrentState();
      document.removeEventListener('keydown', this.onKeyDown);
    }
    super.setActiveState(state);
  }
}