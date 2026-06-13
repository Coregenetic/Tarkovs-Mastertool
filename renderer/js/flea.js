// ── FLEA STATE ────────────────────────────
let fleaSales    = []
let fleaStats    = null
let itemCache    = {}
let fleaSearch   = ''
let fleaPage     = 1
let fleaChartRange = 7
const PAGE_SIZE  = 50

// ── INIT ──────────────────────────────────
function initFlea() {
  window.api.on('scan-progress', (data) => renderSplash(data))
  window.api.on('scan-complete', (data) => {
    fleaSales = data.sales || []
    fleaStats = data.stats || null
    hideSplash()
    renderFlea()
    if (typeof renderOverview === 'function') renderOverview()
    setTimeout(() => renderWeekChart(fleaStats?.daily || [], fleaChartRange), 100)
    fetchMissingThumbnails()
  })
  window.api.on('new-sales', (data) => {
    if (data.sales) fleaSales = [...data.sales, ...fleaSales]
    if (data.stats) fleaStats = data.stats
    renderFleaStats()
    renderFleaSalesList(true)
    data.sales?.forEach(s => showSaleToast(s))
  })

  // Range Buttons
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      fleaChartRange = parseInt(btn.dataset.range)
      if (fleaStats) renderWeekChart(fleaStats.daily || [], fleaChartRange)
    })
  })

  loadFleaData()
}

async function loadFleaData() {
  try {
    const [sales, stats] = await Promise.all([
      window.api.getSales(500),
      window.api.getStats(),
    ])
    fleaSales = sales || []
    fleaStats = stats || null
    if (fleaSales.length > 0 || fleaStats) {
      hideSplash()
      renderFlea()
      if (typeof renderOverview === 'function') renderOverview()
      setTimeout(() => {
        renderWeekChart(fleaStats?.daily || [], fleaChartRange)
        if (typeof drawOvChart === 'function') {
          const last7 = (fleaStats?.daily || []).slice(0, 7).reverse()
          const today = new Date().toISOString().slice(0, 10)
          drawOvChart(last7, today)
        }
      }, 150)
      fetchMissingThumbnails()
    }
  } catch(e) { console.error('loadFleaData:', e) }
}

// ── RENDER ────────────────────────────────
function renderFlea() {
  renderFleaStats()
  renderFleaSalesList(false)
}

