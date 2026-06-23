import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebVitalsWidgetComponent } from './web-vitals-widget.component';
import { WebVitalsService, VitalRating } from '../../services/web-vitals.service';

describe('WebVitalsWidgetComponent', () => {
  let fixture: ComponentFixture<WebVitalsWidgetComponent>;
  let component: WebVitalsWidgetComponent;
  let vitals: WebVitalsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebVitalsWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WebVitalsWidgetComponent);
    component = fixture.componentInstance;
    vitals = TestBed.inject(WebVitalsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the panel title to "Core Web Vitals"', () => {
    expect(component.title()).toBe('Core Web Vitals');
  });

  // ── tiles ────────────────────────────────────────────────────────────────────

  it('exposes four tiles for LCP, CLS, INP and TTFB in order', () => {
    const names = component.tiles().map(t => t.metric.name);
    expect(names).toEqual(['LCP', 'CLS', 'INP', 'TTFB']);
  });

  it('pairs each tile with its descriptive icon', () => {
    const icons = component.tiles().map(t => t.icon);
    expect(icons).toEqual(['image', 'swap_vert', 'touch_app', 'timer']);
  });

  it('carries a human-readable description per tile', () => {
    expect(component.tiles()[0].description).toBe('Largest Contentful Paint');
  });

  // ── rating ↔ summary wiring ──────────────────────────────────────────────────

  it('reflects a good LCP reading from the service as a good rating', () => {
    vitals.lcpValue.set(1000); // < 2500ms good threshold
    expect(component.tiles()[0].metric.rating).toBe('good');
  });

  it('reflects a poor LCP reading from the service as a poor rating', () => {
    vitals.lcpValue.set(5000); // > 4000ms poor threshold
    expect(component.tiles()[0].metric.rating).toBe('poor');
  });

  it('reports an unmeasured metric as pending', () => {
    vitals.inpValue.set(null);
    expect(component.tiles()[2].metric.rating).toBe('pending');
  });

  it('surfaces the worst metric rating as the overall rating', () => {
    vitals.lcpValue.set(5000); // poor dominates the summary
    expect(component.summary().overallRating).toBe('poor');
  });

  // ── label / emoji helpers ────────────────────────────────────────────────────

  it('maps each rating to a human label', () => {
    expect(component.ratingLabel('good')).toBe('Good');
    expect(component.ratingLabel('needs-improvement')).toBe('Needs work');
    expect(component.ratingLabel('poor')).toBe('Poor');
    expect(component.ratingLabel('pending')).toBe('Measuring…');
  });

  it('maps each rating to a status emoji', () => {
    const emoji: Record<VitalRating, string> = {
      'good': '🟢',
      'needs-improvement': '🟡',
      'poor': '🔴',
      'pending': '⚪',
    };
    (Object.keys(emoji) as VitalRating[]).forEach(r => {
      expect(component.ratingEmoji(r)).toBe(emoji[r]);
    });
  });

  // ── goodThreshold ────────────────────────────────────────────────────────────

  it('exposes the "good" threshold label for every metric', () => {
    expect(component.goodThreshold('LCP')).toBe('<2.5s');
    expect(component.goodThreshold('CLS')).toBe('<0.1');
    expect(component.goodThreshold('INP')).toBe('<200ms');
    expect(component.goodThreshold('TTFB')).toBe('<800ms');
    expect(component.goodThreshold('FID')).toBe('<100ms');
  });
});
