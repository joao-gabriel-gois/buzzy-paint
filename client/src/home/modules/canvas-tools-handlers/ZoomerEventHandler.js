import ToolEventHandler from "./models/ToolEventHandler.js";

export class Zoomer extends ToolEventHandler {
  constructor(elements) {
    super(elements);
    this.currentStyle = {
      zoom: 1,
      state: this.activeState,
    };
  }

  createZoomEvent(zoom) {
    this.updateCurrentStyle({ zoom: zoom });

    const zoomEvent = super.createToolEvent('zoom', this.currentStyle);

    return zoomEvent;
  }

  // 1) Utils

  
  resetZoomState() {
    super.dispacthToolEvent(this.createZoomEvent(1))
    super.startRenderCall();
  }

  handleStyleSwitch(event) {
    const decimalValue = event.target.value ? event.target.value / 100 : 0;
    const previousValue = this.currentStyle.zoom;

    if (decimalValue <= 0) this.updateCursorStyle('help');
    else if (decimalValue >= previousValue) this.updateCursorStyle('zoom-in');
    else if (decimalValue < previousValue) this.updateCursorStyle('zoom-out');

    this.updateCurrentStyle({
      zoom: decimalValue,
    });
  }

  updateCursorStyle(cursorStyle) {
    this.cursorStyle = cursorStyle;
    this.canvas.style.cursor = this.cursorStyle;
  }

  updateCurrentStyle(currentStyle) {
    let {zoom, state} = currentStyle;
    zoom = zoom === undefined ? this.currentStyle.zoom : zoom;
    state = state === undefined ? this.currentStyle.state : state;

    this.currentStyle = {
      zoom,
      state,
    }
  }

  // 2 - overrides from extended class

  handleOnMouseDown(event) {
    if (this.cursorStyle === 'help') {
      alert('Please, set a zoom percentage');
      return;
    }

    super.handleOnMouseDown(event);
    super.dispacthToolEvent(this.createZoomEvent(this.currentStyle.zoom));
    
  }

  handleOnMouseUp(event) {
    super.handleOnMouseUp(event);
    super.startRenderCall();
  }

  setActiveState(state) {
    super.setActiveState(state);
    this.updateCurrentStyle({state: state});
  }

  start() {
    this.updateCursorStyle('help');
    super.start();
    super.startRenderCall();
  }

  stop() {
    if (this.activeCounter == 1) {
      alert("You can not write or draw with zoom applied!");
    }
    this.resetZoomState();
    // should handle different this reset, let this way for now
    this.styleSwitcher.children[0].children[1].value = '';
    super.stop();
  }
}
