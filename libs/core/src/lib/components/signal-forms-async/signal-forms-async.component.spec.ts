import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SignalFormsAsyncComponent,
  type SignalFormsAsyncClaim,
} from './signal-forms-async.component';

/**
 * Specs for {@link SignalFormsAsyncComponent}. Drives the public contract only — the
 * DOM input, the async availability check, and the `claimed` output — exercising the
 * real `validateAsync` resource: sync-gates-async, the pending state, a late error
 * for a taken reference, and a clean submit for a free one.
 *
 * The component's `checkAvailability` resolver is overridden per-test so resolution
 * is deterministic without a network. The debounce is left at its real (small) value
 * and the tests poll with real timers until the field settles.
 */
describe('SignalFormsAsyncComponent', () => {
  let fixture: ComponentFixture<SignalFormsAsyncComponent>;
  let component: SignalFormsAsyncComponent;
  let host: HTMLElement;
  let checked: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormsAsyncComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalFormsAsyncComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;

    // Record every backend hit so we can assert sync-gates-async.
    checked = [];
    fixture.detectChanges();
  });

  /** Point availability at a fixed taken-set; resolves on the next microtask. */
  function resolveWith(taken: string[]): void {
    const takenSet = new Set(taken);
    component.checkAvailability = (ref) => {
      checked.push(ref);
      return Promise.resolve(!takenSet.has(ref.trim().toLowerCase()));
    };
  }

  function type(value: string): void {
    const el = host.querySelector<HTMLInputElement>('input[type="text"]')!;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
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

  function errorText(): string {
    return host.querySelector('.sfa__error')?.textContent?.trim() ?? '';
  }

  /** Poll (real timers) until `predicate` holds, flushing CD + effects each step. */
  async function waitUntil(
    predicate: () => boolean,
    timeoutMs = 2500,
  ): Promise<void> {
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      fixture.detectChanges();
      TestBed.tick();
      if (predicate()) return;
      if (Date.now() - start > timeoutMs) {
        throw new Error('waitUntil timed out');
      }
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  /** True once the async check has settled (not pending) for the current value. */
  function settled(): boolean {
    return !component['f'].reference().pending();
  }

  // ── render ──────────────────────────────────────────────────────────────────

  it('renders the reference input', () => {
    expect(host.querySelector('input[type="text"]')).toBeTruthy();
    expect(host.querySelector('.sfa__submit')).toBeTruthy();
  });

  it('shows no error before any interaction', () => {
    expect(host.querySelector('.sfa__error')).toBeNull();
  });

  // ── synchronous validation gates the async check ────────────────────────────

  it('shows a sync min-length error and never hits the backend for a short value', async () => {
    resolveWith([]);
    type('ab');
    submit();
    // Give any (erroneously-scheduled) async work time to fire.
    await new Promise((r) => setTimeout(r, 500));
    fixture.detectChanges();
    TestBed.tick();
    expect(errorText()).toBe('Mínimo 3 caracteres.');
    expect(checked).toEqual([]);
  });

  it('shows a sync pattern error for invalid characters (no backend hit)', async () => {
    resolveWith([]);
    type('Bad Ref!');
    submit();
    await new Promise((r) => setTimeout(r, 500));
    fixture.detectChanges();
    TestBed.tick();
    expect(errorText()).toBe('Só minúsculas, números e hífen.');
    expect(checked).toEqual([]);
  });

  // ── async: taken vs free ────────────────────────────────────────────────────

  it('surfaces a late "already used" error for a taken reference', async () => {
    resolveWith(['arroios-t3']);
    type('arroios-t3');
    await waitUntil(settled);
    submit();
    expect(checked).toContain('arroios-t3');
    expect(errorText()).toBe('Referência já utilizada.');
  });

  it('marks a free reference available and clears any error', async () => {
    resolveWith(['taken-one']);
    type('alfama-t2');
    await waitUntil(() => settled() && component['isAvailable']());
    expect(host.querySelector('.sfa__error')).toBeNull();
    expect(host.querySelector('.sfa__input--ok')).toBeTruthy();
  });

  // ── submit ──────────────────────────────────────────────────────────────────

  it('does not emit while a sync-invalid reference is submitted', () => {
    const emitted: SignalFormsAsyncClaim[] = [];
    component.claimed$.subscribe((v) => emitted.push(v));
    resolveWith([]);
    type('ab');
    submit();
    expect(emitted).toHaveLength(0);
  });

  it('does not emit for a taken reference', async () => {
    const emitted: SignalFormsAsyncClaim[] = [];
    component.claimed$.subscribe((v) => emitted.push(v));
    resolveWith(['demo']);
    type('demo');
    await waitUntil(settled);
    submit();
    expect(emitted).toHaveLength(0);
  });

  it('emits the claim once a free reference is confirmed available', async () => {
    const emitted: SignalFormsAsyncClaim[] = [];
    component.claimed$.subscribe((v) => emitted.push(v));
    resolveWith(['taken']);
    type('graca-loft');
    await waitUntil(() => settled() && component['isAvailable']());
    submit();
    expect(emitted).toEqual([{ reference: 'graca-loft' }]);
  });

  it('reports a pending state while the check is in flight, then resolves', async () => {
    // A resolver we control: stays pending until we release it. `release` is only
    // assigned once the loader actually runs (i.e. past the debounce, sync-valid).
    let release: ((available: boolean) => void) | undefined;
    component.checkAvailability = () =>
      new Promise<boolean>((res) => {
        release = res;
      });

    type('penha-studio');
    // Wait until the resource is genuinely in flight (loader invoked) and pending.
    await waitUntil(() => !!release && component['pending']());
    expect(host.querySelector('.sfa__spinner')).toBeTruthy();

    release!(true);
    await waitUntil(() => settled() && component['isAvailable']());
    expect(host.querySelector('.sfa__spinner')).toBeNull();
    expect(host.querySelector('.sfa__input--ok')).toBeTruthy();
  });
});
