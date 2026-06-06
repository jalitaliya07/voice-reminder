import { Injectable } from '@angular/core';
import { Reminder } from '../models/types';

/**
 * ElectronService — bridges Angular to the Electron preload contextBridge.
 * In browser mode (dev without Electron), all calls are no-ops.
 */
@Injectable({ providedIn: 'root' })
export class ElectronService {
  private get api() {
    return window.electronAPI;
  }

  get isElectron(): boolean {
    return !!window.electronAPI;
  }

  // ── Window controls ──────────────────────────────────────────────────────────
  minimizeWindow():    void { this.api?.window.minimize(); }
  maximizeWindow():    void { this.api?.window.maximize(); }
  closeWindow():       void { this.api?.window.close(); }
  minimizeToTray():    void { this.api?.window.minimizeToTray(); }

  // ── Notifications ────────────────────────────────────────────────────────────
  showNotification(title: string, body: string, silent = false): void {
    this.api?.notifications.show(title, body, { silent });
  }

  // ── Settings ─────────────────────────────────────────────────────────────────
  setAutoStart(enable: boolean): Promise<void> {
    return this.api?.settings.setAutoStart(enable) ?? Promise.resolve();
  }

  // ── App info ─────────────────────────────────────────────────────────────────
  getVersion(): Promise<string> {
    return this.api?.app.getVersion() ?? Promise.resolve('dev');
  }

  async getInfo() {
    return this.api?.app.getInfo() ?? { isDev: true, version: 'dev', platform: 'browser', backendPort: 3000 };
  }

  // ── Event listeners ──────────────────────────────────────────────────────────
  onReminderDue(callback: (reminder: Reminder) => void): void {
    this.api?.onReminderDue(callback);
  }

  onTrayOpen(callback: () => void): void {
    this.api?.onTrayOpen(callback);
  }

  removeListeners(channel: string): void {
    this.api?.removeAllListeners(channel);
  }
}
