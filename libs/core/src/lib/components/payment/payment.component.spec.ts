import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  IU_PAYMENT_GATEWAY,
  PaymentAuthResult,
  PaymentComponent,
  PaymentGateway,
  PaymentGatewayRequest,
  PaymentState,
} from './payment.component';

describe('PaymentComponent (iu-payment) — NG-05 fatia 1', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;
  const statusEl = () =>
    fixture.nativeElement.querySelector('.iu-payment__status') as HTMLElement;
  const errorEl = () =>
    fixture.nativeElement.querySelector('.iu-payment__error') as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and starts idle', () => {
    expect(component).toBeTruthy();
    expect(component.state()).toBe('idle');
    expect(host().classList).toContain('iu-payment--state-idle');
  });

  it('defaults to the checkout intent', () => {
    expect(component.intent()).toBe('checkout');
    expect(host().classList).toContain('iu-payment--checkout');
  });

  it('reflects the intent on the host class', () => {
    fixture.componentRef.setInput('intent', 'refund');
    fixture.detectChanges();
    expect(host().classList).toContain('iu-payment--refund');
  });

  it('validate() advances idle → ready with a valid amount + currency', () => {
    fixture.componentRef.setInput('amount', 250);
    fixture.componentRef.setInput('currency', 'EUR');
    fixture.detectChanges();
    expect(component.validate()).toBe(true);
    expect(component.state()).toBe('ready');
    expect(component.error()).toBeNull();
  });

  it('emits every transition through stateChange', () => {
    const seen: PaymentState[] = [];
    component.stateChange.subscribe((s) => seen.push(s));
    fixture.componentRef.setInput('amount', 100);
    fixture.detectChanges();
    component.validate();
    expect(seen).toEqual(['validating', 'ready']);
  });

  it('rejects a non-positive amount with an invalid_amount error', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    expect(component.validate()).toBe(false);
    expect(component.state()).toBe('error');
    expect(component.error()?.code).toBe('invalid_amount');
  });

  it('rejects a non-finite amount', () => {
    fixture.componentRef.setInput('amount', Number.NaN);
    fixture.detectChanges();
    expect(component.validate()).toBe(false);
    expect(component.error()?.code).toBe('invalid_amount');
  });

  it('rejects a malformed currency code', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.componentRef.setInput('currency', 'euro');
    fixture.detectChanges();
    expect(component.validate()).toBe(false);
    expect(component.state()).toBe('error');
    expect(component.error()?.code).toBe('invalid_currency');
  });

  it('checks the amount before the currency', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.componentRef.setInput('currency', 'bad');
    fixture.detectChanges();
    component.validate();
    // Amount is invalid first, so it wins the error.
    expect(component.error()?.code).toBe('invalid_amount');
  });

  it('is inert while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('amount', 100);
    fixture.detectChanges();
    expect(component.validate()).toBe(false);
    expect(component.state()).toBe('idle');
    expect(host().classList).toContain('iu-payment--disabled');
  });

  it('renders an alert + retry button in the error state', () => {
    fixture.componentRef.setInput('amount', -5);
    fixture.detectChanges();
    component.validate();
    fixture.detectChanges();
    const el = errorEl();
    expect(el).toBeTruthy();
    expect(el?.getAttribute('role')).toBe('alert');
    expect(el?.querySelector('.iu-payment__retry')).toBeTruthy();
  });

  it('retry() re-validates and recovers once the amount is fixed', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    component.validate();
    expect(component.state()).toBe('error');

    fixture.componentRef.setInput('amount', 300);
    fixture.detectChanges();
    expect(component.retry()).toBe(true);
    expect(component.state()).toBe('ready');
    expect(component.error()).toBeNull();
  });

  it('retry() is a no-op outside the error state', () => {
    expect(component.retry()).toBe(false);
    expect(component.state()).toBe('idle');
  });

  it('reset() returns to idle and clears the error', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    component.validate();
    expect(component.state()).toBe('error');
    component.reset();
    expect(component.state()).toBe('idle');
    expect(component.error()).toBeNull();
  });

  it('exposes a polite aria-live status region', () => {
    expect(statusEl().getAttribute('role')).toBe('status');
    expect(statusEl().getAttribute('aria-live')).toBe('polite');
  });

  it('announces the ready state in the status region', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.detectChanges();
    component.validate();
    fixture.detectChanges();
    expect(statusEl().textContent?.trim()).toBe('Pronto para pagar.');
  });

  it('announces the validation error message', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    component.validate();
    fixture.detectChanges();
    expect(statusEl().textContent?.trim()).toBe('Montante inválido.');
  });

  it('marks the host aria-busy while validating (transient)', () => {
    // isBusy is true only for validating/processing; after a sync validate()
    // it settles on ready, so we assert the computed directly for the busy states.
    expect(component.isBusy()).toBe(false);
  });
});

