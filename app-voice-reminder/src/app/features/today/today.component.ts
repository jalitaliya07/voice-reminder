import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../core/services/reminder.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { VoiceSynthesisService } from '../../core/services/voice-synthesis.service';
import { Reminder, CreateReminderDto, RepeatMode } from '../../core/models/types';
import * as chrono from 'chrono-node';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './today.component.html',
  styleUrl: './today.component.scss',
})
export class TodayComponent implements OnInit {
  // Reminders state
  readonly reminders = signal<Reminder[]>([]);
  readonly isLoading = signal(false);

  // Filters state
  readonly priorityFilter = signal<string>('all');
  readonly categoryFilter = signal<string>('all');

  // Quick add form state
  title = '';
  description = '';
  time = '';
  category: 'general' | 'work' | 'health' | 'personal' | 'study' = 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  voiceEnabled = true;
  repeatMode: RepeatMode = 'none';

  // Real-time voice parser suggestions
  parsedSuggestion = signal<{
    title: string;
    time: string;
    category: string;
    priority: string;
  } | null>(null);

  // Filtered reminders computed list
  readonly filteredReminders = computed(() => {
    return this.reminders().filter(r => {
      const matchesPriority = this.priorityFilter() === 'all' || r.priority === this.priorityFilter();
      const matchesCategory = this.categoryFilter() === 'all' || r.category === this.categoryFilter();
      return matchesPriority && matchesCategory;
    });
  });

  constructor(
    private reminderService: ReminderService,
    public voiceInput: VoiceInputService,
    private voiceSynth: VoiceSynthesisService
  ) {
    // React to voice transcripts in real-time
    effect(() => {
      const transcriptText = this.voiceInput.transcript();
      if (transcriptText) {
        this.handleVoiceInput(transcriptText);
      }
    });
  }

  ngOnInit(): void {
    this.loadReminders();
    this.setDefaultTime();
  }

  setDefaultTime(): void {
    const now = new Date();
    this.time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  loadReminders(): void {
    this.isLoading.set(true);
    this.reminderService.getToday().subscribe({
      next: res => {
        // Sort reminders by time ascending
        const sorted = res.data.sort((a, b) => a.time.localeCompare(b.time));
        this.reminders.set(sorted);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  completeReminder(reminder: Reminder): void {
    this.reminderService.complete(reminder.id).subscribe(() => {
      this.loadReminders();
      if (reminder.voice_enabled) {
        this.voiceSynth.speak(`Completed reminder: ${reminder.title}`);
      }
    });
  }

  deleteReminder(id: number): void {
    this.reminderService.delete(id).subscribe(() => {
      this.loadReminders();
    });
  }

  snoozeReminder(reminder: Reminder): void {
    this.reminderService.snooze(reminder.id, 10).subscribe(() => {
      this.loadReminders();
      if (reminder.voice_enabled) {
        this.voiceSynth.speak(`Snoozed ${reminder.title} for 10 minutes`);
      }
    });
  }

  onSubmit(): void {
    if (!this.title.trim()) return;

    const now = new Date();
    const offset = now.getTimezoneOffset();
    const todayStr = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

    const dto: CreateReminderDto = {
      title: this.title.trim(),
      description: this.description.trim(),
      date: todayStr,
      time: this.time,
      category: this.category,
      priority: this.priority,
      voice_enabled: this.voiceEnabled,
      repeat_mode: this.repeatMode,
    };

    this.reminderService.create(dto).subscribe({
      next: () => {
        this.loadReminders();
        this.voiceSynth.speak(`Reminder added: ${dto.title}`);
        this.resetForm();
      },
    });
  }

  resetForm(): void {
    this.title = '';
    this.description = '';
    this.setDefaultTime();
    this.category = 'general';
    this.priority = 'medium';
    this.voiceEnabled = true;
    this.repeatMode = 'none';
    this.parsedSuggestion.set(null);
  }

  // Voice NLP Parser logic
  handleVoiceInput(transcript: string): void {
    const parsed = this.parseNLP(transcript);
    this.parsedSuggestion.set(parsed);

    // Auto populate the form fields
    this.title = parsed.title;
    this.time = parsed.time;
    this.category = parsed.category as any;
    this.priority = parsed.priority as any;
  }

  parseNLP(text: string) {
    const parsedDate = chrono.parse(text);
    let timeStr = '';
    let dateText = '';

    if (parsedDate && parsedDate.length > 0) {
      const dateRef = parsedDate[0].start.date();
      timeStr = `${String(dateRef.getHours()).padStart(2, '0')}:${String(dateRef.getMinutes()).padStart(2, '0')}`;
      dateText = parsedDate[0].text;
    }

    if (!timeStr) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    let title = text;
    if (dateText) {
      title = title.replace(dateText, '');
    }

    title = title
      .replace(/^\s*(remind me to|remind me|remind|schedule|add a reminder to|add reminder to|tell me to|to)\s+/i, '')
      .replace(/\s+(at|on|for|tomorrow|today|tonight)\s*$/i, '')
      .trim();

    if (!title) title = 'Voice Reminder';
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Guess category
    let category = 'general';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('work') || lowerTitle.includes('meeting') || lowerTitle.includes('call') || lowerTitle.includes('email') || lowerTitle.includes('project')) {
      category = 'work';
    } else if (lowerTitle.includes('doctor') || lowerTitle.includes('medicine') || lowerTitle.includes('pill') || lowerTitle.includes('gym') || lowerTitle.includes('workout') || lowerTitle.includes('run') || lowerTitle.includes('water')) {
      category = 'health';
    } else if (lowerTitle.includes('study') || lowerTitle.includes('read') || lowerTitle.includes('class') || lowerTitle.includes('learn') || lowerTitle.includes('course') || lowerTitle.includes('homework')) {
      category = 'study';
    } else if (lowerTitle.includes('buy') || lowerTitle.includes('shop') || lowerTitle.includes('grocery') || lowerTitle.includes('clean') || lowerTitle.includes('dinner') || lowerTitle.includes('lunch')) {
      category = 'personal';
    }

    // Guess priority
    let priority = 'medium';
    if (lowerTitle.includes('urgent') || lowerTitle.includes('asap') || lowerTitle.includes('important') || lowerTitle.includes('crisis')) {
      priority = 'high';
    } else if (lowerTitle.includes('quick') || lowerTitle.includes('whenever') || lowerTitle.includes('low priority')) {
      priority = 'low';
    }

    return { title, time: timeStr, category, priority };
  }

  acceptSuggestion(): void {
    if (this.parsedSuggestion()) {
      this.onSubmit();
    }
  }

  toggleVoice(): void {
    this.voiceInput.toggleListening();
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
}
