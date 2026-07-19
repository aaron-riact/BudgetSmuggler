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
  appState.totalMonths

const appState = observable({
  startMonth: 0,
  baseYear: 2020,
  totalMonths: 120,
  editing: false,
  editingNode: null,
  total: function() { console.log('TOT'); return sumChildren(this.sections) },
  sections: []
});

const randomVal = () => Math.round(Math.random() * 500 + 50)
const makeValues = () => Array.from({ length: monthsWidth() }, () => randomVal())

function init() {
  const data = [
    { name: 'Income', categories: [
      { name: 'Wages', extendeds: ['Main Job', 'Side Gig'] },
      { name: 'Investments', extendeds: ['Dividends', 'Interest'] },
    ]},
    { name: 'Expenses', categories: [
      { name: 'Housing', extendeds: ['Rent', 'Utilities'] },
      { name: 'Food', extendeds: ['Groceries', 'Dining Out'] },
      { name: 'Transport', extendeds: ['Fuel', 'Insurance'] },
    ]},
  ]
  data.forEach(({name, categories}) => {
    const sec = makeNewChild(appState, 'root', name)
    categories.forEach(({name, extendeds}) => {
      const cat = makeNewChild(sec, 'section', name)
      extendeds.forEach(name => {
        const ext = makeNewChild(cat, 'category', name)
        ext.values = makeValues()
      })
    })
  })
}

module.exports = {appState, makeNewChild, init}
