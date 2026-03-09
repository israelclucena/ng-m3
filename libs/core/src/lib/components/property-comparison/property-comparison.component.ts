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
import type { PropertyData } from '../property-card/property-card.component';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single row in the comparison table */
interface ComparisonRow {
  label: string;
  icon: string;
  getValue: (p: PropertyData) => string;
  highlight?: 'min' | 'max';
}

// ─── Row definitions ──────────────────────────────────────────────────────────

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Preço / mês',
    icon: '💶',
    getValue: p => `€${p.priceMonthly.toLocaleString('pt-PT')}`,
    highlight: 'min',
  },
  {
    label: 'Área',
    icon: '📐',
    getValue: p => `${p.areaSqm} m²`,
    highlight: 'max',
  },
  {
    label: 'Quartos',
    icon: '🛏️',
    getValue: p => p.bedrooms === 0 ? 'Estúdio' : `T${p.bedrooms}`,
    highlight: 'max',
  },
  {
    label: 'Casas de banho',
    icon: '🚿',
    getValue: p => `${p.bathrooms}`,
    highlight: 'max',
  },
  {
    label: 'Tipo',
    icon: '🏠',
    getValue: p => p.type.charAt(0).toUpperCase() + p.type.slice(1),
  },
  {
    label: 'Disponível',
    icon: '📅',
    getValue: p => p.availableFrom ?? '—',
  },
  {
    label: 'Preço / m²',
    icon: '📊',
    getValue: p => `€${Math.round(p.priceMonthly / p.areaSqm)}/m²`,
    highlight: 'min',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PropertyComparison — Side-by-side property comparison table.
 *
 * Accepts 2 or 3 `PropertyData` items and renders a comparison grid
 * using M3 design tokens. Best values are highlighted in primary colour.
 *
 * Feature flag: `PROPERTY_COMPARISON`
 *
 * @example
 * ```html
 * <iu-property-comparison [properties]="favourites()" />
 * ```
 */
@Component({
  selector: 'iu-property-comparison',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .iu-comparison {
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      background: var(--md-sys-color-surface, #FFFBFE);
      border-radius: var(--md-sys-shape-corner-large, 16px);
      border: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
      overflow: hidden;
    }

    /* ── Header ── */
    .iu-comparison__header {
      display: grid;
      background: var(--md-sys-color-surface-variant, #E7E0EC);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }

    .iu-comparison__header-cell {
      padding: 16px 12px 12px;
      text-align: center;
      position: relative;
    }

    .iu-comparison__header-cell:not(:last-child) {
      border-right: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }

    .iu-comparison__col-label {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      margin-bottom: 4px;
    }

    .iu-comparison__img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 8px;
      background: var(--md-sys-color-surface-container, #F3EDF7);
      display: block;
    }

    .iu-comparison__img-placeholder {
      width: 100%;
      height: 120px;
      border-radius: 8px;
      background: var(--md-sys-color-surface-container, #F3EDF7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin-bottom: 8px;
    }

    .iu-comparison__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1C1B1F);
      margin: 0 0 4px;
      line-height: 1.3;
    }

    .iu-comparison__location {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
    }

    .iu-comparison__remove-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      font-size: 16px;
      padding: 4px;
      border-radius: 50%;
      line-height: 1;
      transition: background 150ms;
    }
    .iu-comparison__remove-btn:hover {
      background: var(--md-sys-color-surface-container-highest, #E6E0E9);
    }

    /* ── Body rows ── */
    .iu-comparison__body { }

    .iu-comparison__row {
      display: grid;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }
    .iu-comparison__row:last-child { border-bottom: none; }
    .iu-comparison__row:nth-child(even) {
      background: var(--md-sys-color-surface-container-lowest, #FFFBFE);
    }

    .iu-comparison__row-label {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      border-right: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }

    .iu-comparison__cell {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--md-sys-color-on-surface, #1C1B1F);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .iu-comparison__cell:not(:last-child) {
      border-right: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }

    .iu-comparison__cell--best {
      background: var(--md-sys-color-primary-container, #EADDFF);
      color: var(--md-sys-color-on-primary-container, #21005D);
      font-weight: 700;
    }

    /* ── Empty state ── */
    .iu-comparison__empty {
      padding: 48px 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454F);
    }

    .iu-comparison__empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
  `],
  template: `
    <div class="iu-comparison">
      @if (properties().length < 2) {
        <!-- Empty / insufficient state -->
        <div class="iu-comparison__empty">
          <span class="iu-comparison__empty-icon">🔍</span>
          <p>Adicione pelo menos 2 imóveis aos favoritos para comparar.</p>
        </div>
      } @else {
        <!-- Header row with property cards -->
        <div class="iu-comparison__header" [style.grid-template-columns]="gridColumns()">
          <!-- Label col -->
          <div class="iu-comparison__header-cell" style="background: var(--md-sys-color-surface-container, #F3EDF7)">
            <span class="iu-comparison__col-label">Comparação</span>
          </div>

          @for (p of properties(); track p.id) {
            <div class="iu-comparison__header-cell">
              @if (showRemove()) {
                <button
                  class="iu-comparison__remove-btn"
                  (click)="removeProperty.emit(p.id)"
                  [attr.aria-label]="'Remover ' + p.title"
                  title="Remover da comparação"
                >✕</button>
              }
              @if (p.imageUrl) {
                <img class="iu-comparison__img" [src]="p.imageUrl" [alt]="p.title" loading="lazy" />
              } @else {
                <div class="iu-comparison__img-placeholder">{{ typeEmoji(p.type) }}</div>
              }
              <div class="iu-comparison__title">{{ p.title }}</div>
              <div class="iu-comparison__location">📍 {{ p.location }}</div>
            </div>
          }
        </div>

        <!-- Body: comparison rows -->
        <div class="iu-comparison__body">
          @for (row of rows; track row.label) {
            <div class="iu-comparison__row" [style.grid-template-columns]="gridColumns()">
              <!-- Row label -->
              <div class="iu-comparison__row-label">
                <span>{{ row.icon }}</span>
                <span>{{ row.label }}</span>
              </div>

              <!-- Value cells -->
              @for (p of properties(); track p.id) {
                <div
                  class="iu-comparison__cell"
                  [class.iu-comparison__cell--best]="isBestValue(row, p)"
                >
                  {{ row.getValue(p) }}
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PropertyComparisonComponent {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /**
   * Properties to compare. Accepts 2 or 3 items.
   * Pass the result of `FavouritesService.favouriteProperties()`.
   */
  readonly properties = input<PropertyData[]>([]);

  /**
   * Whether to show a remove button on each column header.
   * Emits `removeProperty` with the property id.
   */
  readonly showRemove = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when the user clicks the remove button on a column */
  readonly removeProperty = output<string | number>();

  // ── Internal ─────────────────────────────────────────────────────────────────

  /** Comparison row definitions */
  protected readonly rows = COMPARISON_ROWS;

  /** CSS grid template based on number of properties */
  protected readonly gridColumns = computed(() => {
    const count = this.properties().length;
    // label col (180px) + N equal property columns
    return `180px repeat(${count}, 1fr)`;
  });

  /**
   * Returns true if the given property has the best (highlight) value
   * for this row metric.
   */
  protected isBestValue(row: ComparisonRow, p: PropertyData): boolean {
    if (!row.highlight) return false;
    const props = this.properties();
    if (props.length < 2) return false;

    // Extract numeric value from formatted string isn't reliable — use raw fields
    const nums = props.map(pr => this._numericValue(row, pr));
    const thisVal = this._numericValue(row, p);

    if (row.highlight === 'min') return thisVal === Math.min(...nums);
    if (row.highlight === 'max') return thisVal === Math.max(...nums);
    return false;
  }

  private _numericValue(row: ComparisonRow, p: PropertyData): number {
    switch (row.label) {
      case 'Preço / mês': return p.priceMonthly;
      case 'Área': return p.areaSqm;
      case 'Quartos': return p.bedrooms;
      case 'Casas de banho': return p.bathrooms;
      case 'Preço / m²': return Math.round(p.priceMonthly / p.areaSqm);
      default: return 0;
    }
  }

  /** Returns an emoji for the property type (image placeholder) */
  protected typeEmoji(type: PropertyData['type']): string {
    const map: Record<string, string> = {
      apartment: '🏢', house: '🏠', studio: '🛋️',
      room: '🚪', villa: '🏡', penthouse: '🌆',
    };
    return map[type] ?? '🏠';
  }
}
