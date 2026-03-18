import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { debouncedSignal } from '../../utils/signal-debounce';
import { CommonModule } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single select option */
export interface FilterSelectOption {
  /** Option value (used in FilterValues) */
  value: string;
  /** Display label */
  label: string;
}

/** Date range value */
export interface FilterDateRange {
  start: string | null;
  end: string | null;
}

/** Base filter config shared across all types */
interface FilterConfigBase {
  /** Unique filter key — used as key in FilterValues */
  key: string;
  /** Label shown above the control */
  label: string;
  /** Placeholder text (for text/select filters) */
  placeholder?: string;
}

/** Text input filter (with 300ms debounce) */
export interface TextFilterConfig extends FilterConfigBase {
  type: 'text';
}

/** Select / dropdown filter */
export interface SelectFilterConfig extends FilterConfigBase {
  type: 'select';
  /** Available options */
  options: FilterSelectOption[];
}

/** Date range filter with start and end pickers */
export interface DateRangeFilterConfig extends FilterConfigBase {
  type: 'date-range';
}

/** Tag input filter — multiple values as chips */
export interface TagsFilterConfig extends FilterConfigBase {
  type: 'tags';
  /** Max number of tags allowed */
  maxTags?: number;
}

/** Discriminated union of all filter config types */
export type FilterConfig =
  | TextFilterConfig
  | SelectFilterConfig
  | DateRangeFilterConfig
  | TagsFilterConfig;

/**
 * Map of filter key → current value.
 * - `text`: `string`
 * - `select`: `string`
 * - `date-range`: `FilterDateRange`
 * - `tags`: `string[]`
 */
