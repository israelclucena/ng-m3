import { TestBed } from '@angular/core/testing';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnackbarService);
  });

  it('starts closed with default state', () => {
    const s = service.state();
    expect(s.open).toBe(false);
    expect(s.message).toBe('');
    expect(s.action).toBe('');
    expect(s.duration).toBe(4000);
    expect(s.variant).toBe('single');
    expect(s.closeable).toBe(false);
  });

  it('show() opens the snackbar with the given message and defaults', () => {
    service.show({ message: 'Saved!' });
    const s = service.state();
    expect(s.open).toBe(true);
    expect(s.message).toBe('Saved!');
    expect(s.action).toBe('');
    expect(s.duration).toBe(4000);
    expect(s.variant).toBe('single');
    expect(s.closeable).toBe(false);
  });

  it('show() honours every optional field when provided', () => {
    service.show({
      message: 'Item deleted',
      action: 'Undo',
      duration: 7000,
      variant: 'multi',
      closeable: true,
    });
    const s = service.state();
    expect(s.message).toBe('Item deleted');
    expect(s.action).toBe('Undo');
    expect(s.duration).toBe(7000);
    expect(s.variant).toBe('multi');
    expect(s.closeable).toBe(true);
    expect(s.open).toBe(true);
  });

  it('show() stores the onAction callback for later invocation by the component', () => {
    const cb = jest.fn();
    service.show({ message: 'Deleted', action: 'Undo' }, cb);
    service.state().onAction?.();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('dismiss() flips open=false without clearing other fields', () => {
    service.show({ message: 'Saved!', action: 'OK', duration: 5000 });
    service.dismiss();
    const s = service.state();
    expect(s.open).toBe(false);
    expect(s.message).toBe('Saved!');
    expect(s.action).toBe('OK');
    expect(s.duration).toBe(5000);
  });

  it('show() replaces a previous snackbar (last-wins, no queueing)', () => {
    service.show({ message: 'First', duration: 1000 });
    service.show({ message: 'Second' });
    const s = service.state();
    expect(s.message).toBe('Second');
    expect(s.duration).toBe(4000); // back to default — not preserved from previous
    expect(s.open).toBe(true);
  });

  it('state signal is reactive: snapshots change between show/dismiss', () => {
    const first = service.state();
    service.show({ message: 'Hi' });
    const second = service.state();
    service.dismiss();
    const third = service.state();
    expect(first).not.toBe(second);
    expect(second).not.toBe(third);
    expect(first.open).toBe(false);
    expect(second.open).toBe(true);
    expect(third.open).toBe(false);
  });
});
