import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TitlebarComponent } from './layout/titlebar/titlebar.component';
import { ReminderNotificationComponent } from './shared/components/reminder-notification/reminder-notification.component';
import { ElectronService } from './core/services/electron.service';
import { ReminderAlertService } from './core/services/reminder-alert.service';
import { SettingsService } from './core/services/settings.service';
import { ReminderService } from './core/services/reminder.service';
import { LayoutService } from './core/services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    TitlebarComponent,
    ReminderNotificationComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private browserPollInterval: any = null;

  constructor(
    private electron: ElectronService,
    private reminderAlert: ReminderAlertService,
    private settingsService: SettingsService,
    private reminderService: ReminderService,
    public layoutService: LayoutService,
  ) {
    // Reactively watch for theme changes and apply body classes
    effect(() => {
      const theme = this.settingsService.settings().theme || 'dark';
      if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
    });
  }

  ngOnInit(): void {
    // Listen for reminder due events from Electron main process
    if (this.electron.isElectron) {
      this.electron.onReminderDue((reminder) => {
        this.reminderAlert.triggerAlert(reminder);
      });
    } else {
      // Browser mode: poll the API directly every 30 seconds for due reminders
      console.log('[Browser Scheduler] Starting local reminder poll (30s)...');
      
      const firedThisMinute = new Set<number>();
      let lastMinute = '';

      this.browserPollInterval = setInterval(() => {
        const now = new Date();
        const currentMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentMinute !== lastMinute) {
          firedThisMinute.clear();
          lastMinute = currentMinute;
        }

        this.reminderService.getDue().subscribe({
          next: (res) => {
            const due = res.data || [];
            due.forEach((reminder) => {
              if (!firedThisMinute.has(reminder.id)) {
                firedThisMinute.add(reminder.id);
                console.log(`[Browser Scheduler] Firing reminder: "${reminder.title}"`);
                this.reminderAlert.triggerAlert(reminder);
              }
            });
          },
          error: (err) => console.error('[Browser Scheduler] Poll error:', err),
        });
      }, 30_000);
    }
  }

  ngOnDestroy(): void {
    if (this.browserPollInterval) {
      clearInterval(this.browserPollInterval);
      this.browserPollInterval = null;
    }
    this.electron.removeListeners('reminder:due');
  }
}
