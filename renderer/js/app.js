// ── STATE ─────────────────────────────────
let settings = {}
let currentPage = 'overview'

// ── INIT ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings()
  initNav()
  initTitlebar()
  initDate()
  initSettings()
  applyAccentColor(settings.accentColor || '#e91e8c')
})

// ── SETTINGS LADEN ────────────────────────
async function loadSettings() {
  try {
    settings = await window.api.getSettings()
    applySettingsToUI()
  } catch(e) {
    console.warn('Settings laden fehlgeschlagen:', e)
    settings = {
      accentColor: '#e91e8c',
      gameMode: 'pve',
      logPath: '',
      playerName: '',
      sound: true,
      language: 'de',
    }
  }
}

function applySettingsToUI() {
  // Inputs befüllen
  const pn = document.getElementById('set-playerName')
  const lp = document.getElementById('set-logPath')
  const pt = document.getElementById('set-pat')
  const gi = document.getElementById('set-gistId')
  const sn = document.getElementById('set-sound')

  if (pn) pn.value = settings.playerName || ''
  if (lp) lp.value = settings.logPath || ''
  if (pt) pt.value = settings.pat || ''
  if (gi) gi.value = settings.gistId || ''
  if (sn) sn.checked = settings.sound !== false

  // Gamemode
  document.querySelectorAll('#gamemodeGroup .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === (settings.gameMode || 'pve'))
  })

  // Language
  document.querySelectorAll('#languageGroup .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === (settings.language || 'de'))
  })

  // Akzentfarbe
  applyAccentColor(settings.accentColor || '#e91e8c')

  // Gamemode Badge
  const badge = document.getElementById('gamemodeBadge')
  if (badge) badge.textContent = (settings.gameMode || 'pve').toUpperCase()

  // Avatar
  const av = document.getElementById('sidebarAvatar')
  if (av) av.textContent = (settings.playerName || 'C')[0].toUpperCase()
}

// ── AKZENTFARBE ───────────────────────────
function applyAccentColor(color) {
  document.documentElement.style.setProperty('--ac', color)

  // Berechne dim und border aus der Farbe
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0,2), 16)
  const g = parseInt(hex.slice(2,4), 16)
  const b = parseInt(hex.slice(4,6), 16)
  document.documentElement.style.setProperty('--ac-dim', `rgba(${r},${g},${b},0.15)`)
  document.documentElement.style.setProperty('--ac-border', `rgba(${r},${g},${b},0.3)`)

  // Color-Dots updaten
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === color)
  })
}

// ── NAVIGATION ────────────────────────────
const PAGE_TITLES = {
  overview: 'Overview',
  flea:     'Flea Market',
  raids:    'Raids',
  quests:   'Quests',
  stats:    'Stats',
  hideout:  'Hideout',
  settings: 'Einstellungen',
}

function showPage(name) {
  if (currentPage === name) return
  currentPage = name

  // Alle Seiten ausblenden
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))

  // Aktive Seite einblenden
  const page = document.getElementById('page-' + name)
  const btn  = document.querySelector(`.nav-btn[data-page="${name}"]`)
  if (page) page.classList.add('active')
  if (btn)  btn.classList.add('active')

  // Titel updaten
  const title = document.getElementById('pageTitle')
  if (title) title.textContent = PAGE_TITLES[name] || name
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page))
  })
}

// ── TITLEBAR ──────────────────────────────
function initTitlebar() {
  document.getElementById('btn-minimize')?.addEventListener('click', () => window.api.minimize())
  document.getElementById('btn-maximize')?.addEventListener('click', () => window.api.maximize())
  document.getElementById('btn-close')?.addEventListener('click', () => window.api.close())
}

// ── DATUM ─────────────────────────────────
function initDate() {
  const el = document.getElementById('pageDate')
  if (!el) return
  const now = new Date()
  el.textContent = now.toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ── SETTINGS ──────────────────────────────
function initSettings() {
  // Color Picker
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      applyAccentColor(dot.dataset.color)
      settings.accentColor = dot.dataset.color
    })
  })

  // Gamemode Toggle
  document.querySelectorAll('#gamemodeGroup .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#gamemodeGroup .toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      settings.gameMode = btn.dataset.mode
      const badge = document.getElementById('gamemodeBadge')
      if (badge) badge.textContent = btn.dataset.mode.toUpperCase()
    })
  })

  // Language Toggle
  document.querySelectorAll('#languageGroup .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#languageGroup .toggle-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      settings.language = btn.dataset.lang
    })
  })

  // Auto-Detect Log-Pfad
  document.getElementById('btn-detectPath')?.addEventListener('click', () => {
    const paths = [
      'C:\\Battlestate Games\\Escape from Tarkov\\Logs',
      'D:\\Battlestate Games\\Escape from Tarkov\\Logs',
      'C:\\Program Files (x86)\\Battlestate Games\\EFT\\Logs',
    ]
    // In Electron würden wir fs.existsSync nutzen — hier setzen wir den häufigsten Pfad
    const input = document.getElementById('set-logPath')
    if (input && !input.value) {
      input.value = 'D:\\Battlestate Games\\Escape from Tarkov\\Logs'
      input.style.borderColor = 'var(--success)'
      setTimeout(() => input.style.borderColor = '', 2000)
    }
  })

  // Speichern
  document.getElementById('btn-saveSettings')?.addEventListener('click', async () => {
    settings.playerName = document.getElementById('set-playerName')?.value || ''
    settings.logPath    = document.getElementById('set-logPath')?.value || ''
    settings.pat        = document.getElementById('set-pat')?.value || ''
    settings.gistId     = document.getElementById('set-gistId')?.value || ''
    settings.sound      = document.getElementById('set-sound')?.checked ?? true

    try {
      await window.api.saveSettings(settings)
      applySettingsToUI()

      const btn = document.getElementById('btn-saveSettings')
      const orig = btn.textContent
      btn.textContent = '✓ Gespeichert!'
      btn.style.background = 'var(--success)'
      setTimeout(() => {
        btn.textContent = orig
        btn.style.background = ''
      }, 2000)
    } catch(e) {
      console.error('Speichern fehlgeschlagen:', e)
    }
  })
}
