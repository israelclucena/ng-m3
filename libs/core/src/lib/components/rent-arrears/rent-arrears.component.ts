import {
  Component, ChangeDetectionStrategy, Input, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentArrearsService } from '../../services/rent-arrears.service';
import type { ArrearsRecord, ArrearsStatus } from '../../services/rent-arrears.service';

const STATUS_LABELS: Record<ArrearsStatus, string> = {
  overdue: 'Overdue',
  partial: 'Partial',
  reminder_sent: 'Reminder Sent',
  payment_plan: 'Payment Plan',
  legal: 'Legal',
  resolved: 'Resolved',
};

/**
 * RentArrearsComponent — landlord-facing rent arrears management dashboard.
 *
 * Shows portfolio-level KPIs (total outstanding, tenants in arrears, avg days overdue,
 * critical cases), a severity-colour-coded list with send-reminder, payment-plan,
 * legal escalation, and resolve actions per record.
 *
 * @example
 * <iu-rent-arrears />
 */
@Component({
  selector: 'iu-rent-arrears',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ra-root">

      <!-- Header -->
      <div class="ra-header">
        <span class="material-symbols-outlined ra-header-icon">account_balance_wallet</span>
        <div>
          <h2 class="ra-title">Rent Arrears</h2>
          <p class="ra-subtitle">Outstanding payments across your portfolio</p>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="ra-kpis">
        <div class="ra-kpi ra-kpi-danger">
          <span class="material-symbols-outlined ra-kpi-icon">euro</span>
          <div>
            <span class="ra-kpi-num">€{{ svc.kpis().totalOutstanding | number:'1.0-0' }}</span>
            <span class="ra-kpi-label">Total Outstanding</span>
          </div>
        </div>
        <div class="ra-kpi ra-kpi-warn">
          <span class="material-symbols-outlined ra-kpi-icon">groups</span>
          <div>
            <span class="ra-kpi-num">{{ svc.kpis().totalTenants }}</span>
            <span class="ra-kpi-label">Tenants in Arrears</span>
          </div>
        </div>
        <div class="ra-kpi ra-kpi-neutral">
          <span class="material-symbols-outlined ra-kpi-icon">schedule</span>
          <div>
            <span class="ra-kpi-num">{{ svc.kpis().avgDaysOverdue }}d</span>
            <span class="ra-kpi-label">Avg Days Overdue</span>
          </div>
        </div>
        <div class="ra-kpi" [class.ra-kpi-critical]="svc.kpis().critical > 0" [class.ra-kpi-ok]="svc.kpis().critical === 0">
          <span class="material-symbols-outlined ra-kpi-icon">warning</span>
          <div>
            <span class="ra-kpi-num">{{ svc.kpis().critical }}</span>
            <span class="ra-kpi-label">Critical Cases</span>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="ra-filters">
        <button *ngFor="let f of filters"
                class="ra-filter-btn"
                [class.ra-filter-active]="svc.filter() === f.value"
                (click)="svc.setFilter(f.value)">
          {{ f.label }}
        </button>
      </div>

      <!-- Records -->
      <div class="ra-list">
        <div *ngIf="svc.filtered().length === 0" class="ra-empty">
          <span class="material-symbols-outlined ra-empty-icon">check_circle</span>
          <p>No arrears records</p>
        </div>

        <div *ngFor="let r of svc.filtered()" class="ra-card" [class]="'ra-card-' + svc.severity(r)">
          <div class="ra-card-stripe" [class]="'ra-stripe-' + svc.severity(r)"></div>

          <div class="ra-card-body">
            <!-- Top row -->
            <div class="ra-top-row">
              <div class="ra-tenant-info">
                <div class="ra-avatar">{{ initials(r.tenantName) }}</div>
                <div>
                  <div class="ra-tenant-name">{{ r.tenantName }}</div>
                  <div class="ra-tenant-email">{{ r.tenantEmail }}</div>
                </div>
              </div>
              <div class="ra-amount-block">
                <span class="ra-amount-outstanding">€{{ r.amountOutstanding | number:'1.0-0' }}</span>
                <span class="ra-amount-label">outstanding</span>
              </div>
            </div>

            <!-- Property & Overdue info -->
            <div class="ra-meta-row">
              <span class="ra-meta">
                <span class="material-symbols-outlined">location_on</span>{{ r.propertyAddress }}
              </span>
              <span class="ra-meta">
                <span class="material-symbols-outlined">calendar_today</span>Due since {{ r.dueSince }}
              </span>
              <span class="ra-overdue-badge" [class]="'ra-overdue-' + svc.severity(r)">
                {{ r.daysOverdue }}d overdue
              </span>
            </div>

            <!-- Progress bar (paid vs total) -->
            <div *ngIf="r.amountPaid > 0" class="ra-progress-wrap">
              <div class="ra-progress-bar">
                <div class="ra-progress-fill" [style.width.%]="(r.amountPaid / r.amountDue) * 100"></div>
              </div>
              <span class="ra-progress-label">€{{ r.amountPaid | number:'1.0-0' }} paid of €{{ r.amountDue | number:'1.0-0' }}</span>
            </div>

            <!-- Payment plan badge -->
            <div *ngIf="r.paymentPlanActive" class="ra-plan-badge">
              <span class="material-symbols-outlined">payments</span>
              Payment plan active — €{{ r.paymentPlanMonthly }}/month
            </div>

            <!-- Notes -->
            <p *ngIf="r.notes" class="ra-notes">{{ r.notes }}</p>

            <!-- Status + Actions row -->
            <div class="ra-actions-row">
              <span class="ra-status-chip ra-status-{{ r.status }}">
                {{ statusLabel(r.status) }}
              </span>
              <div class="ra-action-btns" *ngIf="r.status !== 'resolved'">
                <button *ngIf="r.status !== 'reminder_sent' && r.status !== 'legal'"
                        class="ra-btn ra-btn-remind"
                        (click)="svc.sendReminder(r.id)">
                  <span class="material-symbols-outlined">notifications</span>
                  Remind
                </button>
                <button *ngIf="r.status === 'reminder_sent'"
                        class="ra-btn ra-btn-remind ra-btn-disabled" disabled>
                  <span class="material-symbols-outlined">check</span>
                  Reminder Sent ({{ r.reminderCount }}×)
                </button>
                <button *ngIf="!r.paymentPlanActive && r.status !== 'legal'"
                        class="ra-btn ra-btn-plan"
                        (click)="openPlanForm(r)">
                  <span class="material-symbols-outlined">payments</span>
                  Payment Plan
                </button>
                <button *ngIf="r.status !== 'legal' && r.daysOverdue > 45"
                        class="ra-btn ra-btn-legal"
                        (click)="svc.escalateToLegal(r.id)">
                  <span class="material-symbols-outlined">gavel</span>
                  Escalate
                </button>
                <button class="ra-btn ra-btn-resolve"
                        (click)="svc.markResolved(r.id)">
                  <span class="material-symbols-outlined">check_circle</span>
                  Resolve
                </button>
              </div>
            </div>

            <!-- Inline payment plan form -->
            <div *ngIf="planFormId() === r.id" class="ra-plan-form">
              <p class="ra-plan-form-title">Set Up Payment Plan</p>
              <label class="ra-plan-label">
                Monthly Instalment (€)
                <input type="number" [value]="planAmount()" min="50"
                       (input)="planAmount.set(+$any($event.target).value)"
                       class="ra-plan-input" />
              </label>
              <p class="ra-plan-months" *ngIf="planAmount() > 0">
                Estimated {{ Math.ceil(r.amountOutstanding / planAmount()) }} months to clear
              </p>
              <div class="ra-plan-actions">
                <button class="ra-btn ra-btn-plan" (click)="submitPlan(r)">
                  <span class="material-symbols-outlined">check</span>
                  Activate Plan
                </button>
                <button class="ra-btn ra-btn-ghost" (click)="planFormId.set(null)">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ra-root {
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      padding: 24px;
    }

    .ra-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .ra-header-icon { font-size: 36px; color: var(--md-sys-color-primary, #6750a4); }
    .ra-title { margin: 0 0 4px; font-size: 22px; font-weight: 600; }
    .ra-subtitle { margin: 0; font-size: 14px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* KPIs */
    .ra-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .ra-kpi {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .ra-kpi-icon { font-size: 28px; }
    .ra-kpi-num { display: block; font-size: 22px; font-weight: 700; }
    .ra-kpi-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .ra-kpi-danger { background: #FFEBEE; }
    .ra-kpi-danger .ra-kpi-icon, .ra-kpi-danger .ra-kpi-num { color: #B71C1C; }
    .ra-kpi-warn { background: #FFF8E1; }
    .ra-kpi-warn .ra-kpi-icon, .ra-kpi-warn .ra-kpi-num { color: #E65100; }
    .ra-kpi-neutral { background: var(--md-sys-color-surface-container, #f3eff7); }
    .ra-kpi-neutral .ra-kpi-icon { color: var(--md-sys-color-primary, #6750a4); }
    .ra-kpi-critical { background: #FFEBEE; }
    .ra-kpi-critical .ra-kpi-icon, .ra-kpi-critical .ra-kpi-num { color: #B71C1C; }
    .ra-kpi-ok { background: #E8F5E9; }
    .ra-kpi-ok .ra-kpi-icon, .ra-kpi-ok .ra-kpi-num { color: #2E7D32; }

    /* Filters */
    .ra-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .ra-filter-btn {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 0.15s;
    }
    .ra-filter-btn:hover { background: var(--md-sys-color-surface-container-high, #ece6f0); }
    .ra-filter-active {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-weight: 600;
    }

    /* List */
    .ra-list { display: flex; flex-direction: column; gap: 12px; }
    .ra-empty { text-align: center; padding: 48px 24px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .ra-empty-icon { font-size: 48px; display: block; margin-bottom: 12px; color: #388E3C; opacity: 0.6; }

    /* Card */
    .ra-card {
      display: flex;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      overflow: hidden;
    }
    .ra-card-critical { border-color: #C62828; }
    .ra-card-high { border-color: #FF8F00; }
    .ra-card-stripe { width: 6px; flex-shrink: 0; }
    .ra-stripe-critical { background: #C62828; }
    .ra-stripe-high { background: #FF8F00; }
    .ra-stripe-medium { background: #F9A825; }
    .ra-stripe-low { background: #66BB6A; }
    .ra-card-body { flex: 1; padding: 16px; }

    .ra-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .ra-tenant-info { display: flex; align-items: center; gap: 12px; }
    .ra-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; flex-shrink: 0;
    }
    .ra-tenant-name { font-weight: 600; font-size: 15px; }
    .ra-tenant-email { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    .ra-amount-block { text-align: right; }
    .ra-amount-outstanding { display: block; font-size: 24px; font-weight: 700; color: #C62828; }
    .ra-amount-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    .ra-meta-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 10px; }
    .ra-meta { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--md-sys-color-on-surface-variant, #49454f); }
    .ra-meta .material-symbols-outlined { font-size: 15px; }

    .ra-overdue-badge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
    .ra-overdue-critical { background: #FFEBEE; color: #B71C1C; }
    .ra-overdue-high { background: #FFF3E0; color: #BF360C; }
    .ra-overdue-medium { background: #FFF8E1; color: #E65100; }
    .ra-overdue-low { background: #E8F5E9; color: #2E7D32; }

    /* Progress */
    .ra-progress-wrap { margin-bottom: 10px; }
    .ra-progress-bar { height: 6px; background: #E0E0E0; border-radius: 3px; margin-bottom: 4px; overflow: hidden; }
    .ra-progress-fill { height: 100%; background: var(--md-sys-color-primary, #6750a4); border-radius: 3px; }
    .ra-progress-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); }

    /* Plan badge */
    .ra-plan-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #E8F5E9;
      color: #2E7D32;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .ra-plan-badge .material-symbols-outlined { font-size: 16px; }

    .ra-notes { font-size: 13px; font-style: italic; color: var(--md-sys-color-on-surface-variant, #49454f); margin: 0 0 10px; }

    /* Actions */
    .ra-actions-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .ra-action-btns { display: flex; gap: 6px; flex-wrap: wrap; }

    .ra-status-chip { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px; }
    .ra-status-overdue { background: #FFEBEE; color: #B71C1C; }
    .ra-status-partial { background: #FFF8E1; color: #E65100; }
    .ra-status-reminder_sent { background: #E3F2FD; color: #1565C0; }
    .ra-status-payment_plan { background: #E8F5E9; color: #1B5E20; }
    .ra-status-legal { background: #FCE4EC; color: #880E4F; }
    .ra-status-resolved { background: #E8F5E9; color: #1B5E20; }

    .ra-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 12px; border-radius: 8px; border: none;
      cursor: pointer; font-size: 12px; font-weight: 600;
      transition: opacity 0.15s;
    }
    .ra-btn .material-symbols-outlined { font-size: 15px; }
    .ra-btn:hover:not([disabled]) { opacity: 0.85; }
    .ra-btn-remind { background: #E3F2FD; color: #1565C0; }
    .ra-btn-plan { background: #E8F5E9; color: #1B5E20; }
    .ra-btn-legal { background: #FCE4EC; color: #880E4F; }
    .ra-btn-resolve { background: #E8F5E9; color: #2E7D32; }
    .ra-btn-ghost { background: transparent; border: 1px solid var(--md-sys-color-outline, #79747e); color: var(--md-sys-color-on-surface-variant, #49454f); }
    .ra-btn-disabled { opacity: 0.6; cursor: default; }

    /* Plan form */
    .ra-plan-form {
      margin-top: 14px; padding: 14px;
      background: var(--md-sys-color-surface-container, #f3eff7);
      border-radius: 10px;
    }
    .ra-plan-form-title { font-weight: 600; margin: 0 0 12px; font-size: 14px; }
    .ra-plan-label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-bottom: 8px; max-width: 220px; }
    .ra-plan-input {
      padding: 8px 10px; border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline, #79747e); font-size: 14px;
    }
    .ra-plan-months { font-size: 12px; color: var(--md-sys-color-on-surface-variant, #49454f); margin: 0 0 10px; }
    .ra-plan-actions { display: flex; gap: 8px; }

    @media (max-width: 600px) {
      .ra-kpis { grid-template-columns: repeat(2, 1fr); }
      .ra-top-row { flex-direction: column; align-items: flex-start; gap: 8px; }
      .ra-actions-row { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class RentArrearsComponent {
  protected readonly svc = inject(RentArrearsService);
  protected readonly Math = Math;

  readonly planFormId = signal<string | null>(null);
  readonly planAmount = signal<number>(0);

  readonly filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'overdue' as const, label: 'Overdue' },
    { value: 'partial' as const, label: 'Partial' },
    { value: 'reminder_sent' as const, label: 'Reminder Sent' },
    { value: 'payment_plan' as const, label: 'Payment Plan' },
    { value: 'legal' as const, label: 'Legal' },
    { value: 'resolved' as const, label: 'Resolved' },
  ];

  /** @internal */
  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  /** @internal Generate initials from name. */
  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  /** @internal Open payment plan form. */
  openPlanForm(r: ArrearsRecord): void {
    this.planFormId.set(r.id);
    this.planAmount.set(Math.ceil(r.amountOutstanding / 4));
  }

  /** @internal Submit payment plan. */
  submitPlan(r: ArrearsRecord): void {
    if (this.planAmount() > 0) {
      this.svc.setPaymentPlan(r.id, this.planAmount());
    }
    this.planFormId.set(null);
  }
}
