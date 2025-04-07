import { router } from "../shared/router.js";
import { TabsManager  } from "./modules/TabsManager.js";
import { ToolbarClickListener } from './modules/ToolbarClickListener.js';

import { Drawer } from './modules/canvas-tools-handlers/DrawerEventHandler.js';
import { Liner } from './modules/canvas-tools-handlers/LinerEventHandler.js';
import { Polygoner } from './modules/canvas-tools-handlers/PolygonEventHandler.js';
import { Writter } from './modules/canvas-tools-handlers/WritterEventHandler.js';
import { Zoomer } from './modules/canvas-tools-handlers/ZoomerEventHandler.js';
import { Eraser } from './modules/canvas-tools-handlers/EraserEventHandler.js';
import { Rectangler } from './modules/canvas-tools-handlers/RectangleEventHandler.js';
import { getDataFromURLHash } from "../shared/global.js";
import { addJSONImportEvent } from "../utils/addJSONImportEvent.js";
import { handleImageDownload } from "../utils/handleImageDownload.js";
import { Ellipser } from "./modules/canvas-tools-handlers/EllipseEventHandler.js";
import { CropperAndMover } from "./modules/canvas-tools-handlers/CropAndMoveEventHandler.js";

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const user_id = getDataFromURLHash();
    if (!user_id) {
      console.error('Something went hugely wrong!');
      return router('/logout');
    }

    const toolbarClickListener = new ToolbarClickListener(
      '#tools ul',
      '#options ul'
    );

    const drawer = new Drawer({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#draw-options',
    });
    
    const liner = new Liner({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#line-options',
    });

    const polygoner = new Polygoner({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#polygon-line-options',
    });
    
    const writter = new Writter({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#text-options',
    });

    const cropTransformer = new CropperAndMover({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#crop-transform-and-move-options',
    });
    
    const zoomer = new Zoomer({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#zoom-options',
    });
    
    const eraser = new Eraser({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#eraser-options',
    });

    const rectangler = new Rectangler({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#rectangle-options',
      checkBoxReactiveContainers: ['rectStroke', 'rectFill']
    });

    const ellipser = new Ellipser({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#ellipse-options',
      checkBoxReactiveContainers: ['ellipseStroke', 'ellipseFill']
    });

    toolbarClickListener.subscribe(drawer);
    toolbarClickListener.subscribe(liner);
    toolbarClickListener.subscribe(polygoner);
    toolbarClickListener.subscribe(rectangler);
    toolbarClickListener.subscribe(ellipser);
    toolbarClickListener.subscribe(eraser);
    toolbarClickListener.subscribe(cropTransformer);
    toolbarClickListener.subscribe(writter);
    toolbarClickListener.subscribe(zoomer);
    toolbarClickListener.init();
    
    const tabsManager =  new TabsManager(
      '#canvas-wrapper',
      'canvas',
      '#tabs-wrapper',
      '#add-tab',
      `${user_id}@tabsData`
    );
    
    tabsManager.init();
    
    const [
      saveItem,
      importItem,
      exportItem,
      downloadItem
    ] = document.querySelectorAll('header nav ul li');
    const fileInput = importItem.firstElementChild;

    saveItem.addEventListener('click', (e) => tabsManager.saveTabsData());
    addJSONImportEvent(fileInput); 
    exportItem.addEventListener('click', (e) => tabsManager.onExportCall()); 
    downloadItem.addEventListener('click', (e) => handleImageDownload()); 
    
    const logoutButton = document.querySelector('header nav button');
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      router('/logout');
    });
    
    startInputOptionsReactiveBackground();
  });

  // async function addCorrectLanguageToText(reference) {
  //   const elements = documnt.querySelector(reference).children;
  //   const content = await getLocaleContent();
  //   if (!(elements && content)) throw new Error('Not possible to get Elements to add Text');
    
  //   // Implement content based on locale
  // }
})();

function startInputOptionsReactiveBackground() {
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        bgColorReactionForActiveItens();
      }
    }
  });
  const targetNode = document.querySelector('#options > ul');
  observer.observe(targetNode, { attributes: true, childList: true, subtree: true });
  
  bgColorReactionForActiveItens();

  function bgColorReactionForActiveItens() {
    const ul = document.getElementById('options').firstElementChild;
    const listItems = ul.querySelectorAll('li');
    let hasActiveTab = false;
  
    listItems.forEach((li) => {
      if (li.classList.contains('tabnav-active')) {
        hasActiveTab = true;
      }
    });
  
    if (hasActiveTab) {
      ul.style.backgroundColor = '#A37CD189'; 
      ul.style.borderWidth = '5px 3px 1px 1px';
      ul.style.borderColor = "#352B71";
      ul.style.borderStyle = "solid";
      // ul.style.borderBottom = '4px #201946 solid';
      // ul.style.borderLeft = '3px #201946 solid';
      ul.style.borderRadius = '5px';
    } else {
      ul.style.backgroundColor = 'transparent';
      ul.style.border = 'none';
    }
  }
}
