'use strict';

/**
 * Electron System Tray
 * Creates a tray icon with a context menu.
 */

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

/** @type {Tray | null} */
let tray = null;

/**
 * Initialize the system tray.
 * @param {Electron.App} app
 * @param {Electron.BrowserWindow} mainWindow
 * @param {() => void} focusMainWindow
 */
function setupTray(app, mainWindow, focusMainWindow) {
  try {
    const iconPath = path.join(__dirname, '../assets/icons/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    tray.setToolTip('AI Voice Reminder');
    tray.setTitle('');

    buildContextMenu(app, mainWindow, focusMainWindow);

    // Double-click to open
    tray.on('double-click', focusMainWindow);

    console.log('[Tray] System tray initialized.');
  } catch (err) {
    console.error('[Tray] Failed to initialize tray:', err.message);
  }
}

/**
 * Build and set the tray context menu.
 */
function buildContextMenu(app, mainWindow, focusMainWindow) {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '✨ AI Voice Reminder',
      enabled: false,
      icon: undefined,
    },
    { type: 'separator' },
    {
      label: '🖥️  Open App',
      click: focusMainWindow,
    },
    {
      label: '📋 Today\'s Reminders',
      click: () => {
        focusMainWindow();
        // Navigate to today view
        mainWindow?.webContents.send('tray:navigate', '/today');
      },
    },
    { type: 'separator' },
    {
      label: '❌ Exit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Update the tray badge count (pending reminders).
 * @param {number} count
 */
function updateTrayBadge(count) {
  if (!tray) return;
  tray.setTitle(count > 0 ? `${count}` : '');
  tray.setToolTip(`AI Voice Reminder${count > 0 ? ` • ${count} pending` : ''}`);
}

/**
 * Destroy the tray icon.
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { setupTray, updateTrayBadge, destroyTray };
