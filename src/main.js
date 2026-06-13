const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
const fs   = require('fs')
const Store = require('electron-store')
const { autoUpdater } = require('electron-updater')

const store      = new Store()
const logWatcher  = require('./logWatcher')
const saleStore   = require('./saleStore')
const raidWatcher = require('./raidWatcher')

const isDev  = process.argv.includes('--dev')
const DATA_DIR = path.join(app.getPath('userData'), 'data')

let mainWindow
let tray = null

// ── Setup ────────────────────────────────
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function createTray() {
  // Einfaches Icon aus Text generieren falls kein Icon vorhanden
  const iconPath = path.join(__dirname, '../assets/icon.ico')
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)
  tray.setToolTip('Tarkov Mastertool')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Tarkov Mastertool',
      click: () => { mainWindow?.show(); mainWindow?.focus() }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.isQuitting = true; app.quit() }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Doppelklick → Fenster öffnen
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 1100, minHeight: 680,
    frame: false,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })

  // Minimize to Tray statt schließen
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
      tray?.displayBalloon?.({
        title: 'Tarkov Mastertool',
        content: 'Still running in the background. Double-click the tray icon to open.',
        iconType: 'info',
      })
    }
  })
}

// ── App Ready ────────────────────────────
app.whenReady().then(() => {
  ensureDataDir()
  saleStore.init(DATA_DIR)
  createWindow()
  createTray()

  // Auto-Update (nur in Production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
    autoUpdater.on('update-available', () => {
      mainWindow?.webContents.send('update-available')
    })
    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('update-downloaded')
    })
  }

  // LogWatcher Events
  logWatcher.setDataDir(DATA_DIR)

  logWatcher.on('scan-progress', (data) => {
    mainWindow?.webContents.send('scan-progress', data)
  })

  logWatcher.on('scan-complete', (data) => {
    const stats = saleStore.buildStats()
    mainWindow?.webContents.send('scan-complete', {
      sales: saleStore.getAll().slice(0, 200), // Erste 200 für UI
      stats,
      ...data,
    })
  })

  logWatcher.on('sales-batch', (sales) => {
    const added = saleStore.bulkAdd(sales)
    if (added > 0) {
      mainWindow?.webContents.send('scan-progress', {
        status: `${saleStore.count} Sales geladen...`,
        pct: 50,
        count: saleStore.count,
      })
    }
  })

  logWatcher.on('new-sales', (sales) => {
    const newSales = []
    for (const s of sales) {
      if (saleStore.add(s)) newSales.push(s)
    }
    if (newSales.length > 0) {
      mainWindow?.webContents.send('new-sales', {
        sales: newSales,
        stats: saleStore.buildStats(),
      })
    }
  })

  logWatcher.on('log', (msg) => {
    mainWindow?.webContents.send('log', msg)
  })

  // Settings laden und LogWatcher + RaidWatcher starten
  const settings = store.get('settings', {})
  if (settings.logPath) {
    logWatcher.start(settings.logPath)
    raidWatcher.start(settings.logPath)
  }

  // RaidWatcher Events
  raidWatcher.on('raid-start', (raid) => {
    mainWindow?.webContents.send('raid-start', raid)
  })

  raidWatcher.on('raid-status-request', (raid) => {
    mainWindow?.webContents.send('raid-status-request', raid)
  })
})

app.on('window-all-closed', () => {
  // Nicht beenden — im Tray weiterlaufen
  if (process.platform !== 'darwin' && app.isQuitting) {
    logWatcher.stop()
    saleStore.save()
    app.quit()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
  logWatcher.stop()
  saleStore.save()
})

// ── Window Controls ──────────────────────
ipcMain.on('win-minimize', () => mainWindow?.minimize())
ipcMain.on('win-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('win-close', () => mainWindow?.close())

// ── Settings ─────────────────────────────
ipcMain.handle('get-settings', () => store.get('settings', {
  accentColor: '#e91e8c',
  gameMode: 'pve',
  logPath: '',
  playerName: '',
  gistId: '',
  pat: '',
  sound: true,
  language: 'de',
}))

ipcMain.handle('save-settings', (_, settings) => {
  store.set('settings', settings)
  // LogWatcher neu starten wenn Pfad geändert
  if (settings.logPath) {
    logWatcher.stop()
    logWatcher.start(settings.logPath)
  }
  return true
})

// ── Data ─────────────────────────────────
ipcMain.handle('get-sales', (_, limit = 500) => {
  return saleStore.getAll().slice(0, limit)
})

ipcMain.handle('get-stats', () => {
  return saleStore.buildStats()
})

ipcMain.handle('get-quest-progress', () => {
  const p = path.join(DATA_DIR, 'quest_manual.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return [] }
})

ipcMain.handle('save-quest-progress', (_, ids) => {
  const p = path.join(DATA_DIR, 'quest_manual.json')
  fs.writeFileSync(p, JSON.stringify(ids, null, 2))
  return true
})

ipcMain.handle('get-quest-cache', () => {
  const p = path.join(DATA_DIR, 'quest_cache.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return [] }
})

ipcMain.handle('save-quest-cache', (_, data) => {
  const p = path.join(DATA_DIR, 'quest_cache.json')
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('save-raid', (_, raid) => {
  const p = path.join(DATA_DIR, 'raid_data.json')
  let raids = []
  try { raids = JSON.parse(fs.readFileSync(p, 'utf8')) } catch {}
  raids.unshift(raid)
  if (raids.length > 1000) raids = raids.slice(0, 1000)
  fs.writeFileSync(p, JSON.stringify(raids, null, 2))
  return true
})

ipcMain.handle('get-raids', () => {
  const p = path.join(DATA_DIR, 'raid_data.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return [] }
})

ipcMain.handle('get-hideout-progress', () => {
  const p = path.join(DATA_DIR, 'hideout_progress.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return {} }
})

ipcMain.handle('save-hideout-progress', (_, data) => {
  const p = path.join(DATA_DIR, 'hideout_progress.json')
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('get-hideout-cache', () => {
  const p = path.join(DATA_DIR, 'hideout_cache.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return [] }
})

ipcMain.handle('save-hideout-cache', (_, data) => {
  const p = path.join(DATA_DIR, 'hideout_cache.json')
  fs.writeFileSync(p, JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('detect-log-path', (_, candidates) => {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch {}
  }
  // Registry versuchen
  try {
    const { execSync } = require('child_process')
    const reg = execSync(
      'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EscapeFromTarkov" /v InstallLocation',
      { encoding: 'utf8', timeout: 3000 }
    )
    const match = reg.match(/InstallLocation\s+REG_SZ\s+(.+)/)
    if (match) {
      const logPath = path.join(match[1].trim(), 'Logs')
      if (fs.existsSync(logPath)) return logPath
    }
  } catch {}
  return null
})

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})