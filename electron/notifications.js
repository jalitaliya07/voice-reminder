'use strict';

/**
 * Electron Native Notifications
 * Wraps Electron's Notification API.
 */

const { Notification } = require('electron');
const path = require('path');

const ICON_PATH = path.join(__dirname, '../assets/icons/icon.png');

/**
 * Show a native desktop notification.
 * @param {string} title
 * @param {string} body
 * @param {{ silent?: boolean, mainWindow?: Electron.BrowserWindow }} options
 */
function showNotification(title, body, options = {}) {
  if (!Notification.isSupported()) {
    console.warn('[Notifications] Native notifications not supported.');
    return;
  }

  const notification = new Notification({
    title,
    body,
    icon: ICON_PATH,
    silent: options.silent ?? false,
    urgency: 'normal',
  });

  // Click → focus app
  notification.on('click', () => {
    const { mainWindow } = options;
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
  console.log(`[Notification] Shown: "${title}"`);
}

module.exports = { showNotification };
