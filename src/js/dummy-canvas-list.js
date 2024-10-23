export class DummyCanvasEventListener {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.eventQueue = [];
    this.onDestroyCall = this.onDestroyCall.bind(this);
    console.log("New instance for ", canvasId);
    this.eventQueueElTest = 1;
  }

  onDestroyCall(_) {
    this.eventQueue.push(this.eventQueueElTest);
    console.log("received canvas-destroy-call");
    document.dispatchEvent(
      new CustomEvent('canvas-destroy', { detail: { eventQueue: this.eventQueue } })
    );
    // Just testing if different instances are really saving different states
    // Once you go again to a tab and then stop it again, it will push an incremented
    // number into eventQueue
    this.eventQueueElTest++;
  }

  init() {
    document.addEventListener('canvas-destroy-call', this.onDestroyCall);
  }

  stop() {
    document.removeEventListener('canvas-destroy-call', this.onDestroyCall);
  }
}