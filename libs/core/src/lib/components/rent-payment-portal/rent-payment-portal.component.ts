import {
  Component, ChangeDetectionStrategy, Input, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentPaymentPortalService } from '../../services/rent-payment-portal.service';
import type { RentPayment } from '../../services/rent-payment-portal.service';

/**
 * RentPaymentPortalComponent — tenant-facing or landlord-facing rent payment dashboard.
 *
 * Displays KPI strip (paid this year, outstanding, streak, next due date),
 * an overdue banner, and a full payment schedule table with Pay / Receipt CTAs.
 *
 * @example
 * <iu-rent-payment-portal mode="tenant" tenantId="tenant-001" />
 */
@Component({
  selector: 'iu-rent-payment-portal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="rpp-root">

      <!-- KPI Strip -->
      <div class="rpp-kpis">
        <div class="rpp-kpi">
          <span class="rpp-kpi-icon material-symbols-outlined">euro</span>
          <div>
            <span class="rpp-kpi-label">Paid This Year</span>
            <span class="rpp-kpi-value">€{{ svc.totalPaidThisYear() | number:'1.0-0' }}</span>
          </div>
        </div>
        <div class="rpp-kpi">
          <span class="rpp-kpi-icon material-symbols-outlined">warning_amber</span>
          <div>
            <span class="rpp-kpi-label">Outstanding</span>
            <span class="rpp-kpi-value" [class.rpp-kpi-danger]="svc.totalOutstanding() > 0">
              €{{ svc.totalOutstanding() | number:'1.0-0' }}
            </span>
          </div>
        </div>
        <div class="rpp-kpi">
          <span class="rpp-kpi-icon material-symbols-outlined">local_fire_department</span>
          <div>
            <span class="rpp-kpi-label">Payment Streak</span>
            <span class="rpp-kpi-value">{{ svc.paymentStreak() }} mo</span>
          </div>
        </div>
        <div class="rpp-kpi">
          <span class="rpp-kpi-icon material-symbols-outlined">event</span>
          <div>
            <span class="rpp-kpi-label">Next Due</span>
            <span class="rpp-kpi-value rpp-next-due">
              {{ svc.nextDueDate()?.dueDate ?? '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Overdue Banner -->
      @if (hasOverdue()) {
        <div class="rpp-overdue-banner" role="alert">
          <span class="material-symbols-outlined">error</span>
          <span>You have <strong>{{ overdueCount() }}</strong> overdue payment{{ overdueCount() > 1 ? 's' : '' }} — please settle immediately to avoid late fees.</span>
        </div>
      }

      <!-- Payment Schedule -->
      <section class="rpp-section">
        <h3 class="rpp-section-title">Payment Schedule</h3>
        <div class="rpp-table" role="table">
          <div class="rpp-table-head" role="row">
            <span>Period</span>
            <span>Due Date</span>
            <span>Amount</span>
            <span>Status</span>
            @if (mode === 'tenant') {
              <span>Action</span>
            }
          </div>
          @for (payment of svc.payments(); track payment.id) {
            <div class="rpp-table-row" [class]="rowClass(payment.status)" role="row">
              <span class="rpp-period">{{ payment.periodLabel }}</span>
              <span class="rpp-due">{{ payment.dueDate }}</span>
              <span class="rpp-amount">€{{ payment.amount | number:'1.0-0' }}</span>
              <span>
                <span class="rpp-status-chip" [class]="'rpp-chip--' + payment.status">
                  {{ payment.status | titlecase }}
                </span>
              </span>
              @if (mode === 'tenant') {
                <span class="rpp-action-cell">
                  @if (payment.status === 'pending' || payment.status === 'overdue') {
                    <button class="rpp-pay-btn" (click)="onPay(payment)">
                      <span class="material-symbols-outlined" style="font-size:16px">payments</span>
                      Pay Now
                    </button>
                  } @else if (payment.status === 'partial') {
                    <button class="rpp-pay-btn rpp-pay-btn--partial" (click)="onPay(payment)">Pay Rest</button>
                  } @else if (payment.receiptId) {
                    <button class="rpp-receipt-btn" (click)="onReceipt(payment)">
                      <span class="material-symbols-outlined" style="font-size:16px">receipt_long</span>
                      Receipt
                    </button>
                  }
                </span>
              }
            </div>
          }
        </div>
      </section>

      <!-- Summary for Landlord -->
      @if (mode === 'landlord') {
        <div class="rpp-landlord-summary">
          <span class="material-symbols-outlined">account_balance_wallet</span>
          <span>Total collected: <strong>€{{ svc.totalPaidThisYear() | number:'1.0-0' }}</strong> this year across {{ svc.paidPayments().length }} payments.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .rpp-root {
      display: flex;
      flex-direction: column;
      gap: 24px;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
    }

    /* KPIs */
    .rpp-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .rpp-kpi {
      background: var(--md-sys-color-surface-container);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .rpp-kpi-icon {
      font-size: 28px;
      color: var(--md-sys-color-primary);
      flex-shrink: 0;
    }
    .rpp-kpi > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rpp-kpi-label {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rpp-kpi-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .rpp-kpi-danger { color: var(--md-sys-color-error) !important; }
    .rpp-next-due { font-size: 15px !important; }

    /* Overdue Banner */
    .rpp-overdue-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
      border-radius: 12px;
      padding: 14px 18px;
      font-size: 14px;
    }

    /* Section */
    .rpp-section-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 12px;
    }

    /* Table */
    .rpp-table {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 14px;
      overflow: hidden;
    }
    .rpp-table-head {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
      gap: 8px;
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container-high);
      font-size: 11px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .rpp-table-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
      gap: 8px;
      padding: 14px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
      align-items: center;
      font-size: 14px;
      transition: background 0.15s;
    }
    .rpp-table-row:hover { background: var(--md-sys-color-surface-container-low); }
    .rpp-row--overdue { background: color-mix(in srgb, var(--md-sys-color-error-container) 25%, transparent); }

    .rpp-period { font-weight: 500; color: var(--md-sys-color-on-surface); }
    .rpp-due { color: var(--md-sys-color-on-surface-variant); }
    .rpp-amount { font-weight: 500; }

    /* Status chips */
    .rpp-status-chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .rpp-chip--paid { background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); }
    .rpp-chip--pending { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .rpp-chip--overdue { background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
    .rpp-chip--partial { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }

    /* Action buttons */
    .rpp-action-cell { display: flex; }
    .rpp-pay-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    .rpp-pay-btn:hover { opacity: 0.9; }
    .rpp-pay-btn--partial { background: var(--md-sys-color-secondary); color: var(--md-sys-color-on-secondary); }
    .rpp-receipt-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      color: var(--md-sys-color-primary);
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
    }

    /* Landlord summary */
    .rpp-landlord-summary {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: var(--md-sys-color-surface-container-low);
      border-radius: 12px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `],
})
export class RentPaymentPortalComponent implements OnInit {
  protected readonly svc = inject(RentPaymentPortalService);

  /**
   * 'tenant' — shows Pay Now / Receipt buttons.
   * 'landlord' — read-only view with landlord summary.
   */
  @Input() mode: 'tenant' | 'landlord' = 'tenant';

  /** Pre-load payments for this tenant id on init */
  @Input() tenantId?: string;

  /** Pre-load payments for this landlord id on init */
  @Input() landlordId?: string;

  ngOnInit(): void {
    if (this.mode === 'tenant' && this.tenantId) {
      this.svc.loadForTenant(this.tenantId);
    } else if (this.mode === 'landlord' && this.landlordId) {
      this.svc.loadForLandlord(this.landlordId);
    }
  }

  protected hasOverdue(): boolean {
    return this.svc.outstanding().some(p => p.status === 'overdue');
  }

  protected overdueCount(): number {
    return this.svc.outstanding().filter(p => p.status === 'overdue').length;
  }

  protected rowClass(status: string): string {
    return `rpp-table-row rpp-row--${status}`;
  }

  /** Trigger full payment for a pending/overdue entry */
  protected onPay(payment: RentPayment): void {
    this.svc.makePayment(payment.id, payment.amount);
  }

  /** Open receipt (stub — real app would navigate to InvoiceService receipt) */
  protected onReceipt(payment: RentPayment): void {
    console.log('[RentPaymentPortal] open receipt:', payment.receiptId);
  }
}
