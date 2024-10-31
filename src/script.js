import { TabsManager  } from "./js/TabsManager.js";
import { ToolbarClickListener } from './js/ToolbarClickListener.js';

import { Drawer } from './js/canvas-tools-handlers/DrawerEventHandler.js';
import { Liner } from './js/canvas-tools-handlers/LinerEventHandler.js';
import { Writter } from './js/canvas-tools-handlers/WritterEventHandler.js';
import { Zoomer } from './js/canvas-tools-handlers/ZoomerEventHandler.js';
import { Eraser } from './js/canvas-tools-handlers/EraserEventHandler.js';


document.addEventListener('DOMContentLoaded', () => {
  // addCorrectLanguageToText('#options ul');
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
  );

  tabsManager.init();
});

// async function addCorrectLanguageToText(reference) {
//   const elements = documnt.querySelector(reference).children;
//   const content = await getLocaleContent();
//   if (!(elements && content)) throw new Error('Not possible to get Elements to add Text');
  
//   // Implement content based on locale
// }