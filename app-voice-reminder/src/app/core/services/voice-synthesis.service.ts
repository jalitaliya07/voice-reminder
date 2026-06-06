import { Injectable, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { Reminder } from '../models/types';

/**
 * VoiceSynthesisService — wraps the Web SpeechSynthesis API.
 * Reads reminder text aloud using the voice/speed/volume from settings.
 */
@Injectable({ providedIn: 'root' })
export class VoiceSynthesisService {
  private synth = window.speechSynthesis;
  readonly isSpeaking = signal(false);

  constructor(private settings: SettingsService) {}

  /**
   * Speak the given text using configured voice settings.
   */
  speak(text: string): void {
    if (!this.synth) return;
    this.synth.cancel(); // cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const s = this.settings.settings();

    utterance.volume = parseFloat(s.voice_volume  ?? '0.9');
    utterance.rate   = parseFloat(s.voice_rate    ?? '1.0');
    utterance.pitch  = parseFloat(s.voice_pitch   ?? '1.0');
    utterance.lang   = s.language ?? 'en-US';

    // Try to match saved voice name
    const voices = this.synth.getVoices();
    const voiceName = s.voice_name;
    if (voiceName && voiceName !== 'default') {
      const match = voices.find(v => v.name === voiceName);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend   = () => this.isSpeaking.set(false);
    utterance.onerror = () => this.isSpeaking.set(false);

    this.synth.speak(utterance);
  }

  /**
   * Speak a reminder with a personalized message.
   */
  speakReminder(reminder: Reminder): void {
    let text = `bhai time thay gyo che, ${reminder.title}.`;
    if (reminder.description) {
      text += ` ${reminder.description}`;
    }
    this.speak(text.trim());
  }

  /**
   * Get list of available TTS voices.
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() ?? [];
  }

  stop(): void {
    this.synth?.cancel();
    this.isSpeaking.set(false);
  }
}
