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
    tabWrapperReference,
    tabsStorageKey,
    apiSave = handleTabsDataSaving,
    storage = strg,
    renderPromptDialog = createAndRenderPrompt,
    renderAlertDialog = createAndRenderAlert
  ) {
    this.canvasWrapper = document.querySelector(canvasWrapperReference);
    this.canvasReference = canvasReference;
    this.tabButtonsWrapper = document.querySelector(tabWrapperReference);
    this.newTabBtn = this.tabButtonsWrapper.children[
      this.tabButtonsWrapper.children.length - 1
    ];
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

    this.assignNewTab = this.assignNewTab.bind(this);
    this.alternateTab = this.alternateTab.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.onExportCall = this.onExportCall.bind(this);
    this.onImportCall = this.onImportCall.bind(this);
    this.onDownloadCall = this.onDownloadCall.bind(this);
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
      this.tabButtonsWrapper.insertBefore(
        this.tabs[i].tabButton,
        this.newTabBtn
      );
      if (i === this.activeIndex) {
        this.activateAndRenderTab(i);
      }
    };
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

  createTabButton(index, tabName) {
    const canvasTabButton = document.createElement('button');
    canvasTabButton.id = `tab-${index}`;
    addCSSClass(canvasTabButton, 'tab');
    canvasTabButton.innerText = tabName ? tabName : `Tab ${index + 1}`;
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
    
    this.tabButtonsWrapper.insertBefore(tabButton, this.newTabBtn);
    
    this.tabs[newTabIndex] = {
      tabButton,
      canvasListener: new CanvasEventListener(this.canvasReference, data)
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
    currentCavansListener.renderCurrentState(!isPng && currentCavansListener.paintBackground);
    // not transparent case needs to appl paintBg callback
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
  
  
  init() {
    this.assignTabs();
    this.newTabBtn.addEventListener('click', this.assignNewTab);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('import-call', this.onImportCall);
    document.addEventListener('download-call', this.onDownloadCall);
  }

  stop() {
    this.newTabBtn.removeEventListener('click', this.assignNewTab);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('import-call', this.onImportCall);
    document.removeEventListener('download-call', this.onDownloadCall);
  }
}
