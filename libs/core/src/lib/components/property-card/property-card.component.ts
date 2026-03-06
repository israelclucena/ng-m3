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

// ─── Types ────────────────────────────────────────────────────────────────────

export type PropertyType = 'apartment' | 'house' | 'studio' | 'room' | 'villa' | 'penthouse';
export type PropertyBadge = 'new' | 'featured' | 'available' | 'rented' | 'verified';

/**
 * Property data model for LisboaRent listings.
 */
export interface PropertyData {
  /** Unique identifier */
  id: string | number;
  /** Property title / headline */
  title: string;
  /** Neighbourhood / district (e.g. "Príncipe Real, Lisboa") */
  location: string;
  /** Monthly rent in EUR */
  priceMonthly: number;
  /** Number of bedrooms (0 = studio) */
  bedrooms: number;
  /** Number of bathrooms */
  bathrooms: number;
  /** Area in m² */
  areaSqm: number;
  /** Property type label */
  type: PropertyType;
  /** Hero image URL */
  imageUrl?: string;
  /** Optional badges to display */
  badges?: PropertyBadge[];
  /** Whether the property is saved/favourited */
  isFavourited?: boolean;
  /** Available from date string (ISO or display) */
  availableFrom?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PropertyCard — M3 card for LisboaRent property listings.
 *
 * Displays hero image, title, location, price, key specs (beds/baths/area),
 * badges, and a favourite toggle. Emits `cardClick` and `favouriteToggle`.
 *
 * Feature flag: `PROPERTY_LISTING`
 *
 * @example
 * ```html
 * <iu-property-card [property]="prop" (cardClick)="open($event)" />
 * ```
 */
@Component({
  selector: 'iu-property-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="iu-property-card"
      [class.iu-property-card--featured]="isFeatured()"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      tabindex="0"
      role="article"
      [attr.aria-label]="property().title + ', ' + formattedPrice()"
    >
      <!-- Hero image -->
      <div class="iu-property-card__image-wrap">
        @if (property().imageUrl) {
          <img
            class="iu-property-card__image"
            [src]="property().imageUrl"
            [alt]="property().title"
            loading="lazy"
          />
        } @else {
          <div class="iu-property-card__image-placeholder">
            <span class="material-symbols-outlined">apartment</span>
          </div>
        }

        <!-- Badges overlay -->
        @if (visibleBadges().length > 0) {
          <div class="iu-property-card__badges">
            @for (badge of visibleBadges(); track badge) {
              <span class="iu-property-card__badge iu-property-card__badge--{{ badge }}">
                {{ badgeLabel(badge) }}
              </span>
            }
          </div>
        }

        <!-- Favourite button -->
        <button
          class="iu-property-card__fav"
          [class.iu-property-card__fav--active]="favourited()"
          (click)="onFavClick($event)"
          [attr.aria-label]="favourited() ? 'Remove from favourites' : 'Add to favourites'"
          [attr.aria-pressed]="favourited()"
        >
          <span class="material-symbols-outlined">
            {{ favourited() ? 'favorite' : 'favorite_border' }}
          </span>
        </button>

        <!-- Type chip -->
        <span class="iu-property-card__type">{{ typeLabel() }}</span>
      </div>

      <!-- Content -->
      <div class="iu-property-card__content">
        <div class="iu-property-card__header">
          <h3 class="iu-property-card__title">{{ property().title }}</h3>
          <p class="iu-property-card__price">
            {{ formattedPrice() }}
            <span class="iu-property-card__price-unit">/mês</span>
          </p>
        </div>

        <p class="iu-property-card__location">
          <span class="material-symbols-outlined">location_on</span>
          {{ property().location }}
        </p>

        <!-- Specs row -->
        <div class="iu-property-card__specs">
          @if (property().bedrooms >= 0) {
            <div class="iu-property-card__spec">
              <span class="material-symbols-outlined">bed</span>
              <span>{{ bedroomsLabel() }}</span>
            </div>
          }
          @if (property().bathrooms > 0) {
            <div class="iu-property-card__spec">
              <span class="material-symbols-outlined">bathtub</span>
              <span>{{ property().bathrooms }} WC</span>
            </div>
          }
          @if (property().areaSqm > 0) {
            <div class="iu-property-card__spec">
              <span class="material-symbols-outlined">square_foot</span>
              <span>{{ property().areaSqm }} m²</span>
            </div>
          }
        </div>

        @if (property().availableFrom) {
          <p class="iu-property-card__available">
            <span class="material-symbols-outlined">event_available</span>
            Disponível {{ property().availableFrom }}
          </p>
        }
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }

    .iu-property-card {
      background: var(--md-sys-color-surface-container-low, #f5f5f5);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease;
      outline: none;
      position: relative;
    }
    .iu-property-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06);
    }
    .iu-property-card:focus-visible {
      outline: 3px solid var(--md-sys-color-primary, #6750a4);
      outline-offset: 2px;
    }
    .iu-property-card--featured {
      border: 2px solid var(--md-sys-color-primary, #6750a4);
    }

    /* ── Image ── */
    .iu-property-card__image-wrap {
      position: relative;
      height: 196px;
      overflow: hidden;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .iu-property-card__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 300ms ease;
    }
    .iu-property-card:hover .iu-property-card__image {
      transform: scale(1.04);
    }
    .iu-property-card__image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .iu-property-card__image-placeholder .material-symbols-outlined {
      font-size: 64px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.4;
    }

    /* ── Badges ── */
    .iu-property-card__badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .iu-property-card__badge {
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .4px;
      text-transform: uppercase;
    }
    .iu-property-card__badge--new      { background: var(--md-sys-color-primary, #6750a4);           color: var(--md-sys-color-on-primary, #fff); }
    .iu-property-card__badge--featured { background: var(--md-sys-color-tertiary, #7d5260);          color: var(--md-sys-color-on-tertiary, #fff); }
    .iu-property-card__badge--available{ background: var(--md-sys-color-secondary, #625b71);         color: var(--md-sys-color-on-secondary, #fff); }
    .iu-property-card__badge--rented   { background: var(--md-sys-color-error, #b3261e);             color: var(--md-sys-color-on-error, #fff); }
    .iu-property-card__badge--verified { background: var(--md-sys-color-surface-container, #ece6f0); color: var(--md-sys-color-primary, #6750a4); }

    /* ── Type chip ── */
    .iu-property-card__type {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #fff;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .4px;
    }

    /* ── Favourite ── */
    .iu-property-card__fav {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255,255,255,.85);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 120ms ease, transform 120ms ease;
    }
    .iu-property-card__fav:hover { background: #fff; transform: scale(1.1); }
    .iu-property-card__fav .material-symbols-outlined { font-size: 20px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-property-card__fav--active .material-symbols-outlined { color: var(--md-sys-color-error, #b3261e); }

    /* ── Content ── */
    .iu-property-card__content {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .iu-property-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .iu-property-card__title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1.3;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .iu-property-card__price {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750a4);
      white-space: nowrap;
    }
    .iu-property-card__price-unit { font-size: 11px; font-weight: 400; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-property-card__location {
      margin: 0;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .iu-property-card__location .material-symbols-outlined { font-size: 14px; }
    .iu-property-card__specs { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
    .iu-property-card__spec {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .iu-property-card__spec .material-symbols-outlined { font-size: 14px; }
    .iu-property-card__available {
      margin: 4px 0 0;
      font-size: 11px;
      color: var(--md-sys-color-secondary, #625b71);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .iu-property-card__available .material-symbols-outlined { font-size: 13px; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {

  /** Property data to display */
  readonly property = input.required<PropertyData>();

  /** Emits when the card body is clicked */
  readonly cardClick = output<PropertyData>();

  /** Emits when the favourite button is toggled */
  readonly favouriteToggle = output<{ property: PropertyData; isFavourited: boolean }>();

  /** Internal favourite state (synced with property.isFavourited) */
  readonly favourited = signal(false);

  constructor() {
    // Sync internal state with input
    // (effect runs when property signal changes)
  }

  readonly isFeatured = computed(() =>
    this.property().badges?.includes('featured') ?? false
  );

  readonly formattedPrice = computed(() =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(this.property().priceMonthly)
  );

  readonly visibleBadges = computed(() =>
    (this.property().badges ?? []).slice(0, 3)
  );

  readonly typeLabel = computed(() => {
    const labels: Record<PropertyType, string> = {
      apartment: 'Apartamento',
      house: 'Casa',
      studio: 'Estúdio',
      room: 'Quarto',
      villa: 'Moradia',
      penthouse: 'Penthouse',
    };
    return labels[this.property().type] ?? this.property().type;
  });

  readonly bedroomsLabel = computed(() => {
    const n = this.property().bedrooms;
    if (n === 0) return 'Estúdio';
    return `T${n}`;
  });

  badgeLabel(badge: PropertyBadge): string {
    const labels: Record<PropertyBadge, string> = {
      new: 'Novo',
      featured: 'Destaque',
      available: 'Disponível',
      rented: 'Arrendado',
      verified: 'Verificado',
    };
    return labels[badge] ?? badge;
  }

  onCardClick(): void {
    this.cardClick.emit(this.property());
  }

  onFavClick(event: Event): void {
    event.stopPropagation();
    const next = !this.favourited();
    this.favourited.set(next);
    this.favouriteToggle.emit({ property: this.property(), isFavourited: next });
  }
}
