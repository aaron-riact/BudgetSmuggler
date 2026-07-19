const yo = require('yo-yo');
const {appState, makeNewChild, init, currentOffset} = require('./appState')
const {autorun, transaction} = require("mobx");

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

const onFocus = (node, ev) => {
  console.log('onFocus', ev)
}

var range = (start, end) => [...Array(end - start + 1)].map((_, i) => start + i);
const COL_WIDTH = 50
const SLIDE_STEP = 12
const getBudgetSize = () => appState.viewSize
const getRenderArray = () => {
  const base = appState.slideDir === -1
    ? Math.max(0, currentOffset() - SLIDE_STEP)
    : currentOffset()
  return Array.from({length: getBudgetSize() + SLIDE_STEP}, (_, i) => i + base)
}
const getColArray = () =>
  Array.from({length: getBudgetSize()}, (_, i) => i + currentOffset())

const makeRow = (node, klass) => {
  const slideDir = appState.slideDir
  const from = slideDir === -1 ? -(SLIDE_STEP * COL_WIDTH) : 0
  const to = slideDir === -1 ? 0 : -(SLIDE_STEP * COL_WIDTH)
  const slideStyle = slideDir
    ? `--slide-from: ${from}px; --slide-to: ${to}px; transform: translateX(${from}px)`
    : ''
  return yo`
  <ol style='${slideStyle}' class='${slideDir ? 'slide' : ''}'>
    ${getRenderArray().map(i => yo`
      <li>
        ${klass === 'extended'
          ? yo`<input value="${node.values[i] || 0}" oninput=${ev => node.values[i] = parseFloat(ev.target.value) || 0}>`
          : node.values[i] || 0
        }
      </li>
    `)}
  </ol>`
}
        
const toggleEditMode = () =>
  appState.editing = !appState.editing

const nextBudget = (amt) => {
  if (appState.slideDir) return
  const maxOffset = appState.totalMonths - getBudgetSize()
  const oldOffset = appState.scrollOffset
  const newOffset = Math.max(0, Math.min(oldOffset + amt * SLIDE_STEP, maxOffset))
  if (oldOffset === newOffset) return
  appState.slideDir = amt

  setTimeout(() => {
    transaction(() => {
      appState.scrollOffset = newOffset
      appState.slideDir = 0
    })
  }, 370)
}

const renderTitle = () =>
  yo`
    <div class='title'>
      <div class='left'>
        <button class='edit-button' onclick=${toggleEditMode}>
          Edit
        </button>
      </div>
      <div class='center'>
        <h3>
          Budget Smuggler
        </h3>
      </div>
      <div class='right year-chooser'>
        <button onclick=${() => nextBudget(-1)}>B</button>
        <button onclick=${() => nextBudget(+1)}>F</button>
      </div>
    </div>
  `
  
const renderEditButton = (root, rootClass) => {
  const name = rootClass === 'root' ? 'sec' : rootClass === 'section' ? 'cat' : 'ext'
  return appState.editing ? yo`
    <div class='new'>
      <button class=${rootClass} onclick=${makeNewChild.bind(null, root, rootClass, name)}>
        +
      </button>
    </div>
  ` : ''
}

const renderMonths = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const cols = getRenderArray()
  const slideDir = appState.slideDir
  const from = slideDir === -1 ? -(SLIDE_STEP * COL_WIDTH) : 0
  const to = slideDir === -1 ? 0 : -(SLIDE_STEP * COL_WIDTH)
  const slideStyle = slideDir
    ? `--slide-from: ${from}px; --slide-to: ${to}px; transform: translateX(${from}px)`
    : ''

  const years = []
  let lastYear = null
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i]
    const year = appState.baseYear + Math.floor((col + appState.startMonth) / 12)
    years.push(year !== lastYear ? String(year) : '')
    lastYear = year
  }

  const monthLabels = cols.map(col => months[(col + appState.startMonth) % 12])

  return yo`<div>
    <div class='header'>
      <div class='nav'><span class='name'>Year</span></div>
      <div class='months' style='width: ${getBudgetSize() * COL_WIDTH}px'>
        <ol style='${slideStyle}' class='${slideDir ? 'slide' : ''}'>${years.map((y, idx) => y ? yo`<li class='year-label'>${y}</li>` : yo`<li></li>`)}</ol>
      </div>
    </div>
    <div class='header'>
      <div class='nav'><span class='name'>Months</span></div>
      ${renderEditButton(appState, 'root')}
      <div class='months' style='width: ${getBudgetSize() * COL_WIDTH}px'>
        <ol style='${slideStyle}' class='${slideDir ? 'slide' : ''}'>${monthLabels.map(m => yo`<li>${m}</li>`)}</ol>
      </div>
    </div>
  </div>`
  } 

function onBlur (node, ev) {
  node.name = ev.target.value
  appState.editingNode = null
}

const makeNode = (node, klass, children) =>
   yo`<div class=${klass} onclick=${onClick.bind(null, node)} onfocus=${onFocus}>
    <div class='nav'>
      ${appState.editingNode == node
        ? yo`<input value=${node.name} onblur=${onBlur.bind(null, node)}/>`
    	  : yo`<span class='name'>${node.name}</span>`
      }
    </div>
    ${renderEditButton(node, klass)}
    <div class='months' style='width: ${getBudgetSize() * COL_WIDTH}px'>
      ${makeRow(node, klass)}
    </div>
    <div class='children'>
      ${children || undefined}
    </div>
  </div>`
          
const isOpen = (node) =>
  node.open || appState.editing

const renderTree = sections =>
  yo`<div class='root'>
  	${sections.map(section =>
      makeNode(section, 'section',
  			isOpen(section) && section.categories.map(category =>
      		makeNode(category, 'category',
      			isOpen(category) && category.extendeds && category.extendeds.map(extended =>
     				 	makeNode(extended, 'extended')
            )
      		)
  			)
      )
  	)}
  </div>` 

const inputComp = state =>
  yo`<input value="${state.name}" oninput=${ev => state.name = ev.target.value}>`

const appComp = state => yo`<div class='container'>
	<div class='budget'>
    ${renderTitle()}
    ${renderMonths()}
		${renderTree(state.sections)}
  	${makeNode({name: 'Total', values: state.total}, 'section total')}
  </div>
</div>`;

const ref = document.body.appendChild(document.createElement('div')); 

init()
const x = autorun(() => yo.update(ref, appComp(appState)));
//console.log('donex', x); 
