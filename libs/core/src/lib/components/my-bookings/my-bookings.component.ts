import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * A single booking record displayed in `iu-my-bookings`.
 * Feature flag: `MY_BOOKINGS`
 */
export interface BookingRecord {
  /** Unique booking identifier */
  id: string;
  /** Property title */
  propertyTitle: string;
  /** Property location string */
  propertyLocation: string;
  /** Optional property thumbnail URL */
  propertyImageUrl?: string;
  /** Booking date (display string) */
  date: string;
  /** Optional visit time (e.g. "14:30") */
  time?: string;
  /** Booking lifecycle state */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  /** Booking type */
  type: 'visit' | 'inquiry';
  /** Monthly rent shown for context */
  priceMonthly?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-my-bookings` — booking history list for a logged-in user.
 *
 * Shows a filterable, tab-based list of visit requests and inquiries
 * with status chips and cancel/reschedule actions.
 *
 * Feature flag: `MY_BOOKINGS`
 *
 * @example
 * ```html
 * <iu-my-bookings
 *   [bookings]="myBookings"
 *   (cancel)="onCancelBooking($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-my-bookings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-my-bookings">

      <!-- ── Header ── -->
      <div class="bookings-header">
        <div class="header-left">
          <span class="material-symbols-outlined header-icon">calendar_month</span>
          <div>
            <h2 class="header-title">As Minhas Reservas</h2>
            <p class="header-sub">{{ total() }} reserva{{ total() === 1 ? '' : 's' }} no total</p>
          </div>
        </div>

        <!-- Tab filter -->
        <div class="tab-bar" role="tablist">
          @for (tab of tabs; track tab.key) {
            <button
              class="tab-btn"
              [class.active]="activeTab() === tab.key"
              (click)="activeTab.set(tab.key)"
              role="tab"
              [attr.aria-selected]="activeTab() === tab.key"
            >
              {{ tab.label }}
              @if (countForTab(tab.key) > 0) {
                <span class="tab-count">{{ countForTab(tab.key) }}</span>
              }
            </button>
          }
        </div>
      </div>

