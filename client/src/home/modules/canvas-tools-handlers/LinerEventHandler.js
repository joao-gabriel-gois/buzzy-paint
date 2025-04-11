import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'

export class Liner extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      lineWidth: 1,
      lineColor: '#000',
    }
    // array of positions of current draw
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
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    super.handleOnMouseDown(event);
    const position = getRelativeCursorPos(event, this.canvas);
    
    this.currentLine = {
      start: position,
      end: position
    };
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    
    const position = getRelativeCursorPos(event, this.canvas);    
    
    Object.assign(this.currentLine, {
      end: position,
    });  
    
    super.renderLatestState(); // clear for real time lining, overwriting with latest line state
    this.updateContextToCurrentStyle();
    this.context.beginPath();
    this.context.moveTo(...this.currentLine.start);
    this.context.lineTo(...this.currentLine.end);
    this.context.stroke();
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    
    const position = getRelativeCursorPos(event, this.canvas);    
    Object.assign(this.currentLine, {
      end: position,
    });

    super.dispacthToolEvent(this.createLineEvent()); // real and final line is saved

    this.currentLine = {};
  }

  handleStyleSwitch(event) {
    super.handleStyleSwitch(event);
    this.updateContextToCurrentStyle();
  }

  // 2.a) - Private Class Utils:
  handleThicknessChange(event) {
    super.handleStyleSwitch(event);
    this.updateContextToCurrentStyle();
  }

  // 2.b) Specific Util for this implementation (same format but specific for each event handler)

  // Bellow method is only necessary for Tools such as Writter and Drawer
  // because both classes needs to render while updating CanvasListener
  // Data structure
  updateContextToCurrentStyle() {
    const {
      lineColor,
      lineWidth
    } = this.currentStyle;
    
    // TODO - Create input for selecting line Cap on form
    // this.context.lineCap = "round";
    
    this.context.strokeStyle = lineColor;
    this.context.lineWidth = lineWidth;
  }

  // 3) Public interfaces

  setActiveState(state) {
    if (Boolean(state)) this.context.strokeStyle = this.updateContextToCurrentStyle();
    super.setActiveState(state);
  }

  // start() {
  //   super.start();
  // }

  // stop() {
  //   super.stop();
  // }
}