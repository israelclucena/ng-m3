import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AnnualPropertyTaxBurdenComponent } from './annual-property-tax-burden.component';
import { AnnualPropertyTaxBurdenService } from '../../services/annual-property-tax-burden.service';
import type {
  AnnualBurdenResult,
  PropertyBurdenLine,
  TaxCalendarEvent,
} from '../../services/annual-property-tax-burden.service';

describe('AnnualPropertyTaxBurdenComponent', () => {
  let fixture: ComponentFixture<AnnualPropertyTaxBurdenComponent>;
  let component: AnnualPropertyTaxBurdenComponent;

  const makeProperty = (id: string): PropertyBurdenLine => ({
    property: {
      id,
      address: `Rua ${id}`,
      vpt: 100000,
      municipalityImiRate: 0.003,
      annualRentalIncome: 12000,
    } as any,
    imi: 300,
    aimiShare: 50,
    irs: 1500,
    totalAnnual: 1850,
  });

  const makeEvent = (
    id: string,
    kind: TaxCalendarEvent['kind'],
    note?: string,
  ): TaxCalendarEvent => ({
    id,
    kind,
    label: `Pagamento ${id}`,
    date: new Date(2026, 4, 31),
    amount: 250,
    note,
  });

  const baseResult: AnnualBurdenResult = {
    year: 2026,
    imi: 600,
    aimi: 150,
    irsF: 3000,
    maisValias: 800,
    total: 4550,
    perProperty: [makeProperty('p1'), makeProperty('p2')],
    dispositions: [],
    calendarEvents: [
      makeEvent('e1', 'imi', '1ª prestação'),
      makeEvent('e2', 'aimi'),
    ],
  };

  const stub = {
    year: signal(2026),
    setYear: jest.fn(function (this: void, y: number) {
      stub.year.set(y);
    }),
    result: signal<AnnualBurdenResult>(baseResult),
  };

  beforeEach(async () => {
    stub.year.set(2026);
    stub.result.set(baseResult);
    stub.setYear.mockClear();

    await TestBed.configureTestingModule({
      imports: [AnnualPropertyTaxBurdenComponent],
      providers: [
        { provide: AnnualPropertyTaxBurdenService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnualPropertyTaxBurdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    const title = fixture.nativeElement.querySelector('.aptb-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Annual Property Tax Burden');
  });

  it('renders subtitle showing perProperty.length', () => {
    const subtitle = fixture.nativeElement.querySelector('.aptb-subtitle') as HTMLElement;
    expect(subtitle.textContent).toContain('2 propriedades');
  });

  it('reflects 0 propriedades when perProperty is empty', () => {
    stub.result.set({ ...baseResult, perProperty: [] });
    fixture.detectChanges();
    const subtitle = fixture.nativeElement.querySelector('.aptb-subtitle') as HTMLElement;
    expect(subtitle.textContent).toContain('0 propriedades');
  });

  it('year input value equals service.year()', () => {
    const input = fixture.nativeElement.querySelector('#aptb-year') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('2026');
  });

  it('typing a numeric year fires onYearChange which calls service.setYear with parsed number', () => {
    const input = fixture.nativeElement.querySelector('#aptb-year') as HTMLInputElement;
    input.value = '2030';
    input.dispatchEvent(new Event('input'));
    expect(stub.setYear).toHaveBeenCalledWith(2030);
  });

  it('onYearChange called directly with a finite value calls setYear', () => {
    const evt = { target: { value: '2027' } } as unknown as Event;
    component.onYearChange(evt);
    expect(stub.setYear).toHaveBeenCalledWith(2027);
  });

  it('onYearChange called with a non-numeric value does not call setYear', () => {
    const evt = { target: { value: 'xyz' } } as unknown as Event;
    component.onYearChange(evt);
    expect(stub.setYear).not.toHaveBeenCalled();
  });

  it('renders all 5 KPI tiles', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis.length).toBe(5);
  });

  it('renders IMI KPI with formatted value', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[0].textContent).toContain('IMI');
    expect(kpis[0].textContent).toContain('600');
  });

  it('renders AIMI KPI with formatted value', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[1].textContent).toContain('AIMI');
    expect(kpis[1].textContent).toContain('150');
  });

  it('renders IRS Cat. F KPI with formatted value', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[2].textContent).toContain('IRS Cat. F');
    expect(kpis[2].textContent).toContain('3,000');
  });

  it('renders Mais-Valias KPI with formatted value', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[3].textContent).toContain('Mais-Valias');
    expect(kpis[3].textContent).toContain('800');
  });

  it('renders Total KPI including the year and formatted total', () => {
    const total = fixture.nativeElement.querySelector('.aptb-kpi.aptb-total') as HTMLElement;
    expect(total).toBeTruthy();
    expect(total.textContent).toContain('Total 2026');
    expect(total.textContent).toContain('4,550');
  });

  it('does NOT mark AIMI kpi as muted when aimi > 0', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[1].classList.contains('aptb-kpi-muted')).toBe(false);
  });

  it('marks AIMI kpi as muted when aimi === 0', () => {
    stub.result.set({ ...baseResult, aimi: 0 });
    fixture.detectChanges();
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[1].classList.contains('aptb-kpi-muted')).toBe(true);
  });

  it('does NOT mark Mais-Valias kpi as muted when maisValias > 0', () => {
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[3].classList.contains('aptb-kpi-muted')).toBe(false);
  });

  it('marks Mais-Valias kpi as muted when maisValias === 0', () => {
    stub.result.set({ ...baseResult, maisValias: 0 });
    fixture.detectChanges();
    const kpis = fixture.nativeElement.querySelectorAll('.aptb-kpi');
    expect(kpis[3].classList.contains('aptb-kpi-muted')).toBe(true);
  });

  it('renders the calendar section title', () => {
    const sectionTitle = fixture.nativeElement.querySelector('.aptb-section-title') as HTMLElement;
    expect(sectionTitle.textContent).toContain('Calendário fiscal');
  });

  it('renders timeline with one .aptb-event per calendarEvent', () => {
    const events = fixture.nativeElement.querySelectorAll('.aptb-event');
    expect(events.length).toBe(2);
  });

  it('does NOT render .aptb-empty when there are calendar events', () => {
    expect(fixture.nativeElement.querySelector('.aptb-empty')).toBeNull();
  });

  it('renders .aptb-empty with "Sem pagamentos" when calendarEvents is empty', () => {
    stub.result.set({ ...baseResult, calendarEvents: [] });
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.aptb-empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Sem pagamentos');
    expect(empty.textContent).toContain('2026');
  });

  it('does NOT render .aptb-timeline when calendarEvents is empty', () => {
    stub.result.set({ ...baseResult, calendarEvents: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.aptb-timeline')).toBeNull();
  });

  it('event with note renders .aptb-note', () => {
    const events = fixture.nativeElement.querySelectorAll('.aptb-event');
    const note = (events[0] as HTMLElement).querySelector('.aptb-note') as HTMLElement;
    expect(note).toBeTruthy();
    expect(note.textContent).toContain('1ª prestação');
  });

  it('event without note does not render .aptb-note', () => {
    const events = fixture.nativeElement.querySelectorAll('.aptb-event');
    expect((events[1] as HTMLElement).querySelector('.aptb-note')).toBeNull();
  });

  it('sets data-kind attribute on each event element', () => {
    const events = fixture.nativeElement.querySelectorAll('.aptb-event');
    expect((events[0] as HTMLElement).getAttribute('data-kind')).toBe('imi');
    expect((events[1] as HTMLElement).getAttribute('data-kind')).toBe('aimi');
  });

  it('renders event label and amount', () => {
    const events = fixture.nativeElement.querySelectorAll('.aptb-event');
    const first = events[0] as HTMLElement;
    expect((first.querySelector('.aptb-label') as HTMLElement).textContent).toContain('Pagamento e1');
    expect((first.querySelector('.aptb-amount') as HTMLElement).textContent).toContain('250');
  });

  it('renders the footnote with regulatory text', () => {
    const footnote = fixture.nativeElement.querySelector('.aptb-footnote') as HTMLElement;
    expect(footnote).toBeTruthy();
    expect(footnote.textContent).toContain('Estimativa indicativa');
  });

  it('exposes service and burden bindings to the template', () => {
    expect(component.service).toBe(stub as any);
    expect(component.burden()).toBe(baseResult);
  });
});
