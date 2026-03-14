import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingStats } from './landlord-analytics.types';

/**
 * `iu-listing-stats-card` — Analytics card for a single landlord listing.
 *
 * Shows status, rent, occupancy, views, inquiries, rating, and quick actions.
 * Feature flag: `LANDLORD_ANALYTICS`
 *
 * @example
 * ```html
 * <iu-listing-stats-card
 *   [stats]="listing"
 *   (viewDetails)="openListing($event)"
 *   (editListing)="editListing($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-listing-stats-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-ls-card" [class]="'iu-ls-card--' + stats().status">

      <!-- ── Header ── -->
      <div class="iu-ls-card__header">
        <div class="iu-ls-card__title-row">
          <h4 class="iu-ls-card__title">{{ stats().propertyTitle }}</h4>
          <span class="iu-ls-card__status-badge">
            <span class="material-symbols-outlined" aria-hidden="true">{{ statusIcon() }}</span>
            {{ statusLabel() }}
          </span>
        </div>
        <p class="iu-ls-card__address">
          <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
          {{ stats().propertyAddress }}
        </p>
      </div>

      <!-- ── Rent + Occupancy ── -->
      <div class="iu-ls-card__highlights">
        <div class="iu-ls-card__highlight">
          <span class="iu-ls-card__highlight-label">Renda mensal</span>
          <span class="iu-ls-card__highlight-value">
            {{ stats().monthlyRent | currency:stats().currency:'symbol':'1.0-0' }}
          </span>
        </div>
        <div class="iu-ls-card__highlight">
          <span class="iu-ls-card__highlight-label">Taxa ocupação</span>
          <span class="iu-ls-card__highlight-value">{{ stats().occupancyRate }}%</span>
        </div>
      </div>

      <!-- ── Occupancy mini-bar ── -->
      <div class="iu-ls-card__occ-bar" [attr.aria-label]="'Ocupação: ' + stats().occupancyRate + '%'">
        <div class="iu-ls-card__occ-fill" [style.width.%]="stats().occupancyRate"></div>
      </div>

      <!-- ── Stats grid ── -->
      <div class="iu-ls-card__stats">
        <div class="iu-ls-card__stat">
          <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
          <span class="iu-ls-card__stat-value">{{ stats().totalViews | number }}</span>
          <span class="iu-ls-card__stat-label">Visualizações</span>
        </div>
        <div class="iu-ls-card__stat">
          <span class="material-symbols-outlined" aria-hidden="true">mark_email_unread</span>
          <span class="iu-ls-card__stat-value">{{ stats().totalInquiries }}</span>
          <span class="iu-ls-card__stat-label">Contactos</span>
        </div>
        <div class="iu-ls-card__stat">
          <span class="material-symbols-outlined" aria-hidden="true">event_available</span>
          <span class="iu-ls-card__stat-value">{{ stats().activeBookings }}</span>
          <span class="iu-ls-card__stat-label">Reservas</span>
        </div>
        @if (stats().rating !== undefined) {
          <div class="iu-ls-card__stat">
            <span class="material-symbols-outlined" aria-hidden="true">star</span>
            <span class="iu-ls-card__stat-value">{{ stats().rating | number:'1.1-1' }}</span>
            <span class="iu-ls-card__stat-label">
              {{ stats().reviewCount }} av.
            </span>
          </div>
        }
      </div>

      <!-- ── Last activity ── -->
      @if (stats().lastActivity) {
        <p class="iu-ls-card__activity">
          <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
          Última actividade: {{ stats().lastActivity | date:'d MMM yyyy' }}
        </p>
      }

      <!-- ── Actions ── -->
      <div class="iu-ls-card__actions">
        <button
          class="iu-ls-card__btn iu-ls-card__btn--secondary"
          (click)="viewDetails.emit(stats().propertyId)"
          type="button"
        >
          <span class="material-symbols-outlined">open_in_new</span>
          Ver anúncio
        </button>
        <button
          class="iu-ls-card__btn iu-ls-card__btn--primary"
          (click)="editListing.emit(stats().propertyId)"
          type="button"
        >
          <span class="material-symbols-outlined">edit</span>
          Editar
        </button>
      </div>

    </div>
  `,
  styles: [`
    .iu-ls-card {
      padding: 16px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-left: 4px solid transparent;
      font-family: var(--md-sys-typescale-body-medium-font, sans-serif);
    }
    .iu-ls-card--occupied { border-left-color: var(--md-sys-color-primary); }
    .iu-ls-card--vacant { border-left-color: var(--md-sys-color-tertiary, #2d8a50); }
    .iu-ls-card--pending { border-left-color: var(--md-sys-color-secondary); }
    .iu-ls-card--maintenance { border-left-color: var(--md-sys-color-error); }

    /* ── Header ── */
    .iu-ls-card__title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .iu-ls-card__title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      flex: 1;
    }
    .iu-ls-card__status-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 100px;
      white-space: nowrap;
    }
    .iu-ls-card__status-badge .material-symbols-outlined { font-size: 13px; }
    .iu-ls-card--occupied .iu-ls-card__status-badge {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .iu-ls-card--vacant .iu-ls-card__status-badge {
      background: color-mix(in srgb, var(--md-sys-color-tertiary, #2d8a50) 15%, var(--md-sys-color-surface));
      color: var(--md-sys-color-tertiary, #2d8a50);
    }
    .iu-ls-card--pending .iu-ls-card__status-badge {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }
    .iu-ls-card--maintenance .iu-ls-card__status-badge {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }
    .iu-ls-card__address {
      display: flex;
      align-items: center;
      gap: 3px;
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-ls-card__address .material-symbols-outlined { font-size: 13px; }

    /* ── Highlights ── */
    .iu-ls-card__highlights { display: flex; gap: 12px; }
    .iu-ls-card__highlight {
      flex: 1;
      padding: 10px;
      background: var(--md-sys-color-surface-container);
      border-radius: 8px;
      text-align: center;
    }
    .iu-ls-card__highlight-label { display: block; font-size: 10px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 2px; }
    .iu-ls-card__highlight-value { font-size: 16px; font-weight: 700; color: var(--md-sys-color-primary); }

    /* ── Occ bar ── */
    .iu-ls-card__occ-bar {
      height: 4px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 2px;
      overflow: hidden;
    }
    .iu-ls-card__occ-fill {
      height: 100%;
      background: var(--md-sys-color-primary);
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    /* ── Stats grid ── */
    .iu-ls-card__stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
    .iu-ls-card__stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 4px;
      background: var(--md-sys-color-surface-container);
      border-radius: 8px;
    }
    .iu-ls-card__stat .material-symbols-outlined { font-size: 16px; color: var(--md-sys-color-on-surface-variant); }
    .iu-ls-card__stat-value { font-size: 14px; font-weight: 600; color: var(--md-sys-color-on-surface); }
    .iu-ls-card__stat-label { font-size: 9px; color: var(--md-sys-color-on-surface-variant); text-align: center; }

    /* ── Activity ── */
    .iu-ls-card__activity {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-ls-card__activity .material-symbols-outlined { font-size: 13px; }

    /* ── Actions ── */
    .iu-ls-card__actions { display: flex; gap: 8px; }
    .iu-ls-card__btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px;
      border-radius: 100px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: opacity 0.15s;
    }
    .iu-ls-card__btn:hover { opacity: 0.8; }
    .iu-ls-card__btn .material-symbols-outlined { font-size: 15px; }
    .iu-ls-card__btn--primary { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .iu-ls-card__btn--secondary { background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
  `],
})
export class ListingStatsCardComponent {

  /** Listing stats to display. */
  readonly stats = input.required<ListingStats>();

  /** Emitted when the user clicks "View listing". Carries the property ID. */
  readonly viewDetails = output<string>();

  /** Emitted when the user clicks "Edit listing". Carries the property ID. */
  readonly editListing = output<string>();

  /** Computed icon for the listing status. */
  readonly statusIcon = computed(() => {
    const icons: Record<ListingStats['status'], string> = {
      occupied: 'home',
      vacant: 'home_work',
      pending: 'hourglass_top',
      maintenance: 'construction',
    };
    return icons[this.stats().status];
  });

  /** Computed human-readable label for the listing status. */
  readonly statusLabel = computed(() => {
    const labels: Record<ListingStats['status'], string> = {
      occupied: 'Ocupado',
      vacant: 'Disponível',
      pending: 'Pendente',
      maintenance: 'Manutenção',
    };
    return labels[this.stats().status];
  });
}
