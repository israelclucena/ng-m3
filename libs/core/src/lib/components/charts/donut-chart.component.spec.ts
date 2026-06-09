import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChartComponent, DonutChartSegment } from './donut-chart.component';

describe('DonutChartComponent', () => {
  let fixture: ComponentFixture<DonutChartComponent>;
  let component: DonutChartComponent;

  const sampleSegments: DonutChartSegment[] = [
    { label: 'Apples', value: 30 },
    { label: 'Bananas', value: 20 },
    { label: 'Cherries', value: 50 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('segments', sampleSegments);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('total() sums all segment values', () => {
    expect(component.total()).toBe(100);
  });

  it('total() returns 0 when there are no segments', () => {
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    expect(component.total()).toBe(0);
  });

  it('computedSegments() returns one entry per segment', () => {
    expect(component.computedSegments().length).toBe(sampleSegments.length);
  });

  it('computedSegments() rounds percent for each segment', () => {
    const segs = component.computedSegments();
    expect(segs[0].percent).toBe(30);
    expect(segs[1].percent).toBe(20);
    expect(segs[2].percent).toBe(50);
  });

  it('rounds percent to 33 for three equal segments', () => {
    fixture.componentRef.setInput('segments', [
      { label: 'A', value: 1 },
      { label: 'B', value: 1 },
      { label: 'C', value: 1 },
    ]);
    fixture.detectChanges();
    const percents = component.computedSegments().map((s) => s.percent);
    expect(percents).toEqual([33, 33, 33]);
  });

  it('segments without color get default color from DEFAULT_COLORS cycling', () => {
    const segs = component.computedSegments();
    expect(segs[0].color).toBe(component.DEFAULT_COLORS[0]);
    expect(segs[1].color).toBe(component.DEFAULT_COLORS[1]);
    expect(segs[2].color).toBe(component.DEFAULT_COLORS[2]);
  });

  it('cycles default colors when there are more segments than palette entries', () => {
    const many: DonutChartSegment[] = Array.from({ length: 9 }, (_, i) => ({
      label: `S${i}`,
      value: 1,
    }));
    fixture.componentRef.setInput('segments', many);
    fixture.detectChanges();
    const segs = component.computedSegments();
    const palette = component.DEFAULT_COLORS;
    expect(segs[0].color).toBe(palette[0]);
    expect(segs[palette.length].color).toBe(palette[0]);
    expect(segs[palette.length + 1].color).toBe(palette[1]);
  });

  it('segments with a color keep their explicit color', () => {
    fixture.componentRef.setInput('segments', [
      { label: 'Red', value: 10, color: '#ff0000' },
      { label: 'Green', value: 20, color: '#00ff00' },
    ]);
    fixture.detectChanges();
    const segs = component.computedSegments();
    expect(segs[0].color).toBe('#ff0000');
    expect(segs[1].color).toBe('#00ff00');
  });

  it('svgSize is 0.65 * size input', () => {
    expect(component.svgSize()).toBeCloseTo(240 * 0.65);
    fixture.componentRef.setInput('size', 400);
    fixture.detectChanges();
    expect(component.svgSize()).toBeCloseTo(400 * 0.65);
  });

  it('SVG path string starts with "M 0 0"', () => {
    const segs = component.computedSegments();
    for (const seg of segs) {
      expect(seg.path.startsWith('M 0 0')).toBe(true);
    }
  });

  it('renders one path element per segment', () => {
    const paths = fixture.nativeElement.querySelectorAll('path.donut-segment');
    expect(paths.length).toBe(sampleSegments.length);
  });

  it('center-value shows total() when not hovering', () => {
    const value = fixture.nativeElement.querySelector('.center-value') as HTMLElement;
    expect(value.textContent).toContain('100');
  });

  it('center-text shows centerLabel input when not hovering', () => {
    fixture.componentRef.setInput('centerLabel', 'Fruits');
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.center-text') as HTMLElement;
    expect(text.textContent).toContain('Fruits');
  });

  it('center-text shows default "Total" when centerLabel is not set', () => {
    const text = fixture.nativeElement.querySelector('.center-text') as HTMLElement;
    expect(text.textContent).toContain('Total');
  });

  it('legend renders when showLegend() is true (default)', () => {
    const legend = fixture.nativeElement.querySelector('.donut-legend');
    expect(legend).toBeTruthy();
    const items = fixture.nativeElement.querySelectorAll('.legend-item');
    expect(items.length).toBe(sampleSegments.length);
  });

  it('legend hides when showLegend() is false', () => {
    fixture.componentRef.setInput('showLegend', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.donut-legend')).toBeNull();
  });

  it('onSegmentHover sets hoveredSegment and hoveredValue (percent)', () => {
    component.onSegmentHover('Bananas', 20, 20);
    expect(component.hoveredSegment()).toBe('Bananas');
    expect(component.hoveredValue()).toBe(20);
  });

  it('center label flips to show percent + segment name on hover', () => {
    component.onSegmentHover('Cherries', 50, 50);
    fixture.detectChanges();
    const value = fixture.nativeElement.querySelector('.center-value') as HTMLElement;
    const text = fixture.nativeElement.querySelector('.center-text') as HTMLElement;
    expect(value.textContent).toContain('50%');
    expect(text.textContent).toContain('Cherries');
  });

  it('onSegmentLeave clears hoveredSegment to null', () => {
    component.onSegmentHover('Apples', 30, 30);
    expect(component.hoveredSegment()).toBe('Apples');
    component.onSegmentLeave();
    expect(component.hoveredSegment()).toBeNull();
  });

  it('after onSegmentLeave the center reverts to total() and centerLabel()', () => {
    component.onSegmentHover('Apples', 30, 30);
    fixture.detectChanges();
    component.onSegmentLeave();
    fixture.detectChanges();
    const value = fixture.nativeElement.querySelector('.center-value') as HTMLElement;
    const text = fixture.nativeElement.querySelector('.center-text') as HTMLElement;
    expect(value.textContent).toContain('100');
    expect(text.textContent).toContain('Total');
  });

  it('applies segment-hover class to the active path', () => {
    component.onSegmentHover('Apples', 30, 30);
    fixture.detectChanges();
    const paths = fixture.nativeElement.querySelectorAll('path.donut-segment');
    expect((paths[0] as SVGElement).classList.contains('segment-hover')).toBe(true);
    expect((paths[1] as SVGElement).classList.contains('segment-hover')).toBe(false);
  });

  it('title is rendered only when set', () => {
    expect(fixture.nativeElement.querySelector('.chart-title')).toBeNull();
    fixture.componentRef.setInput('title', 'Sales by Fruit');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.chart-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Sales by Fruit');
  });

  it('handles empty segments without errors', () => {
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    expect(component.computedSegments().length).toBe(0);
    expect(component.total()).toBe(0);
    const paths = fixture.nativeElement.querySelectorAll('path.donut-segment');
    expect(paths.length).toBe(0);
  });

  it('legend item shows percent suffix for each segment', () => {
    const items = fixture.nativeElement.querySelectorAll('.legend-item');
    expect((items[0] as HTMLElement).textContent).toContain('30%');
    expect((items[1] as HTMLElement).textContent).toContain('20%');
    expect((items[2] as HTMLElement).textContent).toContain('50%');
  });
});
