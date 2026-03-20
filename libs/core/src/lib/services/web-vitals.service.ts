/**
 * @fileoverview WebVitalsService — Core Web Vitals monitoring via PerformanceObserver.
 *
 * Tracks the following CWV metrics using native browser APIs (no external deps):
 *   - LCP  (Largest Contentful Paint)    Good: <2.5s  | Poor: >4s
 *   - CLS  (Cumulative Layout Shift)     Good: <0.1   | Poor: >0.25
 *   - INP  (Interaction to Next Paint)   Good: <200ms | Poor: >500ms
 *   - TTFB (Time to First Byte)          Good: <800ms | Poor: >1800ms
 *   - FID  (First Input Delay) — legacy  Good: <100ms | Poor: >300ms
 *
 * All metrics are exposed as Angular Signals for reactive consumption.
 * Feature flag: `WEB_VITALS`
 *
 * @example
 * ```ts
 * const vitals = inject(WebVitalsService);
 * effect(() => console.log('LCP:', vitals.lcp()));
 * ```
 */
import { Injectable, OnDestroy, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

/** CWV rating thresholds */
export type VitalRating = 'good' | 'needs-improvement' | 'poor' | 'pending';

/** A single Core Web Vital reading */
export interface VitalMetric {
  /** Metric name */
  name: 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FID';
  /** Current value (ms or unitless for CLS) */
  value: number | null;
  /** Formatted display string */
  displayValue: string;
  /** Rating bucket */
  rating: VitalRating;
  /** Unit suffix for display */
  unit: string;
}

/** Aggregated vitals summary */
export interface VitalsSummary {
  lcp: VitalMetric;
  cls: VitalMetric;
  inp: VitalMetric;
  ttfb: VitalMetric;
  fid: VitalMetric;
  /** Overall score: worst rating across all measured metrics */
  overallRating: VitalRating;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  LCP:  { good: 2500,  poor: 4000  },
  CLS:  { good: 0.1,   poor: 0.25  },
  INP:  { good: 200,   poor: 500   },
  TTFB: { good: 800,   poor: 1800  },
  FID:  { good: 100,   poor: 300   },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rate(name: keyof typeof THRESHOLDS, value: number): VitalRating {
  const t = THRESHOLDS[name];
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

function formatValue(name: keyof typeof THRESHOLDS, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}`;
}

function makeMetric(
  name: VitalMetric['name'],
  value: number | null
): VitalMetric {
  const unit = name === 'CLS' ? '' : 'ms';
  if (value === null) {
    return { name, value: null, displayValue: '—', rating: 'pending', unit };
  }
  return {
    name,
    value,
    displayValue: formatValue(name, value),
    rating: rate(name, value),
    unit,
  };
}

function worstRating(metrics: VitalMetric[]): VitalRating {
  const order: VitalRating[] = ['poor', 'needs-improvement', 'good', 'pending'];
  for (const r of order) {
    if (metrics.some(m => m.rating === r)) return r;
  }
  return 'pending';
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * WebVitalsService — observable CWV signals.
 * Provide at root level for singleton access across the app.
 * Feature flag: `WEB_VITALS`
 */
@Injectable({ providedIn: 'root' })
export class WebVitalsService implements OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _observers: PerformanceObserver[] = [];

  // ── Raw value signals ──────────────────────────────────────────────────────

  /** Largest Contentful Paint (ms) */
  readonly lcpValue = signal<number | null>(null);

  /** Cumulative Layout Shift (unitless) */
  readonly clsValue = signal<number>(0);

  /** Interaction to Next Paint (ms) */
  readonly inpValue = signal<number | null>(null);

  /** Time to First Byte (ms) */
  readonly ttfbValue = signal<number | null>(null);

  /** First Input Delay — legacy (ms) */
  readonly fidValue = signal<number | null>(null);

  // ── Derived metric signals ─────────────────────────────────────────────────

  /** LCP metric with rating */
  readonly lcp = computed<VitalMetric>(() => makeMetric('LCP', this.lcpValue()));

  /** CLS metric with rating */
  readonly cls = computed<VitalMetric>(() => makeMetric('CLS', this.clsValue()));

  /** INP metric with rating */
  readonly inp = computed<VitalMetric>(() => makeMetric('INP', this.inpValue()));

  /** TTFB metric with rating */
  readonly ttfb = computed<VitalMetric>(() => makeMetric('TTFB', this.ttfbValue()));

  /** FID metric with rating */
  readonly fid = computed<VitalMetric>(() => makeMetric('FID', this.fidValue()));

  /** Full vitals summary with overall rating */
  readonly summary = computed<VitalsSummary>(() => {
    const lcp = this.lcp();
    const cls = this.cls();
    const inp = this.inp();
    const ttfb = this.ttfb();
    const fid = this.fid();
    return {
      lcp, cls, inp, ttfb, fid,
      overallRating: worstRating([lcp, cls, inp, ttfb]),
    };
  });

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      this._observeLCP();
      this._observeCLS();
      this._observeINP();
      this._observeTTFB();
      this._observeFID();
    }
  }

  ngOnDestroy(): void {
    this._observers.forEach(o => o.disconnect());
  }

  // ── Private observers ─────────────────────────────────────────────────────

  private _observeLCP(): void {
    try {
      const obs = new PerformanceObserver(list => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          // LCP: last entry is the largest
          const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          this.lcpValue.set(last.startTime);
        }
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      this._observers.push(obs);
    } catch { /* unsupported */ }
  }

  private _observeCLS(): void {
    try {
      let clsTotal = 0;
      let sessionValue = 0;
      let sessionEntries: PerformanceEntry[] = [];

      const obs = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) {
            const firstEntry = sessionEntries[0] as (PerformanceEntry & { startTime: number }) | undefined;
            const lastEntry = sessionEntries[sessionEntries.length - 1] as (PerformanceEntry & { startTime: number }) | undefined;
            const currTime = (entry as PerformanceEntry & { startTime: number }).startTime;

            if (
              sessionEntries.length === 0 ||
              (firstEntry && currTime - firstEntry.startTime < 5000 &&
               lastEntry && currTime - lastEntry.startTime < 1000)
            ) {
              sessionValue += shift.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = shift.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsTotal) {
              clsTotal = sessionValue;
              this.clsValue.set(clsTotal);
            }
          }
        }
      });
      obs.observe({ type: 'layout-shift', buffered: true });
      this._observers.push(obs);
    } catch { /* unsupported */ }
  }

  private _observeINP(): void {
    try {
      let maxInp = 0;
      const obs = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const evt = entry as PerformanceEntry & { processingStart: number; processingEnd: number; startTime: number };
          const duration = evt.processingEnd - evt.startTime;
          if (duration > maxInp) {
            maxInp = duration;
            this.inpValue.set(maxInp);
          }
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obs.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
      this._observers.push(obs);
    } catch { /* unsupported */ }
  }

  private _observeTTFB(): void {
    try {
      const obs = new PerformanceObserver(list => {
        const nav = list.getEntries()[0] as (PerformanceNavigationTiming & { responseStart: number; requestStart: number }) | undefined;
        if (nav) {
          this.ttfbValue.set(nav.responseStart - nav.requestStart);
        }
      });
      obs.observe({ type: 'navigation', buffered: true });
      this._observers.push(obs);
    } catch { /* unsupported */ }
  }

  private _observeFID(): void {
    try {
      const obs = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const evt = entry as PerformanceEntry & { processingStart: number; startTime: number };
          const delay = evt.processingStart - evt.startTime;
          const current = this.fidValue();
          if (current === null || delay > current) {
            this.fidValue.set(delay);
          }
        }
      });
      obs.observe({ type: 'first-input', buffered: true });
      this._observers.push(obs);
    } catch { /* unsupported */ }
  }
}
