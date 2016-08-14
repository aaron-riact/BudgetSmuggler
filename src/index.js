const yo = require('yo-yo');
const {appState, makeNewChild} = require('./appState')
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

const makeRow = (node, klass) =>
  yo`<ol>
    ${[1,2,3,4,5,6,7,8,9,10,11,12].map(month =>
      yo`<li>
        ${klass === 'extended'
          ? yo`<input value="${node.values[month-1] || 0}" oninput=${ev => node.values[month-1] = parseFloat(ev.target.value) || 0}>`
      		: node.values[month-1] || 0
				}
      </li>`
    )}
  </ol>`
        
const toggleEditMode = () =>
  appState.editing = !appState.editing

const renderTitle = () =>
  yo`
    <div>
      <button class='edit-button' onclick=${toggleEditMode}>
        Edit
      </button>
      <div class='title'>
        Budget Smuggler
      </div>
    </div>
  `
  
const renderEditButton = (root, rootClass) =>
  appState.editing ? yo`
    <div class='new'>
      <button class=${rootClass} onclick=${makeNewChild.bind(null, root, rootClass)}>
        +
      </button>
    </div>
  ` : ''

const renderMonths = () =>
  yo`<div class='header'>
    <div class='nav'>
      <span class='name'>Months</span>
    </div>
    ${renderEditButton(appState, 'root')}
    <div class='months'>
      ${makeRow({values:['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']})}
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
//console.log('donex', x); 
