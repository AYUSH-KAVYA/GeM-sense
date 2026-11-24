const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated OS-level APIs to the renderer window
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,

  saveCSVFile: (defaultFileName, csvContent) =>
    ipcRenderer.invoke('os:save-csv', { defaultFileName, csvContent }),

  showNotification: (title, body) =>
    ipcRenderer.invoke('os:notify', { title, body }),

  revealFile: (filePath) =>
    ipcRenderer.invoke('os:reveal-file', { filePath }),

  getClipboardWatcherState: () =>
    ipcRenderer.invoke('os:get-watcher-state'),

  toggleClipboardWatcher: (enabled) =>
    ipcRenderer.invoke('os:toggle-watcher', { enabled }),

  onTriggerSearch: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }
    const listener = (_event, query) => callback(query);
    ipcRenderer.on('os:trigger-search', listener);
    return () => {
      ipcRenderer.removeListener('os:trigger-search', listener);
    };
  },
});
