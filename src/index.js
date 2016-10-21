const mobx = require('mobx')
const {appState, makeNewChild, init, currentOffset} = require('./appState')
const { el, list, mount, setChildren, text } = require('redom')
const yo = require('yo-yo');

const hello = el('h1', 'Hello world!');

const nextBudget = (amt) =>
  appState.currentBudget = Math.abs((appState.currentBudget + amt) % appState.budgets.length)

mount(document.body, hello);
const renderTitle = () =>
  el('div.title',
    el('div.left',
      el('button.edit-button', 'Edit')
    ),
    el('div.center',
      el('h3', 'Budget Smuggler')),
    el('div.right.year-chooser',
      el('button', {onclick: () => nextBudget(-1)}, 'B'),
      el('button', {onclick: () => nextBudget(+1)}, 'F')
    )
  )

const renderEditButton = (root, rootClass) => {
  const name = rootClass === 'root' ? 'sec' : rootClass === 'section' ? 'cat' : 'ext'
  return appState.editing ?
    el('div.new',
      el('button', {class: rootClass, onclick: makeNewChild.bind(null, root, rootClass, name)},
        '+'
      )
    ) : ''
}

const getBudgetSize = () => appState.budgets[appState.currentBudget]
const getColArray = () =>
  Array.from({length: getBudgetSize()}, (_, i) => i + currentOffset())

class Lix {
  constructor () {
    this.el = el('li', el('div'))
  }
  update (data) {
    console.log('data', data)
    yo.update(this.el.firstChild, data)
  }
}
const Row = list.extend('ol', Lix)

const makeRow = (node, klass) => {
  return klass === 'extended'
    ? getColArray().map(month =>
      el('input', {
        value: '67' || node.values[month] || '0',
        oninput: ev => { node.values[month] = parseFloat(ev.target.value) || 0 }
      })
    )
    : getColArray().map(month => text(node.values[month] || '0'))
}

const getMonthsArray = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const budgetSize = getBudgetSize()
  const array = Array.from({length: getBudgetSize() + currentOffset()},
    (_, i) => months[(i + appState.startMonth) % 12]
  )
  console.log('array', array)
  return array
}

const renderMonths = () => {
  const monthRow = new Row
  mobx.autorun(() =>
    monthRow.update(makeRow({values: getMonthsArray()}))
  )
  return el('div.header',
    el('div.nav',
      el('span.name', 'Months')
    ),
    renderEditButton(appState, 'root'),
    el('div.months', monthRow)
  )
}
function onBlur (node, ev) {
  node.name = ev.target.value
  appState.editingNode = null
}

const onClick = (node, ev) => { 
  //console.log(computed);
  ev.preventDefault()
  ev.stopPropagation()
  if (appState.editing) {
    console.log('making node editable')
    return appState.editingNode = node
  }
	node.open = !node.open
}


function getChildren (node, klass) {
  if (isOpen(node)) {
    if (klass === 'section') return new cats //node.categories.map(c => new Node({klass: 'category'}, c))
    if (klass === 'category') return new exts //node.extendeds.map(c => new Node({klass: 'extended'}, c))
  }
  return {update:() => {}} //[]
}

class Node {
  constructor (initData, node) {
    this.initData = initData
    this.children = getChildren(node, initData.klass)
    this.months = new Row
    this.el = el('div', {class: initData.klass, onclick: onClick.bind(null, node)},
      el('div.nav',
        appState.editingNode === node
        ? el('input', {value: node.name, onblur: onBlur.bind(null, node)})
        : el('span.name', node.name)
      ),
      renderEditButton(node, initData.klass),
      el('div.months', this.months),
      this.children
    )
  }
  update (item) {
    this.children.update(isOpen(item) ? item.categories || item.extendeds : [])
    mobx.autorun(() =>
      this.months.update(makeRow(item, this.initData.klass))
    )
    console.log('update', mobx.toJS(item))
  }
}

const isOpen = (node) =>
  node.open || appState.editing

const cats = list.extend('div.children', Node, null, {klass: 'category'})
const exts = list.extend('div.children', Node, null, {klass: 'extended'})
const secs = list.extend('div', cats)
const tree = list('div.root', Node, null, {klass: 'section'})
window.list = list

const totalRow = new Node({klass: 'section total'}, {name: 'Total', values: appState.total})
const appComp = state =>
  el('div.container',
    el('div.budget',
      renderTitle(),
      renderMonths(),
      tree,
      totalRow
    )
  )

init()
console.log('appState', appState)
const ref = document.body.appendChild(document.createElement('div')); 
mount(ref, appComp(appState))
tree.update(appState.sections)
mobx.autorun(() => totalRow.update({name: 'Total', values: appState.total}))
// autorun(() => console.log('upda'))
//const x = autorun(() => yo.update(ref, appComp(appState)));
/******************* TD */
class Td {
  constructor () {
    this.el = el('td');
    console.log('td cons')
  }
  update (data) {
    mobx.autorun(() => {
      this.el.textContent = data.a;
      //console.log('td upda', data)
      //console.dir(data)
    })
  }
}

const Tr = list.extend('tr', Td);
const Table = list.extend('table', Tr);

const table = new Table;

mount(document.body, table);

table.update([
  [ {a: 1}, {a: 2}, {a: 3} ],
  [ {a: 4}, {a: 5}, {a: 6} ],
  [ {a: 7}, {a: 8}, {a: 9} ]
]);

const z = mobx.observable([
  [ {a: 1}, {a: 2}, {a: 3} ],
  [ {a: 4}, {a: 5}, {a: 6} ],
  [ {a: 7}, {a: 8}, {a: 9} ]
])

table.update(z)
console.log('z', z)
/**************** Li */
class Li {
  constructor () {
    this.el = el('li')
  }
  update (data) {
    this.el.textContent = data
  }
}
var ul = list('ul', Li)
mount(document.body, ul)
ul.update([ 1, 2, 3 ].map(i => 'Item ' + i))
// mobx.autorun(() => table.update(z))

window.z = z
