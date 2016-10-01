const {observable} = require("mobx");

const sumChildren = (children) =>
  children
    .map(node => node.values)
    .reduce((vals1, vals2) =>
      vals1.map((v,i) => (v || 0) + (vals2[i] || 0) ), [...Array(monthsWidth())].map(() => 0)
    )

const makeNewChild = (parent, parentClass, name, e) => {
  if(e) e.stopPropagation(); 
  if(parentClass==='category') {
    const node = {
      name: typeof name === 'string' ? name : 'ext',
      values:Array(monthsWidth())
    }
    parent.extendeds.push(node); 
    return node
  }
  if(parentClass==='section') {
    const node = {
      name: typeof name === 'string' ? name : 'cat',
      open: true,
      values:function() { /*console.log('CATN', this);*/ return sumChildren(this.extendeds) },
      extendeds: []
    } 
    parent.categories.push(node);
    return node
  }
  if(parentClass==='root') {
    const node = {
      name: typeof name === 'string' ? name : 'sec',
      open: true,
      values: function() { console.log('ZZ'); return  sumChildren(this.categories) },
      categories: []
    }
    parent.sections.push(node)
    return node
  }
}

const monthsWidth = () =>
  appState.budgets.reduce((a, b) => a + b, 0)

const currentOffset = () =>
  appState.budgets
    .slice(0, appState.currentBudget)
    .reduce((a, b) => a + b, 0)

const appState = observable({
  startMonth: 0,
  budgets: [15, 12],
  currentBudget: 0,
  editing: false,
  editingNode: null,
  total: function() { console.log('TOT'); return sumChildren(this.sections) },
  sections: []
});

function init() {
  const template = require('./template.json')
  template.farms[0].report_sections.forEach(src_sec => {
    const sec = makeNewChild(appState, 'root', src_sec.name)
    src_sec.categories.forEach(src_cat => {
      const cat = makeNewChild(sec, 'section', src_cat.name)
      src_cat.extcodes.forEach(src_ext => {
        makeNewChild(cat, 'category', src_ext.name)
      })
    })
  })
  //const s1 = makeNewChild(appState, 'root', 'sec 1')
  //const c1 = makeNewChild(s1, 'section', 'cat 1-1')
  //makeNewChild(c1, 'category', 'ext 1-1-1')
  //makeNewChild(c1, 'category', 'ext 1-1-2')
  //makeNewChild(c1, 'category', 'ext 1-1-3')

  //const s2 = makeNewChild(appState, 'root', 'sec 2')
  //const c2 = makeNewChild(s2, 'section', 'cat 2-1')
  //makeNewChild(c2, 'category', 'ext 2-1-1')
  //makeNewChild(c2, 'category', 'ext 2-1-2')
  //makeNewChild(c2, 'category', 'ext 2-1-3')
}

module.exports = {appState, makeNewChild, init, currentOffset}
