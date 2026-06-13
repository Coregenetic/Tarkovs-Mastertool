// ── RAID STATE ────────────────────────────
let raidData    = []
let activeRaid  = null

// ── INIT ──────────────────────────────────
function initRaids() {
  loadRaids()

  // Raid Start
  window.api.on('raid-start', (raid) => {
    activeRaid = raid
    showRaidStartToast(raid)
    if (currentPage === 'raids') renderRaids()
    if (currentPage === 'overview') renderOverview()
  })

  // Raid Ende → Status-Modal
  window.api.on('raid-status-request', (raid) => {
    showRaidStatusModal(raid)
  })
}

async function loadRaids() {
  try {
    raidData = await window.api.getRaids() || []
    if (currentPage === 'raids') renderRaids()
  } catch(e) { console.warn('loadRaids:', e) }
}

// ── RAID STATUS MODAL ─────────────────────
function showRaidStatusModal(raid) {
  const existing = document.getElementById('__raid-modal')
  if (existing) existing.remove()

  const duration = raid.duration
    ? `${Math.floor(raid.duration / 60)}m ${raid.duration % 60}s`
    : '—'

  const el = document.createElement('div')
  el.id = '__raid-modal'
  el.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
    animation:fadeIn .2s ease;
  `

  el.innerHTML = `
    <div style="
      background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);
      border-radius:14px;padding:24px;width:320px;
      animation:slideUp .25s ease;
    ">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:32px;margin-bottom:8px">${getMapIcon(raid.map)}</div>
        <div style="font-size:16px;font-weight:700;color:#fff">${esc(raid.map)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px">
          ${duration} · ${new Date(raid.startTime).toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>

      <div style="font-size:12px;color:rgba(255,255,255,0.5);text-align:center;margin-bottom:12px">
        Wie ist der Raid gelaufen?
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <button onclick="submitRaidStatus('${JSON.stringify(raid).replace(/'/g, "\\'")}', 'Survived')"
          style="padding:12px;border-radius:8px;border:1px solid rgba(16,185,129,0.4);
          background:rgba(16,185,129,0.15);color:#10b981;cursor:pointer;
          font-size:13px;font-weight:700;font-family:'Inter',sans-serif;">
          ✓ Survived
        </button>
        <button onclick="submitRaidStatus('${JSON.stringify(raid).replace(/'/g, "\\'")}', 'KIA')"
          style="padding:12px;border-radius:8px;border:1px solid rgba(239,68,68,0.4);
          background:rgba(239,68,68,0.15);color:#ef4444;cursor:pointer;
          font-size:13px;font-weight:700;font-family:'Inter',sans-serif;">
          ✗ KIA
        </button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="submitRaidStatus('${JSON.stringify(raid).replace(/'/g, "\\'")}', 'RunThrough')"
          style="padding:10px;border-radius:8px;border:1px solid rgba(245,158,11,0.3);
          background:rgba(245,158,11,0.1);color:#f59e0b;cursor:pointer;
          font-size:12px;font-weight:600;font-family:'Inter',sans-serif;">
          Run Through
        </button>
        <button onclick="submitRaidStatus('${JSON.stringify(raid).replace(/'/g, "\\'")}', 'MIA')"
          style="padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);cursor:pointer;
          font-size:12px;font-weight:600;font-family:'Inter',sans-serif;">
          MIA
        </button>
      </div>
    </div>
  `

  document.body.appendChild(el)
}

async function submitRaidStatus(raidJson, status) {
  try {
    const raid = JSON.parse(raidJson)
    const fullRaid = {
      ...raid,
      status,
      id: `${raid.startTime}_${raid.mapKey}`,
      date: raid.startTime?.slice(0, 10),
    }

    await window.api.saveRaid(fullRaid)
    raidData.unshift(fullRaid)
    activeRaid = null

    document.getElementById('__raid-modal')?.remove()

    showRaidToast(fullRaid)
    if (currentPage === 'raids')    renderRaids()
    if (currentPage === 'overview') renderOverview()

  } catch(e) { console.error('submitRaidStatus:', e) }
}

// ── RENDER ────────────────────────────────
function renderRaids() {
  const el = document.getElementById('page-raids')
  if (!el) return

  const today = new Date().toISOString().slice(0, 10)

  // Stats berechnen
  const total    = raidData.length
  const survived = raidData.filter(r => r.status === 'Survived').length
  const kia      = raidData.filter(r => r.status === 'KIA').length
  const runThru  = raidData.filter(r => r.status === 'RunThrough').length
  const survRate = total > 0 ? Math.round(survived / total * 100) : 0

  // Map-Stats
  const byMap = {}
  for (const r of raidData) {
    if (!byMap[r.map]) byMap[r.map] = { total: 0, survived: 0 }
    byMap[r.map].total++
    if (r.status === 'Survived') byMap[r.map].survived++
  }
  const mapList = Object.entries(byMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)

  el.innerHTML = `
    <div class="raids-wrap">

      <!-- Aktiver Raid Banner -->
      ${activeRaid ? `
        <div class="raid-active-banner">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="raid-pulse"></div>
            <span style="font-weight:700;color:#fff">Raid läuft: ${esc(activeRaid.map)}</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5)">
            ${new Date(activeRaid.startTime).toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'})}
          </div>
        </div>` : ''}

      <!-- Stats Row -->
      <div class="raids-stats-row">
        <div class="raids-stat-card">
          <div class="raids-stat-label">Raids gesamt</div>
          <div class="raids-stat-val">${total}</div>
        </div>
        <div class="raids-stat-card" style="border-color:rgba(16,185,129,0.3)">
          <div class="raids-stat-label">Survived</div>
          <div class="raids-stat-val" style="color:#10b981">${survived}</div>
        </div>
        <div class="raids-stat-card" style="border-color:rgba(239,68,68,0.3)">
          <div class="raids-stat-label">KIA</div>
          <div class="raids-stat-val" style="color:#ef4444">${kia}</div>
        </div>
        <div class="raids-stat-card" style="border-color:rgba(245,158,11,0.3)">
          <div class="raids-stat-label">Run Through</div>
          <div class="raids-stat-val" style="color:#f59e0b">${runThru}</div>
        </div>
        <div class="raids-stat-card" style="border-color:var(--ac-border);background:var(--ac-dim)">
          <div class="raids-stat-label">Survival Rate</div>
          <div class="raids-stat-val" style="color:var(--ac)">${survRate}%</div>
        </div>
      </div>

      <!-- Map Stats + Letzte Raids -->
      <div class="raids-body">

        <!-- Map Stats -->
        <div class="raids-card">
          <div class="raids-card-title">Maps</div>
          ${mapList.length === 0
            ? '<div class="raids-empty">Noch keine Raids</div>'
            : mapList.map(([map, stats]) => {
                const rate = stats.total > 0 ? Math.round(stats.survived / stats.total * 100) : 0
                return `
                  <div class="raids-map-row">
                    <span class="raids-map-icon">${getMapIcon(map)}</span>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:12px;font-weight:600;color:var(--t1)">${esc(map)}</div>
                      <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:4px">
                        <div style="height:100%;width:${rate}%;background:#10b981;border-radius:2px"></div>
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                      <div style="font-size:12px;font-weight:700;color:var(--t1)">${stats.total}x</div>
                      <div style="font-size:10px;color:#10b981">${rate}%</div>
                    </div>
                  </div>`
              }).join('')
          }
        </div>

        <!-- Letzte Raids -->
        <div class="raids-card">
          <div class="raids-card-title">Letzte Raids</div>
          ${raidData.slice(0, 20).map(r => {
            const STATUS_COLOR = { Survived:'#10b981', KIA:'#ef4444', RunThrough:'#f59e0b', MIA:'rgba(255,255,255,0.3)' }
            const STATUS_LABEL = { Survived:'✓', KIA:'✗', RunThrough:'↻', MIA:'?' }
            const col   = STATUS_COLOR[r.status] || 'rgba(255,255,255,0.3)'
            const label = STATUS_LABEL[r.status] || '?'
            const dur   = r.duration ? `${Math.floor(r.duration/60)}m` : ''
            return `
              <div class="raids-raid-row">
                <span style="font-size:16px">${getMapIcon(r.map)}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:500;color:var(--t1)">${esc(r.map)}</div>
                  <div style="font-size:10px;color:var(--t4)">${r.date || ''} ${dur}</div>
                </div>
                <div style="width:28px;height:28px;border-radius:50%;
                  background:${col}22;border:1px solid ${col}44;
                  display:flex;align-items:center;justify-content:center;
                  font-size:12px;font-weight:700;color:${col};flex-shrink:0">
                  ${label}
                </div>
              </div>`
          }).join('') || '<div class="raids-empty">Noch keine Raids</div>'}
        </div>

      </div>
    </div>
  `
}

// ── HELPERS ──────────────────────────────
const MAP_ICONS = {
  'Customs':          '🏭', 'Factory':'🏗️', 'Factory (Night)':'🌙',
  'Interchange':      '🛒', 'The Lab':'🧪', 'Lighthouse':'🔦',
  'Reserve':          '🏰', 'Shoreline':'🏖️', 'Streets of Tarkov':'🏙️',
  'Woods':            '🌲', 'Ground Zero':'💥', 'Ground Zero+':'💥',
  'Suburbs':          '🏘️', 'Labyrinth':'🌀',
}

function getMapIcon(map) {
  return MAP_ICONS[map] || '🗺️'
}

function showRaidStartToast(raid) {
  showToast({
    icon: getMapIcon(raid.map),
    title: `Raid auf ${raid.map}`,
    sub: 'Viel Erfolg!',
    tag: 'RAID START',
    duration: 4000,
  })
}

function showRaidToast(raid) {
  const STATUS_COL = { Survived:'#10b981', KIA:'#ef4444', RunThrough:'#f59e0b', MIA:'rgba(255,255,255,0.4)' }
  showToast({
    icon: getMapIcon(raid.map),
    title: `${raid.map} — ${raid.status}`,
    sub: raid.duration ? `${Math.floor(raid.duration/60)}m ${raid.duration%60}s` : '',
    tag: 'RAID ENDE',
    color: STATUS_COL[raid.status] || '',
    duration: 5000,
  })
}