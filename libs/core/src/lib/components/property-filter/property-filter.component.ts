import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyType } from '../property-card/property-card.component';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Filter state emitted whenever the user changes any filter control.
 */
export interface PropertyFilterState {
  /** Selected property type(s), empty means "all" */
  types: PropertyType[];
  /** Min price (EUR/month), null means no min */
  priceMin: number | null;
  /** Max price (EUR/month), null means no max */
  priceMax: number | null;
  /** Min bedrooms, null means any */
  bedroomsMin: number | null;
  /** Min area in m², null means any */
  areaMin: number | null;
  /** Max area in m², null means any */
  areaMax: number | null;
  /** Only show available properties */
  availableOnly: boolean;
  /** Only show verified properties */
  verifiedOnly: boolean;
}

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'apartment', label: 'Apartamento', icon: 'apartment' },
  { value: 'house',     label: 'Casa / Moradia', icon: 'house' },
  { value: 'studio',    label: 'Estúdio', icon: 'meeting_room' },
  { value: 'room',      label: 'Quarto', icon: 'bed' },
  { value: 'villa',     label: 'Vila / Luxo', icon: 'villa' },
  { value: 'penthouse', label: 'Penthouse', icon: 'roofing' },
];

const BEDROOM_OPTIONS = [
  { value: 0, label: 'T0' },
  { value: 1, label: 'T1' },
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
  { value: 4, label: 'T4+' },
];

const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Todos', min: null, max: null },
  { label: 'Até €800', min: null, max: 800 },
  { label: '€800 – €1.500', min: 800, max: 1500 },
  { label: '€1.500 – €3.000', min: 1500, max: 3000 },
  { label: '€3.000+', min: 3000, max: null },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PropertyFilter — M3 sidebar filter panel for LisboaRent listings.
 *
 * Signal-driven filter controls: type chips, bedroom selector, price range
 * presets, area range, and availability toggles. Emits `filterChange` on
 * every update and `filterReset` when the user clears all filters.
 *
 * Feature flag: `PROPERTY_FILTER_SIDEBAR`
 *
 * @example
 * ```html
 * <iu-property-filter
 *   [resultCount]="properties().length"
 *   (filterChange)="onFilter($event)"
 *   (filterReset)="onReset()"
 * />
 * ```
 */
