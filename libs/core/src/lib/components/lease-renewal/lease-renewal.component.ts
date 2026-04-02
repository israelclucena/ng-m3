import {
  Component, ChangeDetectionStrategy, Input, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaseRenewalService } from '../../services/lease-renewal.service';
import type { LeaseRenewal, RenewalStatus } from '../../services/lease-renewal.service';

const STATUS_LABELS: Record<RenewalStatus, string> = {
  expiring_soon: 'Expiring Soon',
  offer_sent: 'Offer Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

/**
 * LeaseRenewalComponent — lease renewal manager for landlords and tenants.
 *
 * Displays KPI strip (expiring soon, offers sent, accepted, declined), a filtered
 * renewal list with urgency indicators, and action buttons to send offers or respond.
 *
 * @example
 * <iu-lease-renewal mode="landlord" />
 * <iu-lease-renewal mode="tenant" tenantId="tenant-001" />
 */
@Component({
  selector: 'iu-lease-renewal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="lr-root">

      <!-- Header -->
      <div class="lr-header">
        <span class="material-symbols-outlined lr-header-icon">autorenew</span>
        <div>
          <h2 class="lr-title">Lease Renewals</h2>
          <p class="lr-subtitle">{{ mode === 'landlord' ? 'Manage upcoming lease expirations and renewal offers' : 'Your lease renewal status' }}</p>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="lr-kpis">
        <div class="lr-kpi lr-kpi-warning">
          <span class="material-symbols-outlined lr-kpi-icon">timer</span>
          <div>
            <span class="lr-kpi-num">{{ svc.kpis().expiringSoon }}</span>
            <span class="lr-kpi-label">Expiring Soon</span>
          </div>
        </div>
        <div class="lr-kpi lr-kpi-info">
          <span class="material-symbols-outlined lr-kpi-icon">send</span>
          <div>
            <span class="lr-kpi-num">{{ svc.kpis().offerSent }}</span>
            <span class="lr-kpi-label">Offers Sent</span>
          </div>
        </div>
        <div class="lr-kpi lr-kpi-success">
          <span class="material-symbols-outlined lr-kpi-icon">check_circle</span>
          <div>
            <span class="lr-kpi-num">{{ svc.kpis().accepted }}</span>
            <span class="lr-kpi-label">Accepted</span>
          </div>
        </div>
        <div class="lr-kpi lr-kpi-danger">
          <span class="material-symbols-outlined lr-kpi-icon">cancel</span>
          <div>
            <span class="lr-kpi-num">{{ svc.kpis().declined }}</span>
            <span class="lr-kpi-label">Declined</span>
          </div>
        </div>
      </div>

      <!-- Urgent Alert Banner -->
      <div *ngIf="svc.kpis().urgent > 0 && mode === 'landlord'" class="lr-urgent-banner">
        <span class="material-symbols-outlined">priority_high</span>
        {{ svc.kpis().urgent }} lease{{ svc.kpis().urgent > 1 ? 's' : '' }} expiring within 30 days — action required
      </div>

      <!-- Filter Bar -->
      <div class="lr-filters">
        <button *ngFor="let f of filters"
                class="lr-filter-btn"
                [class.lr-filter-active]="svc.filter() === f.value"
                (click)="svc.setFilter(f.value)">
          {{ f.label }}
        </button>
      </div>

      <!-- Renewal Cards -->
      <div class="lr-list">
        <div *ngIf="svc.filtered().length === 0" class="lr-empty">
          <span class="material-symbols-outlined lr-empty-icon">event_available</span>
          <p>No renewal records</p>
        </div>

        <div *ngFor="let r of svc.filtered()" class="lr-card" [class.lr-card-urgent]="svc.urgency(r) === 'high'">

          <!-- Left urgency stripe -->
          <div class="lr-card-stripe" [class.lr-stripe-high]="svc.urgency(r) === 'high'"
               [class.lr-stripe-medium]="svc.urgency(r) === 'medium'"
               [class.lr-stripe-low]="svc.urgency(r) === 'low'"></div>

          <div class="lr-card-body">
            <div class="lr-card-top">
              <div class="lr-card-info">
                <div class="lr-card-address">
                  <span class="material-symbols-outlined lr-icon-sm">location_on</span>
                  {{ r.propertyAddress }}
                </div>
                <div class="lr-card-meta">
                  <span class="lr-meta">
                    <span class="material-symbols-outlined">person</span>{{ r.tenantName }}
                  </span>
                  <span class="lr-meta">
                    <span class="material-symbols-outlined">calendar_today</span>Expires {{ r.currentEndDate }}
                  </span>
                  <span class="lr-days-chip" [class.lr-days-urgent]="svc.urgency(r) === 'high'"
                        [class.lr-days-medium]="svc.urgency(r) === 'medium'">
                    {{ r.daysUntilExpiry }}d left
                  </span>
                </div>
              </div>
              <span class="lr-status-chip lr-status-{{ r.status }}">
                {{ statusLabel(r.status) }}
              </span>
            </div>

            <!-- Rent comparison -->
            <div class="lr-rent-row">
              <div class="lr-rent-block">
                <span class="lr-rent-label">Current Rent</span>
                <span class="lr-rent-value">€{{ r.currentMonthlyRent }}/mo</span>
              </div>
              <span class="material-symbols-outlined lr-rent-arrow">arrow_forward</span>
              <div class="lr-rent-block">
                <span class="lr-rent-label">Proposed Rent</span>
                <span class="lr-rent-value lr-rent-proposed">€{{ r.proposedMonthlyRent }}/mo</span>
              </div>
              <span *ngIf="r.rentChangePercent !== 0"
                    class="lr-change-badge"
                    [class.lr-change-up]="r.rentChangePercent > 0"
                    [class.lr-change-flat]="r.rentChangePercent === 0">
                {{ r.rentChangePercent > 0 ? '+' : '' }}{{ r.rentChangePercent }}%
              </span>
              <span *ngIf="r.rentChangePercent === 0" class="lr-change-badge lr-change-flat">No change</span>
            </div>

            <p *ngIf="r.notes" class="lr-notes">{{ r.notes }}</p>
            <p *ngIf="r.declineReason" class="lr-decline-reason">
              <span class="material-symbols-outlined">info</span>
              Reason: {{ r.declineReason }}
            </p>

            <!-- Actions -->
            <div class="lr-actions">
              <!-- Landlord actions -->
              <ng-container *ngIf="mode === 'landlord'">
                <button *ngIf="r.status === 'expiring_soon'"
                        class="lr-btn lr-btn-primary"
                        (click)="sendOffer(r)">
                  <span class="material-symbols-outlined">send</span>
                  Send Renewal Offer
                </button>
              </ng-container>

              <!-- Tenant actions -->
              <ng-container *ngIf="mode === 'tenant'">
                <button *ngIf="r.status === 'offer_sent'"
                        class="lr-btn lr-btn-accept"
                        (click)="svc.accept(r.id)">
                  <span class="material-symbols-outlined">check_circle</span>
                  Accept
                </button>
                <button *ngIf="r.status === 'offer_sent'"
                        class="lr-btn lr-btn-decline"
                        (click)="svc.decline(r.id)">
                  <span class="material-symbols-outlined">cancel</span>
                  Decline
                </button>
              </ng-container>
            </div>

            <!-- Offer-sent inline confirmation form (landlord sends offer) -->
            <div *ngIf="offerFormId() === r.id" class="lr-offer-form">
              <p class="lr-offer-form-title">Send Renewal Offer</p>
              <div class="lr-offer-row">
                <label>
                  New End Date
                  <input type="date" [value]="r.proposedEndDate"
                         (change)="offerDate.set($any($event.target).value)" />
                </label>
                <label>
                  Monthly Rent (€)
                  <input type="number" [value]="r.proposedMonthlyRent" min="0"
                         (change)="offerRent.set(+$any($event.target).value)" />
                </label>
              </div>
              <div class="lr-offer-actions">
                <button class="lr-btn lr-btn-primary"
                        (click)="submitOffer(r)">
                  <span class="material-symbols-outlined">send</span>
                  Send Offer
                </button>
                <button class="lr-btn lr-btn-ghost" (click)="offerFormId.set(null)">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .lr-root {
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      padding: 24px;
    }

    .lr-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .lr-header-icon { font-size: 36px; color: var(--md-sys-color-primary, #6750a4); }
    .lr-title { margin: 0 0 4px; font-size: 22px; font-weight: 600; }
    .lr-subtitle { margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* KPIs */
    .lr-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .lr-kpi {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 12px;
      padding: 14px 16px;
      background: var(--md-sys-color-surface-container, #f3eff7);
    }
    .lr-kpi-icon { font-size: 24px; }
    .lr-kpi-num { display: block; font-size: 24px; font-weight: 700; }
    .lr-kpi-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .lr-kpi-warning .lr-kpi-icon { color: #F9A825; }
    .lr-kpi-info .lr-kpi-icon { color: #1976D2; }
    .lr-kpi-success .lr-kpi-icon { color: #388E3C; }
    .lr-kpi-danger .lr-kpi-icon { color: #C62828; }

    /* Urgent banner */
    .lr-urgent-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FFF3E0;
      border: 1px solid #FFB300;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
      color: #E65100;
    }

    /* Filters */
    .lr-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .lr-filter-btn {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 0.15s;
    }
    .lr-filter-btn:hover { background: var(--md-sys-color-surface-container-high, #ece6f0); }
    .lr-filter-active {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-weight: 600;
    }

    /* List */
    .lr-list { display: flex; flex-direction: column; gap: 12px; }
    .lr-empty { text-align: center; padding: 48px 24px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .lr-empty-icon { font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.4; }

    /* Card */
    .lr-card {
      display: flex;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      overflow: hidden;
      background: var(--md-sys-color-surface-container-lowest, #fff);
    }
    .lr-card-urgent { border-color: #FFB300; box-shadow: 0 0 0 2px #FFB30033; }
    .lr-card-stripe { width: 6px; flex-shrink: 0; }
    .lr-stripe-high { background: #C62828; }
    .lr-stripe-medium { background: #FFB300; }
    .lr-stripe-low { background: #388E3C; }
    .lr-card-body { flex: 1; padding: 16px; }

    .lr-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
    .lr-card-address { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
    .lr-icon-sm { font-size: 16px; color: var(--md-sys-color-primary, #6750a4); }

    .lr-card-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .lr-meta { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .lr-meta .material-symbols-outlined { font-size: 15px; }

    .lr-days-chip {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      background: #E8F5E9;
      color: #2E7D32;
    }
    .lr-days-urgent { background: #FFEBEE; color: #B71C1C; }
    .lr-days-medium { background: #FFF8E1; color: #E65100; }

    /* Status chip */
    .lr-status-chip {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .lr-status-expiring_soon { background: #FFF3E0; color: #E65100; }
    .lr-status-offer_sent { background: #E3F2FD; color: #1565C0; }
    .lr-status-accepted { background: #E8F5E9; color: #1B5E20; }
    .lr-status-declined { background: #FFEBEE; color: #B71C1C; }
    .lr-status-expired { background: #F5F5F5; color: #616161; }

    /* Rent row */
    .lr-rent-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--md-sys-color-surface-container, #f3eff7);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .lr-rent-block { display: flex; flex-direction: column; }
    .lr-rent-label { font-size: 11px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .lr-rent-value { font-size: 16px; font-weight: 700; }
    .lr-rent-proposed { color: var(--md-sys-color-primary, #6750a4); }
    .lr-rent-arrow { color: var(--md-sys-color-on-surface-variant, #49454f); }

    .lr-change-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .lr-change-up { background: #FFF8E1; color: #E65100; }
    .lr-change-flat { background: #E8F5E9; color: #2E7D32; }

    .lr-notes {
      font-size: 13px;
      font-style: italic;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0 0 10px;
    }
    .lr-decline-reason {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #B71C1C;
      background: #FFEBEE;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 0 0 10px;
    }
    .lr-decline-reason .material-symbols-outlined { font-size: 16px; }

    /* Actions */
    .lr-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .lr-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: opacity 0.15s;
    }
    .lr-btn .material-symbols-outlined { font-size: 16px; }
    .lr-btn:hover { opacity: 0.85; }
    .lr-btn-primary { background: var(--md-sys-color-primary, #6750a4); color: #fff; }
    .lr-btn-accept { background: #388E3C; color: #fff; }
    .lr-btn-decline { background: #FFEBEE; color: #C62828; }
    .lr-btn-ghost { background: transparent; border: 1px solid var(--md-sys-color-outline, #79747e); color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* Offer form */
    .lr-offer-form {
      margin-top: 14px;
      padding: 14px;
      background: var(--md-sys-color-surface-container, #f3eff7);
      border-radius: 10px;
    }
    .lr-offer-form-title { font-weight: 600; margin: 0 0 12px; font-size: 14px; }
    .lr-offer-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
    .lr-offer-row label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .lr-offer-row input {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      font-size: 14px;
    }
    .lr-offer-actions { display: flex; gap: 8px; }

    @media (max-width: 600px) {
      .lr-kpis { grid-template-columns: repeat(2, 1fr); }
      .lr-card-top { flex-direction: column; }
      .lr-rent-row { flex-wrap: wrap; }
    }
  `],
})
export class LeaseRenewalComponent {
  protected readonly svc = inject(LeaseRenewalService);

  /** Display mode — 'landlord' or 'tenant'. */
  @Input() mode: 'landlord' | 'tenant' = 'landlord';

  /** Tenant id filter for tenant mode. */
  @Input() tenantId?: string;

  readonly offerFormId = signal<string | null>(null);
  readonly offerDate = signal<string>('');
  readonly offerRent = signal<number>(0);

  readonly filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'expiring_soon' as const, label: 'Expiring Soon' },
    { value: 'offer_sent' as const, label: 'Offer Sent' },
    { value: 'accepted' as const, label: 'Accepted' },
    { value: 'declined' as const, label: 'Declined' },
  ];

  /** @internal */
  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  /** @internal Open the inline offer form. */
  sendOffer(r: LeaseRenewal): void {
    this.offerFormId.set(r.id);
    this.offerDate.set(r.proposedEndDate);
    this.offerRent.set(r.proposedMonthlyRent);
  }

  /** @internal Submit the offer form. */
  submitOffer(r: LeaseRenewal): void {
    this.svc.sendOffer(r.id, {
      leaseId: r.leaseId,
      proposedEndDate: this.offerDate() || r.proposedEndDate,
      proposedMonthlyRent: this.offerRent() || r.proposedMonthlyRent,
    });
    this.offerFormId.set(null);
  }
}