export type FilterValues = Record<string, string | string[] | FilterDateRange>;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * FilterBar — Reactive, Signal-based filter bar supporting text, select, date-range, and tag filters.
 *
 * All changes are emitted via the `filtersChange` output (Signal-based).
 * Text inputs are debounced by 300ms to avoid excessive emissions.
 *
 * @example
 * ```html
 * <iu-filter-bar
 *   [filters]="filterConfigs"
 *   (filtersChange)="onFiltersChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-filter-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-filter-bar" [class.iu-filter-bar--has-active]="hasActiveFilters()">
      <!-- Filter controls -->
      <div class="iu-filter-bar__controls">
        @for (filter of filters(); track filter.key) {
          <div class="iu-filter-bar__field" [attr.data-type]="filter.type">
            <label class="iu-filter-bar__label" [for]="'filter-' + filter.key">
              {{ filter.label }}
            </label>

            <!-- Text filter -->
            @if (filter.type === 'text') {
              <div class="iu-filter-bar__input-wrap">
                <span class="iu-filter-bar__input-icon material-symbols-outlined" aria-hidden="true">search</span>
                <input
                  class="iu-filter-bar__input"
                  type="text"
                  [id]="'filter-' + filter.key"
                  [placeholder]="filter.placeholder ?? 'Search…'"
                  [value]="getTextValue(filter.key)"
                  (input)="onTextInput(filter.key, $event)"
                  autocomplete="off"
                />
                @if (getTextValue(filter.key)) {
                  <button
                    class="iu-filter-bar__clear-btn"
                    type="button"
                    (click)="clearField(filter.key)"
                    aria-label="Clear {{ filter.label }}"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                }
              </div>
            }

            <!-- Select filter -->
            @if (filter.type === 'select') {
              <select
                class="iu-filter-bar__select"
                [id]="'filter-' + filter.key"
                [value]="getTextValue(filter.key)"
                (change)="onSelectChange(filter.key, $event)"
              >
                <option value="">{{ filter.placeholder ?? 'All' }}</option>
                @for (opt of asSelect(filter).options; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }

            <!-- Date range filter -->
            @if (filter.type === 'date-range') {
              <div class="iu-filter-bar__date-range">
                <input
                  class="iu-filter-bar__date-input"
                  type="date"
                  [id]="'filter-' + filter.key + '-start'"
                  [value]="getDateRange(filter.key).start ?? ''"
                  (change)="onDateChange(filter.key, 'start', $event)"
                  aria-label="{{ filter.label }} start date"
                />
                <span class="iu-filter-bar__date-sep" aria-hidden="true">→</span>
                <input
                  class="iu-filter-bar__date-input"
                  type="date"
                  [id]="'filter-' + filter.key + '-end'"
                  [value]="getDateRange(filter.key).end ?? ''"
                  (change)="onDateChange(filter.key, 'end', $event)"
                  aria-label="{{ filter.label }} end date"
                />
              </div>
            }

            <!-- Tags filter -->
            @if (filter.type === 'tags') {
              <div
                class="iu-filter-bar__tags-wrap"
                [class.iu-filter-bar__tags-wrap--full]="isTagsFull(filter.key, asTags(filter).maxTags)"
              >
                <!-- Existing chips -->
                @for (tag of getTagsValue(filter.key); track tag) {
                  <span class="iu-filter-bar__chip">
                    {{ tag }}
                    <button
                      class="iu-filter-bar__chip-remove"
                      type="button"
                      (click)="removeTag(filter.key, tag)"
                      [attr.aria-label]="'Remove tag ' + tag"
                    >
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </span>
                }
                <!-- New tag input -->
                @if (!isTagsFull(filter.key, asTags(filter).maxTags)) {
                  <input
                    class="iu-filter-bar__tags-input"
                    type="text"
                    [id]="'filter-' + filter.key"
                    [placeholder]="filter.placeholder ?? 'Add tag…'"
                    (keydown.enter)="onTagEnter(filter.key, $event)"
                    (keydown.backspace)="onTagBackspace(filter.key, $event)"
                    autocomplete="off"
                  />
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Clear all -->
      @if (hasActiveFilters()) {
        <button
          class="iu-filter-bar__clear-all"
          type="button"
          (click)="clearAll()"
        >
          <span class="material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
          Limpar filtros
        </button>
      }
    </div>
  `,
  styles: [`
    /* ── FilterBar ── */
    .iu-filter-bar {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      padding: 12px 16px;
      background: var(--md-sys-color-surface, #fffbfe);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      flex-wrap: wrap;
    }

    .iu-filter-bar__controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      flex: 1 1 auto;
    }

    .iu-filter-bar__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 160px;
      flex: 1 1 160px;
      max-width: 280px;
    }

    .iu-filter-bar__label {
      font-family: var(--md-sys-typescale-label-small-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-label-small-size, 0.75rem);
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      letter-spacing: 0.1px;
    }

    /* ── Text input ── */
    .iu-filter-bar__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .iu-filter-bar__input-icon {
      position: absolute;
      left: 10px;
      font-size: 18px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      pointer-events: none;
    }

    .iu-filter-bar__input {
      width: 100%;
      height: 40px;
      padding: 0 32px 0 34px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background: transparent;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 0.875rem);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      outline: none;
      transition: border-color 0.2s;
    }

    .iu-filter-bar__input:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
    }

    .iu-filter-bar__clear-btn {
      position: absolute;
      right: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 50%;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 0;
      transition: background 0.2s;
    }

    .iu-filter-bar__clear-btn:hover {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }

    .iu-filter-bar__clear-btn .material-symbols-outlined {
      font-size: 16px;
    }

    /* ── Select ── */
    .iu-filter-bar__select {
      height: 40px;
      width: 100%;
      padding: 0 12px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background: transparent;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 0.875rem);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
      outline: none;
      appearance: auto;
      transition: border-color 0.2s;
    }

    .iu-filter-bar__select:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
    }

    /* ── Date range ── */
    .iu-filter-bar__date-range {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .iu-filter-bar__date-input {
      flex: 1;
      height: 40px;
      padding: 0 10px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      background: transparent;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      font-size: 0.8125rem;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      outline: none;
      transition: border-color 0.2s;
    }

    .iu-filter-bar__date-input:focus {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
    }

    .iu-filter-bar__date-sep {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }

    /* ── Tags ── */
    .iu-filter-bar__tags-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 40px;
      padding: 4px 8px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 8px;
      align-items: center;
      transition: border-color 0.2s;
    }

    .iu-filter-bar__tags-wrap:focus-within {
      border-color: var(--md-sys-color-primary, #6750a4);
      border-width: 2px;
    }

    .iu-filter-bar__chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px 2px 10px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-radius: 8px;
      font-family: var(--md-sys-typescale-label-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-label-medium-size, 0.75rem);
      font-weight: 500;
    }

    .iu-filter-bar__chip-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      border-radius: 50%;
      width: 16px;
      height: 16px;
    }

    .iu-filter-bar__chip-remove .material-symbols-outlined {
      font-size: 14px;
    }

    .iu-filter-bar__tags-input {
      border: none;
      background: none;
      outline: none;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 0.875rem);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      min-width: 80px;
      flex: 1;
    }

    /* ── Clear all button ── */
    .iu-filter-bar__clear-all {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 16px;
      border: none;
      border-radius: 8px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-family: var(--md-sys-typescale-label-large-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-label-large-size, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.2s;
    }

    .iu-filter-bar__clear-all:hover {
      background: var(--md-sys-color-outline-variant, #cac4d0);
    }

    .iu-filter-bar__clear-all .material-symbols-outlined {
      font-size: 18px;
    }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .iu-filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .iu-filter-bar__field {
        max-width: 100%;
      }

      .iu-filter-bar__clear-all {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class FilterBarComponent implements OnInit {

  /**
   * Array of filter configurations defining which filters to render and their type.
   */
  filters = input.required<FilterConfig[]>();

  /**
   * Emitted whenever any filter value changes (text filters debounced 300ms).
   * The value is a map of `{ [filterKey]: currentValue }`.
   */
  filtersChange = output<FilterValues>();

  /** Internal state: signal map of key → current value (immediate, for UI binding) */
  private readonly _values = signal<FilterValues>({});

  /**
   * Tracks the most recent text input change as a {key, value} pair.
   * Sprint-022: replaces manual `Map<string, setTimeout>` with signal-based debounce.
   * Debounced via `debouncedSignal` — only emits after 300 ms of inactivity.
   */
  private readonly _lastTextChange = signal<{ key: string; value: string } | null>(null);
  private readonly _debouncedTextChange = debouncedSignal(this._lastTextChange, 300);

  constructor() {
    // Apply the debounced text change to values and emit once stable
    effect(() => {
      const change = this._debouncedTextChange();
      if (change === null) return;
      this._values.update(prev => ({ ...prev, [change.key]: change.value }));
      this.filtersChange.emit({ ...this._values() });
    });
  }

  ngOnInit(): void {
    // Initialise default values from filter configs
    const initial: FilterValues = {};
    for (const f of this.filters()) {
      if (f.type === 'date-range') {
        initial[f.key] = { start: null, end: null };
      } else if (f.type === 'tags') {
        initial[f.key] = [];
      } else {
        initial[f.key] = '';
      }
    }
    this._values.set(initial);
  }

  /** True if at least one filter has a non-empty value */
  readonly hasActiveFilters = computed(() => {
    const vals = this._values();
    return Object.entries(vals).some(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return (v as FilterDateRange).start || (v as FilterDateRange).end;
      return !!v;
    });
  });

  // ── Helpers for template type narrowing ──────────────────────────────────

  asSelect(f: FilterConfig): SelectFilterConfig {
    return f as SelectFilterConfig;
  }

  asTags(f: FilterConfig): TagsFilterConfig {
    return f as TagsFilterConfig;
  }

  getTextValue(key: string): string {
    return (this._values()[key] as string) ?? '';
  }

  getDateRange(key: string): FilterDateRange {
    return (this._values()[key] as FilterDateRange) ?? { start: null, end: null };
  }

  getTagsValue(key: string): string[] {
    return (this._values()[key] as string[]) ?? [];
  }

  isTagsFull(key: string, maxTags?: number): boolean {
    if (!maxTags) return false;
    return this.getTagsValue(key).length >= maxTags;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  onTextInput(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    // Update the raw values signal immediately for UI responsiveness (cursor position, etc.)
    this._values.update(prev => ({ ...prev, [key]: value }));
    // Signal the latest text change — debouncedTextChange will emit after 300 ms of inactivity
    this._lastTextChange.set({ key, value });
  }

  onSelectChange(key: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this._updateValue(key, value);
  }

  onDateChange(key: string, part: 'start' | 'end', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.getDateRange(key);
    this._updateValue(key, { ...current, [part]: value || null });
  }

  onTagEnter(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const tag = input.value.trim();
    if (!tag) return;
    const current = this.getTagsValue(key);
    if (!current.includes(tag)) {
      this._updateValue(key, [...current, tag]);
    }
    input.value = '';
    event.preventDefault();
  }

  onTagBackspace(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value !== '') return; // only remove last tag when input is empty
    const current = this.getTagsValue(key);
    if (current.length > 0) {
      this._updateValue(key, current.slice(0, -1));
    }
  }

  removeTag(key: string, tag: string): void {
    const current = this.getTagsValue(key);
    this._updateValue(key, current.filter(t => t !== tag));
  }

  clearField(key: string): void {
    const filter = this.filters().find(f => f.key === key);
    if (!filter) return;
    if (filter.type === 'date-range') {
      this._updateValue(key, { start: null, end: null });
    } else if (filter.type === 'tags') {
      this._updateValue(key, []);
    } else {
      this._updateValue(key, '');
    }
  }

  clearAll(): void {
    const reset: FilterValues = {};
    for (const f of this.filters()) {
      if (f.type === 'date-range') {
        reset[f.key] = { start: null, end: null };
      } else if (f.type === 'tags') {
        reset[f.key] = [];
      } else {
        reset[f.key] = '';
      }
    }
    this._values.set(reset);
    this.filtersChange.emit(reset);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _updateValue(key: string, value: string | string[] | FilterDateRange): void {
    this._values.update(prev => ({ ...prev, [key]: value }));
    this.filtersChange.emit({ ...this._values() });
  }
}
