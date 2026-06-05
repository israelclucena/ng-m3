import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';

describe('SnackbarComponent', () => {
  let fixture: ComponentFixture<SnackbarComponent>;
  let component: SnackbarComponent;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SnackbarComponent] }).compileComponents();
    fixture = TestBed.createComponent(SnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.message()).toBe('');
    expect(component.action()).toBe('');
    expect(component.variant()).toBe('single');
    expect(component.duration()).toBe(4000);
    expect(component.open()).toBe(false);
    expect(component.closeable()).toBe(false);
    expect(component.visible()).toBe(false);
  });

  it('hostClass reflects variant and visibility', () => {
    expect(component.hostClass()).toBe('iu-snackbar iu-snackbar--single');
    fixture.componentRef.setInput('variant', 'multi');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-snackbar iu-snackbar--multi');
    component.show();
    expect(component.hostClass()).toBe('iu-snackbar iu-snackbar--multi iu-snackbar--open');
  });

  it('hasAction computed is false when action is empty and true when set', () => {
    expect(component.hasAction()).toBe(false);
    fixture.componentRef.setInput('action', 'Undo');
    fixture.detectChanges();
    expect(component.hasAction()).toBe(true);
  });

  it('ngOnInit auto-shows when open input is true', () => {
    const f = TestBed.createComponent(SnackbarComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    expect(f.componentInstance.visible()).toBe(true);
  });

  it('show() makes the snackbar visible', () => {
    expect(component.visible()).toBe(false);
    component.show();
    expect(component.visible()).toBe(true);
  });

  it('hide() emits dismissed and sets visible to false', () => {
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.show();
    expect(component.visible()).toBe(true);
    component.hide();
    expect(component.visible()).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onAction() emits actionClick then hides the snackbar', () => {
    const actionSpy = jest.fn();
    const dismissedSpy = jest.fn();
    component.actionClick.subscribe(actionSpy);
    component.dismissed.subscribe(dismissedSpy);
    component.show();
    component.onAction();
    expect(actionSpy).toHaveBeenCalledTimes(1);
    expect(dismissedSpy).toHaveBeenCalledTimes(1);
    expect(component.visible()).toBe(false);
  });

  it('auto-dismisses after the duration elapses', () => {
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.show();
    expect(component.visible()).toBe(true);
    jest.advanceTimersByTime(4000);
    expect(component.visible()).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when duration is 0', () => {
    fixture.componentRef.setInput('duration', 0);
    fixture.detectChanges();
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.show();
    jest.advanceTimersByTime(10000);
    expect(component.visible()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ngOnDestroy clears the timer without throwing', () => {
    component.show();
    expect(() => component.ngOnDestroy()).not.toThrow();
    // Advancing timers should NOT trigger hide() after destroy
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    jest.advanceTimersByTime(10000);
    expect(spy).not.toHaveBeenCalled();
  });

  it('renders the message text inside .iu-snackbar__message', () => {
    fixture.componentRef.setInput('message', 'Item deleted');
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.iu-snackbar__message') as HTMLElement;
    expect(msg).toBeTruthy();
    expect(msg.textContent?.trim()).toBe('Item deleted');
  });

  it('renders action button only when action() is non-empty and fires onAction on click', () => {
    expect(fixture.nativeElement.querySelector('.iu-snackbar__action')).toBeNull();
    fixture.componentRef.setInput('action', 'Undo');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.iu-snackbar__action') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent?.trim()).toBe('Undo');
    const spy = jest.fn();
    component.actionClick.subscribe(spy);
    component.show();
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component.visible()).toBe(false);
  });

  it('renders close button only when closeable() is true and fires hide on click', () => {
    expect(fixture.nativeElement.querySelector('.iu-snackbar__close')).toBeNull();
    fixture.componentRef.setInput('closeable', true);
    fixture.detectChanges();
    const close = fixture.nativeElement.querySelector('.iu-snackbar__close') as HTMLButtonElement;
    expect(close).toBeTruthy();
    expect(close.getAttribute('aria-label')).toBe('Dismiss');
    const spy = jest.fn();
    component.dismissed.subscribe(spy);
    component.show();
    close.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component.visible()).toBe(false);
  });
});
