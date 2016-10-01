const mobx = require('mobx')
const {appState, makeNewChild, init, currentOffset} = require('./appState')
const { el, list, mount, setChildren, text } = require('redom')

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
    this.el.replaceChild(data, this.el.firstChild)
  }
}
const makeRow = (node, klass) => {
  const ol = list('ol', Lix)
  mobx.autorun(() =>
    ol.update(getColArray().map(month =>
      klass === 'extended'
        ? el('input', {
          value: node.values[month] || 0,
          oninput: ev => node.values[month] = parseFloat(ev.target.value) || 0 
        })
        : text(node.values[month] || '0')
    ))
  )
  return ol
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

const renderMonths = () =>
  el('div.header',
    el('div.nav',
      el('span.name', 'Months')
    ),
    renderEditButton(appState, 'root'),
    el('div.months',
      makeRow({values: getMonthsArray()})
    )
  )

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

const makeNode = (node, klass, children = []) =>
  el('div', {class: klass, onclick: onClick.bind(null, node), onfocus},
    el('div.nav',
      appState.editingNode === node
      ? el('input', {value: node.name, onblur: onBlur.bind(null, node)})
      : el('span.name', node.name)
    ),
    renderEditButton(node, klass),
    el('div.months', makeRow(node, klass)),
    el('div.children', ...children)
  )

const isOpen = (node) =>
  node.open || appState.editing

const renderTree = sections =>
  el('div.root',
    ...sections.map(section =>
      makeNode(section, 'section',
        isOpen(section) && section.categories.map(category =>
          makeNode(category, 'category',
            isOpen(category) && category.extendeds && category.extendeds.map(extended =>
              makeNode(extended, 'extended')
            )
          )
        )
      )
    )
  )

class TotalRow {
  constructor() {
    this.el = el('div')
  }
  update(state) {
    this.el = makeNode({name: 'Total', values: state.total}, 'section total')
  }
}
const totalRow = new TotalRow
const appComp = state =>
  el('div.container',
    el('div.budget',
      renderTitle(),
      renderMonths(),
      renderTree(state.sections),
      makeNode({name: 'Total', values: state.total}, 'section total')
    )
  )

init()
console.log('appState', appState)
const ref = document.body.appendChild(document.createElement('div')); 
mount(ref, appComp(appState))
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
