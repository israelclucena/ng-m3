import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OccupancyChartComponent } from './occupancy-chart.component';
import { OccupancySummary, OccupancyDataPoint } from './landlord-analytics.types';

describe('OccupancyChartComponent', () => {
  let fixture: ComponentFixture<OccupancyChartComponent>;
  let component: OccupancyChartComponent;

  const sampleData: OccupancyDataPoint[] = [
    { month: 'Jan', occupancyRate: 80, occupied: true },
    { month: 'Fev', occupancyRate: 75, occupied: true },
    { month: 'Mar', occupancyRate: 90, occupied: true },
    { month: 'Abr', occupancyRate: 60, occupied: true },
    { month: 'Mai', occupancyRate: 0, occupied: false },
    { month: 'Jun', occupancyRate: 100, occupied: true },
    { month: 'Jul', occupancyRate: 85, occupied: true },
    { month: 'Ago', occupancyRate: 50, occupied: true },
    { month: 'Set', occupancyRate: 95, occupied: true },
    { month: 'Out', occupancyRate: 70, occupied: true },
    { month: 'Nov', occupancyRate: 88, occupied: true },
    { month: 'Dez', occupancyRate: 65, occupied: true },
  ];

  const sampleSummary: OccupancySummary = {
    propertyId: 'p1',
    propertyTitle: 'Apto Lisboa',
    yearlyAverage: 78,
    data: sampleData,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OccupancyChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OccupancyChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', sampleSummary);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders propertyTitle in the subtitle', () => {
    const subtitle = fixture.nativeElement.querySelector('.iu-occ-chart__subtitle');
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('Apto Lisboa');
  });

  it('renders yearlyAverage in the avg-value', () => {
    const avg = fixture.nativeElement.querySelector('.iu-occ-chart__avg-value');
    expect(avg).toBeTruthy();
    expect(avg.textContent).toContain('78');
    expect(avg.textContent).toContain('%');
  });

  it('renders the avg label "média anual"', () => {
    const label = fixture.nativeElement.querySelector('.iu-occ-chart__avg-label');
    expect(label.textContent).toContain('média anual');
  });

  it('renders the static chart title', () => {
    const title = fixture.nativeElement.querySelector('.iu-occ-chart__title');
    expect(title.textContent).toContain('Taxa de Ocupação');
  });

  it('gridY(0) equals CHART_BOTTOM (145)', () => {
    expect(component.gridY(0)).toBe(145);
  });

  it('gridY(100) equals CHART_TOP (6)', () => {
    expect(component.gridY(100)).toBe(6);
  });

  it('gridY(50) sits at the midpoint between top and bottom', () => {
    const mid = (145 + 6) / 2;
    expect(component.gridY(50)).toBeCloseTo(mid, 5);
  });

  it('bars() returns one entry per data point', () => {
    expect(component.bars().length).toBe(sampleData.length);
  });

  it('each bar.occupied matches the corresponding input data point', () => {
    const bars = component.bars();
    bars.forEach((bar, i) => {
      expect(bar.occupied).toBe(sampleData[i].occupied);
    });
  });

  it('each bar.month and bar.rate mirror the input data point', () => {
    const bars = component.bars();
    bars.forEach((bar, i) => {
      expect(bar.month).toBe(sampleData[i].month);
      expect(bar.rate).toBe(sampleData[i].occupancyRate);
    });
  });

  it('renders one <rect> bar per data point in the SVG', () => {
    const rects = fixture.nativeElement.querySelectorAll('rect.iu-occ-chart__bar');
    expect(rects.length).toBe(sampleData.length);
  });

  it('renders occupied bars with the primary colour fill', () => {
    const rects = fixture.nativeElement.querySelectorAll('rect.iu-occ-chart__bar');
    // index 0 is occupied=true
    expect(rects[0].getAttribute('fill')).toContain('primary');
  });

  it('renders vacant bars with the surface-variant colour fill', () => {
    const rects = fixture.nativeElement.querySelectorAll('rect.iu-occ-chart__bar');
    // index 4 (Mai) is occupied=false
    expect(rects[4].getAttribute('fill')).toContain('surface-variant');
  });

  it('renders a <title> tooltip inside each bar with month and rate', () => {
    const rects = fixture.nativeElement.querySelectorAll('rect.iu-occ-chart__bar');
    const firstTitle = rects[0].querySelector('title');
    expect(firstTitle).toBeTruthy();
    expect(firstTitle.textContent).toContain('Jan');
    expect(firstTitle.textContent).toContain('80');
  });

  it('renders 5 grid lines (0/25/50/75/100)', () => {
    const lines = fixture.nativeElement.querySelectorAll('svg line');
    expect(lines.length).toBe(5);
  });

  it('renders rate label above bar only when bar.h > 12', () => {
    const bars = component.bars();
    const expectedLabels = bars.filter((b) => b.h > 12).length;
    // Each bar produces a month label; rate labels are conditional.
    // Total <text> = 5 grid-line labels + 12 month labels + N rate labels.
    const texts = fixture.nativeElement.querySelectorAll('svg text');
    const total = texts.length;
    expect(total).toBe(5 + sampleData.length + expectedLabels);
  });

  it('omits the rate label for very small bars (h <= 12)', () => {
    // Replace summary with all-zero rates so every bar.h === 2 (the min).
    const zeroData: OccupancyDataPoint[] = sampleData.map((d) => ({
      ...d,
      occupancyRate: 0,
    }));
    fixture.componentRef.setInput('summary', {
      ...sampleSummary,
      data: zeroData,
    });
    fixture.detectChanges();

    component.bars().forEach((bar) => {
      expect(bar.h).toBeLessThanOrEqual(12);
    });

    const texts = fixture.nativeElement.querySelectorAll('svg text');
    // 5 grid-line labels + 12 month labels + 0 rate labels.
    expect(texts.length).toBe(5 + zeroData.length);
  });

  it('chartAriaLabel includes propertyTitle and yearlyAverage', () => {
    const aria = component.chartAriaLabel();
    expect(aria).toContain('Apto Lisboa');
    expect(aria).toContain('78');
  });

  it('exposes chartAriaLabel on the chart wrapper aria-label attribute', () => {
    const wrap = fixture.nativeElement.querySelector('.iu-occ-chart__chart-wrap');
    expect(wrap.getAttribute('aria-label')).toContain('Apto Lisboa');
    expect(wrap.getAttribute('aria-label')).toContain('78');
  });

  it('renders both legend items (Ocupado, Vago)', () => {
    const items = fixture.nativeElement.querySelectorAll('.iu-occ-chart__legend-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Ocupado');
    expect(items[1].textContent).toContain('Vago');
  });

  it('bar widths are at least the minimum of 8 px', () => {
    component.bars().forEach((bar) => {
      expect(bar.w).toBeGreaterThanOrEqual(8);
    });
  });

  it('bar heights are at least the minimum of 2 px', () => {
    component.bars().forEach((bar) => {
      expect(bar.h).toBeGreaterThanOrEqual(2);
    });
  });

  it('bar y + h equals CHART_BOTTOM for every bar (sits on the baseline)', () => {
    component.bars().forEach((bar) => {
      expect(bar.y + bar.h).toBeCloseTo(145, 5);
    });
  });

  it('bars are laid out left-to-right with monotonically increasing x', () => {
    const bars = component.bars();
    for (let i = 1; i < bars.length; i++) {
      expect(bars[i].x).toBeGreaterThan(bars[i - 1].x);
    }
  });

  it('reacts to summary updates by recomputing bars and aria label', () => {
    const updated: OccupancySummary = {
      propertyId: 'p2',
      propertyTitle: 'Casa Porto',
      yearlyAverage: 42,
      data: [
        { month: 'Jan', occupancyRate: 10, occupied: true },
        { month: 'Fev', occupancyRate: 20, occupied: false },
      ],
    };
    fixture.componentRef.setInput('summary', updated);
    fixture.detectChanges();

    expect(component.bars().length).toBe(2);
    expect(component.chartAriaLabel()).toContain('Casa Porto');
    expect(component.chartAriaLabel()).toContain('42');
    const subtitle = fixture.nativeElement.querySelector('.iu-occ-chart__subtitle');
    expect(subtitle.textContent).toContain('Casa Porto');
  });

  it('handles a single data point without throwing', () => {
    const single: OccupancySummary = {
      propertyId: 'p3',
      propertyTitle: 'Studio',
      yearlyAverage: 100,
      data: [{ month: 'Jan', occupancyRate: 100, occupied: true }],
    };
    fixture.componentRef.setInput('summary', single);
    fixture.detectChanges();

    expect(component.bars().length).toBe(1);
    const rects = fixture.nativeElement.querySelectorAll('rect.iu-occ-chart__bar');
    expect(rects.length).toBe(1);
  });
});
