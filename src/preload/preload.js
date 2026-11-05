const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('foxline', {
  getData: () => ipcRenderer.invoke('get-data'),
  setSession: (s) => ipcRenderer.invoke('set-session', s),
  setSettings: (s) => ipcRenderer.invoke('set-settings', s),
  addBookmark: (b) => ipcRenderer.invoke('add-bookmark', b),
  removeBookmark: (id) => ipcRenderer.invoke('remove-bookmark', id),
  addHistory: (item) => ipcRenderer.invoke('add-history', item),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  newWindow: (incognito) => ipcRenderer.invoke('new-window', incognito),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showItem: (p) => ipcRenderer.invoke('show-item', p),
  setDefaultBrowser: () => ipcRenderer.invoke('set-default-browser'),
  appInfo: () => ipcRenderer.invoke('app-info'),
  updateStatus: () => ipcRenderer.invoke('update-status'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onOpenUrl: (cb) => ipcRenderer.on('open-url', (_, url) => cb(url)),
  onDownloadUpdate: (cb) => ipcRenderer.on('download-update', (_, data) => cb(data)),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (_, data) => cb(data))
});
