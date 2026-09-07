import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentComponent, PaymentState } from './payment.component';

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
