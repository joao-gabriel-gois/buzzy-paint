import ToolEventHandler from "./parent/ToolEventHandler.js";
import { getRelativeCursorPos } from "../../../utils/getRelativeCursorPos.js"
import { createAndRenderAlert, createAndRenderConfirm } from "../../../shared/alerts.js";
import { getStyle } from "../../../utils/cssUtils.js"

const LINE_DASH = [3, 6];

// TODO: 
// FINAL) Add the rotation feature based on the user input (style swtich)
// and apply here the real time rotation before the final value is finally
// dispatched as an event to CanvasEventListener (incomplete handleStyleSwitch
// and updateContextToCurrentStyle)

export class CropperAndMover extends ToolEventHandler {
  constructor(elements, alert = createAndRenderAlert) {
    super(elements);
    this.alert = alert;

    // event data
    this.firstSelection = {};
    this.finalSelectionPosition = [];
    this.stillSelected = false;
    this.currentStyle = {
      rotationDegree: 0
    }

    // states
    this.selectionData;
    this.selectionDataParameters;
    this.isSelectionDone = false;
    this.clickWithMouseMoving = false;
    // this.previousOutsideCanvasMouseUp = false;
    this.mouseDownOnLatestSelection = false;
    // this.action = "create";

    this.ctrlKeyCapturing = this.ctrlKeyCapturing.bind(this);
  }

  // 1) Private Event Handler - Event Related Functions
  createCropAndMoveEvent() {
    // const cropAndMoveEvent = super.createToolEvent(`${action}-crop-and-move`, {
    const cropAndMoveEvent = super.createToolEvent("crop-and-move", {
      firstSelection: this.firstSelection,
      dataPosition: this.finalSelectionPosition,
      stillSelected: this.stillSelected,
      style: this.currentStyle,
    });

    return cropAndMoveEvent;
  }
  
