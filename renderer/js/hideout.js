// ── HIDEOUT STATE ─────────────────────────
let hideoutData    = null
let hideoutLevels  = {} // { stationId_level: true }

// ── INIT ──────────────────────────────────
function initHideout() {
  loadHideoutProgress()
  fetchHideout()
}

// ── PERSIST ───────────────────────────────
async function loadHideoutProgress() {
  try {
    const saved = await window.api.getHideoutProgress()
    hideoutLevels = saved || {}
    updateOverviewHideoutStats()
    if (currentPage === 'hideout') renderHideout()
  } catch(e) {}
}

async function saveHideoutProgress() {
  try {
    await window.api.saveHideoutProgress(hideoutLevels)
    updateOverviewHideoutStats()
    if (currentPage === 'overview') renderOverview()
  } catch(e) {}
}

function updateOverviewHideoutStats() {
  if (!hideoutData) return
  const total = hideoutData.length
  const done  = hideoutData.filter(s =>
    s.levels?.every(l => hideoutLevels[`${s.id}_${l.level}`])
  ).length
  window._hideoutDone  = done
  window._hideoutTotal = total
}

// ── API ───────────────────────────────────
async function fetchHideout() {
  if (hideoutData) return
  try {
    const cached = await window.api.getHideoutCache()
    if (cached?.length > 0) {
      hideoutData = cached
      updateOverviewHideoutStats()
      if (currentPage === 'hideout') renderHideout()
      _fetchHideoutFromAPI(true)
      return
    }
    await _fetchHideoutFromAPI(false)
  } catch(e) {}
}

async function _fetchHideoutFromAPI(background = false) {
  try {
    const r = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{
        hideoutStations {
          id name
          levels {
            id level
            itemRequirements { count item { id name iconLink } }
          }
        }
      }` })
    })
    const d = await r.json()
    const stations = d?.data?.hideoutStations || []
    if (stations.length > 0) {
      hideoutData = stations
      await window.api.saveHideoutCache(hideoutData)
      updateOverviewHideoutStats()
      if (currentPage === 'hideout') renderHideout()
    }
  } catch(e) { console.warn('fetchHideout:', e) }
}

// ── TOGGLE ────────────────────────────────
function toggleHideoutLevel(stationId, level) {
  const key = `${stationId}_${level}`

  // Klick auf Level N: alle Levels bis N setzen/entfernen
  const station = hideoutData?.find(s => s.id === stationId)
  if (!station) return

  const maxLevel = Math.max(...station.levels.map(l => l.level))
  const curMax   = station.levels
    .filter(l => hideoutLevels[`${stationId}_${l.level}`])
    .reduce((m, l) => Math.max(m, l.level), 0)

  if (curMax >= level) {
    // Abwählen: alle Levels >= level entfernen
    for (const l of station.levels) {
      if (l.level >= level) delete hideoutLevels[`${stationId}_${l.level}`]
    }
  } else {
    // Auswählen: alle Levels bis level setzen
    for (const l of station.levels) {
      if (l.level <= level) hideoutLevels[`${stationId}_${l.level}`] = true
    }
  }

  saveHideoutProgress()
  renderHideout()
}

// ── RENDER ────────────────────────────────
function renderHideout() {
  const el = document.getElementById('page-hideout')
  if (!el) return

  if (!hideoutData) {
    el.innerHTML = `
      <div class="q-loading">
        <i class="ti ti-loader" style="animation:spin 1s linear infinite;font-size:32px;color:var(--ac)"></i>
        <div style="color:var(--t2)">Lade Hideout von tarkov.dev...</div>
      </div>`
    return
  }

  const total     = hideoutData.length
  const completed = hideoutData.filter(s =>
    s.levels?.every(l => hideoutLevels[`${s.id}_${l.level}`])
  ).length
  const pct = total > 0 ? Math.round(completed / total * 100) : 0

  el.innerHTML = `
    <div class="hideout-wrap">

      <!-- Header -->
      <div class="hideout-header">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--t2)">Hideout Fortschritt</div>
          <div style="font-size:11px;color:var(--t4);margin-top:2px">${completed} / ${total} Stationen komplett</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex:1;max-width:300px">
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:var(--ac);border-radius:3px;transition:width .6s"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:var(--ac);flex-shrink:0">${pct}%</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="hideout-grid">
        ${hideoutData.map(station => {
          const maxLevel  = Math.max(...station.levels.map(l => l.level), 0)
          const curLevel  = station.levels
            .filter(l => hideoutLevels[`${station.id}_${l.level}`])
            .reduce((m, l) => Math.max(m, l.level), 0)
          const isComplete = curLevel === maxLevel && maxLevel > 0
          const pctS = maxLevel > 0 ? Math.round(curLevel / maxLevel * 100) : 0

          return `
            <div class="hideout-card ${isComplete ? 'complete' : ''}">
              <div class="hideout-card-name">${esc(station.name)}</div>
              <div class="hideout-levels">
                ${station.levels.map(l => {
                  const done = !!hideoutLevels[`${station.id}_${l.level}`]
                  return `
                    <div class="hideout-level ${done ? 'done' : ''}"
                      onclick="toggleHideoutLevel('${station.id}', ${l.level})"
                      title="Level ${l.level}">
                      ${l.level}
                    </div>`
                }).join('')}
              </div>
              <div class="hideout-bar">
                <div class="hideout-bar-fill" style="width:${pctS}%"></div>
              </div>
              <div style="font-size:9px;color:var(--t4);margin-top:3px">
                ${curLevel}/${maxLevel} ${isComplete ? '✓' : ''}
              </div>
            </div>`
        }).join('')}
      </div>

    </div>
  `
}