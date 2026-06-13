// ── QUEST STATE ───────────────────────────
let questData    = null
let completedIds = new Set()
let questFilter  = 'all'
let questSearch  = ''

// ── INIT ──────────────────────────────────
function initQuests() {
  loadCompletedIds()
}

// ── LOAD / SAVE ───────────────────────────
async function loadCompletedIds() {
  try {
    const saved = await window.api.getQuestProgress()
    completedIds = new Set(saved || [])
    updateOverviewQuestStats()
  } catch(e) { console.warn('loadCompletedIds:', e) }
}

async function saveCompletedIds() {
  try {
    await window.api.saveQuestProgress([...completedIds])
  } catch(e) { console.warn('saveCompletedIds:', e) }
}

// ── TARKOV.DEV API ────────────────────────
async function fetchQuests() {
  if (questData) return

  // Erst aus lokalem Cache laden
  try {
    const cached = await window.api.getQuestCache()
    if (cached && cached.length > 0) {
      questData = cached
      updateOverviewQuestStats()
      if (currentPage === 'quests') renderQuests()
      // Im Hintergrund trotzdem aktualisieren
      _fetchQuestsFromAPI(true)
      return
    }
  } catch(e) {}

  // Kein Cache — direkt von API laden
  await _fetchQuestsFromAPI(false)
}

