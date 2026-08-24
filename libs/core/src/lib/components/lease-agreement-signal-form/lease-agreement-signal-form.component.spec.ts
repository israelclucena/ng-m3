import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaseAgreementSignalFormComponent } from './lease-agreement-signal-form.component';
import { LeaseAgreementFormComponent } from '../lease-agreement/lease-agreement-form.component';
import {
  LeaseAgreementService,
  LeaseAgreement,
} from '../../services/lease-agreement.service';

/**
 * Specs for {@link LeaseAgreementSignalFormComponent} — the official-`form()`
 * twin of {@link LeaseAgreementFormComponent}.
 *
 * The suite drives the **public contract only** (DOM segment buttons + date/number
 * inputs + textarea via the real `[formField]` two-way binding + the `submitted`
 * output), never the protected field tree, and closes with a **parity block** that
 * runs the same inputs through *both* components and asserts they hand
 * `LeaseAgreementService.create` an identical payload.
 */
describe('LeaseAgreementSignalFormComponent', () => {
  let fixture: ComponentFixture<LeaseAgreementSignalFormComponent>;
  let host: HTMLElement;
  let service: LeaseAgreementService;

  const setInputs = (fix: ComponentFixture<unknown>): void => {
    fix.componentRef.setInput('landlordId', 'landlord-001');
    fix.componentRef.setInput('landlordName', 'Carlos Mendes');
    fix.componentRef.setInput('propertyId', 'p1');
    fix.componentRef.setInput('propertyTitle', 'T2 no Chiado');
    fix.componentRef.setInput('propertyAddress', 'Rua Garrett 42, Lisboa');
    fix.componentRef.setInput('tenantId', 'tenant-001');
    fix.componentRef.setInput('tenantName', 'Ana Ferreira');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseAgreementSignalFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaseAgreementSignalFormComponent);
    host = fixture.nativeElement as HTMLElement;
    service = TestBed.inject(LeaseAgreementService);
    setInputs(fixture);
    fixture.detectChanges();
  });

  /** Type into an input/textarea and propagate it through `[formField]` (commits on `input`). */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Click a segmented lease-type button by its zero-based index. */
  function clickLeaseType(index: number): void {
    const btns = host.querySelectorAll<HTMLButtonElement>('.laf-segment-btn');
    btns[index].click();
    fixture.detectChanges();
    TestBed.tick();
  }

  function fillValid(): void {
    typeInto('#lafs-start', '2026-09-01');
    typeInto('#lafs-end', '2027-08-31');
    typeInto('#lafs-rent', '1200');
    typeInto('#lafs-deposit', '2400');
    typeInto(
      '#lafs-terms',
      'Contrato de arrendamento habitacional celebrado nos termos do NRAU, com renda e depósito.',
    );
  }

  /** Dispatch the native submit event only — no TestBed.tick (safe under fake timers). */
  function dispatchSubmit(): void {
    host.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  }

  function submitForm(): void {
    dispatchSubmit();
    fixture.detectChanges();
    TestBed.tick();
  }

  const errorTexts = (): string[] =>
    Array.from(host.querySelectorAll('.laf-error')).map(
      (e) => e.textContent?.trim() ?? '',
    );

  // ── render ────────────────────────────────────────────────────────────────

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header, property/tenant subtitle and the form() badge', () => {
    expect(host.querySelector('.laf-title')?.textContent?.trim()).toBe('Novo Contrato de Arrendamento');
    expect(host.querySelector('.laf-subtitle')?.textContent?.trim()).toBe('T2 no Chiado · Ana Ferreira');
    expect(host.querySelector('.laf-badge')?.textContent?.trim()).toBe('form()');
  });

  it('renders the segment buttons, both date inputs, both number inputs and the terms textarea', () => {
    expect(host.querySelectorAll('.laf-segment-btn').length).toBe(3);
    expect(host.querySelector<HTMLInputElement>('#lafs-start')?.type).toBe('date');
    expect(host.querySelector<HTMLInputElement>('#lafs-end')?.type).toBe('date');
    expect(host.querySelector<HTMLInputElement>('#lafs-rent')?.type).toBe('number');
    expect(host.querySelector<HTMLInputElement>('#lafs-deposit')?.type).toBe('number');
    expect(host.querySelector('#lafs-terms')?.tagName).toBe('TEXTAREA');
  });

  it('pre-selects "Prazo Fixo" as the active lease type', () => {
    const active = host.querySelector('.laf-segment-btn.active');
    expect(active?.textContent?.trim()).toContain('Prazo Fixo');
  });

  it('shows no field errors before any interaction', () => {
    expect(errorTexts().length).toBe(0);
  });

  // ── lease-type segment (imperative value.set) ───────────────────────────────

  it('switches the active lease type when a segment button is clicked', () => {
    clickLeaseType(2); // short-term
    const active = host.querySelector('.laf-segment-btn.active');
    expect(active?.textContent?.trim()).toContain('Curta Duração');
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('surfaces every required error on submit of an empty form', () => {
    const before = service.leases().length;
    submitForm();
    const errors = errorTexts();
    expect(errors).toContain('Seleccione a data de início.');
    expect(errors).toContain('Seleccione a data de fim.');
    expect(errors).toContain('A renda mensal é obrigatória.');
    expect(errors).toContain('O depósito é obrigatório.');
    expect(errors).toContain('Os termos são obrigatórios.');
    // one <span class="laf-error"> per invalid field (leaseType + notes never error)
    expect(errors.length).toBe(5);
    expect(service.leases().length).toBe(before);
  });

  it('rejects terms shorter than fifty characters', () => {
    typeInto('#lafs-start', '2026-09-01');
    typeInto('#lafs-end', '2027-08-31');
    typeInto('#lafs-rent', '1200');
    typeInto('#lafs-deposit', '2400');
    typeInto('#lafs-terms', 'Curto demais.');
    submitForm();
    expect(errorTexts()).toContain('Os termos devem ter pelo menos 50 caracteres.');
  });

  // ── submit gating ───────────────────────────────────────────────────────────

  it('does not create a lease while the form is invalid', () => {
    const before = service.leases().length;
    submitForm();
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(service.leases().length).toBe(before);
  });

  it('enables the submit button only once the form is valid', () => {
    const submitBtn = () => host.querySelector<HTMLButtonElement>('.laf-btn--filled')!;
    expect(submitBtn().disabled).toBe(true);
    fillValid();
    expect(submitBtn().disabled).toBe(false);
  });

  // ── submit flow (async) ───────────────────────────────────────────────────

  it('creates the lease through the service and surfaces success', () => {
    const before = service.leases().length;
    let emitted: LeaseAgreement | undefined;
    fixture.componentInstance.submitted.subscribe((l) => (emitted = l));

    // Fill under real timers — `[formField]` propagation relies on the effect
    // scheduler, which jest fake timers stall; only the submit's setTimeout needs faking.
    fillValid();

    jest.useFakeTimers();
    try {
      dispatchSubmit();
      expect(fixture.componentInstance.saving()).toBe(true);
      jest.advanceTimersByTime(500);
    } finally {
      jest.useRealTimers();
    }
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.componentInstance.submittedSuccess()).toBe(true);
    expect(service.leases().length).toBe(before + 1);
    expect(emitted).toBeTruthy();
    expect(emitted!.status).toBe('draft');
    expect(emitted!.monthlyRent).toBe(1200);
    expect(emitted!.depositAmount).toBe(2400);
    expect(emitted!.tenantName).toBe('Ana Ferreira');
    expect(emitted!.propertyId).toBe('p1');
    expect(host.querySelector('.laf-success')).toBeTruthy();
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke LeaseAgreementFormComponent', () => {
    /**
     * Runs the same lease inputs through the bespoke component and asserts its
     * `create` payload equals the official twin's — the migration is only safe if
     * both hand the service byte-identical data. `create` stamps a `uid()` id +
     * timestamps, so the comparison is on the caller-supplied payload only.
     */
    it('hands LeaseAgreementService.create the same payload for the same inputs', async () => {
      // ── official twin (already built in beforeEach) ──
      const officialSpy = jest.spyOn(service, 'create');
      clickLeaseType(2); // short-term — proves the segmented value.set path
      fillValid(); // real timers — [formField] propagation needs the effect scheduler
      jest.useFakeTimers();
      try {
        dispatchSubmit();
        jest.advanceTimersByTime(500);
      } finally {
        jest.useRealTimers();
      }
      const officialCall = officialSpy.mock.calls[0]?.[0];
      expect(officialCall).toBeDefined();

      // ── bespoke twin in its own TestBed ──
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [LeaseAgreementFormComponent],
      }).compileComponents();
      const bespokeFix = TestBed.createComponent(LeaseAgreementFormComponent);
      const bespokeService = TestBed.inject(LeaseAgreementService);
      const bespokeSpy = jest.spyOn(bespokeService, 'create');
      setInputs(bespokeFix);
      bespokeFix.detectChanges();

      const bHost = bespokeFix.nativeElement as HTMLElement;
      const bType = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        bespokeFix.detectChanges();
      };
      // bespoke leaseType via segment button click (same order: index 2 = short-term)
      bHost.querySelectorAll<HTMLButtonElement>('.laf-segment-btn')[2].click();
      bespokeFix.detectChanges();
      bType('#laf-start', '2026-09-01');
      bType('#laf-end', '2027-08-31');
      bType('#laf-rent', '1200');
      bType('#laf-deposit', '2400');
      bType(
        '#laf-terms',
        'Contrato de arrendamento habitacional celebrado nos termos do NRAU, com renda e depósito.',
      );

      jest.useFakeTimers();
      try {
        bHost.querySelector('form')!.dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );
        jest.advanceTimersByTime(500);
      } finally {
        jest.useRealTimers();
      }
      const bespokeCall = bespokeSpy.mock.calls[0]?.[0];

      expect(bespokeCall).toEqual(officialCall);
    });
  });
});
