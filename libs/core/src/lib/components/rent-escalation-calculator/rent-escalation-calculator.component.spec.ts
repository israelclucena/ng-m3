import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentEscalationCalculatorComponent } from './rent-escalation-calculator.component';
import { RentEscalationService } from '../../services/rent-escalation.service';

describe('RentEscalationCalculatorComponent', () => {
  let fixture: ComponentFixture<RentEscalationCalculatorComponent>;
  let component: RentEscalationCalculatorComponent;
  let service: RentEscalationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentEscalationCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RentEscalationCalculatorComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(RentEscalationService);
    service.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.re-title');
    const subtitle = fixture.nativeElement.querySelector('.re-subtitle');
    expect(title.textContent).toContain('Actualização de Renda');
    expect(subtitle.textContent).toContain('NRAU');
  });

  // ── Default escalation (2024 → 2026) ───────────────────────────────────────

  it('should build a year-by-year history between start and target', () => {
    const rows = service.historicoEscalation();
    expect(rows.length).toBe(2);
    expect(rows[0].year).toBe(2025);
    expect(rows[1].year).toBe(2026);
  });

  it('should apply the published coefficients cumulatively', () => {
    // 800 * 1.0228 = 818.24 ; 818.24 * 1.0216 ≈ 835.91
    expect(service.rendaAtualizada()).toBeCloseTo(835.91, 2);
    expect(service.aumentoTotal()).toBeCloseTo(35.91, 2);
    expect(service.aumentoPct()).toBeCloseTo(4.49, 2);
  });

  it('should render one history row per year', () => {
    const tableRows = fixture.nativeElement.querySelectorAll('.re-table tbody tr');
    expect(tableRows.length).toBe(2);
  });

  // ── Empty / boundary states ────────────────────────────────────────────────

  it('should return no history when target year is not after start', () => {
    service.setAnos(2026, 2026);
    fixture.detectChanges();
    expect(service.historicoEscalation().length).toBe(0);
    expect(service.rendaAtualizada()).toBe(service.rendaActual());
    expect(fixture.nativeElement.querySelector('.re-hint')).toBeTruthy();
  });

  it('should treat zero starting rent percentage as zero', () => {
    service.setRenda(0);
    expect(service.aumentoPct()).toBe(0);
  });

  // ── Overrides (deterministic clean coefficient) ────────────────────────────

  it('should honour a per-year coefficient override', () => {
    service.setRenda(1000);
    service.setAnos(2024, 2025);
    service.applyCoeficienteOverride(2025, 1.1);
    expect(service.rendaAtualizada()).toBeCloseTo(1100, 2);
    expect(service.aumentoTotal()).toBeCloseTo(100, 2);
    expect(service.aumentoPct()).toBeCloseTo(10, 2);
  });

  it('should ignore a non-positive override', () => {
    const before = service.rendaAtualizada();
    service.applyCoeficienteOverride(2025, 0);
    expect(service.rendaAtualizada()).toBeCloseTo(before, 2);
  });

  // ── Input handlers via DOM events ──────────────────────────────────────────

  it('should update the rent from the rent input', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.re-input');
    input.value = '950';
    input.dispatchEvent(new Event('input'));
    expect(service.rendaActual()).toBe(950);
  });

  it('should reset state on the reset button', () => {
    service.setRenda(2000);
    service.setAnos(2018, 2026);
    service.reset();
    expect(service.rendaActual()).toBe(800);
    expect(service.anoInicio()).toBe(2024);
    expect(service.anoAlvo()).toBe(2026);
  });
});
