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
      values:function() { return sumChildren(this.extendeds) },
      extendeds: []
    } 
    parent.categories.push(node);
    return node
  }
  if(parentClass==='root') {
    const node = {
      name: typeof name === 'string' ? name : 'sec',
      open: true,
      values: function() { return sumChildren(this.categories) },
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
      total: function() { return sumChildren(this.sections) },
  sections: []
});

const noise = (amount) => Math.round((Math.random() - 0.5) * 2 * amount)
const trended = (base, deltas) =>
  Array.from({ length: monthsWidth() }, (_, i) =>
    Math.max(0, Math.round(base + deltas.reduce((s, d) => s + (typeof d === 'function' ? d(i) : d), 0)))
  )

function init() {
  const data = [
    { name: 'Income', categories: [
      { name: 'Wages', extendeds: [
        ['Main Job',  trended(4000, [i => Math.floor(i / 12) * 200, i => noise(20)])],
        ['Side Gig',  trended(500,  [i => 150 * Math.sin(2 * Math.PI * (i - 5) / 12), i => noise(30)])],
      ]},
      { name: 'Investments', extendeds: [
        ['Dividends', trended(200,  [i => i % 3 === 2 ? 300 : 0, i => noise(15)])],
        ['Interest',  trended(100,  [i => -i * 0.5, i => noise(5)])],
      ]},
    ]},
    { name: 'Expenses', categories: [
      { name: 'Housing', extendeds: [
        ['Rent',      trended(1200, [i => Math.floor(i / 12) * 50, i => noise(15)])],
        ['Utilities', trended(150,  [i => 70 * Math.sin(2 * Math.PI * (i + 2) / 12), i => noise(10)])],
      ]},
      { name: 'Food', extendeds: [
        ['Groceries', trended(600, [i => 80 * Math.sin(2 * Math.PI * (i - 1) / 12), i => Math.floor(i / 12) * 15, i => noise(15)])],
        ['Dining Out',trended(200, [i => 50 * Math.sin(2 * Math.PI * (i - 5) / 12), i => Math.floor(i / 12) * 10, i => noise(12)])],
      ]},
      { name: 'Transport', extendeds: [
        ['Fuel',      trended(180,  [i => i * 0.8, i => 30 * Math.sin(2 * Math.PI * i / 6), i => noise(20)])],
        ['Insurance', trended(100,  [i => Math.floor(i / 12) * 30, i => noise(8)])],
      ]},
    ]},
  ]
  data.forEach(({name, categories}) => {
    const sec = makeNewChild(appState, 'root', name)
    categories.forEach(({name, extendeds}) => {
      const cat = makeNewChild(sec, 'section', name)
      extendeds.forEach(([name, values]) => {
        const ext = makeNewChild(cat, 'category', name)
        ext.values = values
      })
    })
  })
}

module.exports = {appState, makeNewChild, init}
