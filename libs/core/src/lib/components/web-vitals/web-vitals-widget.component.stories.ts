/**
 * Storybook stories for WebVitalsWidget
 * Feature flag: WEB_VITALS
 * Sprint 024 — Night Shift 2026-03-18
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { WebVitalsWidgetComponent } from '@israel-ui/core';
import { WebVitalsService, VitalMetric, VitalRating, VitalsSummary } from '@israel-ui/core';

// ─── Mock factory ─────────────────────────────────────────────────────────────

function mkMetric(
  name: VitalMetric['name'],
  value: number | null,
  unit = 'ms'
): VitalMetric {
  if (value === null) {
    return { name, value: null, displayValue: '—', rating: 'pending', unit };
  }
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP:  { good: 2500, poor: 4000 },
    CLS:  { good: 0.1,  poor: 0.25 },
    INP:  { good: 200,  poor: 500  },
    TTFB: { good: 800,  poor: 1800 },
    FID:  { good: 100,  poor: 300  },
  };
  const t = thresholds[name];
  const rating: VitalRating = value <= t.good ? 'good' : value <= t.poor ? 'needs-improvement' : 'poor';
  const displayValue = name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}`;
  return { name, value, displayValue, rating, unit };
}

function makeMockService(opts: {
  lcp?: number | null;
  cls?: number;
  inp?: number | null;
  ttfb?: number | null;
}): Partial<WebVitalsService> {
  const lcp  = mkMetric('LCP',  opts.lcp  ?? null);
  const cls  = mkMetric('CLS',  opts.cls  ?? 0, '');
  const inp  = mkMetric('INP',  opts.inp  ?? null);
  const ttfb = mkMetric('TTFB', opts.ttfb ?? null);
  const fid  = mkMetric('FID',  null);
  const order: VitalRating[] = ['poor', 'needs-improvement', 'good', 'pending'];
  const overallRating = order.find(r => [lcp, cls, inp, ttfb].some(m => m.rating === r)) ?? 'pending';
  const summaryVal: VitalsSummary = { lcp, cls, inp, ttfb, fid, overallRating };

  return {
    lcpValue: signal(opts.lcp ?? null),
    clsValue: signal(opts.cls ?? 0),
    inpValue: signal(opts.inp ?? null),
    ttfbValue: signal(opts.ttfb ?? null),
    fidValue: signal(null),
    lcp: computed(() => lcp),
    cls: computed(() => cls),
    inp: computed(() => inp),
    ttfb: computed(() => ttfb),
    fid: computed(() => fid),
    summary: computed(() => summaryVal),
  } as unknown as WebVitalsService;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<WebVitalsWidgetComponent> = {
  title: 'Performance/WebVitalsWidget',
  component: WebVitalsWidgetComponent,
  decorators: [
    applicationConfig({
      providers: [provideZonelessChangeDetection()],
    }),
  ],
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<WebVitalsWidgetComponent>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default — metrics pending (PerformanceObserver not yet fired).
 * Shows the "Measuring…" state.
 */
export const Default: Story = {
  args: { title: 'Core Web Vitals' },
  decorators: [
    moduleMetadata({
      providers: [
        { provide: WebVitalsService, useValue: makeMockService({}) },
      ],
    }),
  ],
};

/**
 * AllGood — LCP 1.2s, CLS 0.03, INP 120ms, TTFB 350ms.
 * All metrics within green thresholds.
 */
export const AllGood: Story = {
  name: 'All Good',
  args: { title: 'Core Web Vitals — All Good ✅' },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: WebVitalsService,
          useValue: makeMockService({ lcp: 1200, cls: 0.03, inp: 120, ttfb: 350 }),
        },
      ],
    }),
  ],
};

/**
 * NeedsWork — LCP 3.2s, CLS 0.18, INP 380ms, TTFB 1.2s.
 * All metrics in "needs improvement" band.
 */
export const NeedsWork: Story = {
  name: 'Needs Work',
  args: { title: 'Core Web Vitals — Needs Work 🟡' },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: WebVitalsService,
          useValue: makeMockService({ lcp: 3200, cls: 0.18, inp: 380, ttfb: 1200 }),
        },
      ],
    }),
  ],
};
