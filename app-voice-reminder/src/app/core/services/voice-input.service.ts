import { Injectable, signal } from '@angular/core';

/**
 * VoiceInputService — wraps the Web SpeechRecognition API.
 * Listens for voice commands and emits recognized text.
 */
@Injectable({ providedIn: 'root' })
export class VoiceInputService {
  private recognition: any = null;

  readonly isListening   = signal(false);
  readonly transcript    = signal('');
  readonly interimText   = signal('');
  readonly isSupported   = signal(false);

  constructor() {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.isSupported.set(true);
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous      = false;
    this.recognition.interimResults  = true;
    this.recognition.lang            = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      this.interimText.set(interim);
      if (final) {
        this.transcript.set(final.trim());
        this.interimText.set('');
      }
    };

    this.recognition.onstart = () => this.isListening.set(true);
    this.recognition.onend   = () => {
      this.isListening.set(false);
      this.interimText.set('');
    };
    this.recognition.onerror = (event: any) => {
      console.warn('[VoiceInput] Error:', event.error);
      this.isListening.set(false);
    };
  }

  startListening(): void {
    if (!this.recognition || this.isListening()) return;
    this.transcript.set('');
    this.interimText.set('');
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[VoiceInput] Already started');
    }
  }

  stopListening(): void {
    this.recognition?.stop();
  }

  toggleListening(): void {
    this.isListening() ? this.stopListening() : this.startListening();
  }
}