async function _fetchQuestsFromAPI(background = false) {
  if (!background) {
    // Loading-Anzeige aktualisieren
    const el = document.getElementById('page-quests')
    if (el) el.innerHTML = `
      <div class="q-loading">
        <i class="ti ti-loader" style="animation:spin 1s linear infinite;font-size:32px;color:var(--ac)"></i>
        <div style="color:var(--t2);font-size:14px">Lade Quests von tarkov.dev...</div>
        <div style="color:var(--t4);font-size:11px;margin-top:4px">Spielmodus: ${(settings?.gameMode || 'pve').toUpperCase()}</div>
      </div>`
  }

  try {
    const gm = settings?.gameMode || 'pve'
    console.log('[Quests] Lade von API, GameMode:', gm)

    const r = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{
        tasks(gameMode:${gm}) {
          id name
          trader { name }
          minPlayerLevel
          experience
          kappaRequired
          lightkeeperRequired
          taskRequirements { task { id } status }
        }
      }` })
    })

    if (!r.ok) {
      console.error('[Quests] HTTP Fehler:', r.status)
      showQuestError(`API Fehler: ${r.status}`)
      return
    }

    const d = await r.json()
    console.log('[Quests] API Antwort:', d?.data?.tasks?.length, 'Tasks')

    const tasks = d?.data?.tasks || []
    if (tasks.length > 0) {
      questData = tasks
      await window.api.saveQuestCache(questData)
      updateOverviewQuestStats()
      if (currentPage === 'quests') renderQuests()
    } else {
      console.warn('[Quests] Keine Tasks erhalten:', JSON.stringify(d).slice(0, 200))
      showQuestError('Keine Quests von API erhalten')
    }
  } catch(e) {
    console.error('[Quests] Fetch Fehler:', e)
    showQuestError(`Ladefehler: ${e.message}`)
  }
}

function showQuestError(msg) {
  const el = document.getElementById('page-quests')
  if (!el || currentPage !== 'quests') return
  el.innerHTML = `
    <div class="q-loading">
      <i class="ti ti-alert-circle" style="font-size:32px;color:var(--danger)"></i>
      <div style="color:var(--t2);font-size:14px">${msg}</div>
      <button onclick="_fetchQuestsFromAPI(false)" style="
        margin-top:8px;padding:8px 16px;background:var(--ac);border:none;
        border-radius:var(--r-sm);color:#fff;cursor:pointer;font-family:'Inter',sans-serif;font-size:12px
      ">Erneut versuchen</button>
    </div>`
}

function updateOverviewQuestStats() {
  if (!questData) return
  const kappaIds = new Set(questData.filter(q => q.kappaRequired).map(q => q.id))
  const lkIds    = new Set(questData.filter(q => q.lightkeeperRequired).map(q => q.id))

  window._questDone  = completedIds.size
  window._questTotal = questData.length
  window._kappaDone  = [...kappaIds].filter(id => completedIds.has(id)).length
  window._kappaTotal = kappaIds.size
  window._lkDone     = [...lkIds].filter(id => completedIds.has(id)).length
  window._lkTotal    = lkIds.size
}

// ── DEPENDENCY RESOLUTION ─────────────────
function completeWithDeps(questId) {
  const quest = questData?.find(q => q.id === questId)
  if (!quest) return
  for (const req of quest.taskRequirements || []) {
    if (req.task?.id && !completedIds.has(req.task.id))
      completeWithDeps(req.task.id)
  }
  completedIds.add(questId)
}

function toggleQuest(questId, done) {
  if (done) completeWithDeps(questId)
  else completedIds.delete(questId)
  updateOverviewQuestStats()
  saveCompletedIds()
  renderQuests()
  if (currentPage === 'overview') renderOverview()
}

// ── RENDER ────────────────────────────────
function renderQuests() {
  const el = document.getElementById('page-quests')
  if (!el) return

  if (!questData) {
    el.innerHTML = `
      <div class="q-loading">
        <i class="ti ti-loader" style="animation:spin 1s linear infinite;font-size:32px;color:var(--ac)"></i>
        <div>Lade Quests von tarkov.dev...</div>
      </div>`
    fetchQuests()
    return
  }

  const kappaIds = new Set(questData.filter(q => q.kappaRequired).map(q => q.id))
  const lkIds    = new Set(questData.filter(q => q.lightkeeperRequired).map(q => q.id))
  const traders  = [...new Set(questData.map(q => q.trader?.name).filter(Boolean))].sort()

  const totalDone  = completedIds.size
  const kappaDone  = [...kappaIds].filter(id => completedIds.has(id)).length
  const questPct   = questData.length > 0 ? Math.round(totalDone / questData.length * 100) : 0
  const kappaPct   = kappaIds.size > 0 ? Math.round(kappaDone / kappaIds.size * 100) : 0

  // Filter
  const filtered = questData.filter(q => {
    const done = completedIds.has(q.id)
    if (questFilter === 'active'      && done) return false
    if (questFilter === 'completed'   && !done) return false
    if (questFilter === 'kappa'       && !kappaIds.has(q.id)) return false
    if (questFilter === 'lightkeeper' && !lkIds.has(q.id)) return false
    if (!['all','active','completed','kappa','lightkeeper'].includes(questFilter) && q.trader?.name !== questFilter) return false
    if (questSearch && !q.name.toLowerCase().includes(questSearch) &&
        !(q.trader?.name || '').toLowerCase().includes(questSearch)) return false
    return true
  })

  el.innerHTML = `
    <div class="q-wrap">

      <!-- Header -->
      <div class="q-header">

        <!-- Progress Bars -->
        <div class="q-progress-row">
          <div class="q-progress-item">
            <div class="q-progress-label">
              <span>Gesamt</span>
              <span class="q-progress-val">${totalDone} / ${questData.length}</span>
            </div>
            <div class="q-bar"><div class="q-bar-fill" style="width:${questPct}%;background:var(--ac)"></div></div>
          </div>
          <div class="q-progress-item">
            <div class="q-progress-label">
              <span>🏆 Kappa</span>
              <span class="q-progress-val" style="color:#f59e0b">${kappaDone} / ${kappaIds.size}</span>
            </div>
            <div class="q-bar"><div class="q-bar-fill" style="width:${kappaPct}%;background:#f59e0b"></div></div>
          </div>
        </div>

        <!-- Filter Buttons -->
        <div class="q-filters">
          ${[
            { key:'all',         label:'Alle' },
            { key:'active',      label:'Offen' },
            { key:'completed',   label:'Erledigt' },
            { key:'kappa',       label:'🏆 Kappa' },
            { key:'lightkeeper', label:'🔦 Lightkeeper' },
          ].map(f => `
            <button class="q-filter-btn ${questFilter === f.key ? 'active' : ''}"
              onclick="questFilter='${f.key}';renderQuests()">${f.label}</button>
          `).join('')}

          <select class="q-trader-select" onchange="questFilter=this.value;renderQuests()">
            <option value="all">Trader...</option>
            ${traders.map(t => `
              <option value="${t}" ${questFilter === t ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>

          <input class="q-search" type="search" placeholder="Quest suchen..."
            value="${questSearch}"
            oninput="questSearch=this.value.toLowerCase();renderQuests()">
        </div>

      </div>

      <!-- Quest Liste -->
      <div class="q-list">
        ${filtered.length === 0
          ? '<div class="q-empty">Keine Quests gefunden</div>'
          : filtered.map(q => {
              const done     = completedIds.has(q.id)
              const isKappa  = kappaIds.has(q.id)
              const isLK     = lkIds.has(q.id)
              const blocked  = !done && (q.taskRequirements || []).some(r => r.task?.id && !completedIds.has(r.task.id))

              return `
                <div class="q-row ${done ? 'done' : ''}" onclick="toggleQuest('${q.id}', ${!done})">
                  <div class="q-checkbox ${done ? 'checked' : ''}">
                    ${done ? '<i class="ti ti-check"></i>' : ''}
                  </div>
                  <div class="q-info">
                    <div class="q-name">${esc(q.name)}</div>
                    <div class="q-meta">${esc(q.trader?.name || '')}${q.minPlayerLevel > 1 ? ` · Lvl ${q.minPlayerLevel}+` : ''}</div>
                  </div>
                  <div class="q-badges">
                    ${isKappa  ? '<span class="q-badge kappa">K</span>'  : ''}
                    ${isLK     ? '<span class="q-badge lk">LK</span>'    : ''}
                    ${blocked  ? '<span class="q-badge blocked">🔒</span>' : ''}
                  </div>
                  ${q.experience ? `<div class="q-xp">${(q.experience/1000).toFixed(0)}K XP</div>` : ''}
                </div>`
            }).join('')
        }
      </div>

    </div>
  `
}