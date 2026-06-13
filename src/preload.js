const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Window Controls
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close:    () => ipcRenderer.send('win-close'),

  // Settings
  getSettings:  () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  // Events vom Main-Prozess empfangen
  on: (channel, fn) => ipcRenderer.on(channel, (_, ...args) => fn(...args)),
  off: (channel, fn) => ipcRenderer.off(channel, fn),
})
