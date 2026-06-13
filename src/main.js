const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs   = require('fs')
const Store = require('electron-store')

const store      = new Store()
const logWatcher = require('./logWatcher')
const saleStore  = require('./saleStore')

const isDev  = process.argv.includes('--dev')
const DATA_DIR = path.join(app.getPath('userData'), 'data')

let mainWindow

// ── Setup ────────────────────────────────
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
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
}

// ── App Ready ────────────────────────────
app.whenReady().then(() => {
  ensureDataDir()
  saleStore.init(DATA_DIR)
  createWindow()

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

  // Settings laden und LogWatcher starten
  const settings = store.get('settings', {})
  if (settings.logPath) {
    logWatcher.start(settings.logPath)
  }
})

app.on('window-all-closed', () => {
  logWatcher.stop()
  saleStore.save()
  if (process.platform !== 'darwin') app.quit()
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

ipcMain.handle('get-data-dir', () => DATA_DIR)
