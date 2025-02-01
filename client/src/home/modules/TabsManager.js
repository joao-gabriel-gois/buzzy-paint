import {
  addCSSClass,
  removeCSSClass
} from '../../utils/cssUtils.js'
import { CanvasEventListener } from "./CanvasEventListener.js";
import { storage as strg } from '../../shared/global.js';
import { handleTabsDataSaving } from '../../shared/api.js';
import { createAndRenderAlert, createAndRenderPrompt } from '../../shared/alerts.js';

export class TabsManager {
  constructor(
    canvasWrapperReference,
    canvasReference,
    tabsWrapperReference,
    newTabBtn,
    tabsStorageKey,
    apiSave = handleTabsDataSaving,
    storage = strg,
    renderPromptDialog = createAndRenderPrompt,
    renderAlertDialog = createAndRenderAlert
  ) {
    this.canvasWrapper = document.querySelector(canvasWrapperReference);
    this.canvasReference = canvasReference;
    this.tabsWrapper = document.querySelector(tabsWrapperReference);
    this.newTabBtn = document.querySelector(newTabBtn);
    this.renderPromptDialog = renderPromptDialog;
    this.renderAlertDialog = renderAlertDialog;
       
    this.getStorageTabsData = () => storage.getItem(tabsStorageKey);
    this.setStorageTabsData = (data) => storage.setItem(tabsStorageKey, data);
    
    const storageTabsData = this.getStorageTabsData();
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

    this.wheelCount = 0;

    this.assignNewTab = this.assignNewTab.bind(this);
    this.alternateTab = this.alternateTab.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onExportCall = this.onExportCall.bind(this);
    this.onImportCall = this.onImportCall.bind(this);
    this.onDownloadCall = this.onDownloadCall.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
  }
  
  assignTabs() {
    if (this.tabsData.length === 0) {
      const blankTab = {
        tabButton: this.createTabButton(0),
        canvasListener: new CanvasEventListener(this.canvasReference)
      };

      this.tabs.push(blankTab);
      this.tabsWrapper.appendChild(
        blankTab.tabButton,
      );
      this.activateAndRenderTab(0);
      return;
    }
    
    for (let i = 0; i < this.tabsData.length; i++) {
      const {
        eventQueue,
        undoStack,
        tabName
      } = this.tabsData[i];

      const tabButton = this.createTabButton(i, tabName);

      this.tabs[i] = {
        tabButton,
        canvasListener: new CanvasEventListener(
          this.canvasReference,
          {
            eventQueue,
            undoStack
          }
        )
      };
      this.tabsWrapper.appendChild(
        this.tabs[i].tabButton,
      );
      if (i === this.activeIndex) {
        this.activateAndRenderTab(i);
      }
    };
  }

  alternateTab(event) {
    let tabIndex;
    if (event instanceof Event) {
      tabIndex = this.tabs.findIndex(tab => tab.tabButton === event.target);
    }
    else {
      tabIndex = Number(event);
    }
    if (
      isNaN(tabIndex) || tabIndex > this.tabs.length - 1
    ) throw new Error('The Element reference is either NaN or does not relate to the current tabs state!');
    else if (tabIndex === this.activeIndex) return;

    this.deactivateTab(this.activeIndex);
    this.activateAndRenderTab(tabIndex);
  }

  createTabButton(index, tabName) {
    const canvasTabButton = document.createElement('button');
    const closeTabButton = createCloseTabButton();
    canvasTabButton.innerText = tabName ? tabName : `Tab ${index + 1}`;
    closeTab = closeTab.bind(this);
    canvasTabButton.addEventListener('click', (e) => {
      if (e.target.id !== closeTabButton.id)
        this.alternateTab(e);
      else
        closeTab(e);
    });
    canvasTabButton.addEventListener('dblclick', changeTabName);
    canvasTabButton.append(closeTabButton);

    return canvasTabButton;

    // closure event handlers
    function closeTab(event) {
      const index = this.getCurrentTargetIndex(event);
      event.preventDefault();
      const lastIndex = this.tabs.length - 1;
      const realPreviousTab = this.previousActiveIndex;

      if (this.activeIndex === index) {
        if (index === lastIndex)
          this.alternateTab(index - 1);
        else
          this.alternateTab(index + 1);
        this.previousActiveIndex = realPreviousTab;
      }
      if (
        this.previousActiveIndex === index
          || this.previousActiveIndex == this.activeIndex
      ) this.previousActiveIndex = -1;

      if (this.activeIndex > index)
        this.activeIndex--;
      if (this.previousActiveIndex > index)
        this.previousActiveIndex--;

      // freeing memory of the closing tab canvasListener's instance
      delete this.tabs[index].canvasListener;
      this.tabs = [
        ...this.tabs.slice(0, index),
        ...this.tabs.slice(index + 1, this.tabs.length)
      ];

      canvasTabButton.remove();
    }

    function createCloseTabButton() {
      const closeTabButton = document.createElement('button');
      closeTabButton.innerText = 'x';
      closeTabButton.id = 'tab-close-btn';
      addCSSClass(canvasTabButton, 'tab');
      return closeTabButton;
    }

    function changeTabName(event) {
      const { target: currentTabEl } = event;

      let oldText = currentTabEl.innerText;
      oldText = oldText.slice(0, oldText.length - 1);
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
            currentTabEl.append(createCloseTabButton());
          }
          document.removeEventListener('click', checkOutsideClick);
        }

