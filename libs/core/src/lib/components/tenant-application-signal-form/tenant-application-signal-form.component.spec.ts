import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantApplicationSignalFormComponent } from './tenant-application-signal-form.component';
import { TenantApplicationFormComponent } from '../tenant-application/tenant-application-form.component';
import {
  TenantApplicationService,
  CreateApplicationPayload,
} from '../../services/tenant-application.service';

/**
 * Specs for {@link TenantApplicationSignalFormComponent} — the official-`form()`
 * twin of {@link TenantApplicationFormComponent}.
 *
 * The suite drives the **public contract** (DOM inputs + the real `[formField]`
 * two-way binding + the outputs), and closes with a **parity block** that runs the
 * same inputs through *both* twins and asserts they hand
 * `TenantApplicationService.submit` a byte-identical `CreateApplicationPayload` —
 * the safety criterion of the migration.
 */
describe('TenantApplicationSignalFormComponent', () => {
  let fixture: ComponentFixture<TenantApplicationSignalFormComponent>;
  let host: HTMLElement;
  let component: TenantApplicationSignalFormComponent;
  let service: TenantApplicationService;

  const setInputs = (
    ref: ComponentFixture<TenantApplicationSignalFormComponent | TenantApplicationFormComponent>,
  ): void => {
    ref.componentRef.setInput('tenantId', 'tenant-001');
    ref.componentRef.setInput('tenantName', 'Ana Ferreira');
    ref.componentRef.setInput('tenantEmail', 'ana@email.pt');
    ref.componentRef.setInput('propertyId', 'p1');
    ref.componentRef.setInput('propertyTitle', 'T2 no Chiado');
    ref.componentRef.setInput('landlordId', 'landlord-001');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantApplicationSignalFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantApplicationSignalFormComponent);
    host = fixture.nativeElement as HTMLElement;
    component = fixture.componentInstance;
    service = TestBed.inject(TenantApplicationService);
    setInputs(fixture);
    fixture.detectChanges();
  });

  /** Type a value into a control and propagate it through `[formField]`. */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function blur(selector: string): void {
    host.querySelector(selector)!.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  const errorTexts = (): string[] =>
    Array.from(host.querySelectorAll('.taf-error')).map((e) => e.textContent?.trim() ?? '');

  // ── render ────────────────────────────────────────────────────────────────

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the form() engine badge and starts on the personal step', () => {
    expect(host.querySelector('.taf-badge')?.textContent?.trim()).toBe('form()');
    expect(component.currentStep()).toBe('personal');
    expect(host.querySelector('#tafs-phone')).toBeTruthy();
    expect(host.querySelector('#tafs-nif')).toBeTruthy();
  });

  it('shows no field errors before any interaction', () => {
    expect(errorTexts().length).toBe(0);
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('flags a required phone once touched', () => {
    blur('#tafs-phone');
    expect(errorTexts()).toContain('Telefone obrigatório.');
  });

  it('rejects a malformed NIF via the pattern(/^\\d{9}$/) validator', () => {
    typeInto('#tafs-nif', '12'); // not 9 digits
    blur('#tafs-nif');
    expect(errorTexts()).toContain('NIF deve ter 9 dígitos.');
  });

  it('accepts a well-formed 9-digit NIF', () => {
    typeInto('#tafs-nif', '123456789');
    blur('#tafs-nif');
    expect(errorTexts()).not.toContain('NIF deve ter 9 dígitos.');
  });

  it('surfaces required errors on the current step after a submit attempt', () => {
    component.onSubmit(); // ungated (mirrors bespoke), but marks attempted → errors visible
    fixture.detectChanges();
    const errors = errorTexts();
    expect(errors).toContain('Telefone obrigatório.');
    expect(errors).toContain('NIF obrigatório.');
    expect(errors).toContain('Nacionalidade obrigatória.');
  });

  // ── segmented choosers (imperative value.set) ───────────────────────────────

  it('toggles the pets chooser via imperative field write', () => {
    const [no, yes] = Array.from(host.querySelectorAll<HTMLButtonElement>('.taf-seg-btn'));
    expect(no.classList.contains('active')).toBe(true); // default 'false'
    yes.click();
    fixture.detectChanges();
    expect(yes.classList.contains('active')).toBe(true);
  });

  // ── native number parse ─────────────────────────────────────────────────────

  it('parses the income input natively as a number (no manual coercion)', () => {
    jest.useFakeTimers();
    try {
      const spy = jest.spyOn(service, 'submit');
      typeInto('#tafs-phone', '912345678');
      typeInto('#tafs-nif', '123456789');

      component.nextStep(); // → employment
      fixture.detectChanges();
      typeInto('#tafs-income', '2500');

      component.onSubmit();
      jest.advanceTimersByTime(600);

      const payload = spy.mock.calls[0]![0];
      expect(payload.monthlyIncome).toBe(2500);
      expect(typeof payload.monthlyIncome).toBe('number');
    } finally {
      jest.useRealTimers();
    }
  });

  // ── submit flow ─────────────────────────────────────────────────────────────

  it('submits through the service and shows the success state', () => {
    jest.useFakeTimers();
    try {
      const before = service.applications().length;

      typeInto('#tafs-phone', '912345678');
      typeInto('#tafs-nif', '123456789');
      typeInto('#tafs-nationality', 'Portuguesa');

      component.nextStep();
      fixture.detectChanges();
      typeInto('#tafs-income', '2000');
      typeInto('#tafs-occupation', 'Engenheira');

      component.onSubmit();
      expect(component.saving()).toBe(true);

      jest.advanceTimersByTime(600);
      fixture.detectChanges();

      expect(component.saving()).toBe(false);
      expect(component.submittedSuccess()).toBe(true);
      expect(service.applications().length).toBe(before + 1);
      expect(host.querySelector('.taf-success')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('carries entered references into the submitted payload', () => {
    jest.useFakeTimers();
    try {
      const spy = jest.spyOn(service, 'submit');
      component.addRef();
      const id = component.refs()[0].id;
      component.updateRef(id, 'name', 'Maria');

      typeInto('#tafs-phone', '912345678');
      typeInto('#tafs-nif', '123456789');

      component.onSubmit();
      jest.advanceTimersByTime(600);

      const payload = spy.mock.calls[0]![0];
      expect(payload.references.length).toBe(1);
      expect(payload.references[0].name).toBe('Maria');
    } finally {
      jest.useRealTimers();
    }
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke TenantApplicationFormComponent', () => {
    /**
     * Fills the *official* twin through the DOM, captures the payload its
     * `submit` receives, then does the same with a freshly-built bespoke twin and
     * asserts the two payloads are byte-identical — the migration is only safe if
     * both hand the service the same data.
     */
    it('hands TenantApplicationService.submit the same payload for the same inputs', () => {
      jest.useFakeTimers();
      try {
        const officialSpy = jest.spyOn(service, 'submit');

        // ── official twin (this fixture) ──
        typeInto('#tafs-phone', '912345678');
        typeInto('#tafs-nif', '123456789');
        typeInto('#tafs-nationality', 'Portuguesa');
        component.nextStep();
        fixture.detectChanges();
        typeInto('#tafs-income', '2000');
        typeInto('#tafs-occupation', 'Engenheira');
        // step to cover letter and fill it
        component.nextStep(); // references
        component.nextStep(); // cover
        fixture.detectChanges();
        typeInto(
          '#tafs-cover',
          'Somos um casal responsável à procura de estabilidade a longo prazo.',
        );
        component.onSubmit();
        jest.advanceTimersByTime(600);
        const officialPayload: CreateApplicationPayload = officialSpy.mock.calls[0]![0];
        expect(officialPayload).toBeDefined();

        // ── bespoke twin (fresh TestBed) ──
        TestBed.resetTestingModule();
        jest.useRealTimers();
        return buildBespokeAndCompare(officialPayload);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

/**
 * Builds a bespoke {@link TenantApplicationFormComponent} in its own TestBed, drives
 * it through the same inputs, and asserts its `submit` payload equals the official
 * twin's. Separated so the parity test can `resetTestingModule` without provider
 * bleed. Returns a promise the spec awaits.
 */
async function buildBespokeAndCompare(officialPayload: CreateApplicationPayload): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [TenantApplicationFormComponent],
  }).compileComponents();

  const fix = TestBed.createComponent(TenantApplicationFormComponent);
  const bHost = fix.nativeElement as HTMLElement;
  const bComp = fix.componentInstance;
  const bService = TestBed.inject(TenantApplicationService);
  fix.componentRef.setInput('tenantId', 'tenant-001');
  fix.componentRef.setInput('tenantName', 'Ana Ferreira');
  fix.componentRef.setInput('tenantEmail', 'ana@email.pt');
  fix.componentRef.setInput('propertyId', 'p1');
  fix.componentRef.setInput('propertyTitle', 'T2 no Chiado');
  fix.componentRef.setInput('landlordId', 'landlord-001');
  fix.detectChanges();

  const bespokeSpy = jest.spyOn(bService, 'submit');

  const bType = (sel: string, val: string) => {
    const el = bHost.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)!;
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fix.detectChanges();
    TestBed.tick();
  };

  jest.useFakeTimers();
  try {
    bType('#taf-phone', '912345678');
    bType('#taf-nif', '123456789');
    bType('#taf-nationality', 'Portuguesa');
    bComp.nextStep();
    fix.detectChanges();
    bType('#taf-income', '2000');
    bType('#taf-occupation', 'Engenheira');
    bComp.nextStep();
    bComp.nextStep();
    fix.detectChanges();
    bType('#taf-cover', 'Somos um casal responsável à procura de estabilidade a longo prazo.');
    bComp.onSubmit();
    jest.advanceTimersByTime(600);

    const bespokePayload: CreateApplicationPayload = bespokeSpy.mock.calls[0]![0];
    expect(bespokePayload).toEqual(officialPayload);
  } finally {
    jest.useRealTimers();
  }
}
