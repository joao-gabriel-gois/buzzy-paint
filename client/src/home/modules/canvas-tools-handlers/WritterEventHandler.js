import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'

const MIN_FONT_SIZE = 4;

// Tentar substituir todas as lógicas que lidam com o contexto ou com outra interface como no drawer
// ou tentar o que lá deu problema de perfomance e ver se ocorre o mesmo
export class Writter extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    super.currentStyle = {
      textColor: 'black',
      fontSize: 12,
      fontFamily: 'Arial',
      innerText: 'Insert a text',
    };
    // last position reference for erasing
    this.lastPosition = [];
  }

  createWriteEvent() {
    const writeEvent = super.createToolEvent('write', {
        position: this.lastPosition,
        style: this.currentStyle,
      });

    return writeEvent;
  }

  handleOnMouseDown(event) {
    this.cursorStyle = 'move';
    super.handleOnMouseDown(event);
    
    const { innerText } = this.currentStyle;

    this.updateLastPosition(event);
    this.writeText(innerText);
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    super.renderLatestState();
    
    this.updateCurrentFrame(event);
  }

  handleOnMouseUp(event) {
    this.cursorStyle= 'copy';
    
    super.handleOnMouseUp(event);
    super.dispacthToolEvent(this.createWriteEvent());
  }

  updateLastPosition(event) {
    const position = getRelativeCursorPos(event, this.canvas);
    this.lastPosition = position;
  }

  writeText(innerText, position = this.lastPosition) {
    this.updateContextToCurrentStyle();
    this.context.fillText(innerText, ...position);
  }
  
  eraseLastPositionTextArea({ fontSize, innerText }) {
    const [ lastX, lastY ] = this.lastPosition;
    const textSize = innerText.length;

    this.context.clearRect(lastX, lastY - fontSize,  textSize / 1.2 * fontSize, fontSize);
    this.writeText(innerText);
  }
  
  updateCurrentFrame(event) {
    const { innerText, font } = this.currentStyle;
    
    // erase in old pos
    this.eraseLastPositionTextArea({ font, innerText });
    // update pos
    this.updateLastPosition(event);
    // write in new pos
    if (this.lastPosition.length === 0) {
      this.writeText(innerText, event);
      return;
    }
    this.writeText(innerText);
  }

  handleStyleSwitch(event) {
    super.handleStyleSwitch(event, MIN_FONT_SIZE);
    this.updateContextToCurrentStyle();
  }

  updateContextToCurrentStyle() {
    const {
      textColor,
      fontSize,
      fontFamily,
      innerText,
    } = this.currentStyle;

    this.context.fillStyle = textColor;
    this.context.font = `${fontSize}pt ${!!fontFamily ? fontFamily : 'Arial' }, Arial, sans-serif`;
    this.context.innerText = innerText;
  }


  // 3) Public interfaces
  setActiveState(state) {
    super.setActiveState(state);
    if (Boolean(state)) this.updateContextToCurrentStyle();
  }
  
  start() {
    super.start();
    this.cursorStyle = 'copy';
  }

  stop() {
    super.stop();
  }
}
