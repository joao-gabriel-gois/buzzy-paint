import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/eventUtils.js'
import { getStyle } from '../../../utils/cssUtils.js';
import { fromRGBtoHex } from '../../../utils/fromRGBtoHex.js';
import { createAndRenderAlert, createAndRenderConfirm } from '../../../shared/alerts.js';

/*
  TODO:
  1) atualizar todos os casos de estilo / inputs e reagir as mudanças com onchange
  2) ouvir o event do lado do canvasListener para registrar os eventos de retangulo na fila de eventos
  3) incluir uma método de renderização para o caso do retangulo
  4) testar tudo
*/
export class Rectangler extends ToolEventHandler {
  constructor(elements, alert = createAndRenderAlert, confirm = createAndRenderConfirm) {
    super(elements);
    super.currentStyle = {
      rectThickness: 1,
      rectOutlineColor: '#000',
      fillColor: getStyle(this.canvas).backgroundColor,
      filled: false,
      stroked: true,
    }
    this.alert = alert;
    this.confirm = confirm;
    this.checkboxReactiveInputContainers = elements
      .checkBoxReactiveContainers
      .map(id => document.getElementById(id));

    this.initOptionsInputHandler();
    // this.initOptionsInputHandler = this.initOptionsInputHandler.bind(this);
    // array of positions of current draw
    this.currentRect = {};
    this.ctrlKeyCapturing = this.ctrlKeyCapturing.bind(this);
    // this.ctrlKeyCapturingCancel = this.ctrlKeyCapturingCancel.bind(this);

    this.keepConfirm = true;
  }

  initOptionsInputHandler() {
    const [strokeCheck, fillCheck] = this.styleSwitcher.querySelectorAll('[type="checkbox"]');
    const [strokeWrapper, fillWrapper] = this.checkboxReactiveInputContainers;
    
    const fillColorInput = this.styleSwitcher.querySelector('#fillColor');
    fillColorInput.value = fromRGBtoHex(this.currentStyle.fillColor);

    const display = {
      fill: getStyle(fillWrapper).display,
      stroke: getStyle(strokeWrapper).display,
    }
    fillWrapper.style.display = 'none';
    strokeWrapper.style.display = 'none';

    fillCheck.addEventListener('click', (_) => {
      if (!fillCheck.checked) {
        fillWrapper.style.display = 'none';
        if (!strokeCheck.checked) strokeCheck.click();
      }
      else {
        fillWrapper.style.display = display.fill;
      }
    });
    
    strokeCheck.addEventListener('click', (_) => {
      if (!fillCheck.checked && !strokeCheck.checked) {
        this.alert({
          type: 'warning',
          title: 'Not possible!',
          message: 'You need at least outline selected to draw a rectangle.'
        });
        strokeCheck.click();
      }
      else if (strokeCheck.checked) {
        strokeWrapper.style.display = display.stroke;
      }
      else {
        strokeWrapper.style.display = 'none';
      }
    });

    strokeCheck.click();
  }

  // 1) Private Event Handler - Event Related Functions
  createRectangleEvent() {
    const rectangleEvent = super.createToolEvent('rect', {
      rect: this.currentRect,
      style: this.currentStyle,
    });

    return rectangleEvent;
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    super.handleOnMouseDown(event);
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    
    this.currentRect = {
      x, y,
      width: 0,
      height: 0,
    };
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    Object.assign(this.currentRect, {
      width: x - this.currentRect.x,
      height: y - this.currentRect.y,
    });
    
    super.startRenderCall(); // clear for real time lining, overwriting with latest line state
    this.updateContextToCurrentStyle();
    
    const { filled, stroked } = this.currentStyle;
    let {
      x: startX,
      y: startY,
      width,
      height
    } = this.currentRect;
    
    if (this.ctrlPressed) { // if ctrl is pressed, force the rectangle to become a square
      const wasNegativeWidth = width < 0;
      const wasNegativeHeight = height < 0;
      width = Math.abs(width) > Math.abs(height) ? width : height;
      height = width;

      if (wasNegativeWidth && width >= 0) width = -width; 
      if (wasNegativeHeight && height >= 0) height = -height;
      
      Object.assign(this.currentRect, { width, height });
    }

    if (filled) {
      this.context.fillRect(startX, startY, width, height);
    }
    if (stroked) {
      this.context.strokeRect(startX, startY, width, height);
    }
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    super.dispacthToolEvent(this.createRectangleEvent()); // real and final rect is saved
    this.currentRect = {};
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
      rectOutlineColor,
      rectThickness,
      fillColor,
    } = this.currentStyle;

    this.context.strokeStyle = rectOutlineColor;
    this.context.fillStyle = fillColor;
    this.context.lineWidth = rectThickness;
  }

  startCtrlKeyCapturing() {
    document.addEventListener('keydown', this.ctrlKeyCapturing);
    document.addEventListener('keyup', this.ctrlKeyCapturing);
  }

  stopCtrlKeyCapturing() {
    document.removeEventListener('keydown', this.ctrlKeyCapturing);
    document.removeEventListener('keyup', this.ctrlKeyCapturing);
  }

  ctrlKeyCapturing(event) {
    this.ctrlPressed = Boolean(event.ctrlKey);
  }

  // ctrlKeyCapturingCancel(event) {
  //   setTimeout(() => {
  //     this.ctrlKeyCapturing(event)
  //   }, 20);
  // }

  setActiveState(state) {
    if (Boolean(state)) {
      this.updateContextToCurrentStyle();
      this.startCtrlKeyCapturing();
      // if (this.keepConfirm) {
      //   this.confirm({
      //     type: 'info',
      //     title: 'Feature Reminder',
      //     message: 'You can also draw squares when keeping <strong>\'ctrl\''
      //       + ' </strong>pressed.<br><br><strong style="display:flex;justify'
      //       + '-self:center;">Do you want to cancel this reminder?</strong>'
      //   }).then(cancel => {
      //     this.keepConfirm = !cancel;
      //   });
      // }
      if (this.activeCounter === 0) {
        this.alert({
          type: 'info',
          title: 'Feature Reminder',
          message: 'You can also draw squares by keeping'
            + ' <strong>\'ctrl\'</strong> pressed.'
        });
      }
    }
    else {
      this.stopCtrlKeyCapturing();
    }
    
    super.setActiveState(state);
  }
}