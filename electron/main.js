'use strict';

/**
 * Electron Main Process — Entry Point
 * Manages BrowserWindow, IPC, tray, and lifecycle.
 */

const { app, BrowserWindow, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const { setupTray }          = require('./tray');
const { showNotification }   = require('./notifications');
const { startScheduler, stopScheduler } = require('./scheduler');

// ─── Environment ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const FRONTEND_URL  = isDev ? 'http://localhost:4200' : `file://${path.join(__dirname, '../app-voice-reminder/dist/app-voice-reminder/browser/index.html')}`;
const BACKEND_PORT  = process.env.PORT || 3000;

// Set APPDATA_PATH for the DB module
process.env.APPDATA_PATH = app.getPath('userData');

/** @type {BrowserWindow | null} */
let mainWindow = null;

// ─── Create Window ────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,           // Custom titlebar in Angular
    transparent: false,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // Security: isolate renderer from Node
      nodeIntegration: false,   // Security: no direct Node in renderer
      sandbox: false,           // Needed for preload to work
      devTools: isDev,
    },
    show: false,            // Show after ready-to-show
    titleBarStyle: 'hidden',
  });

  // ── Load frontend ──────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '../app-voice-reminder/dist/app-voice-reminder/browser/index.html')
    );
  }

  // ── Show when ready ────────────────────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // ── Handle external links ──────────────────────────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // ── Minimize to tray instead of closing ───────────────────────────────────
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

/** Window controls (custom titlebar) */
ipcMain.on('window:minimize',    () => mainWindow?.minimize());
ipcMain.on('window:maximize',    () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window:close',       () => mainWindow?.hide());
ipcMain.on('window:minimize-tray', () => mainWindow?.hide());

/** Show native notification */
ipcMain.handle('notification:show', async (_event, { title, body, silent }) => {
  showNotification(title, body, { silent, mainWindow });
});

/** Toggle auto-launch at startup */
ipcMain.handle('settings:autostart', async (_event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true,
    name: 'AI Voice Reminder',
  });
  return app.getLoginItemSettings();
});

/** Get app version */
ipcMain.handle('app:version', () => app.getVersion());

/** Get app environment info */
ipcMain.handle('app:info', () => ({
  isDev,
  version: app.getVersion(),
  platform: process.platform,
  userDataPath: app.getPath('userData'),
  backendPort: BACKEND_PORT,
}));

/** Focus window (from tray) */
function focusMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Force dark system theme
  nativeTheme.themeSource = 'dark';

  // Start the backend Express server
  if (isDev) {
    // In dev, backend runs separately via concurrently
    console.log('[Electron] Dev mode — using external backend on port', BACKEND_PORT);
  } else {
    // In production, start backend inline
    require('../api-voice-reminder/src/app');
  }

  createWindow();

  // Setup system tray
  setupTray(app, mainWindow, focusMainWindow);

  // Start reminder scheduler
  startScheduler((reminder) => {
    // Send to renderer for voice + UI notification
    mainWindow?.webContents.send('reminder:due', reminder);
    // Also show native OS notification
    showNotification(
      `⏰ ${reminder.title}`,
      reminder.description || 'Your reminder is due!',
      { mainWindow }
    );
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit — stay in system tray
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopScheduler();
});

module.exports = { focusMainWindow };
