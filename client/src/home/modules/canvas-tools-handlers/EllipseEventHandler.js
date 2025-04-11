import ToolEventHandler from './parent/ToolEventHandler.js';
import { getRelativeCursorPos } from '../../../utils/getRelativeCursorPos.js'
import { getStyle } from '../../../utils/cssUtils.js';
import { fromRGBtoHex } from '../../../utils/colorUtils.js';
import { createAndRenderAlert } from '../../../shared/alerts.js';

export class Ellipser extends ToolEventHandler {
  constructor(elements, alert = createAndRenderAlert) {
    super(elements);
    super.currentStyle = {
      ellipseThickness: 1,
      ellipseOutlineColor: '#000',
      ellipseFillColor: getStyle(this.canvas).backgroundColor,
      ellipseFilled: false,
      ellipseStroked: true,
    }
    this.alert = alert;
    this.checkboxReactiveInputContainers = elements
      .checkBoxReactiveContainers
      .map(id => document.getElementById(id));

    this.initOptionsInputHandler();
    this.currentEllipse = {};
    this.ctrlKeyCapturing = this.ctrlKeyCapturing.bind(this);
  }

  initOptionsInputHandler() {
    const strokeCheck = this.styleSwitcher.querySelector('#ellipseStroked');
    const fillCheck = this.styleSwitcher.querySelector('#ellipseFilled');
    const [strokeWrapper, fillWrapper] = this.checkboxReactiveInputContainers;
    
    const ellipseFillColorInput = this.styleSwitcher.querySelector('#ellipseFillColor');
    ellipseFillColorInput.value = fromRGBtoHex(this.currentStyle.ellipseFillColor);

    const display = {
      fill: getStyle(fillWrapper).display,
      stroke: getStyle(strokeWrapper).display,
    }
    fillWrapper.style.display = 'none';
    strokeWrapper.style.display = 'none';

    fillCheck.addEventListener('click', (_) => {
      if (!fillCheck.checked) {
        console.log(strokeCheck, fillCheck);
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
          message: 'You need at least outline selected to draw an ellipse.'
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
  createEllipseEvent() {
    const ellipseEvent = super.createToolEvent('ellipse', {
      ellipse: this.currentEllipse,
      style: this.currentStyle,
    });

    return ellipseEvent;
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = 'crosshair';
    super.handleOnMouseDown(event);
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    
    this.currentEllipse = {
      x, y,
      radiusWidth: 0,
      radiusHeight: 0,
    };
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);    
    Object.assign(this.currentEllipse, {
      radiusWidth: x - this.currentEllipse.x,
      radiusHeight: y - this.currentEllipse.y,
    });
    
    super.renderLatestState(); // clear for real time lining, overwriting with latest line state
    this.updateContextToCurrentStyle();
    
    const { ellipseFilled, ellipseStroked } = this.currentStyle;
    let {
      x: startX,
      y: startY,
      radiusWidth,
      radiusHeight
    } = this.currentEllipse;
    
    radiusWidth = Math.abs(radiusWidth);
    radiusHeight = Math.abs(radiusHeight);
    if (this.ctrlPressed) { // if ctrl is pressed, force the ellipse to become a circle
      radiusWidth = radiusWidth > radiusHeight ? radiusWidth : radiusHeight;
      radiusHeight = radiusWidth;
    }   
    Object.assign(this.currentEllipse, { radiusWidth, radiusHeight });

    if (ellipseFilled) {
      this.context.beginPath();
      this.context.ellipse(startX, startY, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.fill();
      this.context.closePath();
    }
    if (ellipseStroked) {
      this.context.beginPath();
      this.context.ellipse(startX, startY, radiusWidth, radiusHeight, 0, 0, 2 * Math.PI);
      this.context.stroke();
      this.context.closePath();
    }
  }

  handleOnMouseUp(event) {
    this.cursorStyle = 'default';
    super.handleOnMouseUp(event);
    super.dispacthToolEvent(this.createEllipseEvent()); // real and final ellipse is saved
    this.currentEllipse = {};
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

  updateContextToCurrentStyle() {
    const {
      ellipseOutlineColor,
      ellipseThickness,
      ellipseFillColor,
    } = this.currentStyle;

    this.context.strokeStyle = ellipseOutlineColor;
    this.context.fillStyle = ellipseFillColor;
    this.context.lineWidth = ellipseThickness;
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

  setActiveState(state) {
    if (Boolean(state)) {
      this.updateContextToCurrentStyle();
      this.startCtrlKeyCapturing();
      if (this.activeCounter === 0) {
        this.alert({
          type: 'info',
          title: 'Feature Reminder',
          message: 'You can also draw circles by keeping'
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
