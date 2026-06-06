import { Component } from '@angular/core';
import { ReminderAlertService } from '../../../core/services/reminder-alert.service';
import { ReminderService } from '../../../core/services/reminder.service';

@Component({
  selector: 'app-reminder-notification',
  standalone: true,
  templateUrl: './reminder-notification.component.html',
  styleUrl: './reminder-notification.component.scss',
})
export class ReminderNotificationComponent {
  constructor(
    public alertService: ReminderAlertService,
    private reminderService: ReminderService,
  ) {}

  dismiss(): void {
    this.alertService.dismissAlert();
  }

  snooze(): void {
    const r = this.alertService.activeAlert();
    if (r) {
      this.reminderService.snooze(r.id, 10).subscribe();
    }
    this.alertService.dismissAlert();
  }

  complete(): void {
    const r = this.alertService.activeAlert();
    if (r) {
      this.reminderService.complete(r.id).subscribe();
    }
    this.alertService.dismissAlert();
  }
}
