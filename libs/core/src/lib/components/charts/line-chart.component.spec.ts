import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent, LineChartSeries } from './line-chart.component';

/** Build a single line series with sensible defaults, overridable per test. */
function series(over: Partial<LineChartSeries> = {}): LineChartSeries {
  return {
    name: 'Sales',
    data: [
      { label: 'Jan', value: 10 },
      { label: 'Fev', value: 20 },
      { label: 'Mar', value: 30 },
    ],
    ...over,
  };
}

describe('LineChartComponent', () => {
  let fixture: ComponentFixture<LineChartComponent>;
  let component: LineChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('series', [series()]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── dimensions ───────────────────────────────────────────────────────────────

  it('mirrors the width input as the svg width', () => {
    fixture.componentRef.setInput('series', [series()]);
    fixture.componentRef.setInput('width', 600);
    expect(component.svgWidth()).toBe(600);
  });

  it('reserves 32px of height for the legend when there are multiple series', () => {
    fixture.componentRef.setInput('series', [series({ name: 'A' }), series({ name: 'B' })]);
    fixture.componentRef.setInput('height', 280);
    fixture.componentRef.setInput('showLegend', true);
    expect(component.svgHeight()).toBe(248);
  });

  it('uses the full height for a single series even with the legend enabled', () => {
    fixture.componentRef.setInput('series', [series()]);
    fixture.componentRef.setInput('height', 280);
    fixture.componentRef.setInput('showLegend', true);
    expect(component.svgHeight()).toBe(280);
  });

  // ── gridLines ────────────────────────────────────────────────────────────────

  it('produces six horizontal grid lines (5 intervals + baseline)', () => {
    fixture.componentRef.setInput('series', [series()]);
    expect(component.gridLines().length).toBe(6);
  });

  it('labels integer grid values without a decimal point', () => {
    fixture.componentRef.setInput('series', [series()]);
    // values 0..30 over 5 steps → 30,24,18,12,6,0, all integers
    expect(component.gridLines().every(l => !l.label.includes('.'))).toBe(true);
  });

  it('labels fractional grid values with one decimal place', () => {
    fixture.componentRef.setInput('series', [series()]);
    fixture.componentRef.setInput('yMin', 0);
    fixture.componentRef.setInput('yMax', 1);
    // range 1 over 5 steps → 1.0, 0.8, 0.6 … → fractional labels rendered as "0.8"
    expect(component.gridLines().some(l => l.label.includes('.'))).toBe(true);
  });

  // ── xLabels ──────────────────────────────────────────────────────────────────

  it('emits one x-axis label per point in the first series', () => {
    fixture.componentRef.setInput('series', [series()]);
    const labels = component.xLabels();
    expect(labels.length).toBe(3);
    expect(labels.map(l => l.text)).toEqual(['Jan', 'Fev', 'Mar']);
  });

  it('spans the x labels from the left padding to the plot edge', () => {
    fixture.componentRef.setInput('series', [series()]);
    fixture.componentRef.setInput('width', 480);
    const labels = component.xLabels();
    // padding.left = 48, plotWidth = 480 - 48 - 24 = 408
    expect(labels[0].x).toBe(48);
    expect(labels[labels.length - 1].x).toBe(456);
  });

  // ── computedSeries (SVG paths) ───────────────────────────────────────────────

  it('builds a line path starting with a move and using line commands', () => {
    fixture.componentRef.setInput('series', [series()]);
    const path = component.computedSeries()[0].linePath;
    expect(path.startsWith('M')).toBe(true);
    expect(path).toContain('L');
  });

  it('closes the area fill path with a Z command', () => {
    fixture.componentRef.setInput('series', [series()]);
    expect(component.computedSeries()[0].areaPath.endsWith('Z')).toBe(true);
  });

  it('emits one rendered point per data point', () => {
    fixture.componentRef.setInput('series', [series()]);
    expect(component.computedSeries()[0].points.length).toBe(3);
  });

  it('falls back to the default palette colour when a series has none', () => {
    fixture.componentRef.setInput('series', [series()]);
    expect(component.computedSeries()[0].color).toBe(component.DEFAULT_COLORS[0]);
  });

  it('honours an explicit series colour', () => {
    fixture.componentRef.setInput('series', [series({ color: '#FF0000' })]);
    expect(component.computedSeries()[0].color).toBe('#FF0000');
  });

  // ── empty data ───────────────────────────────────────────────────────────────

  it('renders nothing for an empty series list', () => {
    fixture.componentRef.setInput('series', []);
    expect(component.computedSeries()).toEqual([]);
    expect(component.xLabels()).toEqual([]);
  });

  it('still produces grid lines with the default 0–1 range when there is no data', () => {
    fixture.componentRef.setInput('series', []);
    expect(component.gridLines().length).toBe(6);
  });

  // ── getSeriesColor ───────────────────────────────────────────────────────────

  it('cycles through the default palette by series index', () => {
    fixture.componentRef.setInput('series', [series({ name: 'A' }), series({ name: 'B' })]);
    expect(component.getSeriesColor(0)).toBe(component.DEFAULT_COLORS[0]);
    expect(component.getSeriesColor(1)).toBe(component.DEFAULT_COLORS[1]);
  });
});
