import { Component, OnInit, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { VoiceSynthesisService } from '../../core/services/voice-synthesis.service';
import { ReminderService } from '../../core/services/reminder.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SettingsService } from '../../core/services/settings.service';
import { CreateReminderDto } from '../../core/models/types';
import * as chrono from 'chrono-node';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss',
})
export class AiAssistantComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  readonly messages = signal<ChatMessage[]>([]);
  readonly isTyping = signal(false);
  
  userText = '';

  constructor(
    public voiceInput: VoiceInputService,
    private voiceSynth: VoiceSynthesisService,
    private reminderService: ReminderService,
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService
  ) {
    // Listen for final voice transcripts
    effect(() => {
      const transcriptText = this.voiceInput.transcript();
      if (transcriptText) {
        this.processUserInput(transcriptText);
      }
    });
  }

  ngOnInit(): void {
    const userName = this.settingsService.get('user_name') ?? 'there';
    // Initial welcome message
    this.messages.set([
      {
        sender: 'assistant',
        text: `Greetings, ${userName}. I am your voice-controlled productivity assistant. Speak or type a command to begin, such as "remind me to drink water at 4 PM" or "what are my reminders today?".`,
        timestamp: new Date()
      }
    ]);
  }

  toggleVoice(): void {
    this.voiceInput.toggleListening();
  }

  submitMessage(): void {
    if (!this.userText.trim()) return;
    const text = this.userText;
    this.userText = '';
    this.processUserInput(text);
  }

  processUserInput(text: string): void {
    // Append user message
    this.messages.update(prev => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    this.scrollToBottom();

    // Trigger AI typing indicator
    this.isTyping.set(true);

    setTimeout(() => {
      this.handleCommand(text);
    }, 1000);
  }

  handleCommand(text: string): void {
    const lower = text.toLowerCase();
    
    // 1. CREATE REMINDER COMMAND
    if (lower.includes('remind me to') || lower.includes('schedule') || lower.includes('remind')) {
      this.handleCreateReminder(text);
      return;
    }

    // 2. LIST REMINDERS COMMAND
    if (lower.includes('reminders') || lower.includes('schedule') || lower.includes('what do i have')) {
      this.handleListReminders();
      return;
    }

    // 3. STATS / ANALYTICS COMMAND
    if (lower.includes('productivity') || lower.includes('stats') || lower.includes('score')) {
      this.handleStats();
      return;
    }

    // 4. HELP COMMAND
    if (lower.includes('help') || lower.includes('what can you do')) {
      this.respond(
        `I can schedule reminders, show your agenda, and review productivity stats. Say: "remind me to review code at 5 PM", "show reminders", or "how is my productivity?".`
      );
      return;
    }

    // 5. GREETING COMMAND
    if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
      const userName = this.settingsService.get('user_name') ?? 'there';
      this.respond(`Hello, ${userName}. Ready to organize your tasks. What can I do for you?`);
      return;
    }

    // 6. DEFAULT FALLBACK
    this.respond(
      `I processed your input, but I couldn't match a specific command. I can schedule reminders, show your daily list, or read your completion stats. Try saying: "remind me to call Mom at 8 PM".`
    );
  }

  handleCreateReminder(text: string): void {
    const parsedDate = chrono.parse(text);
    const now = new Date();
    const offset = now.getTimezoneOffset();
    let dateStr = new Date(now.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]; // default today
    let timeStr = '';
    let dateText = '';

    if (parsedDate && parsedDate.length > 0) {
      const dateRef = parsedDate[0].start.date();
      dateStr = dateRef.getFullYear() + '-' + 
                String(dateRef.getMonth() + 1).padStart(2, '0') + '-' + 
                String(dateRef.getDate()).padStart(2, '0');
      timeStr = `${String(dateRef.getHours()).padStart(2, '0')}:${String(dateRef.getMinutes()).padStart(2, '0')}`;
      dateText = parsedDate[0].text;
    }

    if (!timeStr) {
      // Default to current local time
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
    let category: any = 'general';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('work') || lowerTitle.includes('meeting') || lowerTitle.includes('call') || lowerTitle.includes('email') || lowerTitle.includes('project')) {
      category = 'work';
    } else if (lowerTitle.includes('doctor') || lowerTitle.includes('medicine') || lowerTitle.includes('pill') || lowerTitle.includes('gym') || lowerTitle.includes('workout') || lowerTitle.includes('run') || lowerTitle.includes('water')) {
      category = 'health';
    }

    const dto: CreateReminderDto = {
      title,
      description: 'Created via AI Assistant',
      date: dateStr,
      time: timeStr,
      category,
      priority: 'medium',
      voice_enabled: true
    };

    this.reminderService.create(dto).subscribe({
      next: () => {
        const timeFormatted = this.formatTime(timeStr);
        this.respond(`Understood. I have scheduled a reminder: "${title}" for ${timeFormatted}.`);
      },
      error: () => {
        this.respond('Apologies, I encountered an error while saving your reminder.');
      }
    });
  }

  handleListReminders(): void {
    this.reminderService.getToday().subscribe({
      next: res => {
        const active = res.data.filter(r => r.is_completed === 0);
        if (active.length === 0) {
          this.respond("You have no pending reminders for today. Excellent work!");
        } else {
          const listText = active.map(r => `• ${r.title} at ${this.formatTime(r.time)}`).join('\n');
          this.respond(`You have ${active.length} pending reminders today:\n\n${listText}`);
        }
      },
      error: () => this.respond('Could not retrieve your reminders.')
    });
  }

  handleStats(): void {
    this.analyticsService.getSummary().subscribe({
      next: res => {
        const s = res.data;
        this.respond(
          `Here is your summary: You have completed ${s.total_completed} reminders. Your average productivity score is ${s.avg_score}%.`
        );
      },
      error: () => this.respond('Could not load productivity analytics.')
    });
  }

  respond(text: string): void {
    this.isTyping.set(false);
    this.messages.update(prev => [...prev, { sender: 'assistant', text, timestamp: new Date() }]);
    this.scrollToBottom();
    this.voiceSynth.speak(text);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
}
