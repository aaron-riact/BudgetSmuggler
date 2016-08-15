const {observable} = require("mobx");

const sumChildren = (children) =>
  children
    .map(node => node.values)
    .reduce((vals1, vals2) =>
      vals1.map((v,i) => (v || 0) + (vals2[i] || 0) ), [...Array(appState.budgets[appState.currentBudget])].map(() => 0)
    )

const makeNewChild = (parent, parentClass, name, e) => {
  if(e) e.stopPropagation(); 
  if(parentClass==='category') {
    const node = {
      name: typeof name === 'string' ? name : 'ext',
      values:Array(appState.budgets[appState.currentBudget])
    }
    parent.extendeds.push(node); 
    return node
  }
  if(parentClass==='section') {
    const node = {
      name: typeof name === 'string' ? name : 'cat',
      open: true,
      values:function() { console.log('CATN', this); return sumChildren(this.extendeds) },
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

const appState = observable({
  startMonth: 0,
  budgets: [15],
  currentBudget: 0,
  editing: false,
  editingNode: null,
  total: function() { console.log('TOT'); return sumChildren(this.sections) },
  sections: []
});

function init() {
  const s1 = makeNewChild(appState, 'root', 'sec 1')
  const c1 = makeNewChild(s1, 'section', 'cat 1-1')
  makeNewChild(c1, 'category', 'ext 1-1-1')
  makeNewChild(c1, 'category', 'ext 1-1-2')
  makeNewChild(c1, 'category', 'ext 1-1-3')

  const s2 = makeNewChild(appState, 'root', 'sec 2')
  const c2 = makeNewChild(s2, 'section', 'cat 2-1')
  makeNewChild(c2, 'category', 'ext 2-1-1')
  makeNewChild(c2, 'category', 'ext 2-1-2')
  makeNewChild(c2, 'category', 'ext 2-1-3')
}

module.exports = {appState, makeNewChild, init}
