const yo = require('yo-yo');
const {appState, makeNewChild, init} = require('./appState')
const {autorun} = require("mobx");

const onClick = (node, ev) => { 
  ev.preventDefault()
  ev.stopPropagation()
  if (appState.editing) {
    return appState.editingNode = node
  }
  node.open = !node.open
}

const onFocus = (node, ev) => {
}

const scrollStep = (dir) => {
  const el = document.querySelector('.scroll-wrap')
  if (!el) return
  el.scrollBy({ left: dir * 12 * 50, behavior: 'smooth' })
}

const toggleEditMode = () =>
  appState.editing = !appState.editing

const renderTitle = () =>
  yo`<div class='title'>
      <div class='left'>
        <button class='edit-button' onclick=${toggleEditMode}>Edit</button>
      </div>
      <div class='center'>
        <h3>Budget Smuggler</h3>
      </div>
      <div class='right year-chooser'>
        <button onclick=${() => scrollStep(-1)}>B</button>
        <button onclick=${() => scrollStep(1)}>F</button>
      </div>
    </div>`

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const colToYear = (col) => appState.baseYear + Math.floor((col + appState.startMonth) / 12)
const colToMonth = (col) => (col + appState.startMonth) % 12

const isOpen = (node) =>
  node.open || appState.editing

const makeDataRow = (node, klass) => {
  const totalMonths = appState.totalMonths
  return yo`<div class='data-row ${klass}' onclick=${onClick.bind(null, node)} onfocus=${onFocus}>
    <ol>
      ${Array.from({ length: totalMonths }, (_, i) => yo`
        <li>
          ${klass === 'extended'
            ? yo`<input value="${node.values[i] || 0}" oninput=${ev => node.values[i] = parseFloat(ev.target.value) || 0}>`
            : node.values[i] || 0
          }
        </li>
      `)}
    </ol>
  </div>`
}

function onBlur (node, ev) {
  node.name = ev.target.value
  appState.editingNode = null
}

const makeNavRow = (node, depth) => {
  const indent = depth === 0 ? '' : depth === 1 ? 'indent-cat' : 'indent-ext'
  const onClickLabel = (ev) => {
    ev.stopPropagation()
    ev.preventDefault()
    onClick(node, ev)
  }
  return yo`<div class='nav-row ${indent}' onclick=${onClickLabel}>
    ${appState.editingNode == node
      ? yo`<input value=${node.name} onblur=${onBlur.bind(null, node)}/>`
      : yo`<span class='name'>${node.name}</span>`
    }
  </div>`
}

const scrollContent = () => {
  const totalMonths = appState.totalMonths

  const yearCells = []
  let lastYear = null
  for (let i = 0; i < totalMonths; i++) {
    const y = colToYear(i)
    yearCells.push(y !== lastYear ? yo`<li class='year-label'>${y}</li>` : yo`<li></li>`)
    lastYear = y
  }

  const monthCells = Array.from({ length: totalMonths }, (_, i) =>
    yo`<li>${months[colToMonth(i)]}</li>`
  )

  const dataRows = []
  const walkSections = (sections) => {
    sections.forEach(section => {
      dataRows.push(makeDataRow(section, 'section'))
      if (isOpen(section)) {
        section.categories.forEach(category => {
          dataRows.push(makeDataRow(category, 'category'))
          if (isOpen(category)) {
            category.extendeds.forEach(extended => {
              dataRows.push(makeDataRow(extended, 'extended'))
            })
          }
        })
      }
    })
  }
  walkSections(appState.sections)

  return yo`
    <div class='data-row header'><ol>${yearCells}</ol></div>
    <div class='data-row header'><ol>${monthCells}</ol></div>
    ${dataRows}
    <div class='data-row total' style='border-top:1px solid rgba(255,255,255,.1)'>
      <ol>${Array.from({ length: totalMonths }, (_, i) => yo`<li>${appState.total[i] || 0}</li>`)}</ol>
    </div>`
}

const renderNav = () => {
  const rows = []
  rows.push(yo`<div class='nav-row header'><span class='name'>Year</span></div>`)
  rows.push(yo`<div class='nav-row header'><span class='name'>Months</span></div>`)

  const walkSections = (sections) => {
    sections.forEach(section => {
      rows.push(makeNavRow(section, 0))
      if (isOpen(section)) {
        section.categories.forEach(category => {
          rows.push(makeNavRow(category, 1))
          if (isOpen(category)) {
            category.extendeds.forEach(extended => {
              rows.push(makeNavRow(extended, 2))
            })
          }
        })
      }
    })
  }
  walkSections(appState.sections)

  rows.push(yo`<div class='nav-row' style='border-top:1px solid rgba(255,255,255,.1)'><span class='name'>Total</span></div>`)

  return rows
}

const renderTable = () => yo`
  <div class='table-body'>
    <div class='nav-col'>${renderNav()}</div>
    <div class='scroll-wrap'>${scrollContent()}</div>
  </div>`

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

const appComp = state => yo`<div class='container'>
  <div class='budget'>
    ${renderTitle()}
    ${renderEditButton(appState, 'root')}
    ${renderTable()}
  </div>
</div>`;

const ref = document.body.appendChild(document.createElement('div')); 

init()
const x = autorun(() => yo.update(ref, appComp(appState)));
//console.log('donex', x); 
