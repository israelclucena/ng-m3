import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentReceiptGeneratorComponent } from './rent-receipt-generator.component';
import { RentReceiptService } from '../../services/rent-receipt.service';

// A valid Portuguese NIF (passes the mod-11 checksum used by isValidNIF).
const VALID_NIF_A = '123456789';
const VALID_NIF_B = '500000000';

describe('RentReceiptGeneratorComponent', () => {
  let fixture: ComponentFixture<RentReceiptGeneratorComponent>;
  let component: RentReceiptGeneratorComponent;
  let service: RentReceiptService;

  const set = (sig: string, value: string | number): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any)[sig].set(value);
  };
  const submitBtn = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.rrg-submit');
  const docTotal = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.rrg-doc-total .rrg-doc-num');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentReceiptGeneratorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RentReceiptGeneratorComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(RentReceiptService);
    service.clear();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    expect(fixture.nativeElement.querySelector('.rrg-title').textContent).toContain('Recibo de Renda');
  });

  it('should show the empty preview before any receipt is issued', () => {
    expect(fixture.nativeElement.querySelector('.rrg-preview-empty')).toBeTruthy();
  });

  // ── canSubmit gating ───────────────────────────────────────────────────────

  it('should disable submit until the form is complete and valid', () => {
    expect(component['canSubmit']()).toBe(false);
    expect(submitBtn().disabled).toBe(true);

    set('senhNome', 'Senhorio Lda');
    set('inqNome', 'Inquilino Silva');
    set('senhNif', VALID_NIF_A);
    set('inqNif', VALID_NIF_B);
    set('valor', 800);
    expect(component['canSubmit']()).toBe(true);
  });

  it('should reject invalid NIFs', () => {
    set('senhNome', 'A');
    set('inqNome', 'B');
    set('senhNif', '111111111'); // fails checksum
    set('inqNif', VALID_NIF_B);
    set('valor', 800);
    expect(component['senhNifValid']()).toBe(false);
    expect(component['canSubmit']()).toBe(false);
  });

  it('should reject non-positive rent', () => {
    set('senhNome', 'A');
    set('inqNome', 'B');
    set('senhNif', VALID_NIF_A);
    set('inqNif', VALID_NIF_B);
    set('valor', 0);
    expect(component['canSubmit']()).toBe(false);
  });

  // ── Generation + financial computeds ────────────────────────────────────────

  it('should generate a receipt with correct withholding and net amounts', () => {
    set('senhNome', 'Senhorio Lda');
    set('inqNome', 'Inquilino Silva');
    set('senhNif', VALID_NIF_A);
    set('inqNif', VALID_NIF_B);
    set('morada', 'Rua A, Lisboa');
    set('valor', 1000);
    set('retencao', 25);

    component['onSubmit'](new Event('submit'));

    expect(service.count()).toBe(1);
    const r = service.receipts()[0];
    expect(r.valorMensal).toBe(1000);
    expect(r.valorRetido).toBe(250);
    expect(r.valorLiquido).toBe(750);
    expect(r.retencaoIRSPct).toBe(25);
  });

  it('should not generate when the form is invalid', () => {
    component['onSubmit'](new Event('submit'));
    expect(service.count()).toBe(0);
  });

  it('should render the issued receipt in the preview', () => {
    set('senhNome', 'Senhorio Lda');
    set('inqNome', 'Inquilino Silva');
    set('senhNif', VALID_NIF_A);
    set('inqNif', VALID_NIF_B);
    set('valor', 500);
    component['onSubmit'](new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rrg-doc')).toBeTruthy();
    expect(docTotal()!.textContent).toContain('375.00'); // 500 − 25% = 375
  });

  it('should clear history via clearAll', () => {
    set('senhNome', 'A');
    set('inqNome', 'B');
    set('senhNif', VALID_NIF_A);
    set('inqNif', VALID_NIF_B);
    set('valor', 500);
    component['onSubmit'](new Event('submit'));
    expect(service.count()).toBe(1);

    component['clearAll']();
    expect(service.count()).toBe(0);
  });

  // ── formatMes helper ────────────────────────────────────────────────────────

  it('should format the reference month in Portuguese', () => {
    expect(component['formatMes']('2026-06')).toBe('Junho 2026');
    expect(component['formatMes']('2026-01')).toBe('Janeiro 2026');
  });

  it('should pass through an out-of-range month string', () => {
    expect(component['formatMes']('2026-13')).toBe('2026-13');
    expect(component['formatMes']('2026-00')).toBe('2026-00');
  });

  // ── input coercion helpers ──────────────────────────────────────────────────

  it('should coerce numeric input, flooring negatives to 0', () => {
    const ev = { target: { value: '-5' } } as unknown as Event;
    expect(component['getNum'](ev)).toBe(0);
    const ok = { target: { value: '42' } } as unknown as Event;
    expect(component['getNum'](ok)).toBe(42);
  });
});
