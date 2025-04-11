import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js';

const MIN_LINE_WIDTH = 1;

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

  // 1) Private Event Handler - Event Related Functions
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
    if (event.target.value === "") return;
    
    super.handleStyleSwitch(event);
    const { 
      lineWidth,
      polygonLineWidth,
      polygonLineColor
    } = this.currentStyle;
    if (polygonLineColor) this.currentStyle.lineColor = polygonLineColor;
    delete this.currentStyle.polygonLineColor;
    
    const updatedLineWidth = Number(polygonLineWidth);
    if (updatedLineWidth === lineWidth) {
      delete this.currentStyle.polygonLineWidth;
      return;
    }
    else if (isNaN(updatedLineWidth)) {
      delete this.currentStyle.polygonLineWidth;
      console.log('lineWidth is NaN:', event.target.value);
      this.updateContextToCurrentStyle();
      return;
    }

    this.currentStyle.lineWidth = (
      updatedLineWidth <= MIN_LINE_WIDTH
        ? MIN_LINE_WIDTH
        : updatedLineWidth
    );
    event.target.value = this.currentStyle.lineWidth;
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
      this.resetCurrentState();
      document.removeEventListener('keydown', this.onKeyDown);
    }
    super.setActiveState(state);
  }
}