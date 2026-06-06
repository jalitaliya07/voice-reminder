import { Injectable, signal } from '@angular/core';
import { Reminder } from '../models/types';
import { VoiceSynthesisService } from './voice-synthesis.service';
import { ElectronService } from './electron.service';
import { ReminderService } from './reminder.service';

/**
 * ReminderAlertService — handles what happens when a reminder fires.
 * Shows an in-app notification card, speaks the reminder, and plays sound.
 */
@Injectable({ providedIn: 'root' })
export class ReminderAlertService {
  readonly activeAlert = signal<Reminder | null>(null);
  readonly isVisible   = signal(false);

  constructor(
    private voice: VoiceSynthesisService,
    private electron: ElectronService,
    private reminderService: ReminderService,
  ) {}

  triggerAlert(reminder: Reminder): void {
    this.activeAlert.set(reminder);
    this.isVisible.set(true);

    // Speak it
    if (reminder.voice_enabled) {
      this.voice.speakReminder(reminder);
    }

    // Native notification (Electron)
    this.electron.showNotification(
      `⏰ ${reminder.title}`,
      reminder.description || 'Your reminder is due!'
    );

    // Auto-dismiss and auto-snooze after 30 seconds if user did not interact
    setTimeout(() => {
      if (this.isVisible() && this.activeAlert()?.id === reminder.id) {
        console.log(`[Auto-Snooze] Auto-snoozing reminder "${reminder.title}" for 5 minutes`);
        this.reminderService.snooze(reminder.id, 5).subscribe();
        this.dismissAlert();
      }
    }, 30_000);
  }

  dismissAlert(): void {
    this.isVisible.set(false);
    setTimeout(() => this.activeAlert.set(null), 400); // wait for animation
  }

  snoozeAlert(minutes = 10): void {
    this.dismissAlert();
  }
}