  handleOnMouseDown(event) {
    this.cursorStyle = "crosshair";
    super.handleOnMouseDown(event);
    
    let {
      x: selX,
      y: selY,
      width,
      height
    } = this.firstSelection;

    if (this.outsideCanvasMouseUp) {
      // handling mouse up outside canvas properly
      // this.previousOutsideCanvasMouseUp = this.outsideCanvasMouseUp;
      if (
        selX && selY && width && height
          && this.finalSelectionPosition.length === 0
          && !this.stillSelected
      ) {        
        this.selectionData = this.context.getImageData(
          selX, selY,
          width, height
        );
      }
      return;
    }

    const [x, y] = getRelativeCursorPos(event, this.canvas);
    // first selection after instantiation case
    if (!this.isSelectionDone) {
      this.firstSelection = {
        x, y,
        width: 0,
        height: 0,
      };
      this.context.beginPath();
      return;
    }
    
    this.mouseDownOnLatestSelection = this.isInsideLatestSelection(x, y);
    // changing starting position of current selection if it
    // was already moved once
    if (this.mouseDownOnLatestSelection) {
      const [lastX, lastY] = this.finalSelectionPosition;
      if (lastX && lastY) {
        selX = lastX;
        selY = lastY;
        this.stillSelected = true;        
      }
      this.selectionDataParameters = [
        selX, selY,
        width, height,
      ];
      
      this.selectionData = this.context.getImageData(
        ...this.selectionDataParameters
      );
      return;
    }
    // starting new selection after other selections already happened
    this.clearState();
    this.firstSelection = {
      x, y,
      width: 0,
      height: 0,
    };
    this.context.beginPath();
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

    if (this.isSelectionDone) {
      this.renderLatestState();
      if (!this.stillSelected) {
        this.context.clearRect(firstX, firstY, width, height);
        // saving canvas state to later render behind image moving
        this.wholeCanvasImageData = this.context.getImageData(
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      }
      else {
        // rendering previous saved canvas state before rendering
        // it behind image moving
        this.context.putImageData(this.wholeCanvasImageData, 0, 0);
      }
      this.finalSelectionPosition = [
        x - width / 2, // centralized moving
        y - height / 2 // idem
      ];

      this.context.putImageData(
        this.selectionData,
        ...this.finalSelectionPosition
      );

      // need to figure out how to handle it better,
      // currently it is applying rotation again each new mouse move...
      // that's why the line bellow is commented
      // this.updateContextToCurrentStyle();
      this.context.strokeStyle = "#8C8288";
      this.context.lineWidth = 1;
      this.context.setLineDash(LINE_DASH);
      this.context.strokeRect(...this.finalSelectionPosition, width, height);
      this.context.setLineDash([]);
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
    Object.assign(this.firstSelection, {
      x, y,
      width: Math.abs(width),
      height: Math.abs(height),
    });

    // this was for previous behavior and now broke the latest features
    // will check if it still necessary due to different testing scenarios
    // but for now all seems to be fine without it
    // if (this.previousOutsideCanvasMouseUp) {
    //   this.context.setLineDash([]);
    //   this.context.closePath(); 
    //   this.isSelectionDone = true;
    //   this.clickWithMouseMoving = false;
    //   this.previousOutsideCanvasMouseUp = false;
    //   return;
    // }
    if (!this.clickWithMouseMoving) {
      this.clearState();
      // rendering bellow to remove the dashed selection outline
      this.renderLatestState();
      return;
    }
    else if (this.isSelectionDone) {
      this.dispacthToolEvent(this.createCropAndMoveEvent());
      // need to change this state after dispacthing the event
      // in order to make the CanvasEventListener handles it correctly
      this.stillSelected = true;
      console.log('(end) mouse-up: stillSelected', this.stillSelected, '\n');

      return;
    }
    console.log('(end) mouse-up: stillSelected', this.stillSelected, '\n');

    this.context.setLineDash([]);
    this.context.closePath(); 
    this.isSelectionDone = true;
    this.clickWithMouseMoving = false;
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
    this.isSelectionDone = false;
    this.stillSelected = false;
  }

  // Need to study to functions bellow and make them working for
  // 1) mouse down, move and up image position change
  // 2) at the final event in canvas event listener
  handleStyleSwitch(event) {
    const rotationDegree = parseFloat(event.target.value);
    if (isNaN(rotationDegree)) {
      this.alert({
        type: "warning",
        title: "Invalid Parameter",
        message: "The rotation value must be a number!"
      });
      return;
    }
    super.handleStyleSwitch(event);
    
    // Only redraw if we have a selection to rotate
    if (this.isSelectionDone && this.selectionData) {
      this.renderLatestState();
      this.updateContextToCurrentStyle();
    }
  }
  
  updateContextToCurrentStyle() {
    const { rotationDegree } = this.currentStyle;
    const angle = parseFloat(rotationDegree) * Math.PI / 180;
    
    if (!this.selectionData || this.finalSelectionPosition.length !== 2) {
      return;
    }
    
    const [x, y] = this.finalSelectionPosition;
    const { width, height } = this.firstSelection;
    
    if (this.wholeCanvasImageData) {
      this.context.putImageData(this.wholeCanvasImageData, 0, 0);
    }
    
    this.context.save();
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    // translate is very important here, once rotation method
    // will always refer to the origin (top left corner). That's why
    // force it to refer to the center of the selection
    this.context.translate(centerX, centerY);
    this.context.rotate(angle);
    
    // once imageData is just raw pixel data, we need a new canvas around 
    // it in order to be able to take advantage of rotation capabilities
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    offCtx.putImageData(this.selectionData, 0, 0);
    
    this.context.drawImage(
      offscreenCanvas, 
      -width / 2, -height / 2, // ventered around rotation point
      width, height
    );
    
    this.context.strokeStyle = "#8C8288";
    this.context.lineWidth = 1;
    this.context.setLineDash(LINE_DASH);
    this.context.strokeRect(-width / 2, -height / 2, width, height);
    this.context.setLineDash([]);
    
    this.context.restore();
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
      && !this.clickWithMouseMoving
    ) {
      this.isSelectionDone = false;
      this.renderLatestState();
    }
  }

  setActiveState(state) {
    const rotationInput = this.styleSwitcher.querySelector("#rotationDegree");
    if (Boolean(state)) {
      // this.updateContextToCurrentStyle();
      // removing parent default event for inputs
      this.styleSwitcher.onchange = null;
      this.startCtrlKeyCapturing();
      console.log(this.styleSwitcher, rotationInput);
      rotationInput.addEventListener('input', this.handleStyleSwitch);
      if (this.activeCounter === 0) {
        // turning activating state dependent of closing the alert
        // to avoid handleMouseUp to trigger outside the canvas because
        // of the alert click event
        this.alert({
          type: "info",
          title: "Feature Reminder",
          message: "You can also select squares by keeping"
            + " <strong>'ctrl'</strong> pressed."
        }, () => super.setActiveState(state));
        return;
      }

      super.setActiveState(state);
    }
    else {
      this.stopCtrlKeyCapturing();
      rotationInput.removeEventListener('input', this.handleStyleSwitch);
      this.isSelectionDone = false;
      if (
        Object.keys(this.firstSelection).length !== 0
          && this.finalSelectionPosition.length === 2
      ) this.clearState();

      this.renderLatestState();
      super.setActiveState(state);
    }
  }
}