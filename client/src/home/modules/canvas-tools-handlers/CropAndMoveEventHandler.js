import ToolEventHandler from "./parent/ToolEventHandler.js";
import { getRelativeCursorPos } from "../../../utils/getRelativeCursorPos.js"
import { createAndRenderAlert } from "../../../shared/alerts.js";

const LINE_DASH = [3, 6];

export class CropperAndMover extends ToolEventHandler {
  constructor(elements, alert = createAndRenderAlert) {
    // dependencies
    super(elements);
    this.alert = alert;
    // event data
    this.firstSelection = {};
    this.finalSelectionPosition = [];
    this.firstEventOfTheChain = true;
    this.currentStyle = {
      rotationDegree: 0
    }
    // states
    this.selectionData;
    this.selectionDataParameters;
    this.isSelectionDone = false;
    this.clickWithMouseMoving = false;
    this.mouseDownOnLatestSelection = false;
    this.imageStateHasChanged = false;
    // rotation util props
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvasContext = null;
    this.wheelEndTimeoutControl;
    // event handlers bindings
    this.ctrlKeyCapturing = this.ctrlKeyCapturing.bind(this);
    this.onMouseWheelAboveSelection = this.onMouseWheelAboveSelection.bind(this);
    // removing parent default event for inputs
    this.styleSwitcher.onchange = null;
  }

  // 1) Private Event Handler - Event Related Functions
  createCropAndMoveEvent() {
    const cropAndMoveEvent = super.createToolEvent("crop-and-move", {
      // avoiding the object/array reference using spread operator
      firstSelection: {...this.firstSelection},
      dataPosition: [...this.finalSelectionPosition],
      firstEventOfTheChain: this.firstEventOfTheChain,
      style: {...this.currentStyle},
    });
    return cropAndMoveEvent;
  }

  handleOnMouseDown(event) {
    this.cursorStyle = "crosshair";
    super.handleOnMouseDown(event);

    this.clickWithMouseMoving = false;
    
    const [x, y] = getRelativeCursorPos(event, this.canvas);
    this.mouseDownOnLatestSelection = this.isInsideLatestSelection(x, y);

    if (this.isSelectionDone && !this.mouseDownOnLatestSelection) {
      if (this.imageStateHasChanged) {
        this.dispacthToolEvent(this.createCropAndMoveEvent());
      }
      this.clearState();
      this.renderLatestState();
    }

    if (!this.isSelectionDone) {
      this.firstSelection = {
        x, y,
        width: 0,
        height: 0,
      };
      this.context.beginPath();
      return;
    }
  }

