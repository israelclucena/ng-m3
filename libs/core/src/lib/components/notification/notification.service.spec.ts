import { TestBed } from '@angular/core/testing';
import { NotificationService, NotificationType } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be created with empty initial state', () => {
    expect(service).toBeTruthy();
    expect(service.current()).toBeNull();
    expect(service.queueLength()).toBe(0);
    expect(service.isVisible()).toBe(false);
  });

  it('show() returns an id string starting with "notif-"', () => {
    const id = service.show({ message: 'hello' });
    expect(typeof id).toBe('string');
    expect(id.startsWith('notif-')).toBe(true);
  });

  it('show() defaults type to "info" and sets current', () => {
    service.show({ message: 'hello' });
    expect(service.current()?.type).toBe('info');
    expect(service.current()?.message).toBe('hello');
    expect(service.isVisible()).toBe(true);
  });

  it('show() with explicit type "success" sets current type to success', () => {
    service.show({ message: 'ok', type: 'success' });
    expect(service.current()?.type).toBe('success');
  });

  it('show() with explicit type "warning" sets current type to warning', () => {
    service.show({ message: 'be careful', type: 'warning' });
    expect(service.current()?.type).toBe('warning');
  });

  it('show() with explicit type "error" sets current type to error', () => {
    service.show({ message: 'oh no', type: 'error' });
    expect(service.current()?.type).toBe('error');
  });

  it('show() while one is visible queues the new item', () => {
    service.show({ message: 'first' });
    const firstCurrent = service.current();
    service.show({ message: 'second' });
    expect(service.current()).toBe(firstCurrent);
    expect(service.current()?.message).toBe('first');
    expect(service.queueLength()).toBe(1);
  });

  it('shorthand info() sets type to info', () => {
    service.info('msg');
    expect(service.current()?.type).toBe('info');
    expect(service.current()?.message).toBe('msg');
  });

  it('shorthand success() sets type to success', () => {
    service.success('msg');
    expect(service.current()?.type).toBe('success');
  });

  it('shorthand warning() sets type to warning', () => {
    service.warning('msg');
    expect(service.current()?.type).toBe('warning');
  });

  it('shorthand error() sets type to error with default duration 6000', () => {
    service.error('msg');
    expect(service.current()?.type).toBe('error');
    expect(service.current()?.duration).toBe(6000);
  });

  it('default duration is 4000 for non-error types', () => {
    service.info('msg');
    expect(service.current()?.duration).toBe(4000);
  });

  it('error() respects explicit duration override', () => {
    service.error('msg', { duration: 10000 });
    expect(service.current()?.duration).toBe(10000);
  });

  it('dismiss() clears current and after 200ms shows next from queue', () => {
    service.show({ message: 'first' });
    service.show({ message: 'second' });
    expect(service.queueLength()).toBe(1);

    service.dismiss();
    expect(service.current()).toBeNull();
    expect(service.queueLength()).toBe(0);

    jest.advanceTimersByTime(200);
    expect(service.current()?.message).toBe('second');
  });

  it('dismiss() calls onDismiss callback if provided', () => {
    const onDismiss = jest.fn();
    service.show({ message: 'hi', onDismiss });
    service.dismiss();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismiss: advancing timers by duration clears current', () => {
    service.show({ message: 'hi', duration: 4000 });
    expect(service.current()).not.toBeNull();
    jest.advanceTimersByTime(4000);
    expect(service.current()).toBeNull();
  });

  it('duration: 0 → no auto-dismiss timer fires', () => {
    service.show({ message: 'sticky', duration: 0 });
    jest.advanceTimersByTime(100000);
    expect(service.current()?.message).toBe('sticky');
  });

  it('triggerAction() calls onAction then dismisses', () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    service.show({ message: 'hi', action: 'OK', onAction, onDismiss });
    service.triggerAction();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(service.current()).toBeNull();
  });

  it('clearQueue() clears queue but keeps current visible', () => {
    service.show({ message: 'first' });
    service.show({ message: 'second' });
    service.show({ message: 'third' });
    expect(service.queueLength()).toBe(2);

    service.clearQueue();
    expect(service.queueLength()).toBe(0);
    expect(service.current()?.message).toBe('first');
  });

  it('clearAll() clears queue, current, and timer', () => {
    service.show({ message: 'first', duration: 4000 });
    service.show({ message: 'second' });
    expect(service.isVisible()).toBe(true);
    expect(service.queueLength()).toBe(1);

    service.clearAll();
    expect(service.current()).toBeNull();
    expect(service.queueLength()).toBe(0);
    expect(service.isVisible()).toBe(false);

    // Ensure timer is cleared — advancing time should not trigger anything
    jest.advanceTimersByTime(10000);
    expect(service.current()).toBeNull();
  });

  it('getIcon() returns correct icon per type', () => {
    expect(NotificationService.getIcon('success')).toBe('check_circle');
    expect(NotificationService.getIcon('error')).toBe('error');
    expect(NotificationService.getIcon('warning')).toBe('warning');
    expect(NotificationService.getIcon('info')).toBe('info');
    expect(NotificationService.getIcon('unknown' as NotificationType)).toBe('info');
  });

  it('isVisible() reflects current state correctly through lifecycle', () => {
    expect(service.isVisible()).toBe(false);
    service.show({ message: 'hi' });
    expect(service.isVisible()).toBe(true);
    service.dismiss();
    expect(service.isVisible()).toBe(false);
  });
});