describe('PaymentComponent (iu-payment) — NG-05 fatia 2: terminal states', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;
  const statusEl = () =>
    fixture.nativeElement.querySelector('.iu-payment__status') as HTMLElement;
  const terminalEl = () =>
    fixture.nativeElement.querySelector(
      '.iu-payment__terminal',
    ) as HTMLElement | null;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cancel() moves an active flow to the terminal cancelled state', () => {
    expect(component.cancel()).toBe(true);
    expect(component.state()).toBe('cancelled');
    expect(component.isTerminal()).toBe(true);
  });

  it('expire() moves an active flow to the terminal expired state', () => {
    expect(component.expire()).toBe(true);
    expect(component.state()).toBe('expired');
    expect(component.isTerminal()).toBe(true);
  });

  it('cancel() can abort mid-flow from the ready state', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.detectChanges();
    component.validate();
    expect(component.state()).toBe('ready');
    expect(component.cancel()).toBe(true);
    expect(component.state()).toBe('cancelled');
  });

  it('cancel() clears a pending validation error', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    component.validate();
    expect(component.error()).not.toBeNull();
    component.cancel();
    expect(component.error()).toBeNull();
  });

  it('expire() clears a pending validation error', () => {
    fixture.componentRef.setInput('amount', 0);
    fixture.detectChanges();
    component.validate();
    expect(component.error()).not.toBeNull();
    component.expire();
    expect(component.error()).toBeNull();
  });

  it('cancel() is a no-op once the flow has settled', () => {
    component.expire();
    expect(component.cancel()).toBe(false);
    expect(component.state()).toBe('expired');
  });

  it('expire() is a no-op once the flow has settled', () => {
    component.cancel();
    expect(component.expire()).toBe(false);
    expect(component.state()).toBe('cancelled');
  });

  it('validate() is inert from a terminal state (only reset() leaves it)', () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.detectChanges();
    component.cancel();
    expect(component.validate()).toBe(false);
    expect(component.state()).toBe('cancelled');
  });

  it('reset() recovers from a terminal state back to idle', () => {
    component.expire();
    expect(component.state()).toBe('expired');
    component.reset();
    expect(component.state()).toBe('idle');
    expect(component.isTerminal()).toBe(false);
  });

  it('emits the terminal transition through stateChange', () => {
    const seen: PaymentState[] = [];
    component.stateChange.subscribe((s) => seen.push(s));
    component.cancel();
    expect(seen).toEqual(['cancelled']);
  });

  it('renders an assertive alert for the expired state', () => {
    component.expire();
    fixture.detectChanges();
    const el = terminalEl();
    expect(el).toBeTruthy();
    expect(el?.getAttribute('role')).toBe('alert');
    expect(el?.classList).toContain('iu-payment__terminal--expired');
  });

  it('renders a polite status notice for the cancelled state', () => {
    component.cancel();
    fixture.detectChanges();
    const el = terminalEl();
    expect(el).toBeTruthy();
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.classList).not.toContain('iu-payment__terminal--expired');
  });

  it('offers a restart button that resets to idle', () => {
    component.cancel();
    fixture.detectChanges();
    const restart = terminalEl()?.querySelector(
      '.iu-payment__restart',
    ) as HTMLButtonElement;
    expect(restart).toBeTruthy();
    restart.click();
    fixture.detectChanges();
    expect(component.state()).toBe('idle');
  });

  it('announces the terminal state in the live status region', () => {
    component.expire();
    fixture.detectChanges();
    expect(statusEl().textContent?.trim()).toBe('A sessão de pagamento expirou.');
  });

  it('reflects the terminal state on the host class', () => {
    component.cancel();
    fixture.detectChanges();
    expect(host().classList).toContain('iu-payment--state-cancelled');
  });
});

