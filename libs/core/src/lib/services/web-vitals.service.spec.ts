import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WebVitalsService } from './web-vitals.service';

// ─── PerformanceObserver mock ────────────────────────────────────────────────
//
// JSDOM does not implement PerformanceObserver. We capture every constructor
// call into MockPerformanceObserver.instances so individual tests can drive
// callbacks for a specific entry type (largest-contentful-paint, layout-shift,
// event, navigation, first-input).

interface CapturedObserver {
  callback: (list: { getEntries: () => unknown[] }) => void;
  type?: string;
  disconnect: jest.Mock;
}

class MockPerformanceObserver {
  static instances: CapturedObserver[] = [];
  private readonly _captured: CapturedObserver;

  constructor(callback: (list: { getEntries: () => unknown[] }) => void) {
    this._captured = {
      callback,
      disconnect: jest.fn(),
    };
    MockPerformanceObserver.instances.push(this._captured);
  }

  observe(opts: { type?: string }): void {
    this._captured.type = opts.type;
  }

  disconnect(): void {
    this._captured.disconnect();
  }
}

function emit(type: string, entries: unknown[]): void {
  const obs = MockPerformanceObserver.instances.find(i => i.type === type);
  if (!obs) throw new Error(`No PerformanceObserver registered for type=${type}`);
  obs.callback({ getEntries: () => entries });
}

