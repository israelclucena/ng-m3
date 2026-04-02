import {
  Component, ChangeDetectionStrategy, Input, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewingSchedulerService } from '../../services/viewing-scheduler.service';
import type { ViewingSlot, ViewingStatus } from '../../services/viewing-scheduler.service';

const STATUS_LABELS: Record<ViewingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
};

const STATUS_COLORS: Record<ViewingStatus, string> = {
  pending: '#F9A825',
  confirmed: '#1976D2',
  cancelled: '#D32F2F',
  completed: '#388E3C',
  no_show: '#757575',
};

/**
 * ViewingSchedulerComponent — property viewing appointment manager.
 *
 * Shows KPI strip (pending/confirmed/completed), a filterable viewing list,
 * and confirm/cancel/complete actions per slot. Supports landlord and tenant modes.
 *
 * @example
 * <iu-viewing-scheduler mode="landlord" />
 * <iu-viewing-scheduler mode="tenant" tenantId="tenant-001" />
 */
@Component({
  selector: 'iu-viewing-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="vs-root">

      <!-- Header -->
      <div class="vs-header">
        <span class="material-symbols-outlined vs-header-icon">calendar_month</span>
        <div>
          <h2 class="vs-title">Viewing Scheduler</h2>
          <p class="vs-subtitle">{{ mode === 'landlord' ? 'Manage property viewings across your portfolio' : 'Your scheduled property viewings' }}</p>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="vs-kpis">
        <div class="vs-kpi">
          <span class="vs-kpi-num">{{ svc.kpis().pending }}</span>
          <span class="vs-kpi-label">Pending</span>
        </div>
        <div class="vs-kpi">
          <span class="vs-kpi-num vs-kpi-confirmed">{{ svc.kpis().confirmed }}</span>
          <span class="vs-kpi-label">Confirmed</span>
        </div>
        <div class="vs-kpi">
          <span class="vs-kpi-num vs-kpi-done">{{ svc.kpis().completed }}</span>
          <span class="vs-kpi-label">Completed</span>
        </div>
        <div class="vs-kpi">
          <span class="vs-kpi-num vs-kpi-total">{{ svc.kpis().total }}</span>
          <span class="vs-kpi-label">Total</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="vs-filters">
        <button *ngFor="let f of filters"
                class="vs-filter-btn"
                [class.vs-filter-active]="svc.filter() === f.value"
                (click)="svc.setFilter(f.value)">
          {{ f.label }}
        </button>
      </div>

      <!-- Viewing List -->
      <div class="vs-list">
        <div *ngIf="svc.filtered().length === 0" class="vs-empty">
          <span class="material-symbols-outlined vs-empty-icon">event_busy</span>
          <p>No viewings found</p>
        </div>

        <div *ngFor="let v of svc.filtered()" class="vs-card">
          <!-- Status Badge -->
          <div class="vs-card-status-bar" [style.background]="statusColor(v.status)"></div>

          <div class="vs-card-body">
            <div class="vs-card-main">
              <div class="vs-card-address">
                <span class="material-symbols-outlined vs-card-icon">location_on</span>
                {{ v.propertyAddress }}
              </div>
              <div class="vs-card-meta">
                <span class="vs-meta-item">
                  <span class="material-symbols-outlined">person</span>
                  {{ v.tenantName }}
                </span>
                <span class="vs-meta-item">
                  <span class="material-symbols-outlined">calendar_today</span>
                  {{ v.date }} · {{ v.time }}
                </span>
                <span class="vs-meta-item">
                  <span class="material-symbols-outlined">schedule</span>
                  {{ v.durationMin }} min
                </span>
                <span class="vs-meta-item vs-type-badge" [class.vs-virtual]="v.type === 'virtual'">
                  <span class="material-symbols-outlined">{{ v.type === 'virtual' ? 'videocam' : 'home' }}</span>
                  {{ v.type === 'virtual' ? 'Virtual' : 'In Person' }}
                </span>
              </div>
              <p *ngIf="v.notes" class="vs-notes">{{ v.notes }}</p>
              <a *ngIf="v.meetLink && v.status === 'confirmed'" [href]="v.meetLink"
                 target="_blank" class="vs-meet-link">
                <span class="material-symbols-outlined">video_call</span>
                Join Meeting
              </a>
            </div>

            <!-- Actions + Status -->
            <div class="vs-card-actions">
              <span class="vs-status-chip" [style.background]="statusColor(v.status) + '22'" [style.color]="statusColor(v.status)">
                {{ statusLabel(v.status) }}
              </span>
              <div class="vs-action-btns" *ngIf="mode === 'landlord'">
                <button *ngIf="v.status === 'pending'"
                        class="vs-btn vs-btn-confirm"
                        (click)="svc.confirm(v.id)">
                  <span class="material-symbols-outlined">check_circle</span>
                  Confirm
                </button>
                <button *ngIf="v.status === 'confirmed'"
                        class="vs-btn vs-btn-complete"
                        (click)="svc.complete(v.id)">
                  <span class="material-symbols-outlined">task_alt</span>
                  Complete
                </button>
                <button *ngIf="v.status === 'confirmed'"
                        class="vs-btn vs-btn-noshow"
                        (click)="svc.markNoShow(v.id)">
                  No Show
                </button>
                <button *ngIf="v.status === 'pending' || v.status === 'confirmed'"
                        class="vs-btn vs-btn-cancel"
                        (click)="svc.cancel(v.id)">
                  <span class="material-symbols-outlined">cancel</span>
                  Cancel
                </button>
              </div>
              <div class="vs-action-btns" *ngIf="mode === 'tenant'">
                <button *ngIf="v.status === 'pending' || v.status === 'confirmed'"
                        class="vs-btn vs-btn-cancel"
                        (click)="svc.cancel(v.id)">
                  <span class="material-symbols-outlined">cancel</span>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .vs-root {
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      padding: 24px;
    }

    .vs-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .vs-header-icon {
      font-size: 36px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .vs-title {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 600;
    }
    .vs-subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* KPIs */
    .vs-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .vs-kpi {
      background: var(--md-sys-color-surface-container, #f3eff7);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .vs-kpi-num {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .vs-kpi-confirmed { color: #1976D2; }
    .vs-kpi-done { color: #388E3C; }
    .vs-kpi-total { color: var(--md-sys-color-on-surface, #1c1b1f); }
    .vs-kpi-label {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* Filters */
    .vs-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .vs-filter-btn {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: all 0.15s;
    }
    .vs-filter-btn:hover {
      background: var(--md-sys-color-surface-container-high, #ece6f0);
    }
    .vs-filter-active {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-color: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-weight: 600;
    }

    /* List */
    .vs-list { display: flex; flex-direction: column; gap: 12px; }

    .vs-empty {
      text-align: center;
      padding: 48px 24px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .vs-empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    /* Card */
    .vs-card {
      display: flex;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      overflow: hidden;
      background: var(--md-sys-color-surface-container-lowest, #ffffff);
    }
    .vs-card-status-bar { width: 6px; flex-shrink: 0; }
    .vs-card-body {
      flex: 1;
      padding: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .vs-card-main { flex: 1; }
    .vs-card-address {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .vs-card-icon { font-size: 16px; color: var(--md-sys-color-primary, #6750a4); }

    .vs-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 8px;
    }
    .vs-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .vs-meta-item .material-symbols-outlined { font-size: 15px; }

    .vs-type-badge {
      border-radius: 12px;
      padding: 2px 10px;
      background: var(--md-sys-color-surface-container, #f3eff7);
    }
    .vs-virtual { background: #E3F2FD; color: #1565C0; }

    .vs-notes {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-style: italic;
    }
    .vs-meet-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 13px;
      color: #1976D2;
      text-decoration: none;
    }
    .vs-meet-link:hover { text-decoration: underline; }
    .vs-meet-link .material-symbols-outlined { font-size: 16px; }

    /* Card Actions */
    .vs-card-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      flex-shrink: 0;
    }
    .vs-status-chip {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
      white-space: nowrap;
    }
    .vs-action-btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

    .vs-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: opacity 0.15s;
    }
    .vs-btn .material-symbols-outlined { font-size: 15px; }
    .vs-btn:hover { opacity: 0.85; }

    .vs-btn-confirm { background: #1976D2; color: #fff; }
    .vs-btn-complete { background: #388E3C; color: #fff; }
    .vs-btn-cancel { background: #FFEBEE; color: #C62828; }
    .vs-btn-noshow { background: #F5F5F5; color: #616161; }

    @media (max-width: 600px) {
      .vs-kpis { grid-template-columns: repeat(2, 1fr); }
      .vs-card-body { flex-direction: column; }
      .vs-card-actions { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
    }
  `],
})
export class ViewingSchedulerComponent implements OnInit {
  protected readonly svc = inject(ViewingSchedulerService);

  /** Display mode — 'landlord' shows confirm/complete/cancel actions; 'tenant' shows cancel only. */
  @Input() mode: 'landlord' | 'tenant' = 'landlord';

  /** Filter viewings by tenant when in tenant mode. */
  @Input() tenantId?: string;

  readonly filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'pending' as const, label: 'Pending' },
    { value: 'confirmed' as const, label: 'Confirmed' },
    { value: 'completed' as const, label: 'Completed' },
    { value: 'cancelled' as const, label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.svc.setFilter('all');
  }

  /** @internal */
  statusLabel(s: string): string {
    return (STATUS_LABELS as Record<string, string>)[s] ?? s;
  }

  /** @internal */
  statusColor(s: string): string {
    return (STATUS_COLORS as Record<string, string>)[s] ?? '#9e9e9e';
  }
}
