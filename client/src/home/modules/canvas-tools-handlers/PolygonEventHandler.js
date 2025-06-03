import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js';

export class Polygoner extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      lineWidth: 1,
      lineColor: '#000',
    }

    this.firstLineDone = false;
    this.currentLine = {};
    this.previousLines = [];
    this.undoStackedLastLines = [];

    this.undoCounter = 0;

    this.onKeyDown = this.onKeyDown.bind(this);
  }

  createLineEvent() {
    const lineEvent = super.createToolEvent('line', {
      line: this.currentLine,
      style: this.currentStyle,
    });

    return lineEvent;
  }

  strokeLineAtCurrentPosition() {
    super.renderLatestState(); // clear for real time lining, overwriting with latest line state
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
        return this.clearState();
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
  
  clearState() {
    this.firstLineDone = false;
    this.currentLine = {};
    this.previousLines = [];
    this.undoStackedLastLines = [];
    this.canvas.style.cursor = 'default';
  }

  handleStyleSwitch(event) {    
    super.handleStyleSwitch(event);
    const { 
      polygonLineWidth,
      polygonLineColor
    } = this.currentStyle;
    if (polygonLineColor) this.currentStyle.lineColor = polygonLineColor;
    delete this.currentStyle.polygonLineColor;
    if (polygonLineWidth) this.currentStyle.lineWidth = polygonLineWidth;
    delete this.currentStyle.polygonLineWidth;
   
    this.updateContextToCurrentStyle();
  }

  updateContextToCurrentStyle() {
    const {
      lineColor,
      lineWidth
    } = this.currentStyle;
      
    this.context.strokeStyle = lineColor;
    this.context.lineWidth = lineWidth;
  }

  setActiveState(state) {
    if (Boolean(state)) {
      this.updateContextToCurrentStyle();
      document.addEventListener('keydown', this.onKeyDown);
    }
    else {
      this.clearState();
      document.removeEventListener('keydown', this.onKeyDown);
    }
    super.setActiveState(state);
  }
}