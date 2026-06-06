import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { VoiceSynthesisService } from '../../core/services/voice-synthesis.service';
import { ElectronService } from '../../core/services/electron.service';
import { AppSettings } from '../../core/models/types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  // Available voices
  voices: SpeechSynthesisVoice[] = [];

  // Form values
  userName = '';
  theme: 'dark' | 'light' = 'dark';
  voiceName = 'default';
  voiceVolume = 0.8;
  voiceRate = 1.0;
  voicePitch = 1.0;
  notificationSound = 'chime.mp3';
  notificationVolume = 0.8;
  autoStart = 'false';
  minimizeToTray = 'true';
  language = 'en-US';

  readonly isSaving = signal(false);
  readonly message = signal('');

  constructor(
    private settingsService: SettingsService,
    private voiceSynth: VoiceSynthesisService,
    private electron: ElectronService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadVoices();
  }

  loadVoices(): void {
    // Web Speech API voices load asynchronously
    this.voices = this.voiceSynth.getVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.voiceSynth.getVoices();
      };
    }
  }

  loadSettings(): void {
    this.settingsService.getAll().subscribe({
      next: res => {
        const s = res.data;
        this.userName = s.user_name ?? 'user';
        this.theme = (s.theme as any) ?? 'dark';
        this.voiceName = s.voice_name ?? 'default';
        this.voiceVolume = parseFloat(s.voice_volume ?? '0.8');
        this.voiceRate = parseFloat(s.voice_rate ?? '1.0');
        this.voicePitch = parseFloat(s.voice_pitch ?? '1.0');
        this.notificationSound = s.notification_sound ?? 'chime.mp3';
        this.notificationVolume = parseFloat(s.notification_volume ?? '0.8');
        this.autoStart = s.auto_start ?? 'false';
        this.minimizeToTray = s.minimize_to_tray ?? 'true';
        this.language = s.language ?? 'en-US';
      }
    });
  }

  testVoice(): void {
    this.voiceSynth.speak(`Hello ${this.userName}. Test speech generation using selected parameters.`);
  }

  saveSettings(): void {
    this.isSaving.set(true);
    this.message.set('');

    const updates: Partial<AppSettings> = {
      user_name: this.userName.trim() || 'user',
      theme: this.theme,
      voice_name: this.voiceName,
      voice_volume: String(this.voiceVolume),
      voice_rate: String(this.voiceRate),
      voice_pitch: String(this.voicePitch),
      notification_sound: this.notificationSound,
      notification_volume: String(this.notificationVolume),
      auto_start: this.autoStart,
      minimize_to_tray: this.minimizeToTray,
      language: this.language,
    };

    // Update auto start in Electron if supported
    if (this.electron.isElectron) {
      this.electron.setAutoStart(this.autoStart === 'true').catch(err => {
        console.warn('Could not set auto start:', err);
      });
    }

    this.settingsService.update(updates).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.message.set('Settings saved successfully.');
        // Reload local store
        this.settingsService.load();
        setTimeout(() => this.message.set(''), 3000);
      },
      error: () => {
        this.isSaving.set(false);
        this.message.set('Error saving settings.');
      }
    });
  }
}
