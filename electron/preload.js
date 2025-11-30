const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => process.versions.electron,
  
  // Update Listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download_progress', (_event, value) => callback(value)),
  
  // Actions
  restartApp: () => ipcRenderer.send('restart_app')
});