import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaintenanceRequestSignalFormComponent } from './maintenance-request-signal-form.component';
import { MaintenanceRequestFormComponent } from '../maintenance-request/maintenance-request-form.component';
import {
  MaintenanceRequestService,
  MaintenanceRequest,
} from '../../services/maintenance-request.service';

/**
 * Specs for {@link MaintenanceRequestSignalFormComponent} — the official-`form()`
 * twin of {@link MaintenanceRequestFormComponent}.
 *
 * The suite drives the **public contract only** (DOM `<select>`/`<input>`/`<textarea>`
 * + the real `[formField]` two-way binding + the `submitted` output), never the
 * protected field tree, and closes with a **parity block** that runs the same inputs
 * through *both* components and asserts they hand `MaintenanceRequestService.create`
 * an identical payload.
 */
describe('MaintenanceRequestSignalFormComponent', () => {
  let fixture: ComponentFixture<MaintenanceRequestSignalFormComponent>;
  let host: HTMLElement;
  let service: MaintenanceRequestService;

  const setInputs = (fix: ComponentFixture<unknown>): void => {
    fix.componentRef.setInput('tenantId', 'tenant-001');
    fix.componentRef.setInput('tenantName', 'Ana Ferreira');
    fix.componentRef.setInput('landlordId', 'landlord-001');
    fix.componentRef.setInput('propertyId', 'p1');
    fix.componentRef.setInput('propertyTitle', 'T2 no Chiado');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceRequestSignalFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceRequestSignalFormComponent);
    host = fixture.nativeElement as HTMLElement;
    service = TestBed.inject(MaintenanceRequestService);
    setInputs(fixture);
    fixture.detectChanges();
  });

  /**
   * Set a `<select>` value and propagate it through `[formField]`. The official
   * FormField directive commits on the `input` event (not `change`) — see the
   * signal-forms-listing spec, which drives its `<select [formField]>` the same way.
   */
  function selectValue(selector: string, value: string): void {
    const el = host.querySelector<HTMLSelectElement>(selector);
    if (!el) throw new Error(`select not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  /** Type a value into an input/textarea and propagate it through `[formField]`. */
  function typeInto(selector: string, value: string): void {
    const el = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!el) throw new Error(`control not found: ${selector}`);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    TestBed.tick();
  }

  function fillValid(): void {
    selectValue('#mrsf-category', 'plumbing');
    selectValue('#mrsf-priority', 'high');
    typeInto('#mrsf-title', 'Fuga de água');
    typeInto('#mrsf-description', 'A torneira do chuveiro pinga constantemente há dias.');
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
    Array.from(host.querySelectorAll('.mrsf-error-msg')).map(
      (e) => e.textContent?.trim() ?? '',
    );

  // ── render ────────────────────────────────────────────────────────────────

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header, property title and the form() badge', () => {
    expect(host.querySelector('.mrsf-title')?.textContent?.trim()).toBe('Report Maintenance Issue');
    expect(host.querySelector('.mrsf-subtitle')?.textContent?.trim()).toBe('T2 no Chiado');
    expect(host.querySelector('.mrsf-badge')?.textContent?.trim()).toBe('form()');
  });

  it('renders both selects, the title input and the description textarea', () => {
    expect(host.querySelector('#mrsf-category')).toBeTruthy();
    expect(host.querySelector('#mrsf-priority')).toBeTruthy();
    expect(host.querySelector('#mrsf-title')).toBeTruthy();
    expect(host.querySelector<HTMLTextAreaElement>('#mrsf-description')?.tagName).toBe('TEXTAREA');
  });

  it('shows no field errors before any interaction', () => {
    expect(errorTexts().length).toBe(0);
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('surfaces every required error on submit of an empty form', () => {
    const before = service.requests().length;
    submitForm();
    const errors = errorTexts();
    // category + priority + title + description each required
    expect(errors.filter((e) => e === 'This field is required.').length).toBe(4);
    expect(service.requests().length).toBe(before);
  });

  it('rejects a title shorter than five characters', () => {
    selectValue('#mrsf-category', 'plumbing');
    selectValue('#mrsf-priority', 'high');
    typeInto('#mrsf-title', 'abc');
    typeInto('#mrsf-description', 'A torneira do chuveiro pinga constantemente há dias.');
    submitForm();
    expect(errorTexts()).toContain('Minimum 5 characters required.');
  });

  it('rejects a description shorter than twenty characters', () => {
    selectValue('#mrsf-category', 'plumbing');
    selectValue('#mrsf-priority', 'high');
    typeInto('#mrsf-title', 'Fuga de água');
    typeInto('#mrsf-description', 'curto');
    submitForm();
    expect(errorTexts()).toContain('Minimum 20 characters required.');
  });

  it('drives the description char count live', () => {
    typeInto('#mrsf-description', 'doze chars..'); // 12 chars
    const counts = Array.from(host.querySelectorAll('.mrsf-char-count')).map((e) => e.textContent);
    expect(counts).toContain('12/1000');
  });

  // ── submit gating ───────────────────────────────────────────────────────────

  it('does not create a request while the form is invalid', () => {
    const before = service.requests().length;
    submitForm();
    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(service.requests().length).toBe(before);
  });

  // ── submit flow (async) ───────────────────────────────────────────────────

  it('creates the request through the service and surfaces success', () => {
    const before = service.requests().length;
    let emitted: MaintenanceRequest | undefined;
    fixture.componentInstance.submitted.subscribe((r) => (emitted = r));

    // Fill under real timers — `[formField]` propagation relies on the effect
    // scheduler, which jest fake timers stall; only the submit's setTimeout needs faking.
    fillValid();

    jest.useFakeTimers();
    try {
      dispatchSubmit();
      expect(fixture.componentInstance.submitting()).toBe(true);
      jest.advanceTimersByTime(500);
    } finally {
      jest.useRealTimers();
    }
    fixture.detectChanges();

    expect(fixture.componentInstance.submitting()).toBe(false);
    expect(fixture.componentInstance.submitted$()).toBe(true);
    expect(service.requests().length).toBe(before + 1);
    expect(emitted).toBeTruthy();
    expect(emitted!.status).toBe('pending');
    expect(emitted!.category).toBe('plumbing');
    expect(emitted!.priority).toBe('high');
    expect(emitted!.tenantName).toBe('Ana Ferreira');
    expect(emitted!.propertyId).toBe('p1');
    expect(host.querySelector('.mrsf-success')).toBeTruthy();
  });

  // ── PARITY: bespoke twin ⇄ official form() ────────────────────────────────

  describe('parity with the bespoke MaintenanceRequestFormComponent', () => {
    /**
     * Runs the same request inputs through the bespoke component and asserts its
     * `create` payload equals the official twin's — the migration is only safe if
     * both hand the service byte-identical data. `create` stamps a `Date.now()`
     * id + timestamps, so the comparison is on the caller-supplied payload only.
     */
    it('hands MaintenanceRequestService.create the same payload for the same inputs', async () => {
      // ── official twin (already built in beforeEach) ──
      const officialSpy = jest.spyOn(service, 'create');
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
        imports: [MaintenanceRequestFormComponent],
      }).compileComponents();
      const bespokeFix = TestBed.createComponent(MaintenanceRequestFormComponent);
      const bespokeService = TestBed.inject(MaintenanceRequestService);
      const bespokeSpy = jest.spyOn(bespokeService, 'create');
      setInputs(bespokeFix);
      bespokeFix.detectChanges();

      const bHost = bespokeFix.nativeElement as HTMLElement;
      const bSelect = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLSelectElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        bespokeFix.detectChanges();
      };
      const bType = (sel: string, val: string) => {
        const el = bHost.querySelector<HTMLInputElement | HTMLTextAreaElement>(sel)!;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        bespokeFix.detectChanges();
      };
      bSelect('#mrf-category', 'plumbing');
      bSelect('#mrf-priority', 'high');
      bType('#mrf-title', 'Fuga de água');
      bType('#mrf-description', 'A torneira do chuveiro pinga constantemente há dias.');

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