function renderFleaStats() {
  if (!fleaStats) return
  const s = fleaStats

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const todayData = s.daily?.find(d => d.date === today)     || { revenue: 0, sales: 0 }
  const yestData  = s.daily?.find(d => d.date === yesterday) || { revenue: 0, sales: 0 }

  setEl('flea-today-revenue', fmtRub(todayData.revenue))
  setEl('flea-total-revenue', fmtRub(s.totalRevenue))
  setEl('flea-total-sales',   `${s.totalSales?.toLocaleString('de-DE') || 0} Sales`)
  setEl('flea-streak',        `${s.streak} Tage`)
  setEl('flea-streak-num',    s.streak || 0)
  setEl('flea-buyers',        s.uniqueBuyers?.toLocaleString('de-DE') || '0')

  // Delta
  const deltaEl = document.getElementById('flea-today-delta')
  if (deltaEl) {
    if (yestData.revenue > 0) {
      const delta = Math.round((todayData.revenue - yestData.revenue) / yestData.revenue * 100)
      const pos   = delta >= 0
      deltaEl.textContent = `${pos ? '↑' : '↓'} ${Math.abs(delta)}% vs. gestern`
      deltaEl.style.color = pos ? 'var(--success)' : 'var(--danger)'
    } else {
      deltaEl.textContent = ''
    }
  }

  // Streak Ring
  const ring = document.getElementById('flea-streak-ring')
  if (ring && s.streak > 0) {
    const pct = Math.min(s.streak / 30, 1)
    ring.style.strokeDashoffset = 113.1 * (1 - pct)
    ring.style.transition = 'stroke-dashoffset 1s ease'
  }

  // Sparkline
  const sparkPath = document.getElementById('flea-sparkline-path')
  if (sparkPath && s.daily?.length > 1) {
    const pts = s.daily.slice(0, 7).reverse()
    const max = Math.max(...pts.map(d => d.revenue), 1)
    const coords = pts.map((d, i) => {
      const x = (i / (pts.length - 1)) * 100
      const y = 38 - (d.revenue / max) * 34
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
    sparkPath.setAttribute('d', coords)
  }

  renderWeekChart(s.daily || [], fleaChartRange)
}

function _renderWeekChartDelayed(daily, range) {
  requestAnimationFrame(() => renderWeekChart(daily, range))
}

function renderFleaSalesList(flashNew = false) {
  const el = document.getElementById('flea-sales-list')
  if (!el) return

  const filtered = fleaSearch
    ? fleaSales.filter(s =>
        (s.itemName || '').toLowerCase().includes(fleaSearch) ||
        (s.templateId || '').toLowerCase().includes(fleaSearch))
    : fleaSales

  const start = (fleaPage - 1) * PAGE_SIZE
  const paged = filtered.slice(start, start + PAGE_SIZE)
  const total = filtered.length

  el.innerHTML = paged.map((s, i) => {
    const item  = itemCache[s.templateId]
    const name  = item?.name || s.itemName || s.templateId?.slice(0, 8) || '?'
    const icon  = item?.iconLink || ''
    const isNew = flashNew && i < 3
    return `
      <div class="sale-row${isNew ? ' sale-new' : ''}">
        <div class="sale-icon">
          ${icon
            ? `<img src="${icon}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : `<div class="sale-icon-placeholder"><i class="ti ti-package"></i></div>`
          }
        </div>
        <div class="sale-info">
          <div class="sale-name">${esc(name)}</div>
          <div class="sale-meta">${fmtDate(s.date)} · ×${s.count || 1}</div>
        </div>
        <div class="sale-price">${fmtRub(s.totalPrice)}</div>
      </div>`
  }).join('')

  const pageEl = document.getElementById('flea-pagination')
  if (pageEl) {
    const pages = Math.ceil(total / PAGE_SIZE)
    pageEl.innerHTML = pages > 1 ? `
      <button class="btn-page" ${fleaPage === 1 ? 'disabled' : ''} onclick="setFleaPage(${fleaPage - 1})">‹</button>
      <span>${fleaPage} / ${pages}</span>
      <button class="btn-page" ${fleaPage >= pages ? 'disabled' : ''} onclick="setFleaPage(${fleaPage + 1})">›</button>
    ` : ''
  }
}

// ── CHART ─────────────────────────────────
function renderWeekChart(daily, range = 7) {
  const canvas = document.getElementById('flea-week-chart')
  if (!canvas) return

  const wrap  = canvas.parentElement
  canvas.width  = wrap.clientWidth - 44
  canvas.height = 110

  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height

  const all  = [...daily].reverse()
  const data = range === 0 ? all : all.slice(-range)
  if (!data.length) return

  const max   = Math.max(...data.map(d => d.revenue), 1)
  const ac    = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()
  const today = new Date().toISOString().slice(0, 10)

  ctx.clearRect(0, 0, w, h)

  // Y Labels
  const yEl = document.getElementById('chart-y-labels')
  if (yEl) {
    yEl.innerHTML = [max, max * 0.66, max * 0.33, 0]
      .map(v => `<span>${fmtRubShort(v)}</span>`).join('')
  }

  // X Labels
  const xEl = document.getElementById('chart-x-labels')
  if (xEl) {
    xEl.innerHTML = data.map((d, i) => {
      const isToday = d.date === today
      const day = new Date(d.date + 'T12:00:00').getDay()
      const label = range <= 7
        ? ['So','Mo','Di','Mi','Do','Fr','Sa'][day]
        : d.date.slice(5)
      return `<span style="font-weight:${isToday?700:400};color:${isToday?ac:'rgba(255,255,255,0.25)'}">${label}</span>`
    }).join('')
  }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 3; i++) {
    const y = (i / 3) * h
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Points
  const pts = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * w : w / 2,
    y: h - 8 - (d.revenue / max) * (h - 16),
    date: d.date, revenue: d.revenue,
  }))

  // Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, ac + '55')
  grad.addColorStop(1, ac + '00')

  // Fill
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.lineTo(pts[pts.length-1].x, h)
  ctx.lineTo(pts[0].x, h)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Line
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i-1].x + pts[i].x) / 2
    ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y)
  }
  ctx.strokeStyle = ac; ctx.lineWidth = 2.5; ctx.stroke()

  // Dots + Tooltip
  pts.forEach((p, i) => {
    const isToday = p.date === today
    const isLast  = i === pts.length - 1
    const big     = isToday || isLast

    ctx.beginPath()
    ctx.arc(p.x, p.y, big ? 5 : 3, 0, Math.PI * 2)
    ctx.fillStyle = ac; ctx.fill()

    if (big) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2)
      ctx.fillStyle = ac + '33'; ctx.fill()

      // Tooltip
      ctx.font = 'bold 10px Inter'
      const label = fmtRub(p.revenue)
      const tw    = ctx.measureText(label).width + 16
      const tx    = Math.min(Math.max(p.x - tw / 2, 2), w - tw - 2)
      const ty    = p.y - 30

      ctx.fillStyle = '#1e1e1e'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 18, 4)
      else ctx.rect(tx, ty, tw, 18)
      ctx.fill()
      ctx.strokeStyle = ac + '66'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = ac
      ctx.fillText(label, tx + 8, ty + 13)
    }
  })
}

// ── THUMBNAILS ───────────────────────────
async function fetchMissingThumbnails() {
  const missing = [...new Set(
    fleaSales.filter(s => s.templateId && !itemCache[s.templateId]).map(s => s.templateId)
  )].slice(0, 50)
  if (!missing.length) return
  try {
    const gm = window._gameMode || 'pve'
    const r  = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{items(ids:${JSON.stringify(missing)},gameMode:${gm}){id name shortName iconLink}}`
      })
    })
    const d = await r.json()
    ;(d?.data?.items || []).forEach(item => { itemCache[item.id] = item })
    renderFleaSalesList(false)
  } catch(e) { console.warn('fetchThumbnails:', e) }
}

