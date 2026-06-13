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
  detectLogPath:        (c)   => ipcRenderer.invoke('detect-log-path', c),
  saveRaid:             (r)   => ipcRenderer.invoke('save-raid', r),
  getRaids:             ()    => ipcRenderer.invoke('get-raids'),
  getHideoutProgress:   ()    => ipcRenderer.invoke('get-hideout-progress'),
  saveHideoutProgress:  (d)   => ipcRenderer.invoke('save-hideout-progress', d),
  getHideoutCache:      ()    => ipcRenderer.invoke('get-hideout-cache'),
  saveHideoutCache:     (d)   => ipcRenderer.invoke('save-hideout-cache', d),
  getQuestProgress:  () => ipcRenderer.invoke('get-quest-progress'),
  saveQuestProgress: (ids)  => ipcRenderer.invoke('save-quest-progress', ids),
  getQuestCache:     ()     => ipcRenderer.invoke('get-quest-cache'),
  saveQuestCache:    (data) => ipcRenderer.invoke('save-quest-cache', data),
  getDataDir: ()    => ipcRenderer.invoke('get-data-dir'),

  // Events
  on:   (ch, fn) => ipcRenderer.on(ch, (_, ...args) => fn(...args)),
  off:  (ch, fn) => ipcRenderer.removeListener(ch, fn),
  send: (ch)     => ipcRenderer.send(ch),
})