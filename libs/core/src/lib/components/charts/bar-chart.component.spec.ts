import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent, BarChartDataPoint } from './bar-chart.component';

describe('BarChartComponent', () => {
  let fixture: ComponentFixture<BarChartComponent>;
  let component: BarChartComponent;

  const sampleData: BarChartDataPoint[] = [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 25 },
    { label: 'Mar', value: 40, color: '#ff0000' },
    { label: 'Apr', value: 15 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', sampleData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render the title element when title is empty', () => {
    const title = fixture.nativeElement.querySelector('.chart-title');
    expect(title).toBeNull();
  });

  it('renders the title element when title input is set', () => {
    fixture.componentRef.setInput('title', 'Sales by Month');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.chart-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Sales by Month');
  });

  it('reflects width and height inputs on the SVG element', () => {
    fixture.componentRef.setInput('width', 600);
    fixture.componentRef.setInput('height', 320);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg.chart-svg');
    expect(svg.getAttribute('width')).toBe('600');
    expect(svg.getAttribute('height')).toBe('320');
    expect(svg.getAttribute('viewBox')).toBe('0 0 600 320');
  });

  it('svgWidth/svgHeight computed signals mirror the width/height inputs', () => {
    fixture.componentRef.setInput('width', 700);
    fixture.componentRef.setInput('height', 350);
    expect(component.svgWidth()).toBe(700);
    expect(component.svgHeight()).toBe(350);
  });

  it('plotWidth/plotHeight account for padding', () => {
    fixture.componentRef.setInput('width', 480);
    fixture.componentRef.setInput('height', 280);
    // padding: top 16, right 24, bottom 32, left 48
    expect(component.plotWidth()).toBe(480 - 48 - 24);
    expect(component.plotHeight()).toBe(280 - 16 - 32);
  });

  it('gridLines returns 5 entries (count + 1)', () => {
    const lines = component.gridLines();
    expect(lines.length).toBe(5);
  });

  it('gridLines spans from dataMax (top) down to yMin (bottom)', () => {
    fixture.componentRef.setInput('yMax', 100);
    fixture.componentRef.setInput('yMin', 0);
    const lines = component.gridLines();
    expect(lines[0].label).toBe('100');
    expect(lines[lines.length - 1].label).toBe('0');
  });

  it('gridLines uses integer labels when divisions land on integers', () => {
    fixture.componentRef.setInput('yMax', 40);
    const labels = component.gridLines().map(l => l.label);
    expect(labels).toEqual(['40', '30', '20', '10', '0']);
  });

  it('gridLines uses decimal labels when divisions are non-integer', () => {
    fixture.componentRef.setInput('yMax', 10);
    const labels = component.gridLines().map(l => l.label);
    // 10, 7.5, 5, 2.5, 0
    expect(labels).toEqual(['10', '7.5', '5', '2.5', '0']);
  });

  it('dataMax falls back to Math.max of data values when yMax is undefined', () => {
    expect(component.dataMax()).toBe(40);
  });

  it('dataMax respects yMax input when provided', () => {
    fixture.componentRef.setInput('yMax', 200);
    expect(component.dataMax()).toBe(200);
  });

  it('dataMax falls back to 1 when data is empty and yMax not set', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.dataMax()).toBe(1);
  });

  it('computedBars returns one bar per data point', () => {
    expect(component.computedBars().length).toBe(sampleData.length);
  });

  it('computedBars returns empty array when data is empty', () => {
    fixture.componentRef.setInput('data', []);
    expect(component.computedBars().length).toBe(0);
  });

  it('computedBars uses point.color when present, otherwise barColor input', () => {
    fixture.componentRef.setInput('barColor', '#123456');
    const bars = component.computedBars();
    expect(bars[0].color).toBe('#123456'); // no per-point color → fallback
    expect(bars[1].color).toBe('#123456');
    expect(bars[2].color).toBe('#ff0000'); // per-point color wins
    expect(bars[3].color).toBe('#123456');
  });

  it('computedBars preserves label and value from input data', () => {
    const bars = component.computedBars();
    expect(bars.map(b => b.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
    expect(bars.map(b => b.value)).toEqual([10, 25, 40, 15]);
  });

  it('computedBars positions bars left-to-right with barGap between them', () => {
    fixture.componentRef.setInput('barGap', 10);
    const bars = component.computedBars();
    for (let i = 1; i < bars.length; i++) {
      expect(bars[i].x).toBeGreaterThan(bars[i - 1].x);
      // gap between bars[i-1].x + width and bars[i].x should equal barGap
      const gap = bars[i].x - (bars[i - 1].x + bars[i - 1].width);
      expect(gap).toBeCloseTo(10, 5);
    }
  });

  it('renders one .bar-rect per data point in the DOM', () => {
    const rects = fixture.nativeElement.querySelectorAll('rect.bar-rect');
    expect(rects.length).toBe(sampleData.length);
  });

  it('renders axis-label texts that include data labels', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('text.axis-label')
    ).map((el: any) => el.textContent.trim());
    expect(labels).toEqual(expect.arrayContaining(['Jan', 'Feb', 'Mar', 'Apr']));
  });

  it('tooltip starts hidden', () => {
    expect(component.tooltip().visible).toBe(false);
    const tooltipGroup = fixture.nativeElement.querySelector('.tooltip-group');
    expect(tooltipGroup).toBeNull();
  });

  it('onBarHover sets tooltip visible with "label: value" text', () => {
    const svgRect = { left: 0, top: 0, width: 480, height: 280 } as DOMRect;
    const barRect = { left: 100, top: 50, width: 40, height: 100 } as DOMRect;
    const fakeEvent = {
      target: {
        closest: (_sel: string) => ({ getBoundingClientRect: () => svgRect }),
        getBoundingClientRect: () => barRect,
      },
    } as unknown as MouseEvent;

    component.onBarHover(fakeEvent, 'Feb', 25);

    const t = component.tooltip();
    expect(t.visible).toBe(true);
    expect(t.text).toBe('Feb: 25');
    expect(t.x).toBe(120); // 100 - 0 + 40/2
    expect(t.y).toBe(50);  // 50 - 0
    expect(t.width).toBeGreaterThanOrEqual(60);
  });

  it('onBarLeave clears tooltip visibility', () => {
    const svgRect = { left: 0, top: 0, width: 480, height: 280 } as DOMRect;
    const barRect = { left: 100, top: 50, width: 40, height: 100 } as DOMRect;
    const fakeEvent = {
      target: {
        closest: (_sel: string) => ({ getBoundingClientRect: () => svgRect }),
        getBoundingClientRect: () => barRect,
      },
    } as unknown as MouseEvent;
    component.onBarHover(fakeEvent, 'Jan', 10);
    expect(component.tooltip().visible).toBe(true);

    component.onBarLeave();
    const t = component.tooltip();
    expect(t.visible).toBe(false);
    expect(t.text).toBe('');
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it('tooltip group renders in DOM once tooltip becomes visible', () => {
    component.tooltip.set({ visible: true, x: 100, y: 50, text: 'Mar: 40', width: 80 });
    fixture.detectChanges();
    const tooltipGroup = fixture.nativeElement.querySelector('.tooltip-group');
    expect(tooltipGroup).toBeTruthy();
    const tooltipText = tooltipGroup.querySelector('.tooltip-text');
    expect(tooltipText.textContent).toContain('Mar: 40');
  });

  it('bar y position increases when value decreases (lower bars start higher down)', () => {
    const bars = component.computedBars();
    // Mar (value 40) should have smallest y (tallest bar); Jan (10) largest y
    const marBar = bars.find(b => b.label === 'Mar')!;
    const janBar = bars.find(b => b.label === 'Jan')!;
    expect(marBar.y).toBeLessThan(janBar.y);
  });

  it('computedBars sets a minimum bar height of 2 even for zero values', () => {
    fixture.componentRef.setInput('data', [{ label: 'Zero', value: 0 }] as BarChartDataPoint[]);
    fixture.componentRef.setInput('yMax', 10);
    const bars = component.computedBars();
    expect(bars[0].barHeight).toBeGreaterThanOrEqual(2);
  });

  it('renders no .bar-rect elements when data is empty', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    const rects = fixture.nativeElement.querySelectorAll('rect.bar-rect');
    expect(rects.length).toBe(0);
  });
});