      <!-- ── List ── -->
      @if (filtered().length === 0) {
        <div class="empty">
          <span class="material-symbols-outlined empty-icon">event_busy</span>
          <p>Sem reservas {{ activeTab() !== 'all' ? 'nesta categoria' : '' }}</p>
        </div>
      } @else {
        <div class="booking-list">
          @for (booking of filtered(); track booking.id) {
            <div class="booking-card" [class]="'status-' + booking.status">

              <!-- Thumbnail -->
              <div class="booking-thumb">
                @if (booking.propertyImageUrl) {
                  <img [src]="booking.propertyImageUrl" [alt]="booking.propertyTitle" />
                } @else {
                  <span class="material-symbols-outlined thumb-icon">apartment</span>
                }
              </div>

              <!-- Details -->
              <div class="booking-details">
                <p class="booking-property">{{ booking.propertyTitle }}</p>
                <p class="booking-location">
                  <span class="material-symbols-outlined loc-icon">location_on</span>
                  {{ booking.propertyLocation }}
                </p>
                <div class="booking-meta">
                  <span class="meta-chip">
                    <span class="material-symbols-outlined">{{ booking.type === 'visit' ? 'calendar_today' : 'mail' }}</span>
                    {{ booking.type === 'visit' ? 'Visita' : 'Mensagem' }}
                  </span>
                  <span class="meta-chip">
                    <span class="material-symbols-outlined">schedule</span>
                    {{ booking.date }}{{ booking.time ? ' · ' + booking.time : '' }}
                  </span>
                  @if (booking.priceMonthly) {
                    <span class="meta-chip price">
                      €{{ booking.priceMonthly | number:'1.0-0' }}/mês
                    </span>
                  }
                </div>
              </div>

              <!-- Status + Actions -->
              <div class="booking-right">
                <span class="status-chip" [class]="'chip-' + booking.status">
                  <span class="status-dot"></span>
                  {{ statusLabel(booking.status) }}
                </span>
                <div class="booking-actions">
                  @if (booking.status === 'pending' || booking.status === 'confirmed') {
                    <button class="action-btn cancel" (click)="cancel.emit(booking)" aria-label="Cancelar reserva">
                      <span class="material-symbols-outlined">cancel</span>
                    </button>
                  }
                  @if (booking.status === 'confirmed') {
                    <button class="action-btn info" (click)="view.emit(booking)" aria-label="Ver detalhes">
                      <span class="material-symbols-outlined">open_in_new</span>
                    </button>
                  }
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

    .iu-my-bookings {
      font-family: 'Roboto', sans-serif;
    }

    /* ── Header ── */
    .bookings-header {
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
      color: var(--md-sys-color-primary, #6750a4);
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

    /* ── Tabs ── */
    .tab-bar {
      display: flex;
      gap: 4px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      border-radius: 100px;
      padding: 4px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 100px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--md-sys-color-surface, #fffbfe);
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(0,0,0,.12);
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 100px;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      font-size: 0.7rem;
      font-weight: 700;
    }

    /* ── Empty ── */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .empty-icon { font-size: 48px; opacity: 0.4; }

    .empty p { margin: 0; font-size: 0.95rem; }

    /* ── Booking cards ── */
    .booking-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .booking-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 16px;
      padding: 16px;
      transition: box-shadow 0.2s;
    }

    .booking-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }

    .booking-card.status-cancelled {
      opacity: 0.6;
      border-style: dashed;
    }

    /* Thumbnail */
    .booking-thumb {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      flex-shrink: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .booking-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-icon {
      font-size: 28px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      opacity: 0.5;
    }

    /* Details */
    .booking-details {
      flex: 1;
      min-width: 0;
    }

    .booking-property {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .booking-location {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0 0 8px;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .loc-icon { font-size: 14px; }

    .booking-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px;
      border-radius: 100px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .meta-chip .material-symbols-outlined { font-size: 13px; }

    .meta-chip.price {
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-weight: 600;
    }

    /* Right col */
    .booking-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .chip-pending { background: #fff8e1; color: #795548; }
    .chip-pending .status-dot { background: #ff8f00; }

    .chip-confirmed { background: #e8f5e9; color: #2e7d32; }
    .chip-confirmed .status-dot { background: #43a047; }

    .chip-cancelled { background: #fce4ec; color: #c62828; }
    .chip-cancelled .status-dot { background: #e53935; }

    .chip-completed { background: var(--md-sys-color-secondary-container, #e8def8); color: var(--md-sys-color-on-secondary-container, #1d192b); }
    .chip-completed .status-dot { background: var(--md-sys-color-secondary, #625b71); }

    .booking-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.2s;
    }

    .action-btn .material-symbols-outlined { font-size: 18px; }

    .action-btn.cancel { color: var(--md-sys-color-error, #b3261e); }
    .action-btn.cancel:hover { background: var(--md-sys-color-error-container, #f9dedc); }

    .action-btn.info { color: var(--md-sys-color-primary, #6750a4); }
    .action-btn.info:hover { background: var(--md-sys-color-primary-container, #eaddff); }

    @media (max-width: 600px) {
      .booking-card { flex-wrap: wrap; }
      .booking-right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
      .bookings-header { flex-direction: column; }
    }
  `],
})
export class MyBookingsComponent {
  /** List of booking records to display. */
  readonly bookings = input<BookingRecord[]>([]);

  /** Emits when user clicks cancel on a booking. */
  readonly cancel = output<BookingRecord>();

  /** Emits when user clicks view/open on a booking. */
  readonly view = output<BookingRecord>();

  readonly activeTab = signal<'all' | 'visit' | 'inquiry' | 'completed'>('all');

  readonly tabs = [
    { key: 'all' as const, label: 'Todos' },
    { key: 'visit' as const, label: 'Visitas' },
    { key: 'inquiry' as const, label: 'Mensagens' },
    { key: 'completed' as const, label: 'Concluídos' },
  ];

  readonly total = computed(() => this.bookings().length);

  readonly filtered = computed(() => {
    const tab = this.activeTab();
    const all = this.bookings();
    if (tab === 'all') return all;
    if (tab === 'completed') return all.filter(b => b.status === 'completed' || b.status === 'cancelled');
    return all.filter(b => b.type === tab);
  });

  countForTab(key: string): number {
    const all = this.bookings();
    if (key === 'all') return all.length;
    if (key === 'completed') return all.filter(b => b.status === 'completed' || b.status === 'cancelled').length;
    return all.filter(b => b.type === key).length;
  }

  statusLabel(status: BookingRecord['status']): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      completed: 'Concluído',
    };
    return map[status] ?? status;
  }
}