// ── HELPERS ──────────────────────────────
function setFleaPage(p)   { fleaPage = p; renderFleaSalesList(false) }
function setFleaSearch(q) { fleaSearch = q.toLowerCase(); fleaPage = 1; renderFleaSalesList(false) }

function setEl(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val
}

function fmtRub(val) {
  if (!val) return '0 ₽'
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)} M ₽`
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)} K ₽`
  return `${Math.round(val)} ₽`
}

function fmtRubShort(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K`
  return val > 0 ? Math.round(val).toString() : '0'
}

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// ── SPLASH ────────────────────────────────
function renderSplash(data) {
  const el = document.getElementById('flea-splash')
  if (!el) return
  el.style.display = 'flex'
  const txt = el.querySelector('.splash-status')
  const bar = el.querySelector('.splash-bar-fill')
  if (txt) txt.textContent = data.status || 'Lade...'
  if (bar) bar.style.width = `${data.pct || 0}%`
  const cnt = el.querySelector('.splash-count')
  if (cnt && data.count) cnt.textContent = `${data.count.toLocaleString('de-DE')} Sales`
}

function hideSplash() {
  const el = document.getElementById('flea-splash')
  if (el) el.style.display = 'none'
}

// ── TOAST ─────────────────────────────────
function showSaleToast(sale) {
  const item = itemCache[sale.templateId]
  const name = item?.name || sale.itemName || 'Unbekanntes Item'
  showToast({ icon: item?.iconLink || '', title: name, sub: fmtRub(sale.totalPrice), tag: 'SALE' })
}