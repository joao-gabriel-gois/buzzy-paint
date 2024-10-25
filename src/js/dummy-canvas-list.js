export class DummyCanvasEventListener {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.eventQueue = [];
    this.onStopCall = this.onStopCall.bind(this);
    console.log("New instance for ", canvasId);
    this.eventQueueElTest = 1;
  }

  onStopCall(_) {
    this.eventQueue.push(this.eventQueueElTest);
    console.log("received canvas-destroy-call");
    document.dispatchEvent(
      new CustomEvent('canvas-stop', { detail: { eventQueue: this.eventQueue } })
    );
    // Just testing if different instances are really saving different states
    // Once you go again to a tab and then stop it again, it will push an incremented
    // number into eventQueue
    this.eventQueueElTest++;
  }

  start() {
    document.addEventListener('canvas-stop-call', this.onStopCall);
    // document.addEventListener('keydown', (event) => {
    // on save logic (ctrl + s) goes here
    // it should extract each eventQueue and index them
    // to apply each one accordingly to it's correct tab and
    // get ready to render them once they're active
    //  ( for future typescript adding the canvasListener should
    //    keep both eventQueue, start and stop public. The
    //    renderCurrentState is not necessary because we
    //    can make it run by only populating the current active
    //    listener's eventQueue before starting it, then start it,
    //    then dispacth a new Event('render-call') inside the current
    //    rendered canvas ) -> [Maybe we dont need to rerender diff canvas
    //   only save state and associate with tags, then clear it and call
    //   a different listener state to be rendered in the very same element]
    // 
    // });
  }

  stop() {
    document.removeEventListener('canvas-stop-call', this.onStopCall);
  }
}