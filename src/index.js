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

const computeStats = (values, len) => {
  let min = Infinity, max = -Infinity, sum = 0
  for (let i = 0; i < len; i++) {
    const v = values[i] || 0
    if (v < min) min = v
    if (v > max) max = v
    sum += v
  }
  return { min, max, avg: Math.round(sum / len) }
}

const hexAlpha = (hex, a) => {
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${a})`
}
const SPARK_COLORS = ['#8e44ad','#e67e22','#2ecc71','#e74c3c','#3498db','#f1c40f','#1abc9c','#e84393','#00b894','#6c5ce7']

let _statNodes = []

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
  _statNodes = []

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
      _statNodes.push(section)
      dataRows.push(makeDataRow(section, 'section'))
      if (isOpen(section)) {
        section.categories.forEach(category => {
          _statNodes.push(category)
          dataRows.push(makeDataRow(category, 'category'))
          if (isOpen(category)) {
            category.extendeds.forEach(extended => {
              _statNodes.push(extended)
              dataRows.push(makeDataRow(extended, 'extended'))
            })
          }
        })
      }
    })
  }
  walkSections(appState.sections)

  return [
    yo`<div class='data-row header'><ol>${yearCells}</ol></div>`,
    yo`<div class='data-row header'><ol>${monthCells}</ol></div>`,
    ...dataRows,
    yo`<div class='data-row total'><ol>${Array.from({ length: totalMonths }, (_, i) => yo`<li>${appState.total[i] || 0}</li>`)}</ol></div>`
  ]
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

  rows.push(yo`<div class='nav-row total'><span class='name'>Total</span></div>`)

  return rows
}

const renderStats = () => {
  const totalMonths = appState.totalMonths
  const rows = []
  rows.push(yo`<div class='stat-row header'><span>Trend</span></div>`)
  rows.push(yo`<div class='stat-row header'></div>`)
  _statNodes.forEach((node, idx) => {
    const s = computeStats(node.values, totalMonths)
    rows.push(yo`<div class='stat-row'>
      <canvas class='spark-canvas' data-idx='${idx}' width='80' height='18'></canvas>
      <span class='stat-label'>${s.min}–${s.max}</span>
    </div>`)
  })
  const s = computeStats(appState.total, totalMonths)
  rows.push(yo`<div class='stat-row total'>
    <canvas class='spark-canvas' data-idx='${_statNodes.length}' width='80' height='18'></canvas>
    <span class='stat-label'>${s.min}–${s.max}</span>
  </div>`)
  return rows
}

const drawSparkline = (canvas, values, color) => {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height, len = values.length
  let min = Infinity, max = -Infinity
  for (let i = 0; i < len; i++) {
    const v = values[i] || 0
    if (v < min) min = v
    if (v > max) max = v
  }
  const rng = max - min || 1
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1
  for (let i = 0; i < len; i++) {
    const x = (i / (len - 1)) * w
    const y = h - ((values[i] || 0) - min) / rng * (h - 2) - 1
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
  ctx.fillStyle = hexAlpha(color, .15)
  ctx.fill()
}

const drawSparklines = () => {
  document.querySelectorAll('.spark-canvas').forEach(canvas => {
    const idx = parseInt(canvas.dataset.idx)
    const node = idx < _statNodes.length ? _statNodes[idx] : null
    const values = node ? node.values : appState.total
    const color = SPARK_COLORS[idx % SPARK_COLORS.length]
    drawSparkline(canvas, values, color)
  })
}

const renderYearSummary = () => {
  const totalMonths = appState.totalMonths
  const years = totalMonths / 12
  const yearData = Array.from({ length: years }, (_, y) => {
    const start = y * 12, end = start + 12
    let sum = 0
    const monthsArr = []
    for (let i = start; i < end; i++) {
      const v = appState.total[i] || 0
      sum += v
      monthsArr.push(v)
    }
    return { year: appState.baseYear + y, total: sum, months: monthsArr }
  })
  const maxTotal = Math.max(...yearData.map(y => y.total))

  const allMonths = yearData.flatMap(y => y.months)
  const gmin = Math.min(...allMonths), gmax = Math.max(...allMonths), grng = gmax - gmin || 1

  return yo`
    <div class='summary'>
      <div class='summary-card'>
        <h4>Annual Totals</h4>
        <div class='year-bar'>
          ${yearData.map(y => {
            const pct = y.total / maxTotal * 100
            return yo`<div class='year-bar-item' style='height:${pct}%;background:#e67e22' title='${y.year}: $${y.total.toLocaleString()}'><span class='bar-label'>${y.year}</span></div>`
          })}
        </div>
      </div>
      <div class='summary-card'>
        <h4>Monthly Avg by Year</h4>
        <canvas id='yearChart' width='400' height='80'></canvas>
        <div class='chart-legend' id='chartLegend'></div>
      </div>
    </div>`
}

const renderTable = () => yo`
  <div class='table-body'>
    <div class='nav-col'>${renderNav()}</div>
    <div class='scroll-wrap'>${scrollContent()}</div>
    <div class='stats-col'>${renderStats()}</div>
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
    ${renderYearSummary()}
  </div>
</div>`;

const ref = document.body.appendChild(document.createElement('div')); 

const drawYearChart = () => {
  const canvas = document.getElementById('yearChart')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  const years = appState.totalMonths / 12
  const yearData = Array.from({ length: years }, (_, y) => {
    const start = y * 12, end = start + 12, m = []
    for (let i = start; i < end; i++) m.push(appState.total[i] || 0)
    return m
  })
  const allMonthsArr = yearData.flat()
  const gmin = Math.min(...allMonthsArr), gmax = Math.max(...allMonthsArr), grng = gmax - gmin || 1
  ctx.clearRect(0, 0, w, h)
  yearData.forEach((months, yi) => {
    ctx.beginPath(); ctx.strokeStyle = SPARK_COLORS[yi % SPARK_COLORS.length]; ctx.lineWidth = 1.5
    months.forEach((v, mi) => {
      const x = (mi / 11) * w
      const ypos = h - ((v - gmin) / grng) * (h - 4) - 2
      mi === 0 ? ctx.moveTo(x, ypos) : ctx.lineTo(x, ypos)
    })
    ctx.stroke()
  })
  const legend = document.getElementById('chartLegend')
  if (legend) {
    legend.innerHTML = ''
    yearData.forEach((_, yi) => {
      const year = appState.baseYear + yi
      const dot = document.createElement('span')
      dot.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;background:${SPARK_COLORS[yi % SPARK_COLORS.length]};margin-right:2px;vertical-align:middle;`
      const lbl = document.createElement('span')
      lbl.textContent = `${year}`
      lbl.style.cssText = 'margin-right:8px;font-size:10px;color:rgba(255,255,255,.6)'
      legend.appendChild(dot)
      legend.appendChild(lbl)
    })
  }
}

init()
const x = autorun(() => {
  yo.update(ref, appComp(appState))
  drawSparklines()
  drawYearChart()
}); 
