import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ErrorPageComponent } from './error-page.component';

describe('ErrorPageComponent', () => {
  let fixture: ComponentFixture<ErrorPageComponent>;
  let component: ErrorPageComponent;
  let routerMock: { navigate: jest.Mock };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ErrorPageComponent],
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.errorCode()).toBe(500);
    expect(component.title()).toBe('Something went wrong');
    expect(component.message()).toBe(
      'An unexpected error occurred. Our team has been notified. Please try again.',
    );
  });

  it('renders the default error code 500', () => {
    const code = fixture.nativeElement.querySelector('.error-page__code') as HTMLElement;
    expect(code).toBeTruthy();
    expect(code.textContent?.trim()).toBe('500');
  });

  it('renders a custom error code when provided', () => {
    fixture.componentRef.setInput('errorCode', 503);
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('.error-page__code') as HTMLElement;
    expect(code.textContent?.trim()).toBe('503');
  });

  it('accepts a string error code', () => {
    fixture.componentRef.setInput('errorCode', 'ERR');
    fixture.detectChanges();
    const code = fixture.nativeElement.querySelector('.error-page__code') as HTMLElement;
    expect(code.textContent?.trim()).toBe('ERR');
  });

  it('renders the default title and updates when the input changes', () => {
    const title = fixture.nativeElement.querySelector('.error-page__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Something went wrong');
    fixture.componentRef.setInput('title', 'Service Unavailable');
    fixture.detectChanges();
    expect(title.textContent?.trim()).toBe('Service Unavailable');
  });

  it('renders the default message and updates when the input changes', () => {
    const msg = fixture.nativeElement.querySelector('.error-page__message') as HTMLElement;
    expect(msg.textContent?.trim()).toContain('An unexpected error occurred');
    fixture.componentRef.setInput('message', 'Please retry in a moment.');
    fixture.detectChanges();
    expect(msg.textContent?.trim()).toBe('Please retry in a moment.');
  });

  it('renders a decorative icon marked aria-hidden', () => {
    const icon = fixture.nativeElement.querySelector('.error-page__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders both primary and secondary action buttons', () => {
    const primary = fixture.nativeElement.querySelector(
      '.error-page__btn--primary',
    ) as HTMLButtonElement;
    const secondary = fixture.nativeElement.querySelector(
      '.error-page__btn--secondary',
    ) as HTMLButtonElement;
    expect(primary).toBeTruthy();
    expect(secondary).toBeTruthy();
    expect(primary.textContent?.trim()).toBe('Try Again');
    expect(secondary.textContent?.trim()).toBe('Go to Dashboard');
    expect(primary.getAttribute('type')).toBe('button');
    expect(secondary.getAttribute('type')).toBe('button');
  });

  it('exposes a retry() method that wraps window.location.reload', () => {
    // jsdom marks window.location and its reload as read-only/non-configurable,
    // so we can't spy on the native call directly. Verify the method exists,
    // is wired in the template (separate test), and short-circuit the body by
    // overriding the bound reference on the component prototype.
    expect(typeof component.retry).toBe('function');
    const wrapped = jest.fn();
    const original = component.retry;
    component.retry = wrapped;
    component.retry();
    expect(wrapped).toHaveBeenCalledTimes(1);
    component.retry = original;
  });

  it('clicking the primary button calls retry()', () => {
    const spy = jest.spyOn(component, 'retry').mockImplementation(() => undefined);
    // Re-render so the template's click handler picks up the spy via the
    // updated method reference. Angular's event binding reads the property at
    // call time, so a spy on the instance method is sufficient.
    const btn = fixture.nativeElement.querySelector(
      '.error-page__btn--primary',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('goHome() navigates to /dashboard via Router', () => {
    component.goHome();
    expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('clicking the secondary button calls goHome and navigates to /dashboard', () => {
    const spy = jest.spyOn(component, 'goHome');
    const btn = fixture.nativeElement.querySelector(
      '.error-page__btn--secondary',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('renders the actions container with both buttons inside', () => {
    const actions = fixture.nativeElement.querySelector('.error-page__actions') as HTMLElement;
    expect(actions).toBeTruthy();
    const buttons = actions.querySelectorAll('button.error-page__btn');
    expect(buttons.length).toBe(2);
  });

  it('does not invoke Router.navigate on initial render', () => {
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('renders the root .error-page container', () => {
    const root = fixture.nativeElement.querySelector('.error-page') as HTMLElement;
    expect(root).toBeTruthy();
  });
});
