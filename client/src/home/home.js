import { router } from "../shared/router.js";
import { TabsManager  } from "./modules/TabsManager.js";
import { ToolbarClickListener } from './modules/ToolbarClickListener.js';

import { Drawer } from './modules/canvas-tools-handlers/DrawerEventHandler.js';
import { Liner } from './modules/canvas-tools-handlers/LinerEventHandler.js';
import { Writter } from './modules/canvas-tools-handlers/WritterEventHandler.js';
import { Zoomer } from './modules/canvas-tools-handlers/ZoomerEventHandler.js';
import { Eraser } from './modules/canvas-tools-handlers/EraserEventHandler.js';
import { getDataFromURLHash } from "../shared/global.js";

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
    
    const writter = new Writter({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#text-options',
    });
    
    const zoomer = new Zoomer({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#zoom-options',
    });
    
    const eraser = new Eraser({
      canvas: '#canvas-wrapper canvas',
      styleSwitcher: '#eraser-options',
    });

    toolbarClickListener.subscribe(drawer);
    toolbarClickListener.subscribe(liner);
    toolbarClickListener.subscribe(writter);
    toolbarClickListener.subscribe(zoomer);
    toolbarClickListener.subscribe(eraser);

    toolbarClickListener.init();

    const tabsManager =  new TabsManager(
      '#canvas-wrapper',
      'canvas',
      '#tab-buttons-wrapper',
      `${user_id}@tabsData`
    );

    tabsManager.init();
    document.querySelector('header nav ul li')
      .addEventListener('click', (e) => {
        e.preventDefault();
        tabsManager.saveTabsData();
      })
    document.querySelector('header nav button')
      .addEventListener('click', (e) => {
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
    const aside = document.getElementById('options');
    const listItems = aside.querySelectorAll('ul > li');
    let hasActiveTab = false;
  
    listItems.forEach((li) => {
      if (li.classList.contains('tabnav-active')) {
        hasActiveTab = true;
      }
    });
  
    if (hasActiveTab) {
      aside.style.backgroundColor = 'rgba(71, 61, 139, 0.25)'; 
    } else {
      aside.style.backgroundColor = 'transparent';
    }
  }
}
