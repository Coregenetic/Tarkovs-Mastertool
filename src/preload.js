const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close:    () => ipcRenderer.send('win-close'),

  // Settings
  getSettings:  () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  // Data
  getSales: (limit) => ipcRenderer.invoke('get-sales', limit),
  getStats: ()      => ipcRenderer.invoke('get-stats'),
  getDataDir: ()    => ipcRenderer.invoke('get-data-dir'),

  // Events
  on:  (ch, fn) => ipcRenderer.on(ch, (_, ...args) => fn(...args)),
  off: (ch, fn) => ipcRenderer.removeListener(ch, fn),
})
