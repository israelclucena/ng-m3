import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SignalFormsRosterComponent,
  type SignalFormsRoster,
} from './signal-forms-roster.component';

/**
 * Specs for {@link SignalFormsRosterComponent}. Drives the public contract only —
 * DOM inputs, the add/remove buttons, and the `submitted` output — so the tests
 * exercise the real `applyEach` per-item validators, the array-level `minLength`,
 * the cross-item share-sum tree rule, and live structural edits of the array.
 */
describe('SignalFormsRosterComponent', () => {
  let fixture: ComponentFixture<SignalFormsRosterComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormsRosterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalFormsRosterComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  /** Set a control's value and propagate it through the `[formField]` directive. */
  function fire(el: HTMLInputElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** The `.sfr__tenant` blocks currently rendered. */
  function tenantBlocks(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('.sfr__tenant'));
  }

  /** Fill the i-th tenant's name / email / share. */
  function setTenant(
    i: number,
    v: { name?: string; email?: string; share?: string },
  ): void {
    const block = tenantBlocks()[i];
    if (!block) throw new Error(`tenant block ${i} not found`);
    if (v.name !== undefined) {
      fire(block.querySelector<HTMLInputElement>('input[type="text"]')!, v.name);
    }
    if (v.email !== undefined) {
      fire(block.querySelector<HTMLInputElement>('input[type="email"]')!, v.email);
    }
    if (v.share !== undefined) {
      fire(
        block.querySelector<HTMLInputElement>('input[type="number"]')!,
        v.share,
      );
    }
  }

  function setReference(value: string): void {
    fire(host.querySelector<HTMLInputElement>('input[placeholder^="Ex:"]')!, value);
  }

  function clickAdd(): void {
    host.querySelector<HTMLButtonElement>('.sfr__add')!.click();
    fixture.detectChanges();
    TestBed.tick();
  }

  function removeTenant(i: number): void {
    tenantBlocks()[i].querySelector<HTMLButtonElement>('.sfr__remove')!.click();
    fixture.detectChanges();
    TestBed.tick();
  }

  function submit(): void {
    host
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function errorTexts(): (string | undefined)[] {
    return Array.from(host.querySelectorAll('.sfr__error')).map((e) =>
      e.textContent?.trim(),
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  it('renders the reference input and one tenant block by default', () => {
    expect(host.querySelector('input[placeholder^="Ex:"]')).toBeTruthy();
    expect(tenantBlocks().length).toBe(1);
    expect(host.querySelector('.sfr__add')).toBeTruthy();
  });

  it('shows no error messages before any interaction', () => {
    expect(host.querySelectorAll('.sfr__error').length).toBe(0);
  });

  it('starts the single tenant at 100% (sum badge)', () => {
    expect(host.querySelector('.sfr__sum strong')?.textContent?.trim()).toBe(
      '100 %',
    );
  });

  // ── structural edits: add / remove ──────────────────────────────────────────

  it('adds a tenant block on demand', () => {
    clickAdd();
    expect(tenantBlocks().length).toBe(2);
  });

  it('removes a tenant block, but never drops below one', () => {
    clickAdd();
    expect(tenantBlocks().length).toBe(2);
    removeTenant(1);
    expect(tenantBlocks().length).toBe(1);
    // The remove button on the sole remaining tenant is disabled.
    const soleRemove =
      tenantBlocks()[0].querySelector<HTMLButtonElement>('.sfr__remove')!;
    expect(soleRemove.disabled).toBe(true);
  });

  // ── per-item validators (applyEach) ─────────────────────────────────────────

  it('surfaces required errors on submit of an empty form', () => {
    submit();
    const errors = errorTexts();
    expect(errors).toContain('Indique uma referência.');
    expect(errors).toContain('Nome obrigatório.');
    expect(errors).toContain('Email obrigatório.');
  });

  it('rejects an invalid email on a tenant (applyEach email validator)', () => {
    setTenant(0, { name: 'Ana', email: 'not-an-email' });
    submit();
    expect(errorTexts()).toContain('Email inválido.');
  });

  it('applies per-item validation to a newly added tenant too', () => {
    setReference('T3 Arroios');
    setTenant(0, { name: 'Ana', email: 'ana@mail.pt', share: '50' });
    clickAdd();
    setTenant(1, { share: '50' }); // second tenant left without name/email
    submit();
    const errors = errorTexts();
    expect(errors).toContain('Nome obrigatório.');
    expect(errors).toContain('Email obrigatório.');
  });

  // ── cross-item tree rule: shares sum to 100 ─────────────────────────────────

  it('rejects a roster whose shares do not sum to 100% (tree rule)', () => {
    setReference('T3 Arroios');
    setTenant(0, { name: 'Ana', email: 'ana@mail.pt', share: '60' });
    submit();
    expect(
      errorTexts().some((e) => e?.startsWith('As quotas têm de somar 100')),
    ).toBe(true);
  });

  it('accepts a two-tenant 50/50 split (shares sum to 100%)', () => {
    setReference('T3 Arroios');
    setTenant(0, { name: 'Ana', email: 'ana@mail.pt', share: '50' });
    clickAdd();
    setTenant(1, { name: 'Rui', email: 'rui@mail.pt', share: '50' });
    submit();
    expect(
      errorTexts().some((e) => e?.startsWith('As quotas têm de somar 100')),
    ).toBe(false);
  });

  // ── submit ──────────────────────────────────────────────────────────────────

  it('does not emit while the form is invalid', () => {
    const emitted: SignalFormsRoster[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));
    submit();
    expect(emitted).toHaveLength(0);
  });

  it('emits the payload when a valid, balanced roster is submitted', () => {
    const emitted: SignalFormsRoster[] = [];
    fixture.componentRef.instance.submitted$.subscribe((v) => emitted.push(v));

    setReference('T3 Arroios — 2026/09');
    setTenant(0, { name: 'Ana Dias', email: 'ana@mail.pt', share: '60' });
    clickAdd();
    setTenant(1, { name: 'Rui Sá', email: 'rui@mail.pt', share: '40' });
    submit();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({
      reference: 'T3 Arroios — 2026/09',
      tenants: [
        { name: 'Ana Dias', email: 'ana@mail.pt', sharePct: 60 },
        { name: 'Rui Sá', email: 'rui@mail.pt', sharePct: 40 },
      ],
    });
  });

  it('clears validation errors once valid values are provided', () => {
    submit();
    expect(host.querySelectorAll('.sfr__error').length).toBeGreaterThan(0);

    setReference('T3 Arroios');
    setTenant(0, { name: 'Ana', email: 'ana@mail.pt', share: '100' });

    expect(host.querySelectorAll('.sfr__error').length).toBe(0);
  });
});
