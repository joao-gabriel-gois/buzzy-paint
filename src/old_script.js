(() => {
  // state
  let tabs = [{ active: true },  { active: false }];
  // private
  let main;
  let button;
  
  document.addEventListener('dblclick', alternateTab);
  
  document.addEventListener('DOMContentLoaded', () => {
    assignTabs(tabs);
    main = document.getElementById('draw-area');
    renderTabs(tabs);
    button = document.querySelector('button');
    button.addEventListener('click', assignNewTab);
  })

  function alternateTab() {
    console.log('alternate tab!')
    const newActiveTab = Number(prompt('Which tab you want to activate?'));
    if (isNaN(newActiveTab) || newActiveTab > tabs.length - 1) {
      alert("INVALID INDEX MOTHERFUCKER!");
      return;
    }
    tabs = tabs.map(tab => ({...tab, active: false}));
    tabs[newActiveTab] = {...tabs[newActiveTab], active: true};
    renderTabs(tabs);
  }

  function assignTabs(tabs) {
    tabs.forEach((status, i) => {
      tabs[i] = Object.assign(status, { elements: createTab(i)});
    });
  }

  // private
  function createTab(index) {
    const menu = document.createElement('aside');
    const options = document.createElement('aside');
    const canvas = document.createElement('canvas');
    menu.classList.add('tools');
    options.classList.add('options');
    canvas.id = `draw-${index}`;
    return { menu, canvas, options };
  }

  function assignNewTab() {
    button.removeEventListener('click', assignNewTab);
    document.removeEventListener('dblclick', alternateTab);
    tabs = tabs.map(tab => ({...tab, active: false}));
    const elements = createTab(tabs.length);
    elements.menu.style.backgroundColor = getRandomRGB();
    elements.canvas.style.backgroundColor = getRandomRGB();
    elements.options.style.backgroundColor = getRandomRGB();
    console.log("created with index", tabs.length);
    tabs[tabs.length] = {
      active: true,
      elements,
    }
    renderTabs(tabs);
    button.addEventListener('click', assignNewTab);
    document.addEventListener('dblclick', alternateTab);
  }

  function renderTabs(tabs) {
    if (!main) return;
    main.innerHTML = '';
    tabs.forEach((tab, i) => {
      if (tab.active) {
        main.appendChild(tab.elements.menu);
        main.appendChild(tab.elements.canvas);
        main.appendChild(tab.elements.options);
      }
    })
  }

  function getRandomRGB() {
    const randColor = () => Math.ceil(Math.random() * 255);
    return `rgb(${randColor()}, ${randColor()}, ${randColor()})`;
  }
})()