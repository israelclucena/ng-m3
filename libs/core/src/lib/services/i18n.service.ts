/**
 * @file i18n.service.ts
 * @description Signal-based i18n service for LisboaRent. Supports PT-PT and EN-GB.
 * No RxJS. Loads locale JSON, interpolates {{key}} placeholders.
 * Sprint 021 — Night Shift 2026-03-15
 */
import { Injectable, signal, computed } from '@angular/core';

export type SupportedLocale = 'pt-PT' | 'en-GB';

type TranslationMap = Record<string, string>;

/**
 * Signal-based internationalisation service.
 *
 * Usage:
 * ```ts
 * const i18n = inject(I18nService);
 * // reactive translation
 * const label = computed(() => i18n.t('nav.search'));
 * // with interpolation
 * const msg = i18n.t('search.results_count', { count: 12 });
 * // change locale
 * i18n.setLocale('pt-PT');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal<SupportedLocale>('pt-PT');
  private readonly _translations = signal<TranslationMap>({});
  private _loaded = new Set<SupportedLocale>();

  /** Currently active locale as a signal */
  readonly locale = this._locale.asReadonly();

  /** True while locale data is not yet loaded */
  readonly loading = signal(false);

  constructor() {
    // Detect browser preference, fall back to PT-PT
    const browserLang = (navigator.language ?? 'pt-PT').startsWith('en') ? 'en-GB' : 'pt-PT';
    this.loadLocale(browserLang as SupportedLocale);
  }

  /**
   * Translate a key with optional interpolation.
   * @param key  Dot-separated translation key (e.g. 'nav.search')
   * @param vars Optional substitution map for `{{var}}` placeholders
   * @returns    Translated string, or the key itself if not found
   */
  t(key: string, vars?: Record<string, string | number>): string {
    const map = this._translations();
    let value = map[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        // replaceAll needs es2021+ — use global regex for compatibility
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return value;
  }

  /**
   * Returns a computed signal for a translation key.
   * Re-evaluates automatically when the locale changes.
   */
  signal(key: string, vars?: Record<string, string | number>) {
    return computed(() => {
      // Read locale signal to establish dependency
      void this._locale();
      return this.t(key, vars);
    });
  }

  /**
   * Switch the active locale and load translations if needed.
   * @param locale Target locale
   */
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (this._locale() === locale && this._loaded.has(locale)) return;
    await this.loadLocale(locale);
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private async loadLocale(locale: SupportedLocale): Promise<void> {
    if (this._loaded.has(locale)) {
      this._locale.set(locale);
      return;
    }
    this.loading.set(true);
    try {
      const file = locale === 'pt-PT' ? 'messages.pt.json' : 'messages.en.json';
      // Base path works in both dev server and production (assets copied from locale/)
      const res = await fetch(`/locale/${file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { locale: string; translations: TranslationMap };
      this._translations.set(data.translations);
      this._loaded.add(locale);
      this._locale.set(locale);
      document.documentElement.lang = locale === 'pt-PT' ? 'pt' : 'en';
    } catch (err) {
      console.warn(`[I18nService] Could not load locale "${locale}":`, err);
      // Keep current translations — don't break the app
    } finally {
      this.loading.set(false);
    }
  }
}
