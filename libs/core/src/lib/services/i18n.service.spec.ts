import { TestBed } from '@angular/core/testing';
import { I18nService, type SupportedLocale } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let fetchSpy: jest.Mock;
  let originalFetch: typeof fetch | undefined;
  let consoleWarnSpy: jest.SpyInstance;

  const ptTranslations = {
    'nav.search': 'Pesquisar',
    'search.results_count': '{{count}} resultados',
    'hello.user': 'Olá, {{name}}!',
  };
  const enTranslations = {
    'nav.search': 'Search',
    'search.results_count': '{{count}} results',
  };

  /** Mock fetch to return translations for the requested locale file. */
  const mockOk = (mapByLocale: Record<SupportedLocale, Record<string, string>>) => {
    fetchSpy = jest.fn((url: string) => {
      const locale: SupportedLocale = url.endsWith('messages.en.json') ? 'en-GB' : 'pt-PT';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ locale, translations: mapByLocale[locale] }),
      } as Response);
    });
    (globalThis as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;
  };

  beforeEach(() => {
    originalFetch = (globalThis as { fetch?: typeof fetch }).fetch;
    // Force a deterministic default — service constructor reads navigator.language
    Object.defineProperty(navigator, 'language', { value: 'pt-PT', configurable: true });
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockOk({ 'pt-PT': ptTranslations, 'en-GB': enTranslations });
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    consoleWarnSpy.mockRestore();
  });

  it('defaults to pt-PT and loads translations on construction', async () => {
    // Constructor fires loadLocale; flush the microtask queue
    await Promise.resolve();
    await Promise.resolve();
    expect(service.locale()).toBe('pt-PT');
    expect(service.t('nav.search')).toBe('Pesquisar');
    expect(document.documentElement.lang).toBe('pt');
  });

  it('returns the key itself when translation is missing', async () => {
    await service.setLocale('pt-PT');
    expect(service.t('missing.key')).toBe('missing.key');
  });

  it('interpolates {{vars}} into the translated string', async () => {
    await service.setLocale('pt-PT');
    expect(service.t('search.results_count', { count: 12 })).toBe('12 resultados');
    expect(service.t('hello.user', { name: 'Israel' })).toBe('Olá, Israel!');
  });

  it('substitutes ALL occurrences of the same placeholder', async () => {
    // Ad-hoc seed to verify replace uses global regex (test the implementation contract)
    (service as unknown as { _translations: { set: (m: Record<string, string>) => void } })
      ._translations.set({ 'pair': '{{x}} and {{x}}' });
    expect(service.t('pair', { x: 'A' })).toBe('A and A');
  });

  it('setLocale loads en-GB and switches locale + html lang', async () => {
    await service.setLocale('en-GB');
    expect(service.locale()).toBe('en-GB');
    expect(service.t('nav.search')).toBe('Search');
    expect(document.documentElement.lang).toBe('en');
  });

  it('setLocale is a no-op when the requested locale is already active+loaded', async () => {
    await service.setLocale('pt-PT'); // ensure loaded
    const callsBefore = fetchSpy.mock.calls.length;
    await service.setLocale('pt-PT');
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
  });

  it('cached locale loads without re-fetching', async () => {
    await service.setLocale('en-GB');
    // After this, both pt-PT (from constructor) and en-GB are loaded
    const callsBefore = fetchSpy.mock.calls.length;
    await service.setLocale('pt-PT');
    await service.setLocale('en-GB');
    expect(fetchSpy.mock.calls.length).toBe(callsBefore); // both already cached
  });

  it('signal() returns a computed that re-evaluates on locale change', async () => {
    await service.setLocale('pt-PT');
    const label = service.signal('nav.search');
    expect(label()).toBe('Pesquisar');
    await service.setLocale('en-GB');
    expect(label()).toBe('Search');
  });

  it('keeps current translations and warns when fetch fails (network)', async () => {
    await service.setLocale('pt-PT');
    fetchSpy.mockImplementationOnce(() => Promise.reject(new Error('network down')));
    await service.setLocale('en-GB');
    // Still on pt-PT — translation should not have been clobbered
    expect(service.t('nav.search')).toBe('Pesquisar');
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(service.loading()).toBe(false);
  });

  it('handles non-ok HTTP response without throwing and keeps locale stable', async () => {
    await service.setLocale('pt-PT');
    fetchSpy.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await service.setLocale('en-GB');
    expect(service.t('nav.search')).toBe('Pesquisar');
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('toggles loading() signal around an async locale fetch', async () => {
    let resolveFetch!: (v: Response) => void;
    fetchSpy.mockImplementationOnce(
      () => new Promise<Response>((res) => { resolveFetch = res; }),
    );
    const p = service.setLocale('en-GB');
    expect(service.loading()).toBe(true);
    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ locale: 'en-GB', translations: enTranslations }),
    } as Response);
    await p;
    expect(service.loading()).toBe(false);
  });
});
