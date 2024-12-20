import {
  hasCSSClass,
  addCSSClass,
  removeCSSClass
} from '../../utils/cssUtils.js'

export class ToolbarClickListener {
  constructor(menuReference, optiosnReference) {
    this.menu = [...document.querySelector(menuReference).children];
    this.options = optiosnReference && [...document.querySelector(optiosnReference).children];

    this.subscribers = [];

    this.subscribe = (subscriber) => this.subscribers.push(subscriber);
    this.unsubscribe = (currentSubcriber) => {
      const index = this.subscribers.findIndex(subscriber => subscriber === currentSubcriber);
      this.clearAllSelectedMenuItems();
      this.menu[index].removeEventListener('click', this.handleMenuItemClick);
      this.subscribers.pop(index);
    }

    // bindings
    // this.clearAllSelectedMenuItems = this.clearAllSelectedMenuItems.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    // this.activateMenuItem = this.activateMenuItem.bind(this);
    this.init = this.init.bind(this);
  }

  notify(index, command = 'start') {
    this.subscribers[index][command]();
  }

  clearAllSelectedMenuItems() {
    this.menu.forEach((menuItem, index) => {
      if (hasCSSClass(menuItem, 'active')) {
        removeCSSClass(menuItem,'active');
        removeCSSClass(this.options[index], 'tabnav-active');
        this.notify(index, 'stop');
      }
    });
  }

  activateMenuItem(index) {
    this.notify(index);
    if (this.options) {
      addCSSClass(this.menu[index], 'active');
      addCSSClass(this.options[index], 'tabnav-active');
    }
  }

  handleMenuItemClick(event) {
    const currentMenuItemIndex = this.menu.findIndex(menu => menu === event.currentTarget);
    const hasClickedInSelectedOne = hasCSSClass(this.menu[currentMenuItemIndex], 'active');
    
    this.clearAllSelectedMenuItems();

    if (hasClickedInSelectedOne) return;

    this.activateMenuItem(currentMenuItemIndex);
  }

  init() {
    const isNumberOfMenuItemsEqToSubscribers = this.subscribers.length === this.menu.length;
    
    if (isNumberOfMenuItemsEqToSubscribers) {
      this.menu.forEach(menuItem => menuItem.addEventListener('click', this.handleMenuItemClick));
    }
    else {
      console.error(
        'Toolbar Listener was initialized with different number of subscribed functions',
        ', from menu items and tabs.', '\nYour menu and tab element must have the exact same',
        'number of childs (<your-menu>.children.length) and subscribed observers.'
      );
      throw new Error('Number of subscribers must be equal to both Menu and Tab childs')
    }
  }
}

