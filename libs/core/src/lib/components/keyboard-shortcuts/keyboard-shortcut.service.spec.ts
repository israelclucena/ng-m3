import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutService } from './keyboard-shortcut.service';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [KeyboardShortcutService] });
    service = TestBed.inject(KeyboardShortcutService);
  });

  afterEach(() => {
    // Detach the document keydown listener registered in the constructor.
    service.ngOnDestroy();
    document.body.innerHTML = '';
  });

  /** Dispatch a keydown event, optionally from a specific target element. */
  const press = (
    init: KeyboardEventInit,
    target: EventTarget = document,
  ): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };

  // ── Registration ──────────────────────────────────────────────────────────

  it('should be created with no shortcuts and help hidden', () => {
    expect(service).toBeTruthy();
    expect(service.shortcuts().length).toBe(0);
    expect(service.helpVisible()).toBe(false);
  });

  it('register() adds a shortcut', () => {
    service.register({ id: 'a', keys: 'ctrl+k', description: 'Search', handler: () => {} });
    expect(service.shortcuts().length).toBe(1);
  });

  it('register() with an existing id replaces the previous binding', () => {
    service.register({ id: 'a', keys: 'ctrl+k', description: 'First', handler: () => {} });
    service.register({ id: 'a', keys: 'ctrl+j', description: 'Second', handler: () => {} });
    expect(service.shortcuts().length).toBe(1);
    expect(service.shortcuts()[0].description).toBe('Second');
  });

  it('unregister() removes a shortcut by id', () => {
    service.register({ id: 'a', keys: 'ctrl+k', description: 'Search', handler: () => {} });
    service.unregister('a');
    expect(service.shortcuts().length).toBe(0);
  });

  it('shortcutsByCategory() groups bindings, defaulting to "General"', () => {
    service.register({ id: 'a', keys: 'ctrl+k', description: 'Search', category: 'Nav', handler: () => {} });
    service.register({ id: 'b', keys: 'ctrl+j', description: 'Jump', handler: () => {} });
    const map = service.shortcutsByCategory();
    expect(map.get('Nav')?.length).toBe(1);
    expect(map.get('General')?.length).toBe(1);
  });

  // ── Help overlay ────────────────────────────────────────────────────────────

  it('toggleHelp() flips helpVisible', () => {
    service.toggleHelp();
    expect(service.helpVisible()).toBe(true);
    service.toggleHelp();
    expect(service.helpVisible()).toBe(false);
  });

  it('pressing "?" toggles the help overlay', () => {
    press({ key: '?' });
    expect(service.helpVisible()).toBe(true);
  });

  it('pressing Escape closes an open help overlay', () => {
    service.toggleHelp();
    expect(service.helpVisible()).toBe(true);
    press({ key: 'Escape' });
    expect(service.helpVisible()).toBe(false);
  });

  // ── Dispatch ──────────────────────────────────────────────────────────────

  it('fires a matching shortcut handler and prevents default', () => {
    const handler = jest.fn();
    service.register({ id: 'search', keys: 'ctrl+k', description: 'Search', handler });
    const event = press({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('treats metaKey as ctrl for combo matching', () => {
    const handler = jest.fn();
    service.register({ id: 'search', keys: 'ctrl+k', description: 'Search', handler });
    press({ key: 'k', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('matches combos regardless of modifier order', () => {
    const handler = jest.fn();
    service.register({ id: 'x', keys: 'k+ctrl', description: 'Odd order', handler });
    press({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a non-matching combo', () => {
    const handler = jest.fn();
    service.register({ id: 'search', keys: 'ctrl+k', description: 'Search', handler });
    press({ key: 'j', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('preventDefault:false leaves the browser default intact', () => {
    const handler = jest.fn();
    service.register({
      id: 'nopd',
      keys: 'ctrl+k',
      description: 'No preventDefault',
      handler,
      preventDefault: false,
    });
    const event = press({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores keydown originating from an INPUT element', () => {
    const handler = jest.fn();
    service.register({ id: 'search', keys: 'ctrl+k', description: 'Search', handler });
    const input = document.createElement('input');
    document.body.appendChild(input);
    press({ key: 'k', ctrlKey: true }, input);
    expect(handler).not.toHaveBeenCalled();
  });

  it('stops dispatching to handlers after ngOnDestroy', () => {
    const handler = jest.fn();
    service.register({ id: 'search', keys: 'ctrl+k', description: 'Search', handler });
    service.ngOnDestroy();
    press({ key: 'k', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
