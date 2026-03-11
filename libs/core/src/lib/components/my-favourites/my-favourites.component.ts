import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyData } from '../property-card/property-card.component';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-my-favourites` — saved properties gallery for a logged-in user.
 *
 * Displays favourited properties in a responsive grid with remove and
 * view-detail actions. Shows an empty state when the list is empty.
 *
 * Feature flag: `MY_FAVOURITES`
 *
 * @example
 * ```html
 * <iu-my-favourites
 *   [properties]="savedProperties()"
 *   (remove)="favourites.remove($event.id)"
 *   (viewDetail)="openDetail($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-my-favourites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-my-favourites">

      <!-- ── Header ── -->
      <div class="fav-header">
        <div class="header-left">
          <span class="material-symbols-outlined header-icon">favorite</span>
          <div>
            <h2 class="header-title">Os Meus Favoritos</h2>
            <p class="header-sub">{{ properties().length }} imóvel{{ properties().length === 1 ? '' : 'is' }} guardado{{ properties().length === 1 ? '' : 's' }}</p>
          </div>
        </div>

        <!-- Sort control -->
        @if (properties().length > 1) {
          <div class="sort-wrap">
            <label class="sort-label" for="fav-sort">Ordenar por</label>
            <select id="fav-sort" class="sort-select" (change)="onSortChange($event)">
              <option value="default">Data de adição</option>
              <option value="price-asc">Preço: menor → maior</option>
              <option value="price-desc">Preço: maior → menor</option>
              <option value="area">Área (m²)</option>
            </select>
          </div>
        }
      </div>

      <!-- ── Grid or Empty ── -->
      @if (sorted().length === 0) {
        <div class="fav-empty">
          <span class="material-symbols-outlined empty-icon">favorite_border</span>
          <p class="empty-title">Nenhum favorito ainda</p>
          <p class="empty-sub">Guarda imóveis que te interessam clicando no ❤️ nos cards.</p>
        </div>
      } @else {
        <div class="fav-grid">
          @for (prop of sorted(); track prop.id) {
            <div class="fav-item">

              <!-- Image -->
              <div class="fav-img-wrap">
                @if (prop.imageUrl) {
                  <img class="fav-img" [src]="prop.imageUrl" [alt]="prop.title" loading="lazy" />
                } @else {
                  <div class="fav-img-placeholder">
                    <span class="material-symbols-outlined">apartment</span>
                  </div>
                }

                <!-- Type badge -->
                <span class="type-badge">{{ typeLabel(prop.type) }}</span>

                <!-- Remove button -->
                <button
                  class="remove-btn"
                  (click)="remove.emit(prop)"
                  aria-label="Remover dos favoritos"
                  title="Remover dos favoritos"
                >
                  <span class="material-symbols-outlined">favorite</span>
                </button>
              </div>

              <!-- Details -->
              <div class="fav-details">
                <p class="fav-title">{{ prop.title }}</p>
                <p class="fav-location">
                  <span class="material-symbols-outlined">location_on</span>
                  {{ prop.location }}
                </p>

                <div class="fav-meta">
                  <span class="meta-item">
                    <span class="material-symbols-outlined">bed</span>
                    {{ prop.bedrooms === 0 ? 'Studio' : prop.bedrooms + ' Qto' }}
                  </span>
                  <span class="meta-item">
                    <span class="material-symbols-outlined">straighten</span>
                    {{ prop.areaSqm }} m²
                  </span>
                </div>

                <div class="fav-footer">
                  <span class="fav-price">€{{ prop.priceMonthly | number:'1.0-0' }}<span class="price-unit">/mês</span></span>
                  <button class="view-btn" (click)="viewDetail.emit(prop)">
                    <span class="material-symbols-outlined">open_in_new</span>
                    Ver
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .iu-my-favourites {
      font-family: 'Roboto', sans-serif;
    }

    /* ── Header ── */
    .fav-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 32px;
      color: var(--md-sys-color-error, #b3261e);
    }

    .header-title {
      margin: 0 0 2px;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .header-sub {
      margin: 0;
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Sort */
    .sort-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sort-label {
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      white-space: nowrap;
    }

    .sort-select {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font-size: 0.875rem;
      cursor: pointer;
    }

    /* ── Empty state ── */
    .fav-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 56px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.3;
    }

    .empty-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .empty-sub {
      margin: 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      max-width: 320px;
    }

    /* ── Grid ── */
    .fav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    /* ── Item card ── */
    .fav-item {
      background: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 20px;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .fav-item:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,.12);
      transform: translateY(-2px);
    }

    /* Image */
    .fav-img-wrap {
      position: relative;
      height: 160px;
      background: var(--md-sys-color-surface-container, #ece6f0);
    }

    .fav-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .fav-img-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fav-img-placeholder .material-symbols-outlined {
      font-size: 40px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.3;
    }

    .type-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 3px 10px;
      border-radius: 100px;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,.9);
      color: var(--md-sys-color-error, #b3261e);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.15s;
    }

    .remove-btn:hover {
      background: var(--md-sys-color-error-container, #f9dedc);
      transform: scale(1.1);
    }

    .remove-btn .material-symbols-outlined { font-size: 20px; }

    /* Details */
    .fav-details {
      padding: 14px 16px 16px;
    }

    .fav-title {
      margin: 0 0 4px;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fav-location {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0 0 10px;
      font-size: 0.78rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .fav-location .material-symbols-outlined { font-size: 13px; }

    .fav-meta {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .meta-item .material-symbols-outlined { font-size: 14px; }

    .fav-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .fav-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .price-unit {
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .view-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 100px;
      border: 1px solid var(--md-sys-color-primary, #6750a4);
      background: transparent;
      color: var(--md-sys-color-primary, #6750a4);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .view-btn:hover {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }

    .view-btn .material-symbols-outlined { font-size: 15px; }
  `],
})
export class MyFavouritesComponent {
  /** Properties to display. Wire up with FavouritesService ids → PropertyData. */
  readonly properties = input<PropertyData[]>([]);

  /** Emits the property to remove from favourites. */
  readonly remove = output<PropertyData>();

  /** Emits when user clicks "Ver" to open a property detail. */
  readonly viewDetail = output<PropertyData>();

  readonly sortKey = signal<'default' | 'price-asc' | 'price-desc' | 'area'>('default');

  readonly sorted = computed(() => {
    const list = [...this.properties()];
    const key = this.sortKey();
    if (key === 'price-asc') list.sort((a, b) => a.priceMonthly - b.priceMonthly);
    if (key === 'price-desc') list.sort((a, b) => b.priceMonthly - a.priceMonthly);
    if (key === 'area') list.sort((a, b) => b.areaSqm - a.areaSqm);
    return list;
  });

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'default' | 'price-asc' | 'price-desc' | 'area';
    this.sortKey.set(val);
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      apartment: 'Apartamento',
      studio: 'Estúdio',
      house: 'Moradia',
      penthouse: 'Penthouse',
      villa: 'Villa',
    };
    return map[type] ?? type;
  }
}
