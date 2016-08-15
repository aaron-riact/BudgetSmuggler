const yo = require('yo-yo');
const {appState, makeNewChild, init, currentOffset} = require('./appState')
const {autorun} = require("mobx");

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
const getBudgetSize = () => appState.budgets[appState.currentBudget]
const getColArray = () =>
  Array.from({length: getBudgetSize()}, (_, i) => i + currentOffset())

const getMonthsArray = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const budgetSize = getBudgetSize()
  const array = Array.from({length: getBudgetSize() + currentOffset()},
    (_, i) => months[(i + appState.startMonth) % 12]
  )
  console.log('array', array)
  return array
}

const makeRow = (node, klass) =>
  yo`<ol>
    ${getColArray().map(month =>
      yo`<li>
        ${klass === 'extended'
          ? yo`<input value="${node.values[month] || 0}" oninput=${ev => node.values[month] = parseFloat(ev.target.value) || 0}>`
      		: node.values[month] || 0
				}
      </li>`
    )}
  </ol>`
        
const toggleEditMode = () =>
  appState.editing = !appState.editing

const nextBudget = (amt) =>
  appState.currentBudget = Math.abs((appState.currentBudget + amt) % appState.budgets.length)

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

const renderMonths = () =>
  yo`<div class='header'>
    <div class='nav'>
      <span class='name'>Months</span>
    </div>
    ${renderEditButton(appState, 'root')}
    <div class='months'>
      ${makeRow({values: getMonthsArray()})}
    </div>
  </div>
  ` 

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
    <div class='months'>
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

const x = autorun(() => yo.update(ref, appComp(appState)));
init()
//console.log('donex', x); 
