import { DummyCanvasEventListener } from "./dummy-canvas-list.js";
// import { CanvasEventListener } from "./CanvasEventListener.js";

export class TabsManager {
  constructor(canvasWrapperReference, tabWrapperReference, addTabButtonReference) {
    this.canvasWrapper = document.querySelector(canvasWrapperReference);
    this.tabButtonsWrapper = document.querySelector(tabWrapperReference);
    this.newTabBtn = document.querySelector(addTabButtonReference);
    this.tabs = [{ active: true }];

    this.assignNewTab = this.assignNewTab.bind(this);
    this.alternateTab = this.alternateTab.bind(this);
    this.handleCanvasSwitch = this.handleCanvasSwitch.bind(this);

    this.previousTabIndex = 0;
  }

  getActiveIndex() {
    return this.tabs.findIndex(tab => tab.active);
  }
  
  assignTabs() {
    // if there tabs with saved status, it should be able to assign them correctly
    // with something like this:
    // const fetchedTabs = await (await fetch('/tabs/).then(r => r));
    // if (!fetched tabs) { // if none, create them
    this.tabs.forEach((tab, i) => {
      this.tabs[i] = {
        ...tab,
        elements: this.createTab(i),
        eventQueue: [],
        canvasListener: new DummyCanvasEventListener(`draw-${i}`) //dependency injection to be refatored
      };
      if (tab.active) {
        this.tabs[i].canvasListener.start();
        this.tabButtonsWrapper.insertBefore(
          this.tabs[i].elements.canvasTabButton,
          this.newTabBtn
        );
      }
    });
    // return;
    // }
    // Assigning Fetch dada with logic bellow (else):
  }

  alternateTab(event) {
    const tabIndex = Number(event.target.id.split('-')[1]);
    // const tabIndex = Number(prompt('Which tab you want to activate?'));
    if (isNaN(tabIndex) || tabIndex > this.tabs.length - 1 || tabIndex === this.getActiveIndex()) {
      return;
    }
    this.previousTabIndex = this.getActiveIndex();
    console.log("(FROM) previous active tab:", this.previousTabIndex);
    
    this.tabs = this.tabs.map(tab => ({...tab, active: false}));
    this.tabs[tabIndex] = {...this.tabs[tabIndex], active: true};
    
    document.dispatchEvent(new Event('canvas-stop-call'));
    console.log("(TO) current active tab now is:", this.getActiveIndex());
    console.log("\tEVENT CHAIN END\n\n\n");
  }

  createTab(index) {
    const canvas = document.createElement('canvas');
    const canvasTabButton = document.createElement('button');
    canvas.id = `draw-${index}`;
    canvasTabButton.id = `tab-${index}`;
    canvasTabButton.classList.add('tab');
    canvasTabButton.innerText = `Tab ${index + 1}`;
    canvasTabButton.addEventListener('click', this.alternateTab);
    canvasTabButton.addEventListener('dblclick', changeTabName);
    
    function changeTabName(event) {
      const getPxValue = (pxString) => Number(pxString.slice(0, pxString.length - 2));
      const { target: currentTabEl } = event;

      const oldText = currentTabEl.innerText;
      const inputParentWidth = getPxValue(getComputedStyle(currentTabEl).width);
      const inputParentPaddingR = getPxValue(getComputedStyle(currentTabEl).paddingRight);

      currentTabEl.innerHTML = `<input id="tab-text-changing" placeholder="${oldText}"></input>`;
      currentTabEl.firstChild.style.minWidth = `${
        inputParentWidth - inputParentPaddingR * 2.4
      }px`;
      currentTabEl.firstChild.focus();
      
      let isEscPressed = false;
      currentTabEl.firstChild.addEventListener('keydown', cancelTabNameChange);
      
      currentTabEl.firstChild.addEventListener('change', (sndEvent) => {
        if (!isEscPressed)
          currentTabEl.innerText = sndEvent.target.value;
        currentTabEl.firstChild.removeEventListener('keydown', cancelTabNameChange);
      });

      function cancelTabNameChange(keyEvent) {
        if (keyEvent.key === 'Escape') {
          isEscPressed = true;
          currentTabEl.innerText = oldText;
        }
      }
    }

    return { canvas, canvasTabButton };
  }

