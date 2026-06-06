'use strict';

/**
 * Electron Preload Script
 * 
 * Exposes a secure API to the renderer (Angular app) via contextBridge.
 * NEVER expose Node.js or Electron APIs directly — always use this bridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * All methods available to the Angular app via window.electronAPI
 */
contextBridge.exposeInMainWorld('electronAPI', {

  // ── Window Controls ────────────────────────────────────────────────────────
  window: {
    minimize:    () => ipcRenderer.send('window:minimize'),
    maximize:    () => ipcRenderer.send('window:maximize'),
    close:       () => ipcRenderer.send('window:close'),
    minimizeToTray: () => ipcRenderer.send('window:minimize-tray'),
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    /**
     * Show a native OS notification.
     * @param {string} title
     * @param {string} body
     * @param {{ silent?: boolean }} options
     */
    show: (title, body, options = {}) =>
      ipcRenderer.invoke('notification:show', { title, body, ...options }),
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    /**
     * Toggle app auto-start at Windows login.
     * @param {boolean} enable
     */
    setAutoStart: (enable) =>
      ipcRenderer.invoke('settings:autostart', enable),
  },

  // ── App Info ───────────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getInfo:    () => ipcRenderer.invoke('app:info'),
  },

  // ── Reminder Events (Main → Renderer) ──────────────────────────────────────
  onReminderDue: (callback) => {
    ipcRenderer.on('reminder:due', (_event, reminder) => callback(reminder));
  },

  onTrayOpen: (callback) => {
    ipcRenderer.on('tray:open', () => callback());
  },

  // ── Cleanup ────────────────────────────────────────────────────────────────
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// ── Log preload loaded ───────────────────────────────────────────────────────
console.log('[Preload] contextBridge APIs exposed.');
