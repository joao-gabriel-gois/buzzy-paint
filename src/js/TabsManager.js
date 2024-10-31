// import { DummyCanvasEventListener } from "./dummy-canvas-list.js";
import {
  addCSSClass,
  removeCSSClass
} from './utils/cssUtils.js'
import { CanvasEventListener } from "./CanvasEventListener.js";

export class TabsManager {
  constructor(canvasWrapperReference, canvasReference, tabWrapperReference) {
    this.canvasWrapper = document.querySelector(canvasWrapperReference);
    this.canvasReference = canvasReference;
    this.tabButtonsWrapper = document.querySelector(tabWrapperReference);
    this.newTabBtn = this.tabButtonsWrapper.children[
      this.tabButtonsWrapper.children.length - 1
    ];

    this.tabs = [{ active: true }];

    this.assignNewTab = this.assignNewTab.bind(this);
    this.alternateTab = this.alternateTab.bind(this);
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
        tabButton: this.createTabButton(i),
        canvasListener: new CanvasEventListener(this.canvasReference) //dependency injection to be refatored
      };
      if (tab.active) {
        this.tabButtonsWrapper.insertBefore(
          this.tabs[i].tabButton,
          this.newTabBtn
        );
        this.activateAndRenderTab(i);
      }
    });
    // return;
    // }
    // Assigning Fetch dada with logic bellow (else):
  }

  alternateTab(event) {
    const tabIndex = Number(event.target.id.split('-')[1]);
    if (
      isNaN(tabIndex) || tabIndex > this.tabs.length - 1
    ) throw new Error('The Element reference is either NaN or does not relate to the current saved state!');
    else if (tabIndex === this.getActiveIndex()) return;

    this.deactivateTab(this.getActiveIndex());
    this.activateAndRenderTab(tabIndex);
  }

  createTabButton(index) {
    const canvasTabButton = document.createElement('button');
    canvasTabButton.id = `tab-${index}`;
    addCSSClass(canvasTabButton, 'tab');
    canvasTabButton.innerText = `Tab ${index + 1}`;
    canvasTabButton.addEventListener('click', this.alternateTab);
    canvasTabButton.addEventListener('dblclick', changeTabName);

    return canvasTabButton;
    
    function changeTabName(event) {
      const { target: currentTabEl } = event;

      const oldText = currentTabEl.innerText;
      const inputParentWidth = parseInt(getComputedStyle(currentTabEl).width);
      const inputParentPaddingR = parseInt(getComputedStyle(currentTabEl).paddingRight);

      currentTabEl.innerHTML = `<input id="tab-text-changing" placeholder="${oldText}"></input>`;
      currentTabEl.firstChild.style.minWidth = `${
        // 2.4 was the found magic number to avoid input width
        //  to get bigger than previous tab+textNode width
        inputParentWidth - inputParentPaddingR * 2.4 
      }px`;
      currentTabEl.firstChild.focus();
      
      // scoped event handlers bellow
      {
        document.addEventListener('click', checkOutsideClick);

        let isEscPressed = false;
        currentTabEl.firstChild.addEventListener('keydown', cancelTabNameChange);
        currentTabEl.firstChild.addEventListener('change', handleInputChange);
        
        function checkOutsideClick(clickEvent) {
          if (clickEvent.currentTarget !== document.activeElement) {
            currentTabEl.innerText = oldText;
          }
          document.removeEventListener('click', checkOutsideClick);
        }

        function handleInputChange(changeEvent) {
          if (!isEscPressed) {
            currentTabEl.innerText = changeEvent.target.value;
          }
          document.removeEventListener('click', checkOutsideClick);
        }
    
        function cancelTabNameChange(keyEvent) {
          // avoiding space to trigger checked (and therefore, click event)
          if (keyEvent.key === ' ') 
            keyEvent.target.checked = !keyEvent.target.checked;
          if (keyEvent.key === 'Escape') {
            isEscPressed = true;
            currentTabEl.innerText = oldText;
          }
          document.removeEventListener('click', checkOutsideClick);
        }
      }
    }
  }

  assignNewTab() {
    const previousTabIndex = this.getActiveIndex();
    this.deactivateTab(previousTabIndex);
    
    const newTabIndex = this.tabs.length;
    const tabButton = this.createTabButton(newTabIndex);
    this.tabButtonsWrapper.insertBefore(tabButton, this.newTabBtn);
    
    this.tabs[newTabIndex] = {
      active: false,
      tabButton,
      canvasListener: new CanvasEventListener(this.canvasReference)
    }
    this.activateAndRenderTab(newTabIndex);
    
    this.newTabBtn.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    // console.log(
    //   "Tab created. Current Number of instances: ",
    //   CanvasEventListener.getNumberOfInstances()
    // );
    // console.log('\n');
  }
  
  deactivateTab(index) {
    const {
      canvasListener: previousCanvasListener,
      tabButton: previousTabButton
    } = this.tabs[index];

    this.tabs[index].active = false;
    previousCanvasListener.stop();
    removeCSSClass(previousTabButton, 'active');
    // console.log("Deactivating Tab", index + 1);
  }

  activateAndRenderTab(index) {
    this.tabs[index].active = true;
    this.tabs[index].canvasListener.start();  
    addCSSClass(
      this.tabButtonsWrapper.children[index],
      'active'
    );

    this.tabs[index]
      .canvasListener
      .canvas
      .dispatchEvent(
        new Event('render-call')
      );
    // console.log("Activating Tab", index + 1);
  }
  
  init() {
    this.assignTabs();
    this.newTabBtn.addEventListener('click', this.assignNewTab);
  }
}
