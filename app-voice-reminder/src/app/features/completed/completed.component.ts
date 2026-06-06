import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../core/services/reminder.service';
import { Reminder } from '../../core/models/types';

@Component({
  selector: 'app-completed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './completed.component.html',
  styleUrl: './completed.component.scss',
})
export class CompletedComponent implements OnInit {
  readonly reminders = signal<Reminder[]>([]);
  readonly isLoading = signal(false);

  // Filters state
  readonly priorityFilter = signal<string>('all');
  readonly categoryFilter = signal<string>('all');

  // Filtered computed list
  readonly filteredReminders = computed(() => {
    return this.reminders().filter(r => {
      const matchesPriority = this.priorityFilter() === 'all' || r.priority === this.priorityFilter();
      const matchesCategory = this.categoryFilter() === 'all' || r.category === this.categoryFilter();
      return matchesPriority && matchesCategory;
    });
  });

  constructor(private reminderService: ReminderService) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.isLoading.set(true);
    this.reminderService.getCompleted().subscribe({
      next: res => {
        // Sort by updated_at (completion time) descending
        const sorted = res.data.sort((a, b) => {
          const aTime = a.updated_at || a.created_at;
          const bTime = b.updated_at || b.created_at;
          return bTime.localeCompare(aTime);
        });
        this.reminders.set(sorted);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  deleteReminder(id: number): void {
    this.reminderService.delete(id).subscribe(() => {
      this.loadReminders();
    });
  }

  // Helpers
  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getCategoryClass(category: string): string {
    return `badge badge-${category}`;
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