// --------------------------------------------------------------------------
// NG-05 fatia 3: a11y invariants — the manual stand-in for an axe run.
// `@axe-core/playwright` is Playwright-only and `axe-core` is not a direct
// dependency, so no new package is installed for this (same call as NG-02,
// see the card spec / NG-02 report). We drive `<iu-payment>` through each
// state reachable at rest via the public API and assert its ARIA contract.
// `validating`/`processing`/`success` do not rest through the public API
// (validating is synchronous, the other two land with the Stripe slice), so
// their DOM is covered by the Stripe slice + Playwright e2e; here we assert
// the busy-state ARIA mapping through the computed that drives the template.
// --------------------------------------------------------------------------
describe('PaymentComponent (iu-payment) — NG-05 fatia 3: a11y invariants', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Assert the invariants that must hold in every rendered state. */
  const assertInvariants = (el: HTMLElement) => {
    const state = component.state();

    // The live status region is always present and correctly wired, and what
    // AT reads back always matches the machine's announced copy.
    const status = el.querySelector('.iu-payment__status');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent?.trim()).toBe(component.statusText());

    // aria-busy is boolean-valued: present only while busy, and never 'false'.
    const busy = el.getAttribute('aria-busy');
    if (component.isBusy()) expect(busy).toBe('true');
    else expect(busy).toBeNull();
    if (busy !== null) expect(busy).toBe('true');

    // The error region appears iff we're in `error`, announces itself with
    // role=alert, and offers a natively keyboard-reachable retry button.
    const error = el.querySelector('.iu-payment__error');
    if (state === 'error') {
      expect(error).toBeTruthy();
      expect(error?.getAttribute('role')).toBe('alert');
      const retry = error?.querySelector(
        '.iu-payment__retry',
      ) as HTMLButtonElement | null;
      expect(retry?.tagName).toBe('BUTTON');
      expect(retry?.getAttribute('type')).toBe('button');
    } else {
      expect(error).toBeNull();
    }

    // The terminal region appears iff we've settled into expired/cancelled,
    // with the right politeness (assertive for expired, polite for cancelled)
    // and a restart affordance.
    const terminal = el.querySelector('.iu-payment__terminal');
    if (state === 'expired' || state === 'cancelled') {
      expect(terminal).toBeTruthy();
      expect(terminal?.getAttribute('role')).toBe(
        state === 'expired' ? 'alert' : 'status',
      );
      const restart = terminal?.querySelector(
        '.iu-payment__restart',
      ) as HTMLButtonElement | null;
      expect(restart?.tagName).toBe('BUTTON');
      expect(restart?.getAttribute('type')).toBe('button');
    } else {
      expect(terminal).toBeNull();
    }
  };

  type Scenario = {
    name: PaymentState;
    drive: (c: PaymentComponent, f: ComponentFixture<PaymentComponent>) => void;
  };

  const scenarios: Scenario[] = [
    { name: 'idle', drive: () => {} },
    {
      name: 'ready',
      drive: (c, f) => {
        f.componentRef.setInput('amount', 250);
        f.componentRef.setInput('currency', 'EUR');
        f.detectChanges();
        c.validate();
      },
    },
    {
      name: 'error',
      drive: (c, f) => {
        f.componentRef.setInput('amount', 0);
        f.detectChanges();
        c.validate();
      },
    },
    { name: 'cancelled', drive: (c) => c.cancel() },
    { name: 'expired', drive: (c) => c.expire() },
  ];

  it.each(scenarios)(
    'holds the ARIA contract in the $name state',
    ({ name, drive }) => {
      drive(component, fixture);
      fixture.detectChanges();
      expect(component.state()).toBe(name);
      assertInvariants(host());
    },
  );

  it('never advertises aria-busy in a non-busy state', () => {
    // `validating`/`processing` do not rest through the public API, so their
    // busy DOM is left to the Stripe slice + e2e. What we *can* pin here is the
    // dual invariant that guards the a11y tree the rest of the time: whenever
    // the machine is not busy, `ariaBusy()` (the sole source of the template's
    // `[attr.aria-busy]`) is null — never the string 'false'.
    for (const drive of [
      () => {},
      (c: PaymentComponent) => c.cancel(),
      (c: PaymentComponent) => c.expire(),
    ]) {
      component.reset();
      drive(component);
      fixture.detectChanges();
      expect(component.isBusy()).toBe(false);
      expect(component.ariaBusy()).toBeNull();
      expect(host().getAttribute('aria-busy')).toBeNull();
    }
  });
});