  assignNewTab() {
    // removing and adding (comment on bottom of this method) events were only
    // necessary when the events function had arguments other than 'event'
    // this.newTabBtn.removeEventListener('click', this.assignNewTab);
    // document.removeEventListener('dblclick', this.alternateTab);
    const nextIndex = this.tabs.length;
    this.previousTabIndex = this.getActiveIndex();
    console.log("(FROM) previous active tab:", this.previousTabIndex);
    const elements = this.createTab(nextIndex);
    const c = getRandomRGB()
    elements.canvas.style.backgroundColor = c;
    // elements.canvasTabButton.style.backgroundColor = c;
    console.log("created with index", nextIndex);

    this.tabs = this.tabs.map(tab => ({...tab, active: false}));
    this.tabs[nextIndex] = {
      active: true,
      elements,
      eventQueue: [],
      canvasListener: new DummyCanvasEventListener(`draw-${nextIndex}`)
    }
    // this.renderActiveTab();

    this.tabButtonsWrapper.insertBefore(elements.canvasTabButton, this.newTabBtn);
    this.newTabBtn.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });

    document.dispatchEvent(
      new Event('canvas-stop-call')
    );
    console.log("(TO NEW TAB) current active tab now is:", this.getActiveIndex());
    console.log("\tEVENT CHAIN END\n\n\n");
    // this.newTabBtn.addEventListener('click', this.assignNewTab);
    // document.addEventListener('dblclick', this.alternateTab);
  }

  renderActiveTab() {
    if (!this.canvasWrapper) return;
    const previousCanvas = this.canvasWrapper.querySelector('canvas');
    if (previousCanvas) previousCanvas.remove();
    const i = this.getActiveIndex();

    const { elements } = this.tabs[i];
    
    this.canvasWrapper.appendChild(elements.canvas);
    // console.log("RENDERING,",this.tabButtonsWrapper.children[i]); //
    this.tabButtonsWrapper.children[i].classList.add('active');
  }

  handleCanvasSwitch(event) {
    console.log("Save Previous DISPATCHED:", event.detail);
    const { eventQueue } = event.detail;
    const i = this.getActiveIndex();

    if (!eventQueue || i < 0) {
      // canceling alternateTab / assignNewTab in case it was not possible to get an eventQueue from previous Canvas
      this.tabs = this.tabs.map(tab => ({...tab, active: false}));
      this.tabs[this.previousTabIndex] = {
        ...this.tabs[this.previousTabIndex],
        active: true
      };

      const tabsBtns = this.tabButtonsWrapper.children;
      tabsBtns[tabsBtns.length - 2].remove(); // last one is the add button, so we remove the one before it
      console.error(
        "Something went REALLY REALLY WRONG",
        "Either eventQueue doesn't exists or current index is < 0.",
        "\n\tCurrent EventQueue", eventQueue,
        "\n\tCurrent active index", i
      );

      throw new Error("Either the canvas you're attempting to activate doesn't have an eventQueue or its index wasn't found");
    }
    // In case it is success, alteranteTab / assignNewTab already updated the
    // current one so we only need to save previous eventQueue state before
    // destroy this canvas and render the current one
    this.tabs[this.previousTabIndex] = {
      ...this.tabs[this.previousTabIndex],
      eventQueue
    }
    const {
      canvasListener: previousCanvasListener,
      elements: previousElements
    } = this.tabs[this.previousTabIndex];


    previousCanvasListener.stop();
    previousElements
      .canvasTabButton
      .classList
      .remove('active');

    this.renderActiveTab();
    this.tabs[i].canvasListener.start();  
  }

  init() {
    this.assignTabs();
    this.renderActiveTab();
    this.newTabBtn.addEventListener('click', this.assignNewTab);
    // document.addEventListener('dblclick', this.alternateTab);
    document.addEventListener('canvas-stop', this.handleCanvasSwitch);
  }
}


// Testing utils
function getRandomRGB() {
  const randColor = () => Math.ceil(Math.random() * 255);
  return `rgb(${randColor()}, ${randColor()}, ${randColor()})`;
}