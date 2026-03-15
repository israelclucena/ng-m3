import {
  Component, input, output, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminInquiry, AdminBooking, AdminReview, AdminProperty,
  AdminPanelTab,
  AdminInquiryActionEvent, AdminBookingActionEvent,
  AdminReviewActionEvent, AdminPropertyActionEvent,
} from './admin-panel.types';

/**
 * `iu-admin-panel`
 *
 * Centralised landlord/admin moderation panel with four tabs:
 * Inquiries · Bookings · Reviews · Properties.
 *
 * Uses Angular Signals throughout — no RxJS. M3 design tokens only.
 *
 * @example
 * ```html
 * <iu-admin-panel
 *   [inquiries]="inquiries"
 *   [bookings]="bookings"
 *   [reviews]="reviews"
 *   [properties]="properties"
 *   (inquiryAction)="onInquiryAction($event)"
 *   (bookingAction)="onBookingAction($event)"
 *   (reviewAction)="onReviewAction($event)"
 *   (propertyAction)="onPropertyAction($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="admin-panel">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="admin-header">
        <div class="admin-title">
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <div>
            <h2>Admin Panel</h2>
            <p>Moderação e gestão centralizada</p>
          </div>
        </div>
        <div class="admin-stats">
          @if (pendingInquiries() > 0) {
            <div class="stat-chip stat-chip--warn">
              <span class="material-symbols-outlined">mail</span>
              {{ pendingInquiries() }} inquérito{{ pendingInquiries() !== 1 ? 's' : '' }}
            </div>
          }
          @if (pendingBookings() > 0) {
            <div class="stat-chip stat-chip--primary">
              <span class="material-symbols-outlined">event</span>
              {{ pendingBookings() }} reserva{{ pendingBookings() !== 1 ? 's' : '' }}
            </div>
          }
          @if (pendingReviews() > 0) {
            <div class="stat-chip stat-chip--error">
              <span class="material-symbols-outlined">flag</span>
              {{ pendingReviews() }} review{{ pendingReviews() !== 1 ? 's' : '' }}
            </div>
          }
        </div>
      </div>

      <!-- ── Tab Bar ─────────────────────────────────────────────── -->
      <div class="tab-bar" role="tablist">
        @for (tab of tabs; track tab.key) {
          <button
            class="tab-btn"
            [class.tab-btn--active]="activeTab() === tab.key"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.key"
            (click)="activeTab.set(tab.key)"
          >
            <span class="material-symbols-outlined">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            @if (tab.badge() > 0) {
              <span class="tab-badge">{{ tab.badge() }}</span>
            }
          </button>
        }
      </div>

      <!-- ── Tab Content ─────────────────────────────────────────── -->
      <div class="tab-content">

        <!-- ══ INQUIRIES ══════════════════════════════════════════ -->
        @if (activeTab() === 'inquiries') {
          <div class="panel-section">
            <div class="section-toolbar">
              <span class="section-count">{{ inquiries().length }} inquérito(s)</span>
              <div class="filter-chips">
                @for (f of inquiryFilters; track f.value) {
                  <button
                    class="filter-chip"
                    [class.filter-chip--active]="inquiryFilter() === f.value"
                    (click)="inquiryFilter.set(f.value)"
                  >{{ f.label }}</button>
                }
              </div>
            </div>

            @if (filteredInquiries().length === 0) {
              <div class="empty-tab">
                <span class="material-symbols-outlined">inbox</span>
                <p>Sem inquéritos {{ inquiryFilter() !== 'all' ? 'nesta categoria' : '' }}</p>
              </div>
            } @else {
              <div class="list">
                @for (inq of filteredInquiries(); track inq.id) {
                  <div class="inq-card" [class.inq-card--unread]="inq.unread">
                    <div class="inq-avatar">{{ inq.tenantAvatarInitials ?? inq.tenantName.slice(0,2).toUpperCase() }}</div>
                    <div class="inq-body">
                      <div class="inq-meta">
                        <strong>{{ inq.tenantName }}</strong>
                        <span class="inq-email">{{ inq.tenantEmail }}</span>
                        <span class="inq-date">{{ inq.receivedAt | date:'d MMM y, HH:mm' }}</span>
                      </div>
                      <div class="inq-property">
                        <span class="material-symbols-outlined" style="font-size:14px">home</span>
                        {{ inq.propertyTitle }}
                      </div>
                      <p class="inq-message">{{ inq.message }}</p>
                      <div class="inq-actions">
                        <div class="status-badge status-badge--{{ inq.status }}">{{ statusLabel(inq.status) }}</div>
                        <button class="action-btn action-btn--primary" (click)="emit('inquiryAction', { inquiry: inq, action: 'reply' })">
                          <span class="material-symbols-outlined">reply</span> Responder
                        </button>
                        @if (inq.unread) {
                          <button class="action-btn" (click)="emit('inquiryAction', { inquiry: inq, action: 'mark_read' })">
                            <span class="material-symbols-outlined">mark_email_read</span> Lido
                          </button>
                        }
                        <button class="action-btn action-btn--muted" (click)="emit('inquiryAction', { inquiry: inq, action: 'archive' })">
                          <span class="material-symbols-outlined">archive</span> Arquivar
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ══ BOOKINGS ═══════════════════════════════════════════ -->
        @if (activeTab() === 'bookings') {
          <div class="panel-section">
            <div class="section-toolbar">
              <span class="section-count">{{ bookings().length }} reserva(s)</span>
              <div class="filter-chips">
                @for (f of bookingFilters; track f.value) {
                  <button
                    class="filter-chip"
                    [class.filter-chip--active]="bookingFilter() === f.value"
                    (click)="bookingFilter.set(f.value)"
                  >{{ f.label }}</button>
                }
              </div>
            </div>

            @if (filteredBookings().length === 0) {
              <div class="empty-tab">
                <span class="material-symbols-outlined">event_busy</span>
                <p>Sem reservas {{ bookingFilter() !== 'all' ? 'nesta categoria' : '' }}</p>
              </div>
            } @else {
              <div class="list">
                @for (bk of filteredBookings(); track bk.id) {
                  <div class="bk-card">
                    <div class="bk-header">
                      <div>
                        <strong>{{ bk.tenantName }}</strong>
                        <span class="bk-email">{{ bk.tenantEmail }}</span>
                      </div>
                      <div class="bk-type-badge bk-type-badge--{{ bk.bookingType }}">
                        <span class="material-symbols-outlined">{{ bk.bookingType === 'visit' ? 'calendar_month' : 'key' }}</span>
                        {{ bk.bookingType === 'visit' ? 'Visita' : 'Arrendamento' }}
                      </div>
                    </div>
                    <div class="bk-property">
                      <span class="material-symbols-outlined" style="font-size:14px">home</span>
                      {{ bk.propertyTitle }}
                    </div>
                    <div class="bk-details">
                      <div class="bk-detail-item">
                        <span class="material-symbols-outlined">event</span>
                        {{ bk.requestedDate | date:'d MMM y' }}
                      </div>
                      @if (bk.durationMonths) {
                        <div class="bk-detail-item">
                          <span class="material-symbols-outlined">calendar_view_month</span>
                          {{ bk.durationMonths }} meses
                        </div>
                      }
                      @if (bk.monthlyRent) {
                        <div class="bk-detail-item">
                          <span class="material-symbols-outlined">payments</span>
                          {{ bk.monthlyRent | currency:bk.currency:'symbol':'1.0-0' }}/mês
                        </div>
                      }
                    </div>
                    @if (bk.notes) {
                      <p class="bk-notes">{{ bk.notes }}</p>
                    }
                    <div class="bk-footer">
                      <div class="status-badge status-badge--{{ bk.status }}">{{ bookingStatusLabel(bk.status) }}</div>
                      @if (bk.status === 'pending_approval') {
                        <div class="bk-actions">
                          <button class="action-btn action-btn--success" (click)="emit('bookingAction', { booking: bk, action: 'approve' })">
                            <span class="material-symbols-outlined">check_circle</span> Aprovar
                          </button>
                          <button class="action-btn action-btn--danger" (click)="emit('bookingAction', { booking: bk, action: 'reject' })">
                            <span class="material-symbols-outlined">cancel</span> Rejeitar
                          </button>
                        </div>
                      }
                      @if (bk.status === 'approved') {
                        <button class="action-btn action-btn--muted" (click)="emit('bookingAction', { booking: bk, action: 'cancel' })">
                          <span class="material-symbols-outlined">block</span> Cancelar
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ══ REVIEWS ════════════════════════════════════════════ -->
        @if (activeTab() === 'reviews') {
          <div class="panel-section">
            <div class="section-toolbar">
              <span class="section-count">{{ reviews().length }} review(s)</span>
              <div class="filter-chips">
                @for (f of reviewFilters; track f.value) {
                  <button
                    class="filter-chip"
                    [class.filter-chip--active]="reviewFilter() === f.value"
                    (click)="reviewFilter.set(f.value)"
                  >{{ f.label }}</button>
                }
              </div>
            </div>

            @if (filteredReviews().length === 0) {
              <div class="empty-tab">
                <span class="material-symbols-outlined">rate_review</span>
                <p>Sem reviews {{ reviewFilter() !== 'all' ? 'nesta categoria' : '' }}</p>
              </div>
            } @else {
              <div class="list">
                @for (rv of filteredReviews(); track rv.id) {
                  <div class="rv-card" [class.rv-card--flagged]="rv.flagged">
                    <div class="rv-header">
                      <div class="rv-author">
                        <strong>{{ rv.authorName }}</strong>
                        <div class="star-row">
                          @for (s of starArray(rv.rating); track $index) {
                            <span class="material-symbols-outlined star-icon" [class.star-icon--filled]="s === 'full'">star</span>
                          }
                        </div>
                      </div>
                      <div class="rv-meta">
                        <span class="rv-date">{{ rv.submittedAt | date:'d MMM y' }}</span>
                        @if (rv.flagged) {
                          <span class="flag-badge"><span class="material-symbols-outlined">flag</span> Sinalizada</span>
                        }
                      </div>
                    </div>
                    <div class="rv-property">
                      <span class="material-symbols-outlined" style="font-size:14px">home</span>
                      {{ rv.propertyTitle }}
                    </div>
                    <p class="rv-body">{{ rv.body }}</p>
                    <div class="rv-footer">
                      <div class="status-badge status-badge--{{ rv.status }}">{{ reviewStatusLabel(rv.status) }}</div>
                      @if (rv.landlordReplied) {
                        <span class="replied-badge">
                          <span class="material-symbols-outlined" style="font-size:14px">reply</span> Respondida
                        </span>
                      }
                      <div class="rv-actions">
                        @if (rv.status === 'pending') {
                          <button class="action-btn action-btn--success" (click)="emit('reviewAction', { review: rv, action: 'approve' })">
                            <span class="material-symbols-outlined">check</span> Aprovar
                          </button>
                          <button class="action-btn action-btn--danger" (click)="emit('reviewAction', { review: rv, action: 'reject' })">
                            <span class="material-symbols-outlined">block</span> Rejeitar
                          </button>
                        }
                        @if (!rv.flagged) {
                          <button class="action-btn action-btn--warn" (click)="emit('reviewAction', { review: rv, action: 'flag' })">
                            <span class="material-symbols-outlined">flag</span> Sinalizar
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- ══ PROPERTIES ═════════════════════════════════════════ -->
        @if (activeTab() === 'properties') {
          <div class="panel-section">
            <div class="section-toolbar">
              <span class="section-count">{{ properties().length }} propriedade(s)</span>
              <div class="filter-chips">
                @for (f of propertyFilters; track f.value) {
                  <button
                    class="filter-chip"
                    [class.filter-chip--active]="propertyFilter() === f.value"
                    (click)="propertyFilter.set(f.value)"
                  >{{ f.label }}</button>
                }
              </div>
            </div>

            @if (filteredProperties().length === 0) {
              <div class="empty-tab">
                <span class="material-symbols-outlined">home_work</span>
                <p>Sem propriedades {{ propertyFilter() !== 'all' ? 'nesta categoria' : '' }}</p>
              </div>
            } @else {
              <div class="prop-table">
                <div class="prop-table-head">
                  <span>Propriedade</span>
                  <span>Proprietário</span>
                  <span>Renda</span>
                  <span>Estatísticas</span>
                  <span>Estado</span>
                  <span>Acções</span>
                </div>
                @for (pr of filteredProperties(); track pr.id) {
                  <div class="prop-row">
                    <div class="prop-cell prop-cell--title">
                      <strong>{{ pr.title }}</strong>
                      <span class="prop-location">
                        <span class="material-symbols-outlined" style="font-size:12px">location_on</span>
                        {{ pr.location }}
                      </span>
                    </div>
                    <div class="prop-cell">
                      <span>{{ pr.landlordName }}</span>
                      <span class="prop-email">{{ pr.landlordEmail }}</span>
                    </div>
                    <div class="prop-cell prop-cell--rent">
                      {{ pr.monthlyRent | currency:pr.currency:'symbol':'1.0-0' }}/mês
                    </div>
                    <div class="prop-cell prop-cell--stats">
                      <span class="stat-item"><span class="material-symbols-outlined">visibility</span>{{ pr.viewCount }}</span>
                      <span class="stat-item"><span class="material-symbols-outlined">mail</span>{{ pr.inquiryCount }}</span>
                      <span class="stat-item"><span class="material-symbols-outlined">event</span>{{ pr.bookingCount }}</span>
                    </div>
                    <div class="prop-cell">
                      <div class="status-badge status-badge--{{ pr.status }}">{{ propertyStatusLabel(pr.status) }}</div>
                    </div>
                    <div class="prop-cell prop-cell--actions">
                      @if (pr.status === 'pending_review') {
                        <button class="action-btn action-btn--success" (click)="emit('propertyAction', { property: pr, action: 'approve' })">
                          <span class="material-symbols-outlined">check</span>
                        </button>
                        <button class="action-btn action-btn--danger" (click)="emit('propertyAction', { property: pr, action: 'reject' })">
                          <span class="material-symbols-outlined">close</span>
                        </button>
                      }
                      @if (pr.status === 'active') {
                        <button class="action-btn action-btn--muted" (click)="emit('propertyAction', { property: pr, action: 'pause' })">
                          <span class="material-symbols-outlined">pause</span>
                        </button>
                      }
                      @if (pr.status === 'paused') {
                        <button class="action-btn action-btn--primary" (click)="emit('propertyAction', { property: pr, action: 'activate' })">
                          <span class="material-symbols-outlined">play_arrow</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .admin-panel {
      background: var(--md-sys-color-surface);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    /* ── Header ─────────────────────────────────── */
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px 16px;
      background: var(--md-sys-color-surface-container-low);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .admin-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .admin-title .material-symbols-outlined {
      font-size: 32px;
      color: var(--md-sys-color-primary);
    }
    .admin-title h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .admin-title p {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .admin-stats { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .stat-chip .material-symbols-outlined { font-size: 14px; }
    .stat-chip--primary { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .stat-chip--warn    { background: #fff3e0; color: #e65100; }
    .stat-chip--error   { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }

    /* ── Tab Bar ─────────────────────────────────── */
    .tab-bar {
      display: flex;
      background: var(--md-sys-color-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      overflow-x: auto;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 14px 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      transition: color .15s, border-color .15s;
    }
    .tab-btn .material-symbols-outlined { font-size: 18px; }
    .tab-btn:hover { color: var(--md-sys-color-primary); background: var(--md-sys-color-surface-container-low); }
    .tab-btn--active {
      color: var(--md-sys-color-primary);
      border-bottom-color: var(--md-sys-color-primary);
    }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 100px;
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      font-size: 0.7rem;
      font-weight: 700;
    }

    /* ── Tab Content ─────────────────────────────── */
    .tab-content { padding: 20px 24px 24px; }
    .panel-section { }
    .section-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .section-count {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant);
    }
    .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-chip {
      padding: 4px 12px;
      border-radius: 100px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      font-size: 0.78rem;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant);
      transition: all .15s;
    }
    .filter-chip--active {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border-color: transparent;
      font-weight: 600;
    }

    .empty-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 12px;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.5;
    }
    .empty-tab .material-symbols-outlined { font-size: 48px; }
    .empty-tab p { margin: 0; font-size: 0.9rem; }

    /* ── Shared list / card styles ──────────────── */
    .list { display: flex; flex-direction: column; gap: 12px; }

    /* ── Inquiry Cards ───────────────────────────── */
    .inq-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
      transition: border-color .15s;
    }
    .inq-card--unread {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-primary-container);
    }
    .inq-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .inq-body { flex: 1; min-width: 0; }
    .inq-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .inq-meta strong { font-size: 0.9rem; color: var(--md-sys-color-on-surface); }
    .inq-email { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); }
    .inq-date { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-left: auto; }
    .inq-property {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--md-sys-color-primary);
      font-weight: 500;
      margin-bottom: 6px;
    }
    .inq-message {
      margin: 0 0 10px;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .inq-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

    /* ── Booking Cards ───────────────────────────── */
    .bk-card {
      padding: 16px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    .bk-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
      gap: 8px;
    }
    .bk-header strong { display: block; font-size: 0.9rem; color: var(--md-sys-color-on-surface); }
    .bk-email { font-size: 0.8rem; color: var(--md-sys-color-on-surface-variant); }
    .bk-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .bk-type-badge .material-symbols-outlined { font-size: 13px; }
    .bk-type-badge--visit  { background: #e8f5e9; color: #2e7d32; }
    .bk-type-badge--rental { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .bk-property {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--md-sys-color-primary);
      font-weight: 500;
      margin-bottom: 8px;
    }
    .bk-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .bk-detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .bk-detail-item .material-symbols-outlined { font-size: 14px; }
    .bk-notes {
      font-size: 0.82rem;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 0 8px;
      font-style: italic;
    }
    .bk-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .bk-actions { display: flex; gap: 6px; }

    /* ── Review Cards ────────────────────────────── */
    .rv-card {
      padding: 16px;
      border-radius: 12px;
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    .rv-card--flagged {
      border-color: var(--md-sys-color-error);
      background: var(--md-sys-color-error-container);
    }
    .rv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
      gap: 8px;
    }
    .rv-author strong { display: block; font-size: 0.9rem; color: var(--md-sys-color-on-surface); margin-bottom: 4px; }
    .star-row { display: flex; gap: 1px; }
    .star-icon {
      font-size: 14px;
      color: var(--md-sys-color-outline);
    }
    .star-icon--filled { color: #F59E0B; }
    .rv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .rv-date { font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); }
    .flag-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--md-sys-color-error);
    }
    .rv-property {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--md-sys-color-primary);
      font-weight: 500;
      margin-bottom: 8px;
    }
    .rv-body {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 10px;
      line-height: 1.5;
    }
    .rv-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .replied-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .rv-actions { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }

    /* ── Properties Table ────────────────────────── */
    .prop-table {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px;
      overflow: hidden;
    }
    .prop-table-head, .prop-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr;
      gap: 12px;
      padding: 10px 16px;
      align-items: center;
    }
    .prop-table-head {
      background: var(--md-sys-color-surface-container);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .prop-row {
      border-top: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface);
    }
    .prop-row:hover { background: var(--md-sys-color-surface-container-low); }
    .prop-cell { font-size: 0.85rem; color: var(--md-sys-color-on-surface); }
    .prop-cell--title strong { display: block; font-weight: 600; margin-bottom: 2px; }
    .prop-location {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .prop-email { display: block; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); }
    .prop-cell--rent { font-weight: 700; color: var(--md-sys-color-primary); }
    .prop-cell--stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.78rem;
      color: var(--md-sys-color-on-surface-variant);
    }
    .stat-item .material-symbols-outlined { font-size: 12px; }
    .prop-cell--actions { display: flex; gap: 4px; }

    /* ── Shared Action Buttons ───────────────────── */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 100px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
      transition: all .15s;
    }
    .action-btn .material-symbols-outlined { font-size: 14px; }
    .action-btn:hover { background: var(--md-sys-color-surface-container); }
    .action-btn--primary { border-color: var(--md-sys-color-primary); color: var(--md-sys-color-primary); }
    .action-btn--primary:hover { background: var(--md-sys-color-primary-container); }
    .action-btn--success { border-color: #2e7d32; color: #2e7d32; }
    .action-btn--success:hover { background: #e8f5e9; }
    .action-btn--danger  { border-color: var(--md-sys-color-error); color: var(--md-sys-color-error); }
    .action-btn--danger:hover  { background: var(--md-sys-color-error-container); }
    .action-btn--warn    { border-color: #e65100; color: #e65100; }
    .action-btn--warn:hover    { background: #fff3e0; }
    .action-btn--muted   { opacity: .7; }

    /* ── Status Badges ───────────────────────────── */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-badge--new, .status-badge--pending_approval, .status-badge--pending {
      background: #fff3e0;
      color: #e65100;
    }
    .status-badge--replied, .status-badge--approved {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge--archived, .status-badge--cancelled {
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
    }
    .status-badge--rejected {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }
    .status-badge--completed {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .status-badge--active {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge--paused {
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
    }
    .status-badge--pending_review {
      background: #fff3e0;
      color: #e65100;
    }
  `],
})
export class AdminPanelComponent {

  /** @input List of tenant inquiries */
  inquiries = input<AdminInquiry[]>([]);
  /** @input List of booking requests */
  bookings = input<AdminBooking[]>([]);
  /** @input List of property reviews to moderate */
  reviews = input<AdminReview[]>([]);
  /** @input List of managed properties */
  properties = input<AdminProperty[]>([]);
  /** @input Initially active tab */
  defaultTab = input<AdminPanelTab>('inquiries');

  /** @output Inquiry moderation action */
  inquiryAction = output<AdminInquiryActionEvent>();
  /** @output Booking approval/rejection action */
  bookingAction = output<AdminBookingActionEvent>();
  /** @output Review moderation action */
  reviewAction = output<AdminReviewActionEvent>();
  /** @output Property status action */
  propertyAction = output<AdminPropertyActionEvent>();

  // ── State ──────────────────────────────────────────────────────────────
  readonly activeTab = signal<AdminPanelTab>('inquiries');
  readonly inquiryFilter  = signal<string>('all');
  readonly bookingFilter  = signal<string>('all');
  readonly reviewFilter   = signal<string>('all');
  readonly propertyFilter = signal<string>('all');

  // ── Computed counts ────────────────────────────────────────────────────
  readonly pendingInquiries = computed(() =>
    this.inquiries().filter(i => i.status === 'new' || i.unread).length
  );
  readonly pendingBookings = computed(() =>
    this.bookings().filter(b => b.status === 'pending_approval').length
  );
  readonly pendingReviews = computed(() =>
    this.reviews().filter(r => r.status === 'pending' || r.flagged).length
  );

  // ── Filtered lists ─────────────────────────────────────────────────────
  readonly filteredInquiries = computed(() => {
    const f = this.inquiryFilter();
    const list = this.inquiries();
    if (f === 'all') return list;
    if (f === 'unread') return list.filter(i => i.unread);
    return list.filter(i => i.status === f);
  });

  readonly filteredBookings = computed(() => {
    const f = this.bookingFilter();
    const list = this.bookings();
    if (f === 'all') return list;
    return list.filter(b => b.status === f);
  });

  readonly filteredReviews = computed(() => {
    const f = this.reviewFilter();
    const list = this.reviews();
    if (f === 'all') return list;
    if (f === 'flagged') return list.filter(r => r.flagged);
    return list.filter(r => r.status === f);
  });

  readonly filteredProperties = computed(() => {
    const f = this.propertyFilter();
    const list = this.properties();
    if (f === 'all') return list;
    return list.filter(p => p.status === f);
  });

  // ── Tab config ──────────────────────────────────────────────────────────
  readonly tabs = [
    { key: 'inquiries'   as AdminPanelTab, label: 'Inquéritos', icon: 'mail',               badge: this.pendingInquiries },
    { key: 'bookings'    as AdminPanelTab, label: 'Reservas',   icon: 'event',               badge: this.pendingBookings  },
    { key: 'reviews'     as AdminPanelTab, label: 'Reviews',    icon: 'rate_review',          badge: this.pendingReviews  },
    { key: 'properties'  as AdminPanelTab, label: 'Imóveis',    icon: 'home_work',            badge: signal(0)            },
  ];

  // ── Filter configs ──────────────────────────────────────────────────────
  readonly inquiryFilters  = [
    { value: 'all',      label: 'Todos'     },
    { value: 'unread',   label: 'Não lidos' },
    { value: 'new',      label: 'Novos'     },
    { value: 'replied',  label: 'Respondidos' },
    { value: 'archived', label: 'Arquivados' },
  ];
  readonly bookingFilters = [
    { value: 'all',              label: 'Todos'           },
    { value: 'pending_approval', label: 'Pendentes'       },
    { value: 'approved',         label: 'Aprovados'       },
    { value: 'rejected',         label: 'Rejeitados'      },
    { value: 'completed',        label: 'Concluídos'      },
    { value: 'cancelled',        label: 'Cancelados'      },
  ];
  readonly reviewFilters = [
    { value: 'all',      label: 'Todas'      },
    { value: 'pending',  label: 'Pendentes'  },
    { value: 'approved', label: 'Aprovadas'  },
    { value: 'rejected', label: 'Rejeitadas' },
    { value: 'flagged',  label: 'Sinalizadas' },
  ];
  readonly propertyFilters = [
    { value: 'all',            label: 'Todas'     },
    { value: 'active',         label: 'Activas'   },
    { value: 'pending_review', label: 'Pendentes' },
    { value: 'paused',         label: 'Pausadas'  },
    { value: 'rejected',       label: 'Rejeitadas' },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Emit any typed event (avoids repetition in template) */
  emit(type: 'inquiryAction', ev: AdminInquiryActionEvent): void;
  emit(type: 'bookingAction',  ev: AdminBookingActionEvent):  void;
  emit(type: 'reviewAction',   ev: AdminReviewActionEvent):   void;
  emit(type: 'propertyAction', ev: AdminPropertyActionEvent): void;
  emit(type: string, ev: unknown): void {
    if (type === 'inquiryAction')  this.inquiryAction.emit(ev  as AdminInquiryActionEvent);
    if (type === 'bookingAction')  this.bookingAction.emit(ev  as AdminBookingActionEvent);
    if (type === 'reviewAction')   this.reviewAction.emit(ev   as AdminReviewActionEvent);
    if (type === 'propertyAction') this.propertyAction.emit(ev as AdminPropertyActionEvent);
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { new: 'Novo', replied: 'Respondido', archived: 'Arquivado' };
    return map[s] ?? s;
  }

  bookingStatusLabel(s: string): string {
    const map: Record<string, string> = {
      pending_approval: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado',
      cancelled: 'Cancelado', completed: 'Concluído',
    };
    return map[s] ?? s;
  }

  reviewStatusLabel(s: string): string {
    const map: Record<string, string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };
    return map[s] ?? s;
  }

  propertyStatusLabel(s: string): string {
    const map: Record<string, string> = {
      active: 'Activa', paused: 'Pausada', pending_review: 'Em revisão', rejected: 'Rejeitada',
    };
    return map[s] ?? s;
  }

  /** Returns an array of 'full'/'empty' for star rendering */
  starArray(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? 'full' : 'empty'));
  }
}