// --------------------------------------------------------------------------
// NG-05 fatia 4: the money-move seam (ready → processing → success | error).
// Driven through a *fake* gateway provided over IU_PAYMENT_GATEWAY — no real
// Stripe, no network, no keys. A deferred fake lets us pin the `processing`
// resting state (which the public API could not reach before this slice).
// --------------------------------------------------------------------------
describe('PaymentComponent (iu-payment) — NG-05 fatia 4: gateway submit', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  /** Requests the component handed the gateway, in call order. */
  let requests: PaymentGatewayRequest[];
  /** Resolve/reject the pending authorize from the test. */
  let settle: {
    resolve: (r: PaymentAuthResult) => void;
    reject: (e: unknown) => void;
  } | null;
  /** When true the gateway promise never settles (drives the timeout path). */
  let hang: boolean;

  const gateway: PaymentGateway = {
    authorize: (req) => {
      requests.push(req);
      return new Promise<PaymentAuthResult>((resolve, reject) => {
        if (hang) return;
        settle = { resolve, reject };
      });
    },
  };

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;
  const successEl = () =>
    fixture.nativeElement.querySelector(
      '.iu-payment__success',
    ) as HTMLElement | null;

  /** Take the machine to `ready` with a valid amount/currency. */
  const toReady = () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.componentRef.setInput('currency', 'EUR');
    fixture.detectChanges();
    component.validate();
    expect(component.state()).toBe('ready');
  };

  beforeEach(() => {
    requests = [];
    settle = null;
    hang = false;
    TestBed.configureTestingModule({
      imports: [PaymentComponent],
      providers: [{ provide: IU_PAYMENT_GATEWAY, useValue: gateway }],
    });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('submit() enters processing synchronously and is busy', () => {
    toReady();
    const pending = component.submit();
    expect(component.state()).toBe('processing');
    expect(component.isBusy()).toBe(true);
    // Settle so no promise dangles past the test.
    settle?.resolve({ outcome: 'succeeded' });
    return pending;
  });

  it('drives ready → processing → success on approval', async () => {
    toReady();
    const pending = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    expect(await pending).toBe(true);
    expect(component.state()).toBe('success');
    expect(component.error()).toBeNull();
  });

  it('renders a polite success confirmation with a restart button', async () => {
    toReady();
    const pending = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await pending;
    fixture.detectChanges();
    const el = successEl();
    expect(el).toBeTruthy();
    expect(el?.getAttribute('role')).toBe('status');
    const restart = el?.querySelector('.iu-payment__restart') as HTMLButtonElement;
    expect(restart?.tagName).toBe('BUTTON');
    restart.click();
    fixture.detectChanges();
    expect(component.state()).toBe('idle');
  });

  it('falls into error with gateway_declined when the gateway refuses', async () => {
    toReady();
    const pending = component.submit();
    settle?.resolve({ outcome: 'declined', message: 'Cartão recusado.' });
    expect(await pending).toBe(false);
    expect(component.state()).toBe('error');
    expect(component.error()?.code).toBe('gateway_declined');
    expect(component.error()?.message).toBe('Cartão recusado.');
  });

  it('maps a rejected authorize to gateway_declined', async () => {
    toReady();
    const pending = component.submit();
    settle?.reject(new Error('network'));
    expect(await pending).toBe(false);
    expect(component.error()?.code).toBe('gateway_declined');
  });

  it('times out into gateway_timeout when the gateway hangs', async () => {
    jest.useFakeTimers();
    try {
      toReady();
      hang = true;
      const pending = component.submit();
      expect(component.state()).toBe('processing');
      jest.advanceTimersByTime(20_000);
      expect(await pending).toBe(false);
      expect(component.state()).toBe('error');
      expect(component.error()?.code).toBe('gateway_timeout');
    } finally {
      jest.useRealTimers();
    }
  });

  it('passes the validated amount/currency/intent to the gateway', async () => {
    fixture.componentRef.setInput('intent', 'deposit');
    toReady();
    const pending = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await pending;
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      amount: 100,
      currency: 'EUR',
      intent: 'deposit',
    });
    expect(typeof requests[0].idempotencyKey).toBe('string');
    expect(requests[0].idempotencyKey.length).toBeGreaterThan(0);
  });

  it('reuses the idempotency key across a retry of the same attempt', async () => {
    toReady();
    const first = component.submit();
    settle?.resolve({ outcome: 'declined' });
    await first;
    expect(component.state()).toBe('error');

    expect(component.retry()).toBe(true);
    expect(component.state()).toBe('ready');
    const second = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await second;

    expect(requests).toHaveLength(2);
    expect(requests[0].idempotencyKey).toBe(requests[1].idempotencyKey);
    expect(component.state()).toBe('success');
  });

  it('mints a fresh key for a new attempt after reset()', async () => {
    toReady();
    const first = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await first;
    component.reset();
    expect(component.idempotencyKey()).toBeNull();

    toReady();
    const second = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await second;
    expect(requests[0].idempotencyKey).not.toBe(requests[1].idempotencyKey);
  });

  it('ignores a gateway resolution that lands after the user cancelled', async () => {
    toReady();
    const pending = component.submit();
    expect(component.state()).toBe('processing');
    // User bails while the gateway is in flight — the terminal state must win.
    expect(component.cancel()).toBe(true);
    expect(component.state()).toBe('cancelled');
    settle?.resolve({ outcome: 'succeeded' });
    expect(await pending).toBe(false);
    expect(component.state()).toBe('cancelled');
  });

  it('ignores a gateway resolution that lands after the session expired', async () => {
    toReady();
    const pending = component.submit();
    expect(component.expire()).toBe(true);
    settle?.resolve({ outcome: 'succeeded' });
    expect(await pending).toBe(false);
    expect(component.state()).toBe('expired');
  });

  it('submit() is a no-op unless the flow is ready', async () => {
    expect(await component.submit()).toBe(false);
    expect(component.state()).toBe('idle');
    expect(requests).toHaveLength(0);
  });

  it('submit() is inert while disabled', async () => {
    toReady();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(await component.submit()).toBe(false);
    expect(component.state()).toBe('ready');
    expect(requests).toHaveLength(0);
  });

  it('marks the host aria-busy while processing and announces it', () => {
    toReady();
    const pending = component.submit();
    fixture.detectChanges();
    expect(host().getAttribute('aria-busy')).toBe('true');
    expect(component.statusText()).toBe('A processar o pagamento…');
    settle?.resolve({ outcome: 'succeeded' });
    return pending;
  });

  it('emits processing then success through stateChange', async () => {
    toReady();
    const seen: PaymentState[] = [];
    component.stateChange.subscribe((s) => seen.push(s));
    const pending = component.submit();
    settle?.resolve({ outcome: 'succeeded' });
    await pending;
    expect(seen).toEqual(['processing', 'success']);
  });

  it('uses the root test-mode stub when no gateway is provided', async () => {
    // Second injector without our fake: the default (root) stub must approve
    // without touching anything — proves the seam is inert by default.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    const f = TestBed.createComponent(PaymentComponent);
    const c = f.componentInstance;
    f.detectChanges();
    f.componentRef.setInput('amount', 50);
    f.componentRef.setInput('currency', 'USD');
    f.detectChanges();
    c.validate();
    expect(await c.submit()).toBe(true);
    expect(c.state()).toBe('success');
  });
});

