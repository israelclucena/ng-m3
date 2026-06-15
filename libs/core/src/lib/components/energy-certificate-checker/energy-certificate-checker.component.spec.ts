import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnergyCertificateCheckerComponent } from './energy-certificate-checker.component';
import {
  EnergyCertificateService,
  PT_ENERGY_CLASS_ORDER,
} from '../../services/energy-certificate.service';

describe('EnergyCertificateCheckerComponent', () => {
  let fixture: ComponentFixture<EnergyCertificateCheckerComponent>;
  let component: EnergyCertificateCheckerComponent;
  let service: EnergyCertificateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnergyCertificateCheckerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnergyCertificateCheckerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(EnergyCertificateService);
    // Pin "today" so validity assertions are deterministic.
    service.setHoje('2026-06-15');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.ec-title');
    const subtitle = fixture.nativeElement.querySelector('.ec-subtitle');
    expect(title.textContent).toContain('Certificado Energético');
    expect(subtitle.textContent).toContain('DL 118/2013');
  });

  // ── Inputs reflect service state ──────────────────────────────────────────────

  it('should reflect the service certificate number in the input', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.ec-input');
    expect(input.value).toBe('CE-2024-1234567');
  });

  it('should render all energy classes as select options', () => {
    const select = fixture.nativeElement.querySelectorAll('select.ec-input')[0];
    const options = Array.from(select.querySelectorAll('option')).map((o: any) => o.textContent.trim());
    expect(options).toEqual([...PT_ENERGY_CLASS_ORDER]);
    expect(options.length).toBe(8);
  });

  it('should render the three property types as options', () => {
    const select = fixture.nativeElement.querySelectorAll('select.ec-input')[1];
    const options = Array.from(select.querySelectorAll('option')).map((o: any) => o.textContent.trim());
    expect(options).toEqual(['Habitação', 'Comércio', 'Serviços']);
  });

  // ── Input handlers ───────────────────────────────────────────────────────────

  it('should update the certificate number via input event', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.ec-input');
    input.value = 'CE-2026-9999999';
    input.dispatchEvent(new Event('input'));
    expect(service.numeroCertificado()).toBe('CE-2026-9999999');
  });

  it('should update the class via select change', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelectorAll('select.ec-input')[0];
    select.value = 'A';
    select.dispatchEvent(new Event('change'));
    expect(service.classe()).toBe('A');
  });

  // ── Validity ─────────────────────────────────────────────────────────────────

  it('should report a valid certificate before expiry', () => {
    // default emission 2024-06-15 + 10y validity → expires 2034-06-15
    expect(service.valido()).toBe(true);
    expect(service.diasParaExpirar()).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('.ec-out--ok')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ec-out--alert')).toBeNull();
  });

  it('should report an expired certificate after expiry', () => {
    service.setHoje('2035-01-01');
    fixture.detectChanges();
    expect(service.valido()).toBe(false);
    expect(service.diasParaExpirar()).toBeLessThan(0);
    expect(fixture.nativeElement.querySelector('.ec-out--alert')).toBeTruthy();
    expect(component['svc'].recomendacaoMelhoria()).toContain('expirado');
  });

  // ── Savings ──────────────────────────────────────────────────────────────────

  it('should compute potential savings for class C (default)', () => {
    // upper(C)=200, ref A=50, delta=150, area=80 → 12000 kWh/year
    expect(service.economiaPotencialKwhAno()).toBe(12000);
  });

  it('should report zero savings for class A', () => {
    service.setClasse('A');
    fixture.detectChanges();
    expect(service.economiaPotencialKwhAno()).toBe(0);
    expect(service.recomendacaoMelhoria()).toContain('excelente');
  });

  it('should use the capped delta for class F (infinite upper bound)', () => {
    service.setClasse('F');
    fixture.detectChanges();
    // area * (350 - 50) = 80 * 300 = 24000
    expect(service.economiaPotencialKwhAno()).toBe(24000);
  });

  // ── Legal info ───────────────────────────────────────────────────────────────

  it('should render the legal fine range', () => {
    const legal = fixture.nativeElement.querySelector('.ec-out--legal');
    expect(legal.textContent).toContain('250');
    expect(legal.textContent).toContain('3740');
  });

  // ── Service setter behaviour via component ────────────────────────────────────

  it('should set validity to 6 years for commercial properties', () => {
    service.setTipoImovel('comercio');
    expect(service.validadeAnos()).toBe(6);
    service.setTipoImovel('habitacao');
    expect(service.validadeAnos()).toBe(10);
  });

  it('should fall back to 10 years for an invalid validity', () => {
    service.setValidadeAnos(0);
    expect(service.validadeAnos()).toBe(10);
  });

  it('should clamp a negative area to zero', () => {
    service.setAreaM2(-5);
    expect(service.areaM2()).toBe(0);
  });

  it('should restore defaults on reset', () => {
    service.setClasse('F');
    service.setAreaM2(200);
    service.reset();
    expect(service.classe()).toBe('C');
    expect(service.areaM2()).toBe(80);
    expect(service.numeroCertificado()).toBe('CE-2024-1234567');
  });

  // ── Badge ────────────────────────────────────────────────────────────────────

  it('should render the current class in the badge', () => {
    const badge = fixture.nativeElement.querySelector('.ec-badge');
    expect(badge.textContent.trim()).toBe('C');
    service.setClasse('A+');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ec-badge').textContent.trim()).toBe('A+');
  });
});
