import {
  app,
  BrowserWindow,
  shell,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  clipboard,
  Notification,
  dialog,
  ipcMain,
} from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// 16x16 emerald badge icon as Data URL fallback for Tray & Menu bar
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANElEQVR4nGNgGLSAvyzvPzImWyNJBhHSTNAQigwgVjNOQ4aBAQMfC8QaglczPoOI1kh3AAARNtnhxN/1GAAAAABJRU5ErkJggg==';

// Top-level references to prevent garbage collection
let mainWindow = null;
let tray = null;
let isQuitting = false;
let clipboardWatcherEnabled = true;
let lastClipboardText = '';
let clipboardInterval = null;

/**
 * Restore, show, and bring the main window into active focus.
 */
function showAndFocusWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

/**
 * Update the context menu of the system tray icon to reflect watcher status.
 */
function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open GeM Compare',
      click: () => {
        showAndFocusWindow();
      },
    },
    {
      label: 'Audit Clipboard Now',
      click: () => {
        const text = clipboard.readText().trim();
        showAndFocusWindow();
        if (text && mainWindow) {
          mainWindow.webContents.send('os:trigger-search', text);
        }
      },
    },
    {
      label: 'Auto-Watch Clipboard for GeM URLs',
      type: 'checkbox',
      checked: clipboardWatcherEnabled,
      click: (menuItem) => {
        setClipboardWatcher(menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit GeM Compare',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Initialize system tray / menu bar icon.
 */
function createTray() {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL);
  tray = new Tray(icon);
  tray.setToolTip('GeM Compare — Procurement Rate Auditor');
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.focus();
        }
      } else {
        showAndFocusWindow();
      }
    }
  });
}

/**
 * Updates the clipboard watcher enabled state and rebuilds the tray menu.
 */
function setClipboardWatcher(enabled) {
  clipboardWatcherEnabled = Boolean(enabled);
  if (clipboardWatcherEnabled) {
    lastClipboardText = clipboard.readText();
  }
  updateTrayMenu();
}

/**
 * Register global OS hotkey (CommandOrControl+Shift+G) to trigger clipboard audit.
 */
function registerGlobalShortcuts() {
  try {
    const registered = globalShortcut.register('CommandOrControl+Shift+G', () => {
      showAndFocusWindow();
      const text = clipboard.readText().trim();
      if (text && text.length < 300 && mainWindow) {
        mainWindow.webContents.send('os:trigger-search', text);
      }
    });

    if (!registered) {
      console.warn(
        '[Desktop OS] Global shortcut CommandOrControl+Shift+G registration failed or was already assigned.'
      );
    }
  } catch (err) {
    console.warn('[Desktop OS] Error registering global shortcut:', err);
  }
}

/**
 * Background clipboard monitor polling every 1500ms for supported marketplace URLs.
 */
function startClipboardWatcher() {
  // Prime with existing clipboard so we don't spam notifications at launch
  lastClipboardText = clipboard.readText();

  const URL_REGEX = /(mkp\.gem\.gov\.in|gem\.gov\.in|amazon\.in|flipkart\.com)/i;

  clipboardInterval = setInterval(() => {
    if (!clipboardWatcherEnabled) return;

    try {
      const currentText = clipboard.readText();
      if (!currentText || currentText === lastClipboardText) {
        return;
      }

      lastClipboardText = currentText;
      const trimmed = currentText.trim();

      if (URL_REGEX.test(trimmed)) {
        if (Notification.isSupported()) {
          const notification = new Notification({
            title: 'Marketplace Product Copied',
            body: 'Click to run GeM price comparison & procurement audit.',
            silent: false,
          });

          notification.on('click', () => {
            showAndFocusWindow();
            if (mainWindow) {
              mainWindow.webContents.send('os:trigger-search', trimmed);
            }
          });

          notification.show();
        }
      }
    } catch (err) {
      console.error('[Desktop OS] Clipboard watcher error:', err);
    }
  }, 1500);
}

/**
 * Register all IPC Main handlers invoked from the Preload contextBridge.
 */
function registerIpcHandlers() {
  // Native File Save Dialog + OS Notification for CSV exports
  ipcMain.handle('os:save-csv', async (_event, { defaultFileName, csvContent }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Procurement Audit CSV',
        defaultPath: defaultFileName || 'GeM_Procurement_Audit.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      await fs.promises.writeFile(filePath, csvContent, 'utf-8');

      if (Notification.isSupported()) {
        const notification = new Notification({
          title: 'Procurement Audit Saved',
          body: `Saved to ${path.basename(filePath)}. Click to reveal in folder.`,
        });

        notification.on('click', () => {
          shell.showItemInFolder(filePath);
        });

        notification.show();
      }

      return { success: true, filePath };
    } catch (error) {
      console.error('[Desktop OS] Failed to save CSV:', error);
      return { success: false, error: error.message };
    }
  });

  // Native notification trigger
  ipcMain.handle('os:notify', async (_event, { title, body }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'GeM Compare',
        body: body || '',
      });
      notification.show();
    }
    return { success: true };
  });

  // Reveal file in native Finder/Explorer
  ipcMain.handle('os:reveal-file', async (_event, { filePath }) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
    return { success: true };
  });

  // Query clipboard watcher state
  ipcMain.handle('os:get-watcher-state', () => clipboardWatcherEnabled);

  // Toggle clipboard watcher state
  ipcMain.handle('os:toggle-watcher', (_event, { enabled }) => {
    setClipboardWatcher(enabled);
    return clipboardWatcherEnabled;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'GeM Compare — Procurement Rate Auditor',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Intercept all external link clicks (target="_blank" or window.open)
  // and open them in the user's default system browser (Chrome/Safari/Edge)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Override close event: hide window to system tray unless explicitly quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  startClipboardWatcher();
  registerIpcHandlers();

  app.on('activate', () => {
    if (!mainWindow) {
      createWindow();
    } else {
      showAndFocusWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