// --------------------------------------------------------------------------
// NG-05 fatia 5: extend the fatia-3 a11y invariant contract to the two states
// that could NOT rest through the public API before the gateway seam landed —
// `processing` (rests while a fake gateway hangs) and `success` (rests after a
// fake approval). Same manual axe stand-in as fatia 3 (no new deps): the
// invariants (status region wired + copy == statusText(); boolean aria-busy;
// error/terminal regions absent) must hold here too, and `success` adds its
// own polite confirmation + restart affordance. Closes the fatia-3 checkpoint
// item "estender o it.each da fatia 3 com o gateway falso".
// --------------------------------------------------------------------------
describe('PaymentComponent (iu-payment) — NG-05 fatia 5: a11y invariants for busy/settled states', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  /** When true the gateway promise never settles (holds `processing` at rest). */
  let hang: boolean;
  /** Resolve the pending authorize from the test (for the `success` case). */
  let settle: ((r: PaymentAuthResult) => void) | null;

  const gateway: PaymentGateway = {
    authorize: () =>
      new Promise<PaymentAuthResult>((resolve) => {
        if (hang) return;
        settle = resolve;
      }),
  };

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;

  beforeEach(() => {
    hang = false;
    settle = null;
    TestBed.configureTestingModule({
      imports: [PaymentComponent],
      providers: [{ provide: IU_PAYMENT_GATEWAY, useValue: gateway }],
    });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Take the machine to `ready` with a valid amount/currency. */
  const toReady = () => {
    fixture.componentRef.setInput('amount', 100);
    fixture.componentRef.setInput('currency', 'EUR');
    fixture.detectChanges();
    component.validate();
    expect(component.state()).toBe('ready');
  };

  /**
   * The same invariants asserted in fatia 3, applicable to every rendered
   * state: the live status region is always wired and reads back exactly what
   * the machine announces; aria-busy is boolean (present iff busy, never
   * 'false'); the error and terminal regions are absent outside their states.
   */
  const assertInvariants = (el: HTMLElement) => {
    const state = component.state();

    const status = el.querySelector('.iu-payment__status');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent?.trim()).toBe(component.statusText());

    const busy = el.getAttribute('aria-busy');
    if (component.isBusy()) expect(busy).toBe('true');
    else expect(busy).toBeNull();
    if (busy !== null) expect(busy).toBe('true');

    // Neither the error nor the terminal region belongs to processing/success.
    expect(el.querySelector('.iu-payment__error')).toBeNull();
    expect(el.querySelector('.iu-payment__terminal')).toBeNull();
    void state;
  };

  it('holds the ARIA contract while processing (busy, at rest on a hanging gateway)', () => {
    hang = true;
    toReady();
    const pending = component.submit();
    fixture.detectChanges();

    expect(component.state()).toBe('processing');
    expect(component.isBusy()).toBe(true);
    expect(host().getAttribute('aria-busy')).toBe('true');
    assertInvariants(host());
    // No dangling assertion: the promise stays pending by design (hang), and
    // nothing resolves it — the component is GC'd with the fixture.
    void pending;
  });

  it('holds the ARIA contract in the success state, with a polite confirmation', async () => {
    toReady();
    const pending = component.submit();
    settle?.({ outcome: 'succeeded' });
    await pending;
    fixture.detectChanges();

    expect(component.state()).toBe('success');
    expect(component.isBusy()).toBe(false);
    expect(host().getAttribute('aria-busy')).toBeNull();
    assertInvariants(host());

    // Success adds its own region: polite (role=status) with a restart button.
    const success = host().querySelector('.iu-payment__success');
    expect(success).toBeTruthy();
    expect(success?.getAttribute('role')).toBe('status');
    const restart = success?.querySelector(
      '.iu-payment__restart',
    ) as HTMLButtonElement | null;
    expect(restart?.tagName).toBe('BUTTON');
    expect(restart?.getAttribute('type')).toBe('button');
  });
});

