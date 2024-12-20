import {
  addCSSClass,
  removeCSSClass
} from '../../utils/cssUtils.js'
import { CanvasEventListener } from "./CanvasEventListener.js";
import { storage as strg } from '../../shared/global.js';
import { handleTabsDataSaving } from '../../shared/api.js';
import { createAndRenderAlert } from '../../shared/alerts.js';

export class TabsManager {
  constructor(
    canvasWrapperReference,
    canvasReference,
    tabWrapperReference,
    tabsStorageKey,
    apiSave = handleTabsDataSaving,
    storage = strg,
  ) {
    this.canvasWrapper = document.querySelector(canvasWrapperReference);
    this.canvasReference = canvasReference;
    this.tabButtonsWrapper = document.querySelector(tabWrapperReference);
    this.newTabBtn = this.tabButtonsWrapper.children[
      this.tabButtonsWrapper.children.length - 1
    ];
    
    const storageTabsData = storage.getItem(tabsStorageKey);

    this.setStorageTabsData = (data) => storage.setItem(tabsStorageKey, data);
    const { 
      user_id,
      activeIndex,
      draws
    } = Object.keys(storageTabsData ?? {}).length > 1
          ? storageTabsData
          : {
              user_id: storageTabsData ? storageTabsData.user_id : null,
              activeIndex: 0,
              draws: [],
              timestamp: Date.now()
            };

    this.apiSave = apiSave;
    this.user_id = user_id || null;
    this.tabsData = draws || [];
    this.activeIndex = activeIndex;
    this.previousActiveIndex = -1;

    this.tabs = [];

    this.assignNewTab = this.assignNewTab.bind(this);
    this.alternateTab = this.alternateTab.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }
  
  assignTabs() {
    if (this.tabsData.length === 0) {
      const blankTab = {
        tabButton: this.createTabButton(0),
        canvasListener: new CanvasEventListener(this.canvasReference)
      };

      this.tabs.push(blankTab);
      this.tabButtonsWrapper.insertBefore(
        blankTab.tabButton,
        this.newTabBtn
      );
      this.activateAndRenderTab(0);
      return;
    }

    this.tabsData.forEach((tabData, i) => {
      const {
        eventQueue,
        undoStack,
        tabName
      } = tabData;

      const tabButton = this.createTabButton(i);
      tabButton.innerText = tabName;

      this.tabs[i] = {
        tabButton,
        canvasListener: new CanvasEventListener(
          this.canvasReference,
          eventQueue,
          undoStack
        )
      };
      this.tabButtonsWrapper.insertBefore(
        this.tabs[i].tabButton,
        this.newTabBtn
      );
      if (i === this.activeIndex) {
        this.activateAndRenderTab(i);
      }
    });
  }

  alternateTab(event) {
    const tabIndex = Number(event.target.id.split('-')[1]);
    if (
      isNaN(tabIndex) || tabIndex > this.tabs.length - 1
    ) throw new Error('The Element reference is either NaN or does not relate to the current saved state!');
    else if (tabIndex === this.activeIndex) return;

    this.deactivateTab(this.activeIndex);
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
    this.deactivateTab(this.activeIndex);
    
    const newTabIndex = this.tabs.length;
    const tabButton = this.createTabButton(newTabIndex);
    this.tabButtonsWrapper.insertBefore(tabButton, this.newTabBtn);
    
    this.tabs[newTabIndex] = {
      tabButton,
      canvasListener: new CanvasEventListener(this.canvasReference)
    }
    this.activateAndRenderTab(newTabIndex);
    
    this.newTabBtn.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
  
  deactivateTab(index) {
    if (index < 0) return;
    const {
      canvasListener: previousCanvasListener,
      tabButton: previousTabButton
    } = this.tabs[index];

    this.previousActiveIndex = index;
    previousCanvasListener.stop();
    removeCSSClass(previousTabButton, 'active');
  }

  activateAndRenderTab(index) {
    if (index < 0) return;
    this.activeIndex = index;
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
  }

  async saveTabsData() {
    this.tabsData = this.tabs.map(tab => {
      const tabName = tab.tabButton.innerText;
      const {
        eventQueue,
        undoStack
      } = tab.canvasListener;

      return {
        tabName,
        eventQueue,
        undoStack
      }
    });

    const data = { 
      draws: this.tabsData,
      activeIndex: this.activeIndex
    };

    this.setStorageTabsData(data);
    try {
      const response = await this.apiSave(data);
      if (response.status === 200 || response.status === 201) {
        createAndRenderAlert({
          type: 'success',
          title: 'Saved!',
          message: 'Your tabs were successfully saved!'
        });
      }
      else {
        console.error('It was not possible to save your tabs! Response status:', response.status);
        createAndRenderAlert({
          type: 'warning',
          title: 'Not Saved!',
          message: 'It was not possible to save your tabs!'
        });
      }
    }
    catch (error) {
      console.error('It was not possible to save your tabs! Fatal Error status:', error);
      createAndRenderAlert({
        type: 'error',
        title: 'Not Saved!',
        message: 'It was not possible to save your tabs! Could not connect to server.'
      });
    }
  }

  onKeyDown(event) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveTabsData();
    }
  } 
  
  init() {
    this.assignTabs();
    this.newTabBtn.addEventListener('click', this.assignNewTab);
    document.addEventListener('keydown', this.onKeyDown);
  }
}
