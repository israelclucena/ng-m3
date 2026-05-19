import { TestBed } from '@angular/core/testing';
import { THEME_PALETTES, ThemeService, type ThemeMode } from './theme.service';

interface FakeMediaQueryList {
  matches: boolean;
  addEventListener: jest.Mock;
  _trigger: (matches: boolean) => void;
}

describe('ThemeService', () => {
  let storage: Record<string, string>;
  let originalMatchMedia: typeof window.matchMedia;
  let mq: FakeMediaQueryList;

  const makeFakeMq = (matches: boolean): FakeMediaQueryList => {
    let listener: ((e: { matches: boolean }) => void) | undefined;
    const fake: FakeMediaQueryList = {
      matches,
      addEventListener: jest.fn((_evt: string, cb: (e: { matches: boolean }) => void) => {
        listener = cb;
      }),
      _trigger: (m: boolean) => {
        fake.matches = m;
        listener?.({ matches: m });
      },
    };
    return fake;
  };

  beforeEach(() => {
    storage = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => storage[k] ?? null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => {
      storage[k] = String(v);
    });

    originalMatchMedia = window.matchMedia;
    mq = makeFakeMq(false);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn(() => mq as unknown as MediaQueryList),
    });

    // Each test gets a fresh class instance — clear any prior CSS state on :root
    document.documentElement.className = '';
    document.documentElement.removeAttribute('style');
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
    jest.restoreAllMocks();
  });

  const createService = (): ThemeService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ThemeService);
    // Flush the constructor effect()
    TestBed.tick();
    return svc;
  };

  it('defaults to system mode and lisboaRent palette when storage is empty', () => {
    const service = createService();
    expect(service.mode()).toBe('system');
    expect(service.paletteKey()).toBe('lisboaRent');
    expect(service.palette()).toBe(THEME_PALETTES['lisboaRent']);
  });

  it('isDark reflects system preference when mode is system', () => {
    mq = makeFakeMq(true);
    (window.matchMedia as jest.Mock).mockReturnValue(mq);
    const service = createService();
    expect(service.mode()).toBe('system');
    expect(service.isDark()).toBe(true);
  });

  it('isDark is true when mode is dark regardless of system preference', () => {
    const service = createService();
    service.setMode('dark');
    expect(service.isDark()).toBe(true);
  });

  it('isDark is false when mode is light regardless of system preference', () => {
    mq = makeFakeMq(true);
    (window.matchMedia as jest.Mock).mockReturnValue(mq);
    const service = createService();
    service.setMode('light');
    expect(service.isDark()).toBe(false);
  });

  it('setMode persists to localStorage', () => {
    const service = createService();
    service.setMode('dark');
    expect(storage['m3-theme']).toBe('dark');
  });

  it('loads persisted mode from localStorage on construction', () => {
    storage['m3-theme'] = 'dark';
    storage['m3-palette'] = 'ocean';
    const service = createService();
    expect(service.mode()).toBe('dark');
    expect(service.paletteKey()).toBe('ocean');
  });

  it('toggleMode cycles light → dark → system → light', () => {
    const service = createService();
    service.setMode('light');
    const seen: ThemeMode[] = [];
    for (let i = 0; i < 4; i++) {
      service.toggleMode();
      seen.push(service.mode());
    }
    expect(seen).toEqual(['dark', 'system', 'light', 'dark']);
  });

  it('setPalette accepts known keys and ignores unknown ones', () => {
    const service = createService();
    service.setPalette('ocean');
    expect(service.paletteKey()).toBe('ocean');
    expect(storage['m3-palette']).toBe('ocean');

    service.setPalette('does-not-exist');
    expect(service.paletteKey()).toBe('ocean');
  });

  it('palette signal falls back to default when key is corrupted post-hoc', () => {
    const service = createService();
    // Force an unknown key as if data was tampered — the computed should fall back
    (service as unknown as { _paletteKey: { set: (k: string) => void } })
      ._paletteKey.set('ghost');
    expect(service.palette()).toBe(THEME_PALETTES['default']);
  });

  it('availablePalettes exposes all built-in palettes with a key field', () => {
    const service = createService();
    const keys = service.availablePalettes.map(p => p.key).sort();
    expect(keys).toEqual(['default', 'forest', 'lisboaRent', 'ocean', 'sunset']);
    for (const p of service.availablePalettes) {
      expect(p.primary).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('applies dark-theme class and palette CSS vars to :root', () => {
    const service = createService();
    service.setMode('dark');
    service.setPalette('forest');
    TestBed.tick();

    const root = document.documentElement;
    expect(root.classList.contains('dark-theme')).toBe(true);
    expect(root.style.getPropertyValue('--md-sys-color-primary')).toBe(THEME_PALETTES['forest'].primary);
    expect(root.style.getPropertyValue('--md-sys-color-secondary')).toBe(THEME_PALETTES['forest'].secondary);
    expect(root.style.getPropertyValue('--md-sys-color-tertiary')).toBe(THEME_PALETTES['forest'].tertiary);
  });

  it('removes dark-theme class when switching back to light mode', () => {
    const service = createService();
    service.setMode('dark');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    service.setMode('light');
    TestBed.tick();
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('reacts to system preference change while in system mode', () => {
    const service = createService();
    expect(service.isDark()).toBe(false);
    mq._trigger(true);
    expect(service.isDark()).toBe(true);
    mq._trigger(false);
    expect(service.isDark()).toBe(false);
  });
});