        function handleInputChange(changeEvent) {
          if (!isEscPressed) {
            currentTabEl.innerText = changeEvent.target.value;
            currentTabEl.append(createCloseTabButton());
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
            currentTabEl.append(createCloseTabButton());
          }
          document.removeEventListener('click', checkOutsideClick);
        }
      }
    }
  }

  getCurrentTargetIndex(event) {
    return this.tabs.findIndex(
      t => t.tabButton === event.currentTarget
    );
  }

  assignNewTab(data = {
      eventQueue: [],
      undoStack: []
    },
    tabName = null
  ) {
    if (data instanceof Event) {
      data.preventDefault();
      data = {
        eventQueue: [],
        undoStack: []
      }
    }
    this.deactivateTab(this.activeIndex);

    const newTabIndex = this.tabs.length;
    const tabButton = this.createTabButton(newTabIndex, tabName);
    
    this.tabsWrapper.appendChild(tabButton);
    
    this.tabs[newTabIndex] = {
      tabButton,
      canvasListener: new CanvasEventListener(this.canvasReference, data)
    }
    this.activateAndRenderTab(newTabIndex);
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
      this.tabsWrapper.children[index],
      'active'
    );

    this.tabs[index]
      .tabButton
      .scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'center',
        });

    this.tabs[index]
      .canvasListener
      .canvas
      .dispatchEvent(
        new Event('render-call')
      );
  }

  async saveTabsData() {
    const data = this.getCurrentTabsDataState();

    this.setStorageTabsData(data);
    try {
      await this.apiSave(data);
    }
    catch (error) {
      console.error('It was not possible to save your tabs! Fatal Error status:', error);
      this.renderAlertDialog({
        type: 'error',
        title: 'Not Saved!',
        message: 'It was not possible to save your tabs! Could not connect to server.'
      });
    }
  }

  getCurrentTabsDataState() {
    this.tabsData = this.tabs.map(tab => {
      const rawTabName = tab.tabButton.innerText;
      const tabName = rawTabName.slice(0, rawTabName.length - 1);
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

    return { 
      draws: this.tabsData,
      activeIndex: this.activeIndex
    };
  }

  onKeyDown(event) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveTabsData();
    }
  } 

  onExportCall(_) {
    const data = this.getCurrentTabsDataState();
    this.renderPromptDialog({
      type: 'info',
      title: 'Exporting as JSON',
      message: 'Choose a filename to export the drawing from this tab as JSON: '
    }).then(filename => {
      if (!filename) return;
      downloadObjectAsJson(
        data.draws[data.activeIndex],
        filename.text
      );
    });
 
    function downloadObjectAsJson(exportObj, exportName){
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
      const downloadHiddenAnchor = document.createElement('a');
      downloadHiddenAnchor.setAttribute("href", dataStr);
      downloadHiddenAnchor.setAttribute("download", exportName + ".json");
      downloadHiddenAnchor.style.display = 'none';
      downloadHiddenAnchor.click();
      downloadHiddenAnchor.remove();
    }
  }
  
  onImportCall(event) {
    const { filename, data } = event.detail;
    this.assignNewTab(data, filename);
  }

  onDownloadCall(event) {
    const currentCavansListener = this.tabs[this.activeIndex].canvasListener;
    const { isPng, filename } = event.detail;
    const ext = `image/${isPng ? 'png' : 'jpeg'}`;
    // not transparent case needs to apply the paintBg callback
    currentCavansListener.renderCurrentState(!isPng && currentCavansListener.paintBackground);
    const image = currentCavansListener
      .canvas
      .toDataURL(ext)
      .replace(ext, "image/octet-stream");
    const downloadHiddenAnchor = document.createElement('a');
    downloadHiddenAnchor.setAttribute("href", image);
    downloadHiddenAnchor.setAttribute("download", filename + `.${isPng ? 'png' : 'jpg'}`);
    downloadHiddenAnchor.style.display = 'none';
    downloadHiddenAnchor.click();
    downloadHiddenAnchor.remove();
  }
  
  onMouseWheel(event) {
    event.preventDefault();
    this.wheelCount++;   
    // dreceasing wheel sensitiveness;
    if (this.wheelCount % 2 === 0) return;
    // neves uses more than 2 bytes (if it would an actual integer 16)
    if (this.wheelCount === 0XFFFF) this.whellCount = 1;
    
    const {
      wheelDelta,
    } = event;
    const next = this.activeIndex + 1;
    const prev = this.activeIndex - 1;
    if (wheelDelta > 0 && next < this.tabs.length)
      this.alternateTab(this.activeIndex + 1)
    else if (wheelDelta < 0 && prev >= 0)
      this.alternateTab(this.activeIndex - 1)
  }

  init() {
    this.assignTabs();
    this.newTabBtn.addEventListener('click', this.assignNewTab);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('import-call', this.onImportCall);
    document.addEventListener('download-call', this.onDownloadCall);
    this.tabsWrapper.addEventListener('mousewheel', this.onMouseWheel);
  }

  stop() {
    this.newTabBtn.removeEventListener('click', this.assignNewTab);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('import-call', this.onImportCall);
    document.removeEventListener('download-call', this.onDownloadCall);
    this.tabsWrapper.removeEventListener('mousewheel', this.onMouseWheel);
  }
}