  handleOnMouseMove(event) {
    super.handleOnMouseMove(event);

    let [x, y] = getRelativeCursorPos(event, this.canvas);
    let {
      x: firstX,
      y: firstY,
      width,
      height
    } = this.firstSelection;
    
    this.clickWithMouseMoving = true;

    if (this.mouseDownOnLatestSelection) {
      this.renderLatestState();
      if (this.firstEventOfTheChain) {
        this.selectionData = this.context.getImageData(
          firstX, firstY,
          width, height
        );
        this.context.clearRect(firstX, firstY, width, height);
        // saving canvas state to later render behind image moving
        this.wholeCanvasImageData = this.context.getImageData(
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.putImageData(this.wholeCanvasImageData, 0, 0);
      }
      else {
        // rendering previous saved canvas state before rendering
        // it behind image moving
        this.renderLatestState();
        this.context.putImageData(this.wholeCanvasImageData, 0, 0);
      }
      
      
      this.finalSelectionPosition = [
        x - width / 2, // centralized moving
        y - height / 2 // idem
      ];
      this.updateContextToCurrentStyle();
      return;
    }
    // new selection drawing
    let newWidth = x - firstX;
    let newHeight = y - firstY;
    this.context.setLineDash([]);
    // keeping updated selection outline, by cleaning
    // the previous and drawing a new one in the new position
    super.renderLatestState(); 
    // this.updateContextToCurrentStyle();
    this.context.strokeStyle = "#8C8288";
    this.context.lineWidth = 1;
    this.context.setLineDash(LINE_DASH);

    // if ctrl is pressed, force the rectangle to become a square
    if (this.ctrlPressed) {
      const wasNegativeWidth = newWidth < 0;
      const wasNegativeHeight = newHeight < 0;
      newWidth = Math.abs(newWidth) > Math.abs(newHeight) ? newWidth : newHeight;
      newHeight = newWidth;

      if (wasNegativeWidth && newWidth >= 0) newWidth = -newWidth; 
      if (wasNegativeHeight && newHeight >= 0) newHeight = -newHeight;  
    }

    this.context.strokeRect(
      firstX, firstY,
      newWidth, newHeight
    );

    Object.assign(this.firstSelection, {
      width: newWidth,
      height: newHeight,
    });
  }

  handleOnMouseUp(event) {
    this.cursorStyle = "default";
    super.handleOnMouseUp(event);

    if (!this.clickWithMouseMoving && !this.mouseDownOnLatestSelection) {
      this.clearState();
      this.renderLatestState();
      return;
    }

    let [x, y] = getRelativeCursorPos(event, this.canvas);
    let {
      x: firstX,
      y: firstY,
      width,
      height
    } = this.firstSelection;
    // adjusting image state for negative positioning
    x = width < 0 ? x : firstX;
    y = height < 0 ? y : firstY;
    width = Math.abs(width);
    height = Math.abs(height);

    const isValidFirstSelection = (
      !isNaN(x) && !isNaN(y) 
        && !isNaN(width) && !isNaN(height)
        && width !== 0 && height !== 0
    );
    // if esc was pressed in between
    if (!isValidFirstSelection) return;
    
    Object.assign(this.firstSelection, {
      x, y,
      width, height
    });
    
    if (!this.isSelectionDone) {
      this.context.setLineDash([]);
      this.context.closePath();
      this.selectionData = this.context.getImageData(
        x, y,
        width, height
      );
      super.renderLatestState();
      const canvasImageBeforeCrop = this.context.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
      this.context.clearRect(x, y, width, height);
      // saving canvas state to later render behind image moving
      this.wholeCanvasImageData = this.context.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
      this.context.putImageData(canvasImageBeforeCrop, 0, 0);

      this.isSelectionDone = true;
      this.clickWithMouseMoving = false;
      
      this.currentStyle.rotationDegree = 0;
      this.updateContextToCurrentStyle();

      this.imageStateHasChanged = false;
      return;
    }

    if (this.imageStateHasChanged) {
      this.dispacthToolEvent(this.createCropAndMoveEvent());
      this.imageStateHasChanged = false;
      this.firstEventOfTheChain = false;
    }
  }

  isInsideLatestSelection(x, y) {
    if (
      Object.keys(this.firstSelection).length === 0
    ) return false;
  
    const {
      x: firstX, y: firstY,
      width,
      height,
    } = this.firstSelection;

    if (this.finalSelectionPosition.length !== 2) {
      return (
        x >= firstX && x <= firstX + width
          && y >= firstY && y <= firstY + height
      );
    }

    const [lastX, lastY] = this.finalSelectionPosition;
    return (
      x >= lastX && x <= lastX + width
        && y >= lastY && y <= lastY + height
    );
  }

  clearState() {
    this.firstSelection = {};
    this.finalSelectionPosition = [];
    this.clickWithMouseMoving = false;
    this.mouseDownOnLatestSelection = false;
    this.isSelectionDone = false;
    this.firstEventOfTheChain = true;
    this.selectionData = null;
    this.imageStateHasChanged = false;
    this.currentStyle.rotationDegree = 0;
  }

  handleStyleSwitch(event) {
    let rotationDegree = parseFloat(event.target.value);
    if (isNaN(rotationDegree) && rotationDegree !== "") {
      this.alert({
        type: "warning",
        title: "Invalid Parameter",
        message: "The rotation value must be a number!"
      });
      return;
    }
    // capping the values up to 360, once it's a modulus
    rotationDegree = rotationDegree % 360;
    event.target.value = rotationDegree;
    this.currentStyle.rotationDegree = parseFloat(rotationDegree) * Math.PI / 180;

    if (this.isSelectionDone && this.selectionData) {
      this.renderLatestState();
      this.updateContextToCurrentStyle();
    }
  }
  
  updateContextToCurrentStyle() {
    if (!(this.selectionData && this.isSelectionDone)) return;
    
    let [x, y] = this.finalSelectionPosition;
    const {
      x: firstX,
      y: firstY,
      width,
      height
    } = this.firstSelection;
    const angle = this.currentStyle.rotationDegree;

    if (!(x || y)) {
      x = firstX;
      y = firstY;
    }
    
    if (this.wholeCanvasImageData) {
      this.context.putImageData(this.wholeCanvasImageData, 0, 0);
    }
    
    this.context.save();
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    // translate is very important here, once rotate method will
    // always refer to the origin (top left corner). That's why
    // we force it to refer to the center of the selection.
    this.context.translate(centerX, centerY);
    this.context.rotate(angle);
    // once imageData (selectionData) is just raw pixel data, we need a new canvas around it
    // in order to be able to take advantage of rotation capabilities and get a proper way
    // to reproduce it through state, anywhere it's dispatched in the CanvasEventListener
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    if (!this.offscreenCanvasContext) {
      this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
    }
    this.offscreenCanvasContext.clearRect(0, 0, width, height);
    this.offscreenCanvasContext.putImageData(this.selectionData, 0, 0);
    
    this.context.drawImage(
      this.offscreenCanvas, 
      -width / 2, -height / 2, // ventered around rotation point
      width, height
    );
    
    this.context.strokeStyle = "#8C8288";
    this.context.lineWidth = 1;
    this.context.setLineDash(LINE_DASH);
    this.context.strokeRect(-width / 2, -height / 2, width, height);
    this.context.setLineDash([]);
    
    this.context.restore();
    this.imageStateHasChanged = true;
  }

  startCtrlKeyCapturing() {
    document.addEventListener("keydown", this.ctrlKeyCapturing);
    document.addEventListener("keyup", this.ctrlKeyCapturing);
  }

  stopCtrlKeyCapturing() {
    document.removeEventListener("keydown", this.ctrlKeyCapturing);
    document.removeEventListener("keyup", this.ctrlKeyCapturing);
  }

  ctrlKeyCapturing(event) {
    this.ctrlPressed = Boolean(event.ctrlKey);
    if (
      event.type === "keydown"
      && event.key === "Escape"
    ) {
      this.context.setLineDash([]);
      if (this.imageStateHasChanged) {
        this.dispacthToolEvent(this.createCropAndMoveEvent());
      }
      this.clearState();
      this.renderLatestState();
    }
  }

  onMouseWheelAboveSelection(event) {
    const [x, y] = [...getRelativeCursorPos(event, this.canvas)];
    const rotationInput = this.styleSwitcher.querySelector("#rotationDegree");
    // // possible callback cleaner once wheel events happened again before 
    // // `newScrollStopEventTimeGap` ms (333ms in the example below)
    // const newScrollStopEventTimeGap = 333;
    // if (this.wheelEndTimeoutControl) clearTimeout(this.wheelEndTimeoutControl);
    if (this.isInsideLatestSelection(x, y)) {
      rotationInput.value = !isNaN(Number(rotationInput.value))
        ? (
          Number(rotationInput.value) - Math.round(event.deltaY / Math.abs(event.deltaY)) * 5
        ) : 0;
      
      const fakeEvent = {
        target: rotationInput
      }
      this.handleStyleSwitch(fakeEvent);
      // this.wheelEndTimeoutControl = setTimeout(() => {
      //   // possible callback once continuous sequentil wheel events
      //   // stopped after 333 miliseconds
      //   console.log('wheel input update');
      // }, newScrollStopEventTimeGap);
    }
  }


  setActiveState(state) {
    const rotationInput = this.styleSwitcher.querySelector("#rotationDegree");
    if (Boolean(state)) {
      this.startCtrlKeyCapturing();
      rotationInput.addEventListener('input', this.handleStyleSwitch);
      this.canvas.addEventListener('wheel', this.onMouseWheelAboveSelection);
      if (this.activeCounter === 0) {
        this.alert({
          type: "info",
          title: "Feature Reminder",
          message: "You can also select squares by keeping"
            + " <strong>'ctrl'</strong> pressed."
        });
      }
    }
    else {
      this.stopCtrlKeyCapturing();
      rotationInput.removeEventListener('input', this.handleStyleSwitch);
      this.canvas.removeEventListener('wheel', this.onMouseWheelAboveSelection);
      if (this.imageStateHasChanged) {
        this.dispacthToolEvent(this.createCropAndMoveEvent());
      }
      this.clearState();
      this.renderLatestState();
    }
    super.setActiveState(state);
  }
}
