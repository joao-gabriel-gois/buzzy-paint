import { TabsManager  } from "./js/TabsManager.js";

const tabsManager =  new TabsManager('#canvas-wrapper', '#tab-buttons-wrapper', '#add-tab');

document.addEventListener('DOMContentLoaded', () => {
  tabsManager.init();
  console.log(tabsManager.tabs);
});
