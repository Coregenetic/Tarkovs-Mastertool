// ── OVERVIEW ──────────────────────────────
function initOverview() {
  window.api.on('new-sales', () => {
    if (currentPage === 'overview') renderOverview()
  })
}

function renderOverview() {
  const el = document.getElementById('page-overview')
  if (!el) return

  const s      = fleaStats
  const today  = new Date().toISOString().slice(0, 10)
  const yest   = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const todayD = s?.daily?.find(d => d.date === today)  || { revenue: 0, sales: 0 }
  const yesterD= s?.daily?.find(d => d.date === yest)   || { revenue: 0, sales: 0 }
  const delta  = yesterD.revenue > 0
    ? Math.round((todayD.revenue - yesterD.revenue) / yesterD.revenue * 100)
    : null

  const last7   = (s?.daily || []).slice(0, 7).reverse()
  const maxRev  = Math.max(...last7.map(d => d.revenue), 1)

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend'
  const name = settings?.playerName || 'Operator'

  // Quest Stats
  const questDone  = window._questDone  || 0
  const questTotal = window._questTotal || 0
  const kappaDone  = window._kappaDone  || 0
  const kappaTotal = window._kappaTotal || 0
  const lkDone     = window._lkDone     || 0
  const lkTotal    = window._lkTotal    || 0
  const questPct   = questTotal > 0 ? Math.round(questDone / questTotal * 100) : 0

  // Raid Stats
  const raidTotal  = window._raidStats?.totalRaids   || 0
  const survived   = window._raidStats?.survived     || 0
  const kia        = window._raidStats?.kia          || 0
  const runThrough = window._raidStats?.runThrough   || 0
  const survRate   = window._raidStats?.survivalRate || 0
  const level      = window._raidStats?.profile?.level || '?'
  const kills      = window._raidStats?.profile?.kills || 0
  const playtime   = window._raidStats?.profile?.playTime || 0

  // Hideout
  const hideoutDone  = window._hideoutDone  || 0
  const hideoutTotal = window._hideoutTotal || 0

  el.innerHTML = `
    <div class="ov-wrap">

      <!-- Header -->
      <div class="ov-header">
        <div>
          <div class="ov-greeting">${greeting}, ${esc(name)}</div>
          <div class="ov-sub">${new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' })} · ${(settings?.gameMode || 'pve').toUpperCase()}</div>
        </div>
        <div class="ov-online ${s ? 'active' : ''}">
          <div class="ov-dot"></div>
          <span>${s ? 'Online' : 'Verbinde...'}</span>
        </div>
      </div>

      <!-- 2x2 Grid -->
      <div class="ov-grid">

        <!-- 💰 Flea -->
        <div class="ov-card ov-card-flea" onclick="showPage('flea')">
          <div class="ov-card-head">
            <span class="ov-card-tag">💰 FLEA MARKET</span>
            <span class="ov-card-link">Details →</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:10px">
            <div class="ov-big-val" style="color:var(--ac)">${fmtRub(todayD.revenue)}</div>
            <div class="ov-big-sub">
              Heute
              ${delta !== null ? `<span style="color:${delta >= 0 ? 'var(--success)' : 'var(--danger)'}"> · ${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%</span>` : ''}
            </div>
          </div>
          <canvas id="ov-flea-chart" style="flex:1;width:100%;min-height:0"></canvas>
          <div class="ov-sub-stats">
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Gesamt</div>
              <div class="ov-sub-stat-val">${fmtRub(s?.totalRevenue || 0)}</div>
            </div>
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Sales</div>
              <div class="ov-sub-stat-val">${(s?.totalSales || 0).toLocaleString('de-DE')}</div>
            </div>
            <div class="ov-sub-stat" style="border-color:rgba(245,158,11,0.2);background:rgba(245,158,11,0.06)">
              <div class="ov-sub-stat-label">Streak</div>
              <div class="ov-sub-stat-val" style="color:#f59e0b">${s?.streak || 0}T 🔥</div>
            </div>
          </div>
        </div>

        <!-- ⚔️ Raids -->
        <div class="ov-card" onclick="showPage('raids')">
          <div class="ov-card-head">
            <span class="ov-card-tag">⚔️ RAIDS</span>
            <span class="ov-card-link">Details →</span>
          </div>
          <div class="ov-card-main">
            <div>
              <div class="ov-big-val">${raidTotal.toLocaleString('de-DE')}</div>
              <div class="ov-big-sub">Raids gesamt</div>
            </div>
            <!-- Survival Ring -->
            <div style="position:relative;width:52px;height:52px;flex-shrink:0">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4.5"/>
                <circle cx="26" cy="26" r="21" fill="none" stroke="#10b981" stroke-width="4.5"
                  stroke-dasharray="131.9"
                  stroke-dashoffset="${131.9 * (1 - survRate / 100)}"
                  stroke-linecap="round" transform="rotate(-90 26 26)"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
                <div style="font-size:11px;font-weight:800;color:#10b981;line-height:1">${survRate}%</div>
                <div style="font-size:7px;color:rgba(255,255,255,0.3);margin-top:1px">SURV</div>
              </div>
            </div>
          </div>
          <div class="ov-sub-stats">
            <div class="ov-sub-stat" style="border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.06)">
              <div class="ov-sub-stat-label">Survived</div>
              <div class="ov-sub-stat-val" style="color:#10b981">${survived.toLocaleString('de-DE')}</div>
            </div>
            <div class="ov-sub-stat" style="border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.06)">
              <div class="ov-sub-stat-label">KIA</div>
              <div class="ov-sub-stat-val" style="color:#ef4444">${kia.toLocaleString('de-DE')}</div>
            </div>
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Run</div>
              <div class="ov-sub-stat-val">${runThrough.toLocaleString('de-DE') || '—'}</div>
            </div>
          </div>
        </div>

        <!-- 📋 Quests -->
        <div class="ov-card" onclick="showPage('quests')">
          <div class="ov-card-head">
            <span class="ov-card-tag">📋 QUESTS</span>
            <span class="ov-card-link">Details →</span>
          </div>
          <div class="ov-card-main">
            <div>
              <div class="ov-big-val">${questDone} <span style="font-size:14px;color:var(--t4)">/ ${questTotal || '?'}</span></div>
              <div class="ov-big-sub">${questPct}% abgeschlossen</div>
            </div>
          </div>
          <!-- Progress Bar -->
          <div class="ov-progress-bar">
            <div class="ov-progress-fill" style="width:${questPct}%;background:#f59e0b"></div>
          </div>
          <div class="ov-sub-stats">
            <div class="ov-sub-stat" style="border-color:rgba(245,158,11,0.2);background:rgba(245,158,11,0.06)">
              <div class="ov-sub-stat-label">🏆 Kappa</div>
              <div class="ov-sub-stat-val" style="color:#f59e0b">${kappaDone}/${kappaTotal || '?'}</div>
            </div>
            <div class="ov-sub-stat" style="border-color:rgba(6,182,212,0.2);background:rgba(6,182,212,0.06)">
              <div class="ov-sub-stat-label">🔦 LK</div>
              <div class="ov-sub-stat-val" style="color:#06b6d4">${lkDone}/${lkTotal || '?'}</div>
            </div>
          </div>
        </div>

        <!-- 🏠 Hideout & Stats -->
        <div class="ov-card" onclick="showPage('stats')">
          <div class="ov-card-head">
            <span class="ov-card-tag">🏠 HIDEOUT & STATS</span>
            <span class="ov-card-link">Details →</span>
          </div>
          <div class="ov-card-main">
            <div>
              <div class="ov-big-val">Level <span style="color:var(--ac)">${level}</span></div>
              <div class="ov-big-sub">${esc(name)}</div>
            </div>
          </div>
          <div class="ov-sub-stats">
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Hideout</div>
              <div class="ov-sub-stat-val">${hideoutDone}/${hideoutTotal || '?'}</div>
            </div>
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Kills</div>
              <div class="ov-sub-stat-val">${kills.toLocaleString('de-DE') || '—'}</div>
            </div>
            <div class="ov-sub-stat">
              <div class="ov-sub-stat-label">Spielzeit</div>
              <div class="ov-sub-stat-val">${playtime ? Math.round(playtime / 60) + 'h' : '—'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
  // Canvas nach DOM-Update zeichnen
  setTimeout(() => drawOvChart(last7, today), 150)
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function drawOvChart(data, today) {
  const canvas = document.getElementById('ov-flea-chart')
  if (!canvas || !data.length) return

  canvas.width  = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
  if (canvas.width < 10 || canvas.height < 10) return

  const ctx = canvas.getContext('2d')
  const w   = canvas.width
  const h   = canvas.height
  const ac  = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()
  const max = Math.max(...data.map(d => d.revenue), 1)

  ctx.clearRect(0, 0, w, h)

  const pts = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * w : w / 2,
    y: h - 4 - (d.revenue / max) * (h - 8),
    date: d.date, revenue: d.revenue,
  }))

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, ac + '44')
  grad.addColorStop(1, ac + '00')

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
  ctx.strokeStyle = ac
  ctx.lineWidth   = 2
  ctx.stroke()

  // Dots
  pts.forEach((p, i) => {
    const isLast = i === pts.length - 1
    ctx.beginPath()
    ctx.arc(p.x, p.y, isLast ? 4 : 2.5, 0, Math.PI * 2)
    ctx.fillStyle = ac
    ctx.fill()
    if (isLast) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = ac + '33'
      ctx.fill()
    }
  })
}