@Component({
  selector: 'iu-property-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="iu-pf" [class.iu-pf--compact]="compact()">

      <!-- Header -->
      <div class="iu-pf__header">
        <span class="material-symbols-outlined iu-pf__header-icon">tune</span>
        <h2 class="iu-pf__title">Filtros</h2>
        @if (hasActiveFilters()) {
          <button class="iu-pf__clear-btn" (click)="clearAll()" aria-label="Limpar filtros">
            <span class="material-symbols-outlined">filter_list_off</span>
            Limpar
          </button>
        }
      </div>

      <!-- Result count -->
      @if (resultCount() !== null) {
        <p class="iu-pf__count">
          <strong>{{ resultCount() }}</strong> imóve{{ resultCount() === 1 ? 'l' : 'is' }}
        </p>
      }

      <!-- Divider -->
      <div class="iu-pf__divider"></div>

      <!-- ── Tipo de imóvel ── -->
      <section class="iu-pf__section">
        <h3 class="iu-pf__section-title">Tipo de imóvel</h3>
        <div class="iu-pf__type-grid">
          @for (t of propertyTypes; track t.value) {
            <button
              class="iu-pf__type-chip"
              [class.iu-pf__type-chip--active]="selectedTypes().includes(t.value)"
              (click)="toggleType(t.value)"
              [attr.aria-pressed]="selectedTypes().includes(t.value)"
              [attr.aria-label]="t.label"
            >
              <span class="material-symbols-outlined">{{ t.icon }}</span>
              <span>{{ t.label }}</span>
            </button>
          }
        </div>
      </section>

      <div class="iu-pf__divider"></div>

      <!-- ── Faixa de preço ── -->
      <section class="iu-pf__section">
        <h3 class="iu-pf__section-title">Preço / mês</h3>
        <div class="iu-pf__price-presets">
          @for (p of pricePresets; track p.label) {
            <button
              class="iu-pf__preset"
              [class.iu-pf__preset--active]="isPricePresetActive(p)"
              (click)="applyPricePreset(p)"
            >{{ p.label }}</button>
          }
        </div>

        <!-- Custom range inputs -->
        <div class="iu-pf__range-row">
          <div class="iu-pf__range-field">
            <label class="iu-pf__range-label">Mín (€)</label>
            <input
              class="iu-pf__range-input"
              type="number"
              min="0"
              step="50"
              placeholder="—"
              [value]="priceMin() ?? ''"
              (change)="onPriceMinChange($event)"
              aria-label="Preço mínimo"
            />
          </div>
          <span class="iu-pf__range-sep">–</span>
          <div class="iu-pf__range-field">
            <label class="iu-pf__range-label">Máx (€)</label>
            <input
              class="iu-pf__range-input"
              type="number"
              min="0"
              step="50"
              placeholder="—"
              [value]="priceMax() ?? ''"
              (change)="onPriceMaxChange($event)"
              aria-label="Preço máximo"
            />
          </div>
        </div>
      </section>

      <div class="iu-pf__divider"></div>

      <!-- ── Quartos ── -->
      <section class="iu-pf__section">
        <h3 class="iu-pf__section-title">Quartos (mínimo)</h3>
        <div class="iu-pf__bedroom-row">
          <button
            class="iu-pf__bedroom-btn"
            [class.iu-pf__bedroom-btn--active]="bedroomsMin() === null"
            (click)="setBedroomsMin(null)"
            aria-label="Qualquer número de quartos"
          >Todos</button>
          @for (opt of bedroomOptions; track opt.value) {
            <button
              class="iu-pf__bedroom-btn"
              [class.iu-pf__bedroom-btn--active]="bedroomsMin() === opt.value"
              (click)="setBedroomsMin(opt.value)"
              [attr.aria-label]="opt.label + ' ou mais'"
            >{{ opt.label }}</button>
          }
        </div>
      </section>

      <div class="iu-pf__divider"></div>

      <!-- ── Área ── -->
      <section class="iu-pf__section">
        <h3 class="iu-pf__section-title">Área (m²)</h3>
        <div class="iu-pf__range-row">
          <div class="iu-pf__range-field">
            <label class="iu-pf__range-label">Mín</label>
            <input
              class="iu-pf__range-input"
              type="number"
              min="0"
              step="10"
              placeholder="—"
              [value]="areaMin() ?? ''"
              (change)="onAreaMinChange($event)"
              aria-label="Área mínima em m²"
            />
          </div>
          <span class="iu-pf__range-sep">–</span>
          <div class="iu-pf__range-field">
            <label class="iu-pf__range-label">Máx</label>
            <input
              class="iu-pf__range-input"
              type="number"
              min="0"
              step="10"
              placeholder="—"
              [value]="areaMax() ?? ''"
              (change)="onAreaMaxChange($event)"
              aria-label="Área máxima em m²"
            />
          </div>
        </div>
      </section>

      <div class="iu-pf__divider"></div>

      <!-- ── Toggles ── -->
      <section class="iu-pf__section">
        <h3 class="iu-pf__section-title">Mais opções</h3>

        <label class="iu-pf__toggle">
          <input
            class="iu-pf__toggle-input"
            type="checkbox"
            [checked]="availableOnly()"
            (change)="onAvailableToggle($event)"
            aria-label="Apenas disponíveis"
          />
          <span class="iu-pf__toggle-track">
            <span class="iu-pf__toggle-thumb"></span>
          </span>
          <span class="iu-pf__toggle-label">
            <span class="material-symbols-outlined">event_available</span>
            Apenas disponíveis
          </span>
        </label>

        <label class="iu-pf__toggle">
          <input
            class="iu-pf__toggle-input"
            type="checkbox"
            [checked]="verifiedOnly()"
            (change)="onVerifiedToggle($event)"
            aria-label="Apenas verificados"
          />
          <span class="iu-pf__toggle-track">
            <span class="iu-pf__toggle-thumb"></span>
          </span>
          <span class="iu-pf__toggle-label">
            <span class="material-symbols-outlined">verified</span>
            Apenas verificados
          </span>
        </label>
      </section>

      <!-- Active filter summary chips -->
      @if (hasActiveFilters()) {
        <div class="iu-pf__active-summary">
          @for (chip of activeFilterChips(); track chip.key) {
            <span class="iu-pf__active-chip">
              {{ chip.label }}
              <button class="iu-pf__active-chip-remove" (click)="removeFilter(chip.key)" [attr.aria-label]="'Remover filtro ' + chip.label">
                <span class="material-symbols-outlined">close</span>
              </button>
            </span>
          }
        </div>
      }
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .iu-pf {
      background: var(--md-sys-color-surface-container-low, #f5f5f5);
      border-radius: 16px;
      padding: 20px;
      min-width: 260px;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .iu-pf--compact { padding: 12px; min-width: 220px; }

    /* ── Header ── */
    .iu-pf__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .iu-pf__header-icon { font-size: 20px; color: var(--md-sys-color-primary, #6750a4); }
    .iu-pf__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      flex: 1;
    }
    .iu-pf__clear-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--md-sys-color-error, #b3261e);
      font-size: 12px;
      font-weight: 500;
      padding: 4px 6px;
      border-radius: 8px;
      transition: background 120ms;
    }
    .iu-pf__clear-btn:hover { background: var(--md-sys-color-error-container, #f9dedc); }
    .iu-pf__clear-btn .material-symbols-outlined { font-size: 16px; }

    .iu-pf__count {
      margin: 0 0 10px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .iu-pf__count strong {
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 700;
    }

    .iu-pf__divider {
      height: 1px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
      margin: 12px 0;
    }

    /* ── Sections ── */
    .iu-pf__section { display: flex; flex-direction: column; gap: 10px; }
    .iu-pf__section-title {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .5px;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Type chips ── */
    .iu-pf__type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .iu-pf__type-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1.5px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fffbfe);
      cursor: pointer;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 120ms;
      text-align: left;
    }
    .iu-pf__type-chip:hover {
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .iu-pf__type-chip--active {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-weight: 600;
    }
    .iu-pf__type-chip .material-symbols-outlined { font-size: 16px; flex-shrink: 0; }

    /* ── Price presets ── */
    .iu-pf__price-presets { display: flex; flex-direction: column; gap: 4px; }
    .iu-pf__preset {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: none;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 120ms;
    }
    .iu-pf__preset:hover {
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .iu-pf__preset--active {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      font-weight: 600;
      border-color: var(--md-sys-color-secondary, #625b71);
    }

    /* ── Range row ── */
    .iu-pf__range-row {
      display: flex;
      align-items: flex-end;
      gap: 6px;
    }
    .iu-pf__range-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .iu-pf__range-label { font-size: 11px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-pf__range-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1.5px solid var(--md-sys-color-outline, #79747e);
      background: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-size: 13px;
      box-sizing: border-box;
      transition: border-color 120ms;
      -moz-appearance: textfield;
    }
    .iu-pf__range-input::-webkit-outer-spin-button,
    .iu-pf__range-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .iu-pf__range-input:focus {
      outline: none;
      border-color: var(--md-sys-color-primary, #6750a4);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container, #eaddff);
    }
    .iu-pf__range-sep { color: var(--md-sys-color-on-surface-variant, #49454f); padding-bottom: 8px; }

    /* ── Bedrooms ── */
    .iu-pf__bedroom-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .iu-pf__bedroom-btn {
      padding: 6px 12px;
      border-radius: 100px;
      border: 1.5px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 120ms;
    }
    .iu-pf__bedroom-btn:hover {
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-pf__bedroom-btn--active {
      background: var(--md-sys-color-primary, #6750a4);
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }

    /* ── Toggle ── */
    .iu-pf__toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 4px 0;
    }
    .iu-pf__toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
    .iu-pf__toggle-track {
      width: 36px;
      height: 20px;
      border-radius: 100px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border: 2px solid var(--md-sys-color-outline, #79747e);
      position: relative;
      flex-shrink: 0;
      transition: background 200ms, border-color 200ms;
    }
    .iu-pf__toggle-input:checked + .iu-pf__toggle-track {
      background: var(--md-sys-color-primary, #6750a4);
      border-color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-pf__toggle-thumb {
      position: absolute;
      top: 50%;
      left: 2px;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--md-sys-color-outline, #79747e);
      transition: left 200ms, background 200ms, width 200ms;
    }
    .iu-pf__toggle-input:checked ~ .iu-pf__toggle-track .iu-pf__toggle-thumb {
      left: calc(100% - 14px);
      background: var(--md-sys-color-on-primary, #fff);
    }
    .iu-pf__toggle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      user-select: none;
    }
    .iu-pf__toggle-label .material-symbols-outlined { font-size: 16px; color: var(--md-sys-color-secondary, #625b71); }

    /* ── Active filter chips ── */
    .iu-pf__active-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .iu-pf__active-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px 4px 10px;
      border-radius: 100px;
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      font-size: 11px;
      font-weight: 500;
    }
    .iu-pf__active-chip-remove {
      display: flex;
      align-items: center;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      color: var(--md-sys-color-on-tertiary-container, #31111d);
      opacity: 0.7;
      transition: opacity 120ms;
    }
    .iu-pf__active-chip-remove:hover { opacity: 1; }
    .iu-pf__active-chip-remove .material-symbols-outlined { font-size: 14px; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFilterComponent {

  // ─── Inputs ───────────────────────────────────────────────────────────────

  /**
   * Number of matching results to display below the header.
   * Pass null to hide the count.
   */
  readonly resultCount = input<number | null>(null);

  /** Compact mode — reduced padding for narrow sidebars */
  readonly compact = input<boolean>(false);

  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** Emits the current filter state whenever any control changes */
  readonly filterChange = output<PropertyFilterState>();

  /** Emits when the user clears all filters */
  readonly filterReset = output<void>();

  // ─── Internal state ───────────────────────────────────────────────────────

  readonly selectedTypes = signal<PropertyType[]>([]);
  readonly priceMin = signal<number | null>(null);
  readonly priceMax = signal<number | null>(null);
  readonly bedroomsMin = signal<number | null>(null);
  readonly areaMin = signal<number | null>(null);
  readonly areaMax = signal<number | null>(null);
  readonly availableOnly = signal<boolean>(false);
  readonly verifiedOnly = signal<boolean>(false);

  // ─── Reference data ───────────────────────────────────────────────────────

  readonly propertyTypes = PROPERTY_TYPES;
  readonly pricePresets = PRICE_PRESETS;
  readonly bedroomOptions = BEDROOM_OPTIONS;

  // ─── Derived ──────────────────────────────────────────────────────────────

  readonly hasActiveFilters = computed(() =>
    this.selectedTypes().length > 0 ||
    this.priceMin() !== null ||
    this.priceMax() !== null ||
    this.bedroomsMin() !== null ||
    this.areaMin() !== null ||
    this.areaMax() !== null ||
    this.availableOnly() ||
    this.verifiedOnly()
  );

  readonly activeFilterChips = computed(() => {
    const chips: { key: string; label: string }[] = [];
    if (this.selectedTypes().length > 0) {
      chips.push({ key: 'types', label: `Tipo: ${this.selectedTypes().map(t => PROPERTY_TYPES.find(p => p.value === t)?.label ?? t).join(', ')}` });
    }
    if (this.priceMin() !== null || this.priceMax() !== null) {
      const min = this.priceMin() ? `€${this.priceMin()}` : '';
      const max = this.priceMax() ? `€${this.priceMax()}` : '';
      chips.push({ key: 'price', label: `Preço: ${min || '0'} – ${max || '∞'}` });
    }
    if (this.bedroomsMin() !== null) {
      chips.push({ key: 'bedrooms', label: `Quartos: T${this.bedroomsMin()}+` });
    }
    if (this.areaMin() !== null || this.areaMax() !== null) {
      chips.push({ key: 'area', label: `Área: ${this.areaMin() ?? 0}–${this.areaMax() ?? '∞'} m²` });
    }
    if (this.availableOnly()) chips.push({ key: 'available', label: 'Disponíveis' });
    if (this.verifiedOnly()) chips.push({ key: 'verified', label: 'Verificados' });
    return chips;
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  toggleType(type: PropertyType): void {
    const current = this.selectedTypes();
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    this.selectedTypes.set(next);
    this.emit();
  }

  applyPricePreset(preset: typeof PRICE_PRESETS[number]): void {
    this.priceMin.set(preset.min);
    this.priceMax.set(preset.max);
    this.emit();
  }

  isPricePresetActive(preset: typeof PRICE_PRESETS[number]): boolean {
    return this.priceMin() === preset.min && this.priceMax() === preset.max;
  }

  onPriceMinChange(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.priceMin.set(v === '' ? null : Number(v));
    this.emit();
  }

  onPriceMaxChange(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.priceMax.set(v === '' ? null : Number(v));
    this.emit();
  }

  setBedroomsMin(n: number | null): void {
    this.bedroomsMin.set(n);
    this.emit();
  }

  onAreaMinChange(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.areaMin.set(v === '' ? null : Number(v));
    this.emit();
  }

  onAreaMaxChange(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.areaMax.set(v === '' ? null : Number(v));
    this.emit();
  }

  onAvailableToggle(event: Event): void {
    this.availableOnly.set((event.target as HTMLInputElement).checked);
    this.emit();
  }

  onVerifiedToggle(event: Event): void {
    this.verifiedOnly.set((event.target as HTMLInputElement).checked);
    this.emit();
  }

  removeFilter(key: string): void {
    if (key === 'types') this.selectedTypes.set([]);
    if (key === 'price') { this.priceMin.set(null); this.priceMax.set(null); }
    if (key === 'bedrooms') this.bedroomsMin.set(null);
    if (key === 'area') { this.areaMin.set(null); this.areaMax.set(null); }
    if (key === 'available') this.availableOnly.set(false);
    if (key === 'verified') this.verifiedOnly.set(false);
    this.emit();
  }

  clearAll(): void {
    this.selectedTypes.set([]);
    this.priceMin.set(null);
    this.priceMax.set(null);
    this.bedroomsMin.set(null);
    this.areaMin.set(null);
    this.areaMax.set(null);
    this.availableOnly.set(false);
    this.verifiedOnly.set(false);
    this.filterReset.emit();
    this.emit();
  }

  /** Returns the current filter state */
  getState(): PropertyFilterState {
    return {
      types: this.selectedTypes(),
      priceMin: this.priceMin(),
      priceMax: this.priceMax(),
      bedroomsMin: this.bedroomsMin(),
      areaMin: this.areaMin(),
      areaMax: this.areaMax(),
      availableOnly: this.availableOnly(),
      verifiedOnly: this.verifiedOnly(),
    };
  }

  private emit(): void {
    this.filterChange.emit(this.getState());
  }
}
