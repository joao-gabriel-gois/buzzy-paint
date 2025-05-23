import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'

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
      sequence: this.currentDrawSequence,
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
    if (Number(event.target.value)) {
      this.handleThicknessChange(event);
    } else {   
      super.handleStyleSwitch(event);
      this.updateContextToCurrentStyle();
    } 
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
      drawColor,
      drawThickness
    } = this.currentStyle;
    
    this.context.strokeStyle = drawColor;
    this.context.lineWidth = drawThickness;
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