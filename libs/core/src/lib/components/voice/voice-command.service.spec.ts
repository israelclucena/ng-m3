import { TestBed } from '@angular/core/testing';
import { VoiceCommandService } from './voice-command.service';

/**
 * Minimal stand-in for the Web Speech API `SpeechRecognition`. Records
 * start/stop calls and exposes the event hooks so tests can drive them.
 */
class MockSpeechRecognition {
  static last: MockSpeechRecognition | null = null;
  continuous = false;
  interimResults = false;
  lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onresult: ((e: { results: unknown }) => void) | null = null;
  start = jest.fn(() => this.onstart?.());
  stop = jest.fn(() => this.onend?.());

  constructor() {
    MockSpeechRecognition.last = this;
  }
}

/** Build a Web-Speech-like results payload from transcript strings. */
function resultsOf(...transcripts: string[]) {
  return { results: transcripts.map(t => [{ transcript: t }]) };
}

describe('VoiceCommandService', () => {
  const win = window as unknown as Record<string, unknown>;

  afterEach(() => {
    delete win['SpeechRecognition'];
    delete win['webkitSpeechRecognition'];
    MockSpeechRecognition.last = null;
    jest.useRealTimers();
  });

  const createService = (withSpeech: boolean): VoiceCommandService => {
    TestBed.resetTestingModule();
    if (withSpeech) {
      win['SpeechRecognition'] = MockSpeechRecognition;
    }
    TestBed.configureTestingModule({ providers: [VoiceCommandService] });
    return TestBed.inject(VoiceCommandService);
  };

  // ── Unsupported environment (default jsdom) ──────────────────────────────────

  describe('when SpeechRecognition is unavailable', () => {
    let service: VoiceCommandService;

    beforeEach(() => {
      service = createService(false);
    });

    it('reports unsupported status and isSupported false', () => {
      expect(service.isSupported()).toBe(false);
      expect(service.status()).toBe('unsupported');
    });

    it('start() / stop() / toggle() are safe no-ops', () => {
      expect(() => {
        service.start();
        service.stop();
        service.toggle();
      }).not.toThrow();
      expect(service.status()).toBe('unsupported');
    });
  });

  // ── Supported environment (mocked) ───────────────────────────────────────────

  describe('when SpeechRecognition is available', () => {
    let service: VoiceCommandService;
    let recog: MockSpeechRecognition;

    beforeEach(() => {
      service = createService(true);
      recog = MockSpeechRecognition.last!;
    });

    it('initialises as supported and idle with pt-PT config', () => {
      expect(service.isSupported()).toBe(true);
      expect(service.status()).toBe('idle');
      expect(recog.lang).toBe('pt-PT');
      expect(recog.interimResults).toBe(true);
    });

    it('start() begins recognition and sets status to listening', () => {
      service.start();
      expect(recog.start).toHaveBeenCalledTimes(1);
      expect(service.status()).toBe('listening');
    });

    it('start() swallows an already-started error', () => {
      recog.start.mockImplementationOnce(() => {
        throw new Error('already started');
      });
      expect(() => service.start()).not.toThrow();
    });

    it('stop() ends recognition; onend returns status to idle from listening', () => {
      service.start();
      service.stop();
      expect(recog.stop).toHaveBeenCalledTimes(1);
      expect(service.status()).toBe('idle');
    });

    it('toggle() starts when idle and stops when listening', () => {
      service.toggle();
      expect(service.status()).toBe('listening');
      service.toggle();
      expect(service.status()).toBe('idle');
    });

    it('onerror "not-allowed" sets status to error', () => {
      recog.onerror?.({ error: 'not-allowed' });
      expect(service.status()).toBe('error');
    });

    it('onerror with a transient error resets status to idle', () => {
      recog.onerror?.({ error: 'no-speech' });
      expect(service.status()).toBe('idle');
    });

    it('onresult sets the transcript and dispatches a matching command', () => {
      const handler = jest.fn();
      service.register({
        phrases: ['dashboard', 'go to dashboard'],
        description: 'Open dashboard',
        handler,
      });
      recog.onresult?.(resultsOf('Go To Dashboard'));
      expect(service.transcript()).toBe('go to dashboard');
      expect(service.lastMatch()).toBe('Open dashboard');
      expect(handler).toHaveBeenCalledWith('go to dashboard');
      expect(service.status()).toBe('processing');
    });

    it('onresult with no matching command still records the transcript', () => {
      const handler = jest.fn();
      service.register({ phrases: ['abrir mapa'], description: 'Map', handler });
      recog.onresult?.(resultsOf('comando desconhecido'));
      expect(service.transcript()).toBe('comando desconhecido');
      expect(handler).not.toHaveBeenCalled();
      expect(service.lastMatch()).toBe('');
    });

    it('status returns to idle 1500ms after processing', () => {
      jest.useFakeTimers();
      recog.onresult?.(resultsOf('qualquer coisa'));
      expect(service.status()).toBe('processing');
      jest.advanceTimersByTime(1500);
      expect(service.status()).toBe('idle');
    });

    it('unregisterAll() clears registered commands', () => {
      const handler = jest.fn();
      service.register({ phrases: ['teste'], description: 'T', handler });
      service.unregisterAll();
      recog.onresult?.(resultsOf('teste'));
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
