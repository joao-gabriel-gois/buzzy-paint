import ToolEventHandler from './models/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/eventUtils.js'

export class Drawer extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      drawThickness: 1,
      drawColor: '#000',
    }
    // array of positions of current draw
    this.currentDrawSequence = [];
  }

  // 1) Private Event Handler - Event Related Functions
  createDrawEvent() {
    const drawEvent = super.createToolEvent('draw', {
      sequenceArray: this.currentDrawSequence,
      style: this.currentStyle,
    });

    return drawEvent;
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    super.handleOnMouseDown(event);
    const drawThicknessRate = 1 + this.currentStyle.drawThickness / 8;
    this.context.strokeStyle = this.currentStyle.drawColor;
    this.context.lineWidth = drawThicknessRate;
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    this.context.beginPath();
    this.context.moveTo(x, y);

    this.currentDrawSequence.push({
      position: [x, y],
    });
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event); 
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    this.context.lineTo(x, y);
    this.context.moveTo(x, y);
    this.context.stroke();

    this.currentDrawSequence.push({
      position: [x, y],
    });
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    this.context.lineTo(x, y);
    this.context.moveTo(x, y);
    this.context.stroke();

    this.currentDrawSequence.push({
      position: [x, y],
    });
    
    super.dispacthToolEvent(this.createDrawEvent());
    this.currentDrawSequence = [];
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
    const drawThicknessRate = 1 + Number(event.target.value) / 8;
    let willThicknessBeApplied = true;

    if (drawThicknessRate > 11) {
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
      drawColor,
      drawThickness
    } = this.currentStyle;

    const drawThicknessRate = 1 + drawThickness / 8;
    
    this.context.strokeStyle =  drawColor;
    this.context.lineWidth = drawThicknessRate;
  }

  // 3) Public interfaces

  setActiveState(state) {
    if (Boolean(state)) this.context.strokeStyle = this.currentStyle.drawColor;
    super.setActiveState(state);
  }

  // start() {
  //   super.start();
  // }

  // stop() {
  //   super.stop();
  // }
}