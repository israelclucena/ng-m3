import {
  Component, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilityBillsService } from '../../services/utility-bills.service';
import type { UtilityBill, BillStatus, UtilityType } from '../../services/utility-bills.service';

const STATUS_LABELS: Record<BillStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  disputed: 'Disputed',
};

const TYPE_LABELS: Record<UtilityType, string> = {
  electricity: 'Electricity',
  water: 'Water',
  gas: 'Gas',
  internet: 'Internet',
  waste: 'Waste',
  other: 'Other',
};

/**
 * UtilityBillsComponent — manage utility bills across a rental property portfolio.
 *
 * Features: KPI strip, bill list with type/status/payer filters, mark-paid and dispute actions,
 * split-cost display, overdue highlighting, M3 design tokens throughout.
 *
 * @example
 * <iu-utility-bills />
 */
@Component({
  selector: 'iu-utility-bills',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="ub-root">

      <!-- Header -->
      <div class="ub-header">
        <div>
          <h2 class="ub-title">Utility Bills</h2>
          <p class="ub-subtitle">Track and manage utility costs across your portfolio</p>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="ub-kpis">
        <div class="ub-kpi">
          <span class="ub-kpi-value overdue">€{{ svc.kpis().totalDue | number:'1.2-2' }}</span>
          <span class="ub-kpi-label">Total Due</span>
        </div>
        <div class="ub-kpi">
          <span class="ub-kpi-value paid">€{{ svc.kpis().totalPaid | number:'1.2-2' }}</span>
          <span class="ub-kpi-label">Paid This Period</span>
        </div>
        <div class="ub-kpi">
          <span class="ub-kpi-value warn">{{ svc.kpis().overdue }}</span>
          <span class="ub-kpi-label">Overdue Bills</span>
        </div>
        <div class="ub-kpi">
          <span class="ub-kpi-value disputed">{{ svc.kpis().disputed }}</span>
          <span class="ub-kpi-label">Disputed</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="ub-filters">
        <div class="ub-filter-group">
          <label class="ub-filter-label">Status</label>
          <div class="ub-chips">
            @for (opt of statusOpts; track opt.value) {
              <button
                class="ub-chip"
                [class.active]="svc.filterStatus() === opt.value"
                (click)="svc.setFilterStatus(opt.value)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>
        <div class="ub-filter-group">
          <label class="ub-filter-label">Type</label>
          <div class="ub-chips">
            @for (opt of typeOpts; track opt.value) {
              <button
                class="ub-chip"
                [class.active]="svc.filterType() === opt.value"
                (click)="svc.setFilterType(opt.value)"
              >{{ opt.label }}</button>
            }
          </div>
        </div>
      </div>

      <!-- Bills List -->
      @if (svc.filtered().length === 0) {
        <div class="ub-empty">
          <span class="ub-empty-icon">🧾</span>
          <p class="ub-empty-text">No bills match the selected filters.</p>
        </div>
      } @else {
        <div class="ub-list">
          @for (bill of svc.filtered(); track bill.id) {
            <div class="ub-card" [class.overdue-card]="bill.status === 'overdue'">
              <div class="ub-card-top">
                <div class="ub-card-left">
                  <span class="ub-type-icon">{{ svc.typeIcon(bill.type) }}</span>
                  <div>
                    <div class="ub-type-label">{{ typeLabel(bill.type) }}</div>
                    <div class="ub-provider">{{ bill.provider }} · {{ bill.period }}</div>
                    <div class="ub-address">{{ bill.propertyAddress }}</div>
                  </div>
                </div>
                <div class="ub-card-right">
                  <div class="ub-amount">€{{ bill.amount | number:'1.2-2' }}</div>
                  @if (bill.payer === 'split' && bill.splitRatio != null) {
                    <div class="ub-split-note">
                      Landlord {{ bill.splitRatio }}% · Tenant {{ 100 - bill.splitRatio }}%
                    </div>
                  } @else {
                    <div class="ub-payer-note">Paid by {{ bill.payer }}</div>
                  }
                  <span
                    class="ub-status-badge"
                    [style.background]="svc.statusColor(bill.status) + '22'"
                    [style.color]="svc.statusColor(bill.status)"
                  >{{ statusLabel(bill.status) }}</span>
                </div>
              </div>

              <div class="ub-card-meta">
                <span>Due: {{ bill.dueDate }}</span>
                @if (bill.paidDate) {
                  <span>Paid: {{ bill.paidDate }}</span>
                }
                @if (bill.notes) {
                  <span class="ub-notes">{{ bill.notes }}</span>
                }
              </div>

              @if (bill.status !== 'paid') {
                <div class="ub-actions">
                  @if (bill.status !== 'disputed') {
                    <button class="ub-btn primary" (click)="svc.markPaid(bill.id)">
                      ✓ Mark Paid
                    </button>
                    <button class="ub-btn ghost" (click)="svc.disputeBill(bill.id, 'Disputed — under review')">
                      ⚠ Dispute
                    </button>
                  } @else {
                    <span class="ub-disputed-label">Under dispute review</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ub-root {
      padding: 24px;
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      background: var(--md-sys-color-background, #fafafa);
      min-height: 100vh;
    }
    .ub-header { margin-bottom: 24px; }
    .ub-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 4px;
    }
    .ub-subtitle {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }

    /* KPIs */
    .ub-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .ub-kpi {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .ub-kpi-value {
      font-size: 24px;
      font-weight: 700;
    }
    .ub-kpi-value.overdue { color: #D32F2F; }
    .ub-kpi-value.paid    { color: #388E3C; }
    .ub-kpi-value.warn    { color: #E65100; }
    .ub-kpi-value.disputed{ color: #7B1FA2; }
    .ub-kpi-label {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Filters */
    .ub-filters {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .ub-filter-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .ub-filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      width: 44px;
      flex-shrink: 0;
    }
    .ub-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .ub-chip {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #cac4d0);
      background: transparent;
      font-size: 13px;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 0.2s;
    }
    .ub-chip.active {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    /* List */
    .ub-list { display: flex; flex-direction: column; gap: 12px; }
    .ub-card {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 20px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
      border-left: 4px solid transparent;
      transition: box-shadow 0.2s;
    }
    .ub-card.overdue-card {
      border-left-color: #D32F2F;
    }
    .ub-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .ub-card-left { display: flex; gap: 14px; align-items: flex-start; }
    .ub-type-icon { font-size: 28px; line-height: 1; }
    .ub-type-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ub-provider {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ub-address {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }
    .ub-card-right { text-align: right; }
    .ub-amount {
      font-size: 20px;
      font-weight: 700;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .ub-split-note, .ub-payer-note {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 4px 0;
    }
    .ub-status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .ub-card-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .ub-notes { font-style: italic; }
    .ub-actions { display: flex; gap: 8px; }
    .ub-btn {
      padding: 8px 16px;
      border-radius: 20px;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .ub-btn.primary {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .ub-btn.ghost {
      background: transparent;
      border: 1px solid var(--md-sys-color-outline, #cac4d0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ub-btn:hover { opacity: 0.85; }
    .ub-disputed-label {
      font-size: 13px;
      color: #7B1FA2;
      font-style: italic;
    }
    .ub-empty {
      text-align: center;
      padding: 48px 24px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .ub-empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .ub-empty-text { font-size: 14px; margin: 0; }

    @media (max-width: 768px) {
      .ub-kpis { grid-template-columns: repeat(2, 1fr); }
      .ub-card-top { flex-direction: column; gap: 12px; }
      .ub-card-right { text-align: left; }
    }
  `],
})
export class UtilityBillsComponent {
  readonly svc = inject(UtilityBillsService);

  readonly statusOpts: { value: 'all' | import('../../services/utility-bills.service').BillStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'disputed', label: 'Disputed' },
  ];

  readonly typeOpts: { value: 'all' | import('../../services/utility-bills.service').UtilityType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'electricity', label: '⚡ Electricity' },
    { value: 'water', label: '💧 Water' },
    { value: 'gas', label: '🔥 Gas' },
    { value: 'internet', label: '📶 Internet' },
    { value: 'waste', label: '♻️ Waste' },
  ];

  statusLabel(s: BillStatus): string {
    return { pending: 'Pending', paid: 'Paid', overdue: 'Overdue', disputed: 'Disputed' }[s] ?? s;
  }

  typeLabel(t: UtilityType): string {
    return { electricity: 'Electricity', water: 'Water', gas: 'Gas', internet: 'Internet', waste: 'Waste', other: 'Other' }[t] ?? t;
  }
}