describe('WebVitalsService', () => {
  let service: WebVitalsService;
  let originalPO: typeof PerformanceObserver | undefined;

  beforeEach(() => {
    MockPerformanceObserver.instances = [];
    originalPO = (globalThis as { PerformanceObserver?: typeof PerformanceObserver })
      .PerformanceObserver;
    (globalThis as unknown as { PerformanceObserver: unknown }).PerformanceObserver =
      MockPerformanceObserver;

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(WebVitalsService);
  });

  afterEach(() => {
    (globalThis as unknown as { PerformanceObserver: unknown }).PerformanceObserver =
      originalPO as unknown;
  });

  // ── Construction ─────────────────────────────────────────────────────────

  it('registers one PerformanceObserver per CWV metric in the browser', () => {
    const types = MockPerformanceObserver.instances.map(i => i.type).sort();
    expect(types).toEqual(
      [
        'event',
        'first-input',
        'largest-contentful-paint',
        'layout-shift',
        'navigation',
      ].sort(),
    );
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('initial value signals start at null (or 0 for CLS)', () => {
    expect(service.lcpValue()).toBeNull();
    expect(service.clsValue()).toBe(0);
    expect(service.inpValue()).toBeNull();
    expect(service.ttfbValue()).toBeNull();
    expect(service.fidValue()).toBeNull();
  });

  it('initial computed metrics report rating=pending and displayValue="—"', () => {
    expect(service.lcp().rating).toBe('pending');
    expect(service.lcp().displayValue).toBe('—');
    expect(service.inp().rating).toBe('pending');
    expect(service.ttfb().rating).toBe('pending');
    expect(service.fid().rating).toBe('pending');
  });

  it('initial CLS metric is rated good (value=0)', () => {
    expect(service.cls().rating).toBe('good');
    expect(service.cls().displayValue).toBe('0.000');
  });

  // ── LCP ──────────────────────────────────────────────────────────────────

  it('LCP observer sets lcpValue from the last entry startTime', () => {
    emit('largest-contentful-paint', [
      { startTime: 1200 },
      { startTime: 2300 },
    ]);
    expect(service.lcpValue()).toBe(2300);
    expect(service.lcp().rating).toBe('good'); // <2500
    expect(service.lcp().displayValue).toBe('2300');
    expect(service.lcp().unit).toBe('ms');
  });

  it('LCP rating crosses into needs-improvement above 2500ms', () => {
    emit('largest-contentful-paint', [{ startTime: 3000 }]);
    expect(service.lcp().rating).toBe('needs-improvement');
  });

  it('LCP rating becomes poor above 4000ms', () => {
    emit('largest-contentful-paint', [{ startTime: 5000 }]);
    expect(service.lcp().rating).toBe('poor');
  });

  // ── CLS ──────────────────────────────────────────────────────────────────

  it('CLS observer accumulates session shifts when hadRecentInput=false', () => {
    emit('layout-shift', [
      { hadRecentInput: false, value: 0.05, startTime: 100 },
      { hadRecentInput: false, value: 0.03, startTime: 500 },
    ]);
    expect(service.clsValue()).toBeCloseTo(0.08, 3);
    expect(service.cls().rating).toBe('good');
  });

  it('CLS observer ignores shifts with hadRecentInput=true', () => {
    emit('layout-shift', [
      { hadRecentInput: true, value: 0.5, startTime: 100 },
    ]);
    expect(service.clsValue()).toBe(0);
  });

  it('CLS rating crosses into needs-improvement above 0.1', () => {
    emit('layout-shift', [
      { hadRecentInput: false, value: 0.15, startTime: 100 },
    ]);
    expect(service.cls().rating).toBe('needs-improvement');
  });

  it('CLS rating becomes poor above 0.25', () => {
    emit('layout-shift', [
      { hadRecentInput: false, value: 0.3, startTime: 100 },
    ]);
    expect(service.cls().rating).toBe('poor');
  });

  // ── INP ──────────────────────────────────────────────────────────────────

  it('INP observer tracks the maximum processingEnd - startTime', () => {
    emit('event', [
      { startTime: 100, processingStart: 110, processingEnd: 250 }, // 150
      { startTime: 500, processingStart: 510, processingEnd: 580 }, // 80
      { startTime: 900, processingStart: 905, processingEnd: 1080 }, // 180
    ]);
    expect(service.inpValue()).toBe(180);
    expect(service.inp().rating).toBe('good');
  });

  it('INP rating crosses into needs-improvement above 200ms', () => {
    emit('event', [
      { startTime: 0, processingStart: 0, processingEnd: 300 },
    ]);
    expect(service.inp().rating).toBe('needs-improvement');
  });

  it('INP rating becomes poor above 500ms', () => {
    emit('event', [
      { startTime: 0, processingStart: 0, processingEnd: 600 },
    ]);
    expect(service.inp().rating).toBe('poor');
  });

  // ── TTFB ─────────────────────────────────────────────────────────────────

  it('TTFB observer computes responseStart - requestStart from the navigation entry', () => {
    emit('navigation', [
      { requestStart: 100, responseStart: 700 },
    ]);
    expect(service.ttfbValue()).toBe(600);
    expect(service.ttfb().rating).toBe('good');
  });

  it('TTFB rating crosses into needs-improvement above 800ms', () => {
    emit('navigation', [
      { requestStart: 100, responseStart: 1200 },
    ]);
    expect(service.ttfb().rating).toBe('needs-improvement');
  });

  it('TTFB observer is a no-op when the navigation list is empty', () => {
    emit('navigation', []);
    expect(service.ttfbValue()).toBeNull();
  });

  // ── FID ──────────────────────────────────────────────────────────────────

  it('FID observer tracks the maximum processingStart - startTime', () => {
    emit('first-input', [
      { startTime: 100, processingStart: 150 }, // 50
    ]);
    expect(service.fidValue()).toBe(50);
    expect(service.fid().rating).toBe('good');
  });

  it('FID observer keeps the larger of subsequent readings', () => {
    emit('first-input', [{ startTime: 0, processingStart: 30 }]);
    emit('first-input', [{ startTime: 100, processingStart: 250 }]);
    expect(service.fidValue()).toBe(150);
  });

  // ── Summary ──────────────────────────────────────────────────────────────

  it('summary aggregates all five metrics + an overallRating', () => {
    emit('largest-contentful-paint', [{ startTime: 1500 }]);
    emit('event', [{ startTime: 0, processingStart: 0, processingEnd: 100 }]);
    emit('navigation', [{ requestStart: 0, responseStart: 200 }]);

    const s = service.summary();
    expect(s.lcp.value).toBe(1500);
    expect(s.inp.value).toBe(100);
    expect(s.ttfb.value).toBe(200);
    expect(s.cls.value).toBe(0);
    // All measured metrics rate good; fid still pending → worstRating = poor first,
    // then needs-improvement, then good. With LCP/INP/TTFB all good and CLS good,
    // overallRating excludes fid and resolves to good.
    expect(s.overallRating).toBe('good');
  });

  it('summary overallRating picks the worst non-pending bucket', () => {
    emit('largest-contentful-paint', [{ startTime: 5000 }]); // poor
    emit('event', [{ startTime: 0, processingStart: 0, processingEnd: 100 }]); // good
    expect(service.summary().overallRating).toBe('poor');
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  it('ngOnDestroy disconnects every observer it owns', () => {
    service.ngOnDestroy();
    for (const inst of MockPerformanceObserver.instances) {
      expect(inst.disconnect).toHaveBeenCalled();
    }
  });

  // ── Server platform ──────────────────────────────────────────────────────

  it('does not register observers on the server platform', () => {
    MockPerformanceObserver.instances = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    TestBed.inject(WebVitalsService);
    expect(MockPerformanceObserver.instances.length).toBe(0);
  });
});
