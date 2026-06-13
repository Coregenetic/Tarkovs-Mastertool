const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store()
const isDev = process.argv.includes('--dev')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 680,
    frame: false,
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
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
  return true
})
