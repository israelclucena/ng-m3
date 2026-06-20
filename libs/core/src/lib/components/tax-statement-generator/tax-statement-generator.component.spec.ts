import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaxStatementGeneratorComponent } from './tax-statement-generator.component';
import { TaxStatementService } from '../../services/tax-statement.service';

describe('TaxStatementGeneratorComponent', () => {
  let fixture: ComponentFixture<TaxStatementGeneratorComponent>;
  let component: TaxStatementGeneratorComponent;
  let service: TaxStatementService;

  // Protected members are reachable in specs via bracket access.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (): any => component as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxStatementGeneratorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaxStatementGeneratorComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TaxStatementService);
    service.reset();
    service.setYear(2025);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    expect(fixture.nativeElement.querySelector('.tsg-title').textContent)
      .toContain('Resumo Anual IRS Cat. F');
  });

  it('should show empty states before any entry is added', () => {
    const empties = fixture.nativeElement.querySelectorAll('.tsg-empty');
    expect(empties.length).toBe(2); // rents + expenses
  });

  // ── Add-rent gating ─────────────────────────────────────────────────────────

  it('should not allow adding a rent without a month and positive gross', () => {
    expect(c().canAddRent()).toBe(false);

    c().rentMonth.set('2025-01');
    expect(c().canAddRent()).toBe(false); // gross still 0

    c().rentGross.set(800);
    expect(c().canAddRent()).toBe(true);
  });

  it('should add a rent entry, feed the service totals, and reset the draft', () => {
    c().rentMonth.set('2025-03');
    c().rentGross.set(1000);
    c().rentWithhold.set(250);
    c().addRent();

    expect(service.rentEntries().length).toBe(1);
    expect(service.totalGrossIncome()).toBe(1000);
    expect(service.withholdingsTotal()).toBe(250);
    expect(service.effectiveRate()).toBe(25);

    // draft cleared
    expect(c().rentMonth()).toBe('');
    expect(c().rentGross()).toBe(0);
    expect(c().rentWithhold()).toBe(0);
  });

  it('should ignore addRent when the draft is incomplete', () => {
    c().rentGross.set(500); // no month
    c().addRent();
    expect(service.rentEntries().length).toBe(0);
  });

  // ── Add-expense gating ──────────────────────────────────────────────────────

  it('should require description, positive amount and date before adding an expense', () => {
    expect(c().canAddExpense()).toBe(false);

    c().expDescription.set('IMI 2025');
    c().expAmount.set(320);
    expect(c().canAddExpense()).toBe(false); // no date

    c().expDate.set('2025-04-30');
    expect(c().canAddExpense()).toBe(true);
  });

  it('should add an expense, reflect it in deductions, and reset the draft', () => {
    c().expDescription.set('Condomínio');
    c().expAmount.set(600);
    c().expCategory.set('condominio');
    c().expDate.set('2025-06-01');
    c().addExpense();

    expect(service.deductibleExpenses().length).toBe(1);
    expect(service.totalDeductions()).toBe(600);
    expect(c().expDescription()).toBe('');
    expect(c().expAmount()).toBe(0);
    expect(c().expDate()).toBe('');
  });

  it('should ignore addExpense when the draft is incomplete', () => {
    c().expDescription.set('Sem valor');
    c().addExpense();
    expect(service.deductibleExpenses().length).toBe(0);
  });

  // ── Net income wiring ───────────────────────────────────────────────────────

  it('should derive net income as gross minus deductions', () => {
    c().rentMonth.set('2025-01');
    c().rentGross.set(2000);
    c().addRent();

    c().expDescription.set('Seguro');
    c().expAmount.set(500);
    c().expCategory.set('seguro_multirriscos');
    c().expDate.set('2025-02-01');
    c().addExpense();

    expect(service.netIncome()).toBe(1500);
  });

  // ── Year input ──────────────────────────────────────────────────────────────

  it('should clamp the year through the service when edited', () => {
    c().onYear({ target: { value: '1980' } } as unknown as Event);
    expect(service.year()).toBe(1990); // clamped to floor
  });

  // ── Category helpers ────────────────────────────────────────────────────────

  it('should resolve icon and label for a known category', () => {
    expect(c().iconFor('imi')).toBe('🏛️');
    expect(c().labelFor('imi')).toBe('IMI');
  });

  it('should fall back gracefully for an unknown category', () => {
    expect(c().iconFor('bogus')).toBe('📋');
    expect(c().labelFor('bogus')).toBe('bogus');
  });

  it('should build category breakdown entries in declaration order', () => {
    c().expDescription.set('Obras');
    c().expAmount.set(100);
    c().expCategory.set('conservacao');
    c().expDate.set('2025-05-05');
    c().addExpense();

    const entries = c().categoryEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].id).toBe('conservacao');
    expect(entries[0].value).toBe(100);
  });

  it('should reset entries and expenses via the footer button', () => {
    c().rentMonth.set('2025-01');
    c().rentGross.set(900);
    c().addRent();
    expect(service.rentEntries().length).toBe(1);

    service.reset();
    expect(service.rentEntries().length).toBe(0);
    expect(service.deductibleExpenses().length).toBe(0);
  });
});
