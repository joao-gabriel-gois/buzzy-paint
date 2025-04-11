export default class ToolEventHandler {
  constructor(elements) {
    // Elements
    this.canvas = document.querySelector(elements.canvas);
    this.styleSwitcher = document.querySelector(elements.styleSwitcher);
    
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    this.context.lineJoin = 'round';
    this.context.lineCap = 'round';
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.context.miterLimit = 10;

    this.currentStyle = {};
    this.cursorStyle = 'default';
    
    // _related to subject, triggered by ToolbarListener
    this.activeCounter = 0;
    this.activeState = false;
    
    this.outsideCanvasMouseUp = false;

    // Callbacks Bindings
    this.handleOnMouseDown = this.handleOnMouseDown.bind(this);
    this.handleOnMouseMove = this.handleOnMouseMove.bind(this);
    this.handleOnMouseUp = this.handleOnMouseUp.bind(this);
    this.handleStyleSwitch = this.handleStyleSwitch.bind(this);
    this.handleGlobalMouseUpTracker = this.handleGlobalMouseUpTracker.bind(this);
    this.renderCallEvent = new Event('render-call');
  }
  
  createToolEvent(eventName, detail) {
    const toolEvent = new CustomEvent(eventName, {
      detail,
    });

    return toolEvent;
  }

  dispacthToolEvent(toolEvent) {
    this.canvas.dispatchEvent(toolEvent);
  }

  renderLatestState() {
    this.canvas.dispatchEvent(this.renderCallEvent);
  }

  handleOnMouseDown(event) {
    event.preventDefault();
    this.canvas.addEventListener('mousemove', this.handleOnMouseMove);
    this.canvas.addEventListener('mouseup', this.handleOnMouseUp);
    this.canvas.style.cursor = this.cursorStyle;
  }

  handleOnMouseMove(event) {
    event.preventDefault();
  }

  handleOnMouseUp(event) {
    event.preventDefault();
    this.canvas.removeEventListener('mousemove', this.handleOnMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleOnMouseUp);
    this.canvas.style.cursor = this.cursorStyle;
  }

  handleStyleSwitch(event, MIN_NUM_PARAM_SIZE = 1) {
    event.preventDefault();
    const el = event.target;
    if (el.value === "") return;
    let value = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === "number") {
      value = isNaN(Number(value)) || value < MIN_NUM_PARAM_SIZE
        ? MIN_NUM_PARAM_SIZE
        : Number(value);
    }
    el.value = value;
    return this.updateCurrentStyle({
      ...this.currentStyle,
      [`${el.getAttribute('id')}`]: value,
    });
  }

  updateCurrentStyle(currentStyle) {
    this.currentStyle = {
      ...this.currentStyle,
      ...currentStyle,
    }

    return this.currentStyle;
  }
  // handleGlobalMouseUpTracker(e) {
  //   if (e.target.tagName === "LI" || e.target.tagName === "IMG" || e.target.tagName === "BUTTON") return;
  //   this.outsideCanvasMouseUp = e.target !== this.canvas;
  // };
  setActiveState(state) {
    this.activeState = Boolean(state);
    if (Boolean(state)) {
      this.canvas.addEventListener('mousedown', this.handleOnMouseDown);
      // document.addEventListener('mouseup', this.handleGlobalMouseUpTracker);
    } else {
      this.canvas.removeEventListener('mousedown', this.handleOnMouseDown);
      // document.removeEventListener('mouseup', this.handleGlobalMouseUpTracker);
    }
  }

  start() {
    if (!this.activeCounter) {
      this.styleSwitcher.onchange = this.handleStyleSwitch;
    }
    this.setActiveState(true);
    this.activeCounter++;
  }

  stop() {
    this.setActiveState(false);
    this.canvas.style.cursor = 'default';
    // console.table({
    //   'stop_time': new Date().toLocaleDateString('pt-br', {
    //     hour: 'numeric',
    //     minute: 'numeric',
    //     second: 'numeric'
    //   }),
    //   'active_state': this.activeState,
    //   'active_counter': this.activeCounter,
    //   'current_style': JSON.stringify(this.currentStyle),
    // });
  }
}
