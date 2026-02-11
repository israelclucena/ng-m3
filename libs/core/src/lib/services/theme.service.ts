import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePalette {
  /** Palette display name */
  name: string;
  /** M3 primary color */
  primary: string;
  /** M3 secondary color */
  secondary: string;
  /** M3 tertiary color */
  tertiary: string;
}

/** Built-in theme palettes */
export const THEME_PALETTES: Record<string, ThemePalette> = {
  default: {
    name: 'Default',
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
  },
  ocean: {
    name: 'Ocean',
    primary: '#1565C0',
    secondary: '#0277BD',
    tertiary: '#00838F',
  },
  forest: {
    name: 'Forest',
    primary: '#2E7D32',
    secondary: '#558B2F',
    tertiary: '#33691E',
  },
  sunset: {
    name: 'Sunset',
    primary: '#E65100',
    secondary: '#BF360C',
    tertiary: '#B71C1C',
  },
  lisboaRent: {
    name: 'LisboaRent',
    primary: '#1565C0',
    secondary: '#B85C38',
    tertiary: '#5C6BC0',
  },
} as const;

const STORAGE_KEY_MODE = 'm3-theme';
const STORAGE_KEY_PALETTE = 'm3-palette';

/**
 * ThemeService — M3 theme switching with signals.
 *
 * Manages light/dark/system mode and custom color palettes.
 * Persists to localStorage. Applies CSS custom properties to :root.
 *
 * @example
 * ```typescript
 * constructor(private theme: ThemeService) {}
 *
 * theme.setMode('dark');
 * theme.setPalette('ocean');
 * theme.toggleMode(); // cycles light → dark → system
 *
 * // Reactive access
 * effect(() => console.log('Mode:', this.theme.mode()));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _mode = signal<ThemeMode>(this._loadMode());
  private _paletteKey = signal<string>(this._loadPaletteKey());
  private _systemDark = signal(this._querySystemDark());

  /** Current theme mode */
  readonly mode = this._mode.asReadonly();

  /** Current palette key */
  readonly paletteKey = this._paletteKey.asReadonly();

  /** Current palette */
  readonly palette = computed(() => THEME_PALETTES[this._paletteKey()] ?? THEME_PALETTES['default']);

  /** Whether dark mode is effectively active */
  readonly isDark = computed(() => {
    const mode = this._mode();
    if (mode === 'system') return this._systemDark();
    return mode === 'dark';
  });

  /** Available palette keys */
  readonly availablePalettes = Object.entries(THEME_PALETTES).map(([key, p]) => ({ key, ...p }));

  constructor() {
    // Listen for system preference changes
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => this._systemDark.set(e.matches));
    }

    // Apply theme whenever mode or palette changes
    effect(() => {
      this._applyTheme(this.isDark(), this.palette());
    });
  }

  /** Set theme mode */
  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    this._persist();
  }

  /** Toggle through modes: light → dark → system */
  toggleMode(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = modes.indexOf(this._mode());
    this._mode.set(modes[(idx + 1) % modes.length]);
    this._persist();
  }

  /** Set color palette by key */
  setPalette(key: string): void {
    if (THEME_PALETTES[key]) {
      this._paletteKey.set(key);
      this._persist();
    }
  }

  private _applyTheme(isDark: boolean, palette: ThemePalette): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark-theme', isDark);
    root.style.setProperty('--md-sys-color-primary', palette.primary);
    root.style.setProperty('--md-sys-color-secondary', palette.secondary);
    root.style.setProperty('--md-sys-color-tertiary', palette.tertiary);
  }

  private _persist(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_MODE, this._mode());
    localStorage.setItem(STORAGE_KEY_PALETTE, this._paletteKey());
  }

  private _loadMode(): ThemeMode {
    if (typeof localStorage === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode) ?? 'system';
  }

  private _loadPaletteKey(): string {
    if (typeof localStorage === 'undefined') return 'lisboaRent';
    return localStorage.getItem(STORAGE_KEY_PALETTE) ?? 'lisboaRent';
  }

  private _querySystemDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
