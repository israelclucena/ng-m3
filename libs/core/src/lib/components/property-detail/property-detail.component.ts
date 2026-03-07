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
import { PropertyData, PropertyBadge, PropertyType } from '../property-card/property-card.component';

// ─── Extended Model ───────────────────────────────────────────────────────────

/**
 * Extended property detail data — superset of PropertyData.
 * All fields from PropertyData plus optional detail-specific fields.
 *
 * Feature flag: `PROPERTY_DETAIL_VIEW`
 */
export interface PropertyDetail extends PropertyData {
  /** Long-form description of the property */
  description?: string;
  /** Additional images for the gallery (beyond the main imageUrl) */
  images?: string[];
  /** List of amenity/feature strings */
  features?: string[];
  /** Landlord contact phone */
  contactPhone?: string;
  /** Landlord contact email */
  contactEmail?: string;
  /** Floor number */
  floor?: number;
  /** Whether the property has an elevator */
  elevator?: boolean;
  /** Whether pets are allowed */
  petsAllowed?: boolean;
  /** Whether the property is furnished */
  furnished?: boolean;
  /** Year the building was built */
  yearBuilt?: number;
  /** Energy rating (A, B, C, etc.) */
  energyRating?: string;
  /** Monthly condo fee in EUR */
  condoFee?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * PropertyDetail — Full detail view for a LisboaRent property listing.
 *
 * Displays:
 * - Image gallery with thumbnail strip
 * - Price, type, badges, availability
 * - Key specs (beds, baths, area, floor, energy rating)
 * - Description + amenities grid
 * - Property info table (furnished, pets, year built, condo fee)
 * - Map placeholder
 * - Contact CTA panel
 *
 * Emits `closed` when the back/close button is clicked.
 *
 * Feature flag: `PROPERTY_DETAIL_VIEW`
 *
 * @example
 * ```html
 * <iu-property-detail [property]="selectedProperty" (closed)="clearSelection()" />
 * ```
 */
@Component({
  selector: 'iu-property-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-pd">

      <!-- ── Header bar ──────────────────────────────────────────── -->
      <div class="iu-pd__topbar">
        <button class="iu-pd__back" (click)="onClose()" aria-label="Back to listings">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Listagens</span>
        </button>
        <div class="iu-pd__topbar-actions">
          <button class="iu-pd__icon-btn" (click)="onShare()" aria-label="Share">
            <span class="material-symbols-outlined">share</span>
          </button>
          <button
            class="iu-pd__icon-btn iu-pd__icon-btn--fav"
            [class.iu-pd__icon-btn--fav-active]="favourited()"
            (click)="onFavClick()"
            [attr.aria-pressed]="favourited()"
            aria-label="Save to favourites"
          >
            <span class="material-symbols-outlined">{{ favourited() ? 'favorite' : 'favorite_border' }}</span>
          </button>
        </div>
      </div>

      <!-- ── Gallery ───────────────────────────────────────────────── -->
      <div class="iu-pd__gallery">
        <div class="iu-pd__gallery-main">
          @if (activeImage()) {
            <img
              class="iu-pd__gallery-hero"
              [src]="activeImage()"
              [alt]="property().title"
              loading="eager"
            />
          } @else {
            <div class="iu-pd__gallery-placeholder">
              <span class="material-symbols-outlined">apartment</span>
            </div>
          }

          <!-- Image counter badge -->
          @if (allImages().length > 1) {
            <span class="iu-pd__gallery-counter">
              {{ activeIndex() + 1 }} / {{ allImages().length }}
            </span>
          }

          <!-- Prev/Next arrows -->
          @if (allImages().length > 1) {
            <button class="iu-pd__gallery-arrow iu-pd__gallery-arrow--prev"
              (click)="prevImage()" aria-label="Previous image" [disabled]="activeIndex() === 0">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="iu-pd__gallery-arrow iu-pd__gallery-arrow--next"
              (click)="nextImage()" aria-label="Next image" [disabled]="activeIndex() === allImages().length - 1">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          }
        </div>

        <!-- Thumbnails -->
        @if (allImages().length > 1) {
          <div class="iu-pd__thumbs">
            @for (img of allImages(); track img; let i = $index) {
              <button
                class="iu-pd__thumb"
                [class.iu-pd__thumb--active]="i === activeIndex()"
                (click)="setImage(i)"
                [attr.aria-label]="'Photo ' + (i + 1)"
              >
                <img [src]="img" [alt]="'Photo ' + (i + 1)" loading="lazy" />
              </button>
            }
          </div>
        }
      </div>

      <!-- ── Body ──────────────────────────────────────────────────── -->
      <div class="iu-pd__body">

        <!-- Left column -->
        <div class="iu-pd__main">

          <!-- Title + Price -->
          <div class="iu-pd__hero-info">
            <div class="iu-pd__title-block">
              <div class="iu-pd__badges">
                <span class="iu-pd__type-chip">{{ typeLabel() }}</span>
                @for (badge of visibleBadges(); track badge) {
                  <span class="iu-pd__badge iu-pd__badge--{{ badge }}">{{ badgeLabel(badge) }}</span>
                }
              </div>
              <h1 class="iu-pd__title">{{ property().title }}</h1>
              <p class="iu-pd__location">
                <span class="material-symbols-outlined">location_on</span>
                {{ property().location }}
              </p>
            </div>
            <div class="iu-pd__price-block">
              <div class="iu-pd__price">{{ formattedPrice() }}</div>
              <div class="iu-pd__price-unit">por mês</div>
              @if (property().availableFrom) {
                <div class="iu-pd__available">
                  <span class="material-symbols-outlined">event_available</span>
                  Disponível {{ property().availableFrom }}
                </div>
              }
            </div>
          </div>

          <!-- Key specs -->
          <div class="iu-pd__specs-row">
            <div class="iu-pd__spec-card">
              <span class="material-symbols-outlined">bed</span>
              <div class="iu-pd__spec-value">{{ bedroomsLabel() }}</div>
              <div class="iu-pd__spec-label">Quartos</div>
            </div>
            <div class="iu-pd__spec-card">
              <span class="material-symbols-outlined">bathtub</span>
              <div class="iu-pd__spec-value">{{ property().bathrooms }}</div>
              <div class="iu-pd__spec-label">WC</div>
            </div>
            <div class="iu-pd__spec-card">
              <span class="material-symbols-outlined">square_foot</span>
              <div class="iu-pd__spec-value">{{ property().areaSqm }}</div>
              <div class="iu-pd__spec-label">m²</div>
            </div>
            @if (detailedProp().floor !== undefined) {
              <div class="iu-pd__spec-card">
                <span class="material-symbols-outlined">elevator</span>
                <div class="iu-pd__spec-value">{{ detailedProp().floor }}º</div>
                <div class="iu-pd__spec-label">Piso</div>
              </div>
            }
            @if (detailedProp().energyRating) {
              <div class="iu-pd__spec-card">
                <span class="material-symbols-outlined">bolt</span>
                <div class="iu-pd__spec-value iu-pd__energy iu-pd__energy--{{ detailedProp().energyRating?.toLowerCase() }}">
                  {{ detailedProp().energyRating }}
                </div>
                <div class="iu-pd__spec-label">Energia</div>
              </div>
            }
          </div>

          <!-- Description -->
          @if (detailedProp().description) {
            <section class="iu-pd__section">
              <h2 class="iu-pd__section-title">Descrição</h2>
              <p class="iu-pd__description">{{ detailedProp().description }}</p>
            </section>
          }

          <!-- Amenities -->
          @if (detailedProp().features && detailedProp().features!.length > 0) {
            <section class="iu-pd__section">
              <h2 class="iu-pd__section-title">Comodidades</h2>
              <div class="iu-pd__features-grid">
                @for (feat of detailedProp().features; track feat) {
                  <div class="iu-pd__feature-item">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>{{ feat }}</span>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Property info table -->
          <section class="iu-pd__section">
            <h2 class="iu-pd__section-title">Informações</h2>
            <div class="iu-pd__info-table">
              <div class="iu-pd__info-row">
                <span class="iu-pd__info-label">Tipo</span>
                <span class="iu-pd__info-value">{{ typeLabel() }}</span>
              </div>
              @if (detailedProp().furnished !== undefined) {
                <div class="iu-pd__info-row">
                  <span class="iu-pd__info-label">Mobilado</span>
                  <span class="iu-pd__info-value">{{ detailedProp().furnished ? 'Sim' : 'Não' }}</span>
                </div>
              }
              @if (detailedProp().petsAllowed !== undefined) {
                <div class="iu-pd__info-row">
                  <span class="iu-pd__info-label">Animais</span>
                  <span class="iu-pd__info-value">{{ detailedProp().petsAllowed ? 'Permitidos' : 'Não permitidos' }}</span>
                </div>
              }
              @if (detailedProp().elevator !== undefined) {
                <div class="iu-pd__info-row">
                  <span class="iu-pd__info-label">Elevador</span>
                  <span class="iu-pd__info-value">{{ detailedProp().elevator ? 'Sim' : 'Não' }}</span>
                </div>
              }
              @if (detailedProp().yearBuilt) {
                <div class="iu-pd__info-row">
                  <span class="iu-pd__info-label">Construído em</span>
                  <span class="iu-pd__info-value">{{ detailedProp().yearBuilt }}</span>
                </div>
              }
              @if (detailedProp().condoFee) {
                <div class="iu-pd__info-row">
                  <span class="iu-pd__info-label">Condomínio</span>
                  <span class="iu-pd__info-value">{{ formattedCondoFee() }}/mês</span>
                </div>
              }
            </div>
          </section>

          <!-- Map placeholder -->
          <section class="iu-pd__section">
            <h2 class="iu-pd__section-title">Localização</h2>
            <div class="iu-pd__map-placeholder">
              <span class="material-symbols-outlined">map</span>
              <p>{{ property().location }}</p>
              <span class="iu-pd__map-hint">Mapa interactivo disponível brevemente</span>
            </div>
          </section>

        </div>

        <!-- Right column — Contact panel -->
        <aside class="iu-pd__sidebar">
          <div class="iu-pd__contact-card">
            <div class="iu-pd__contact-header">
              <div class="iu-pd__contact-avatar">
                <span class="material-symbols-outlined">person</span>
              </div>
              <div>
                <div class="iu-pd__contact-name">Proprietário</div>
                <div class="iu-pd__contact-badge">Verificado ✓</div>
              </div>
            </div>

            <div class="iu-pd__price-summary">
              <div class="iu-pd__price-summary-value">{{ formattedPrice() }}</div>
              <div class="iu-pd__price-summary-unit">por mês</div>
            </div>

            <button class="iu-pd__cta-btn iu-pd__cta-btn--primary" (click)="onContact()">
              <span class="material-symbols-outlined">message</span>
              Enviar Mensagem
            </button>
            <button class="iu-pd__cta-btn iu-pd__cta-btn--secondary" (click)="onSchedule()">
              <span class="material-symbols-outlined">calendar_month</span>
              Agendar Visita
            </button>

            @if (detailedProp().contactPhone) {
              <a class="iu-pd__contact-link" [href]="'tel:' + detailedProp().contactPhone">
                <span class="material-symbols-outlined">phone</span>
                {{ detailedProp().contactPhone }}
              </a>
            }
            @if (detailedProp().contactEmail) {
              <a class="iu-pd__contact-link" [href]="'mailto:' + detailedProp().contactEmail">
                <span class="material-symbols-outlined">email</span>
                {{ detailedProp().contactEmail }}
              </a>
            }

            <div class="iu-pd__contact-note">
              <span class="material-symbols-outlined">info</span>
              Resposta habitual em menos de 24h.
            </div>
          </div>

          <!-- Share card -->
          <div class="iu-pd__share-card">
            <h3>Partilhar</h3>
            <div class="iu-pd__share-btns">
              <button class="iu-pd__share-btn" (click)="onShare()" aria-label="Copy link">
                <span class="material-symbols-outlined">link</span>
              </button>
              <button class="iu-pd__share-btn" aria-label="Share on WhatsApp">
                <span class="material-symbols-outlined">chat</span>
              </button>
              <button class="iu-pd__share-btn" aria-label="Share by email">
                <span class="material-symbols-outlined">mail</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .iu-pd {
      background: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      border-radius: 24px;
      overflow: hidden;
    }

    /* ── Top bar ── */
    .iu-pd__topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .iu-pd__back {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-primary, #6750a4);
      font-size: 14px;
      font-weight: 500;
      padding: 6px 10px;
      border-radius: 100px;
      transition: background 120ms;
    }
    .iu-pd__back:hover { background: var(--md-sys-color-primary-container, #eaddff); }
    .iu-pd__back .material-symbols-outlined { font-size: 20px; }
    .iu-pd__topbar-actions { display: flex; gap: 8px; }
    .iu-pd__icon-btn {
      width: 40px; height: 40px;
      border: none; background: transparent; cursor: pointer;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 120ms;
    }
    .iu-pd__icon-btn:hover { background: var(--md-sys-color-surface-container-highest, #e6e0e9); }
    .iu-pd__icon-btn--fav-active .material-symbols-outlined { color: var(--md-sys-color-error, #b3261e); }

    /* ── Gallery ── */
    .iu-pd__gallery { background: var(--md-sys-color-surface-container-low, #f7f2fa); }
    .iu-pd__gallery-main {
      position: relative;
      height: 340px;
      overflow: hidden;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .iu-pd__gallery-hero {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: opacity 200ms ease;
    }
    .iu-pd__gallery-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
    }
    .iu-pd__gallery-placeholder .material-symbols-outlined {
      font-size: 80px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.3;
    }
    .iu-pd__gallery-counter {
      position: absolute; bottom: 12px; right: 12px;
      background: rgba(0,0,0,.55); backdrop-filter: blur(6px);
      color: #fff; padding: 4px 12px; border-radius: 100px;
      font-size: 12px; font-weight: 500;
    }
    .iu-pd__gallery-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 40px; height: 40px; border: none;
      background: rgba(255,255,255,.9); backdrop-filter: blur(4px);
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
      transition: background 120ms, opacity 120ms;
    }
    .iu-pd__gallery-arrow:disabled { opacity: .35; cursor: default; }
    .iu-pd__gallery-arrow:not(:disabled):hover { background: #fff; }
    .iu-pd__gallery-arrow--prev { left: 12px; }
    .iu-pd__gallery-arrow--next { right: 12px; }
    .iu-pd__gallery-arrow .material-symbols-outlined { font-size: 22px; color: var(--md-sys-color-on-surface, #1c1b1f); }

    .iu-pd__thumbs {
      display: flex; gap: 8px; padding: 10px 16px;
      overflow-x: auto; scrollbar-width: none;
    }
    .iu-pd__thumbs::-webkit-scrollbar { display: none; }
    .iu-pd__thumb {
      flex-shrink: 0; width: 72px; height: 52px;
      border-radius: 8px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; padding: 0;
      transition: border-color 120ms, transform 120ms;
    }
    .iu-pd__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .iu-pd__thumb--active { border-color: var(--md-sys-color-primary, #6750a4); transform: scale(1.05); }
    .iu-pd__thumb:not(.iu-pd__thumb--active):hover { border-color: var(--md-sys-color-outline, #79747e); }

    /* ── Body ── */
    .iu-pd__body {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      padding: 24px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .iu-pd__body { grid-template-columns: 1fr; }
      .iu-pd__sidebar { order: -1; }
    }

    /* ── Hero info ── */
    .iu-pd__hero-info {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
    }
    .iu-pd__badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .iu-pd__type-chip {
      padding: 3px 12px; border-radius: 100px;
      font-size: 12px; font-weight: 600;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #21005d);
    }
    .iu-pd__badge {
      padding: 3px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px;
    }
    .iu-pd__badge--new      { background: var(--md-sys-color-primary, #6750a4);    color: var(--md-sys-color-on-primary, #fff); }
    .iu-pd__badge--featured { background: var(--md-sys-color-tertiary, #7d5260);   color: var(--md-sys-color-on-tertiary, #fff); }
    .iu-pd__badge--available{ background: var(--md-sys-color-secondary, #625b71);  color: var(--md-sys-color-on-secondary, #fff); }
    .iu-pd__badge--rented   { background: var(--md-sys-color-error, #b3261e);      color: var(--md-sys-color-on-error, #fff); }
    .iu-pd__badge--verified { background: var(--md-sys-color-surface-container, #ece6f0); color: var(--md-sys-color-primary, #6750a4); }
    .iu-pd__title {
      margin: 0 0 8px; font-size: 22px; font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f); line-height: 1.3;
    }
    .iu-pd__location {
      display: flex; align-items: center; gap: 4px;
      margin: 0; font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .iu-pd__location .material-symbols-outlined { font-size: 16px; }
    .iu-pd__price-block { text-align: right; flex-shrink: 0; }
    .iu-pd__price { font-size: 28px; font-weight: 700; color: var(--md-sys-color-primary, #6750a4); }
    .iu-pd__price-unit { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-pd__available {
      display: flex; align-items: center; gap: 4px; justify-content: flex-end;
      margin-top: 6px; font-size: 12px; color: var(--md-sys-color-secondary, #625b71);
    }
    .iu-pd__available .material-symbols-outlined { font-size: 14px; }

    /* ── Specs row ── */
    .iu-pd__specs-row {
      display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
    }
    .iu-pd__spec-card {
      flex: 1; min-width: 80px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px; padding: 14px 12px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      text-align: center;
    }
    .iu-pd__spec-card .material-symbols-outlined {
      font-size: 22px; color: var(--md-sys-color-primary, #6750a4);
    }
    .iu-pd__spec-value { font-size: 18px; font-weight: 700; color: var(--md-sys-color-on-surface, #1c1b1f); }
    .iu-pd__spec-label { font-size: 11px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-pd__energy { padding: 2px 8px; border-radius: 6px; font-size: 16px !important; }
    .iu-pd__energy--a { background: #2e7d32; color: #fff; }
    .iu-pd__energy--b { background: #558b2f; color: #fff; }
    .iu-pd__energy--c { background: #f9a825; color: #1c1b1f; }
    .iu-pd__energy--d { background: #ef6c00; color: #fff; }
    .iu-pd__energy--e { background: #c62828; color: #fff; }

    /* ── Sections ── */
    .iu-pd__section { margin-bottom: 24px; }
    .iu-pd__section-title {
      font-size: 16px; font-weight: 600; margin: 0 0 12px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .iu-pd__description {
      margin: 0; line-height: 1.6; font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Amenities ── */
    .iu-pd__features-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;
    }
    .iu-pd__feature-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .iu-pd__feature-item .material-symbols-outlined {
      font-size: 18px; color: var(--md-sys-color-primary, #6750a4); flex-shrink: 0;
    }

    /* ── Info table ── */
    .iu-pd__info-table {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px; overflow: hidden;
    }
    .iu-pd__info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .iu-pd__info-row:last-child { border-bottom: none; }
    .iu-pd__info-label { font-size: 13px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-pd__info-value { font-size: 13px; font-weight: 500; color: var(--md-sys-color-on-surface, #1c1b1f); }

    /* ── Map ── */
    .iu-pd__map-placeholder {
      height: 200px; border-radius: 16px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; border: 2px dashed var(--md-sys-color-outline-variant, #cac4d0);
    }
    .iu-pd__map-placeholder .material-symbols-outlined {
      font-size: 48px; color: var(--md-sys-color-on-surface-variant, #49454f); opacity: 0.5;
    }
    .iu-pd__map-placeholder p { margin: 0; font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .iu-pd__map-hint { font-size: 11px; color: var(--md-sys-color-outline, #79747e); }

    /* ── Sidebar / Contact ── */
    .iu-pd__sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

    .iu-pd__contact-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 20px; padding: 20px;
      display: flex; flex-direction: column; gap: 14px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .iu-pd__contact-header { display: flex; align-items: center; gap: 12px; }
    .iu-pd__contact-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: var(--md-sys-color-primary-container, #eaddff);
      display: flex; align-items: center; justify-content: center;
    }
    .iu-pd__contact-avatar .material-symbols-outlined { color: var(--md-sys-color-primary, #6750a4); font-size: 26px; }
    .iu-pd__contact-name { font-size: 15px; font-weight: 600; color: var(--md-sys-color-on-surface, #1c1b1f); }
    .iu-pd__contact-badge { font-size: 12px; color: var(--md-sys-color-primary, #6750a4); margin-top: 2px; }

    .iu-pd__price-summary {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-radius: 12px; padding: 12px 16px; text-align: center;
    }
    .iu-pd__price-summary-value { font-size: 24px; font-weight: 700; color: var(--md-sys-color-primary, #6750a4); }
    .iu-pd__price-summary-unit { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    .iu-pd__cta-btn {
      width: 100%; padding: 14px 20px; border-radius: 100px; border: none;
      cursor: pointer; font-size: 14px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: filter 120ms ease, transform 80ms ease;
    }
    .iu-pd__cta-btn:active { transform: scale(.98); }
    .iu-pd__cta-btn--primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .iu-pd__cta-btn--primary:hover { filter: brightness(1.1); }
    .iu-pd__cta-btn--secondary {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #21005d);
    }
    .iu-pd__cta-btn--secondary:hover { filter: brightness(.96); }
    .iu-pd__cta-btn .material-symbols-outlined { font-size: 18px; }

    .iu-pd__contact-link {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--md-sys-color-primary, #6750a4);
      text-decoration: none; padding: 4px 0;
    }
    .iu-pd__contact-link:hover { text-decoration: underline; }
    .iu-pd__contact-link .material-symbols-outlined { font-size: 16px; }
    .iu-pd__contact-note {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 8px 10px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      border-radius: 8px;
    }
    .iu-pd__contact-note .material-symbols-outlined { font-size: 14px; flex-shrink: 0; }

    .iu-pd__share-card {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 16px; padding: 16px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .iu-pd__share-card h3 {
      margin: 0 0 12px; font-size: 14px; font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .iu-pd__share-btns { display: flex; gap: 10px; }
    .iu-pd__share-btn {
      width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface, #fffbfe); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 120ms;
    }
    .iu-pd__share-btn:hover { background: var(--md-sys-color-surface-container, #ece6f0); }
    .iu-pd__share-btn .material-symbols-outlined { font-size: 20px; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailComponent {

  /** Property (or PropertyDetail) data to display */
  readonly property = input.required<PropertyData>();

  /** Emits when user clicks back/close */
  readonly closed = output<void>();

  /** Emits when user clicks "Enviar Mensagem" */
  readonly contactClick = output<PropertyData>();

  /** Emits when user clicks "Agendar Visita" */
  readonly scheduleClick = output<PropertyData>();

  /** Emits when favourite is toggled */
  readonly favouriteToggle = output<{ property: PropertyData; isFavourited: boolean }>();

  /** Emits when share is clicked */
  readonly shareClick = output<PropertyData>();

  // ── Internal state ────────────────────────────────────────────
  readonly favourited = signal(false);
  readonly activeIndex = signal(0);

  // ── Computed ──────────────────────────────────────────────────

  /** Cast property to PropertyDetail (may have extra fields) */
  readonly detailedProp = computed(() => this.property() as PropertyDetail);

  readonly allImages = computed(() => {
    const prop = this.property() as PropertyDetail;
    const main = prop.imageUrl ? [prop.imageUrl] : [];
    const extras = prop.images ?? [];
    const combined = [...main, ...extras];
    return combined.length > 0 ? combined : [];
  });

  readonly activeImage = computed(() =>
    this.allImages()[this.activeIndex()] ?? null
  );

  readonly formattedPrice = computed(() =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
      .format(this.property().priceMonthly)
  );

  readonly formattedCondoFee = computed(() => {
    const fee = (this.property() as PropertyDetail).condoFee;
    if (!fee) return '';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(fee);
  });

  readonly visibleBadges = computed(() =>
    (this.property().badges ?? []).slice(0, 4)
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
    return n === 0 ? 'Estúdio' : `T${n}`;
  });

  // ── Handlers ─────────────────────────────────────────────────

  onClose(): void { this.closed.emit(); }

  onFavClick(): void {
    const next = !this.favourited();
    this.favourited.set(next);
    this.favouriteToggle.emit({ property: this.property(), isFavourited: next });
  }

  onContact(): void { this.contactClick.emit(this.property()); }
  onSchedule(): void { this.scheduleClick.emit(this.property()); }
  onShare(): void { this.shareClick.emit(this.property()); }

  setImage(index: number): void { this.activeIndex.set(index); }
  prevImage(): void { this.activeIndex.update(i => Math.max(0, i - 1)); }
  nextImage(): void { this.activeIndex.update(i => Math.min(this.allImages().length - 1, i + 1)); }

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
}