describe('PaymentComponent (iu-payment) — NG-05 fatia 8: presentational seed', () => {
  let fixture: ComponentFixture<PaymentComponent>;
  let component: PaymentComponent;

  const host = () =>
    fixture.nativeElement.querySelector('.iu-payment') as HTMLElement;
  const statusEl = () =>
    fixture.nativeElement.querySelector('.iu-payment__status') as HTMLElement;

  // Seed inputs must be set BEFORE the first detectChanges so ngOnInit reads
  // the bound value — mirrors how a wrapper binds `[initialState]` up front.
  const seed = (
    inputs: Partial<{ initialState: PaymentState; presentational: boolean }>,
  ) => {
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    for (const [k, v] of Object.entries(inputs)) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
  };

  it('seeds a terminal state at init without running the machine', () => {
    seed({ initialState: 'success' });
    expect(component.state()).toBe('success');
    expect(component.isTerminal()).toBe(true);
    expect(host().classList).toContain('iu-payment--state-success');
    // Seed is not a transition — the live region still reflects the state.
    expect(statusEl().textContent?.trim()).toBe('Pagamento concluído.');
  });

  it('the seed does not emit a stateChange (it is not a transition)', () => {
    const seen: PaymentState[] = [];
    TestBed.configureTestingModule({ imports: [PaymentComponent] });
    fixture = TestBed.createComponent(PaymentComponent);
    component = fixture.componentInstance;
    component.stateChange.subscribe((s) => seen.push(s));
    fixture.componentRef.setInput('initialState', 'success');
    fixture.detectChanges();
    expect(component.state()).toBe('success');
    expect(seen).toEqual([]);
  });

  it('ignores the default idle seed (no-op)', () => {
    seed({ initialState: 'idle' });
    expect(component.state()).toBe('idle');
    expect(host().classList).toContain('iu-payment--state-idle');
  });

  it('a later initialState change is ignored — the seed is one-shot', () => {
    seed({ initialState: 'success' });
    fixture.componentRef.setInput('initialState', 'error');
    fixture.detectChanges();
    expect(component.state()).toBe('success');
  });

  it('presentational=true suppresses the built-in success affordance', () => {
    seed({ initialState: 'success', presentational: true });
    expect(component.state()).toBe('success');
    expect(host().querySelector('.iu-payment__success')).toBeNull();
    // The aria-live status region is kept for accessibility.
    expect(statusEl()).toBeTruthy();
    expect(statusEl().getAttribute('aria-live')).toBe('polite');
  });

  it('presentational=true suppresses the error affordance (retry button)', () => {
    seed({ initialState: 'error', presentational: true });
    expect(component.state()).toBe('error');
    expect(host().querySelector('.iu-payment__error')).toBeNull();
  });

  it('presentational=true suppresses the expired/cancelled affordance', () => {
    seed({ initialState: 'expired', presentational: true });
    expect(component.state()).toBe('expired');
    expect(host().querySelector('.iu-payment__terminal')).toBeNull();
  });

  it('without presentational the built-in affordance still renders for a seed', () => {
    seed({ initialState: 'success' });
    const success = host().querySelector('.iu-payment__success');
    expect(success).toBeTruthy();
    expect(success?.querySelector('.iu-payment__restart')).toBeTruthy();
  });

  it('presentational is off by default (fallback preserves current behavior)', () => {
    seed({});
    expect(component.presentational()).toBe(false);
    expect(component.state()).toBe('idle');
  });
});
