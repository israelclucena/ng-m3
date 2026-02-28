import { Injectable, signal, NgZone, inject } from '@angular/core';

export interface VoiceCommand {
  /** Phrase(s) to match */
  phrases: string[];
  /** Human-readable description */
  description: string;
  /** Handler called when matched */
  handler: (transcript: string) => void;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

/**
 * VoiceCommandService — Web Speech API voice command manager.
 *
 * Registers commands with phrases, listens for speech, and dispatches matches.
 * Falls back gracefully when SpeechRecognition is unavailable.
 *
 * @example
 * ```ts
 * voice.register({ phrases: ['go to dashboard', 'dashboard'], description: 'Navigate to Dashboard', handler: () => router.navigate(['/']) });
 * voice.start();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class VoiceCommandService {
  private zone = inject(NgZone);
  private recognition: any = null;
  private commands: VoiceCommand[] = [];

  readonly status = signal<VoiceStatus>('idle');
  readonly transcript = signal('');
  readonly lastMatch = signal('');
  readonly isSupported = signal(false);

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported.set(true);
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-PT';
      this._bindEvents();
    } else {
      this.status.set('unsupported');
    }
  }

  /** Register a voice command */
  register(command: VoiceCommand): void {
    this.commands.push(command);
  }

  /** Unregister all commands */
  unregisterAll(): void {
    this.commands = [];
  }

  /** Start listening */
  start(): void {
    if (!this.isSupported()) return;
    try {
      this.recognition.start();
    } catch {
      // already started
    }
  }

  /** Stop listening */
  stop(): void {
    if (!this.isSupported()) return;
    this.recognition.stop();
  }

  /** Toggle listening on/off */
  toggle(): void {
    if (this.status() === 'listening') {
      this.stop();
    } else {
      this.start();
    }
  }

  private _bindEvents(): void {
    this.recognition.onstart = () => {
      this.zone.run(() => this.status.set('listening'));
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        if (this.status() === 'listening') this.status.set('idle');
      });
    };

    this.recognition.onerror = (e: any) => {
      this.zone.run(() => {
        this.status.set(e.error === 'not-allowed' ? 'error' : 'idle');
      });
    };

    this.recognition.onresult = (e: any) => {
      const raw = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim();

      this.zone.run(() => {
        this.transcript.set(raw);
        this.status.set('processing');

        const matched = this.commands.find(cmd =>
          cmd.phrases.some(p => raw.includes(p.toLowerCase()))
        );

        if (matched) {
          this.lastMatch.set(matched.description);
          matched.handler(raw);
        }

        setTimeout(() => {
          if (this.status() === 'processing') this.status.set('idle');
        }, 1500);
      });
    };
  }
}
