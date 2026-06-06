import { Component, OnInit, signal, computed } from '@angular/core';
import { ReminderService } from '../../core/services/reminder.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SettingsService } from '../../core/services/settings.service';
import { Reminder, AnalyticsSummary, DailyBreakdown } from '../../core/models/types';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly todayReminders  = signal<Reminder[]>([]);
  readonly upcomingReminders = signal<Reminder[]>([]);
  readonly summary         = signal<AnalyticsSummary | null>(null);
  readonly daily           = signal<DailyBreakdown[]>([]);
  readonly isLoading       = signal(true);
  readonly now             = new Date();

  readonly completedToday  = computed(() =>
    this.todayReminders().filter(r => r.is_completed === 1).length
  );
  readonly pendingToday    = computed(() =>
    this.todayReminders().filter(r => r.is_completed === 0).length
  );
  readonly completionRate  = computed(() => {
    const total = this.todayReminders().length;
    return total > 0 ? Math.round((this.completedToday() / total) * 100) : 0;
  });

  constructor(
    private reminderService: ReminderService,
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService,
  ) {}

  get userName() {
    return this.settingsService.get('user_name') ?? 'there';
  }

  get greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.reminderService.getToday().subscribe({
      next: res => this.todayReminders.set(res.data),
    });

    this.reminderService.getUpcoming().subscribe({
      next: res => this.upcomingReminders.set(res.data.slice(0, 5)),
    });

    this.analyticsService.getSummary().subscribe({
      next: res => { this.summary.set(res.data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });

    this.analyticsService.getDaily(7).subscribe({
      next: res => this.daily.set(res.data),
    });
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getCategoryClass(category: string): string {
    return `badge badge-${category}`;
  }

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  complete(reminder: Reminder): void {
    this.reminderService.complete(reminder.id).subscribe(() => this.loadData());
  }
}
