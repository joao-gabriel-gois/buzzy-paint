import ToolEventHandler from './models/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/eventUtils.js'
export class Liner extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      lineThickness: 1,
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
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    
    this.currentLine = {
      start: [x, y],
      end: [x, y]
    };
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    
    this.currentLine = {
      ...this.currentLine,
      end: [x, y],
    };
    
    super.startRenderCall(); // clear for real time lining, overwriting with latest line state
    this.updateContextToCurrentStyle();
    this.context.beginPath();
    this.context.moveTo(...this.currentLine.start);
    this.context.lineTo(...this.currentLine.end);
    this.context.stroke();
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);

    this.currentLine = {
      ...this.currentLine,
      end: [x, y]
    };

    super.dispacthToolEvent(this.createLineEvent()); // real and final line is saved

    this.currentLine = {};
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
    const lineThicknessRate = 1 + Number(event.target.value) / 8;
    let willThicknessBeApplied = true;

    if (lineThicknessRate > 11) {
      willThicknessBeApplied = confirm('This much thickness may show render distortion!\n\tPlease confirm to go on:');
    }

    if (willThicknessBeApplied) {
      super.handleStyleSwitch(event);
      this.updateContextToCurrentStyle();
    } else {
      event.target.value = this.getPreviousInputValue(event);
    }
  }

  // 2.b) Specific Util for this implementation (same format but specific for each event handler)

  // Bellow method is only necessary for Tools such as Writter and Drawer
  // because both classes needs to render while updating CanvasListener
  // Data structure
  updateContextToCurrentStyle() {
    const {
      lineColor,
      lineThickness
    } = this.currentStyle;

    const lineThicknessRate = 1 + lineThickness / 8;
    
    // TODO - Create input for selecting line Cap on form
    // this.context.lineCap = "round";
    
    this.context.strokeStyle =  lineColor;
    this.context.lineWidth = lineThicknessRate;
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