/**
 * @fileoverview MaintenanceRequestListComponent — Sprint 034
 *
 * `iu-maintenance-request-list` — Landlord-facing list of all maintenance requests
 * with status management (pending → in-progress → resolved/rejected).
 *
 * Patterns:
 * - Angular Signals only (no RxJS)
 * - Standalone component
 * - Inject MaintenanceRequestService
 *
 * Feature flag: MAINTENANCE_MODULE
 *
 * @example
 * ```html
 * <iu-maintenance-request-list
 *   [landlordId]="'landlord-001'"
 *   [view]="'landlord'" />
 * ```
 */
import {
  Component,
  input,
  inject,
  signal,
  computed,
  effect,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MaintenanceRequestService,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
} from '../../services/maintenance-request.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const STATUS_ICON: Record<MaintenanceStatus, string> = {
  pending: 'schedule',
  'in-progress': 'handyman',
  resolved: 'check_circle',
  rejected: 'cancel',
};

const PRIORITY_DOT: Record<MaintenancePriority, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#ff5722',
  urgent: '#d32f2f',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-maintenance-request-list`
 *
 * Dual-view list: tenants see their own requests; landlords can update status.
 *
 * Feature flag: MAINTENANCE_MODULE
 */
@Component({
  selector: 'iu-maintenance-request-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mrl-container">

      <!-- Header -->
      <div class="mrl-header">
        <div class="mrl-title-area">
          <span class="material-symbols-outlined mrl-header-icon">construction</span>
          <div>
            <h3 class="mrl-title">Maintenance Requests</h3>
            <p class="mrl-subtitle">
              {{ requests().length }} request{{ requests().length !== 1 ? 's' : '' }}
              @if (pendingCount() > 0) {
                · <span class="mrl-pending-badge">{{ pendingCount() }} pending</span>
              }
            </p>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="mrl-tabs" role="tablist">
          @for (tab of FILTER_TABS; track tab.value) {
            <button
              class="mrl-tab"
              role="tab"
              [class.mrl-tab-active]="activeFilter() === tab.value"
              (click)="activeFilter.set(tab.value)">
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (service.loading()) {
        <div class="mrl-loading">
          <div class="mrl-spinner"></div>
          <span>Loading requests…</span>
        </div>
      }

      <!-- Empty state -->
      @else if (filtered().length === 0) {
        <div class="mrl-empty">
          <span class="material-symbols-outlined mrl-empty-icon">build_circle</span>
          <p>No maintenance requests found.</p>
          @if (activeFilter() !== 'all') {
            <button class="mrl-btn-text" (click)="activeFilter.set('all')">Show all</button>
          }
        </div>
      }

      <!-- Request list -->
      @else {
        <ul class="mrl-list" role="list">
          @for (req of filtered(); track req.id) {
            <li class="mrl-item" [class.mrl-item-expanded]="expandedId() === req.id">

              <!-- Summary row -->
              <div class="mrl-item-summary" (click)="toggleExpand(req.id)">

                <div class="mrl-item-left">
                  <span
                    class="mrl-priority-dot"
                    [style.background]="priorityColor(req.priority)"
                    [title]="req.priority + ' priority'">
                  </span>
                  <div>
                    <div class="mrl-item-title">{{ req.title }}</div>
                    <div class="mrl-item-meta">
                      {{ req.category | titlecase }} · {{ req.propertyTitle }}
                      @if (view() === 'landlord') {
                        · {{ req.tenantName }}
                      }
                    </div>
                  </div>
                </div>

                <div class="mrl-item-right">
                  <span class="mrl-status-chip mrl-status-{{ req.status }}">
                    <span class="material-symbols-outlined mrl-status-icon">{{ statusIcon(req.status) }}</span>
                    {{ statusLabel(req.status) }}
                  </span>
                  <span class="mrl-date">{{ req.createdAt | date:'dd MMM' }}</span>
                  <span class="material-symbols-outlined mrl-chevron">
                    {{ expandedId() === req.id ? 'expand_less' : 'expand_more' }}
                  </span>
                </div>
              </div>

              <!-- Expanded detail -->
              @if (expandedId() === req.id) {
                <div class="mrl-item-detail">
                  <p class="mrl-description">{{ req.description }}</p>

                  @if (req.scheduledDate) {
                    <div class="mrl-info-row">
                      <span class="material-symbols-outlined">event</span>
                      Scheduled: {{ req.scheduledDate | date:'dd MMM yyyy, HH:mm' }}
                    </div>
                  }

                  @if (req.resolution) {
                    <div class="mrl-resolution">
                      <span class="material-symbols-outlined">task_alt</span>
                      <div>
                        <strong>Resolution:</strong>
                        <p>{{ req.resolution }}</p>
                      </div>
                    </div>
                  }

                  <!-- Landlord actions -->
                  @if (view() === 'landlord' && req.status !== 'resolved' && req.status !== 'rejected') {
                    <div class="mrl-actions">
                      @if (req.status === 'pending') {
                        <button
                          class="mrl-btn mrl-btn-info"
                          (click)="markInProgress(req.id); $event.stopPropagation()">
                          <span class="material-symbols-outlined">handyman</span>
                          Mark In Progress
                        </button>
                      }
                      <button
                        class="mrl-btn mrl-btn-success"
                        (click)="markResolved(req.id); $event.stopPropagation()">
                        <span class="material-symbols-outlined">check_circle</span>
                        Mark Resolved
                      </button>
                      <button
                        class="mrl-btn mrl-btn-error"
                        (click)="markRejected(req.id); $event.stopPropagation()">
                        <span class="material-symbols-outlined">cancel</span>
                        Reject
                      </button>
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .mrl-container {
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .mrl-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .mrl-title-area { display: flex; align-items: center; gap: 12px; }
    .mrl-header-icon {
      font-size: 28px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .mrl-title {
      margin: 0 0 2px;
      font-size: 18px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .mrl-subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mrl-pending-badge {
      color: var(--md-sys-color-tertiary, #7d5260);
      font-weight: 600;
    }
    .mrl-tabs {
      display: flex;
      gap: 4px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      border-radius: 24px;
      padding: 4px;
    }
    .mrl-tab {
      padding: 6px 14px;
      border: none;
      border-radius: 20px;
      background: transparent;
      font-size: 13px;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .mrl-tab-active {
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
    }
    .mrl-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 40px 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mrl-spinner {
      width: 20px; height: 20px;
      border: 2px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-top-color: var(--md-sys-color-primary, #6750a4);
      border-radius: 50%;
      animation: mrl-spin 0.6s linear infinite;
    }
    @keyframes mrl-spin { to { transform: rotate(360deg); } }
    .mrl-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .mrl-empty-icon { font-size: 48px; opacity: 0.4; margin-bottom: 8px; }
    .mrl-btn-text {
      background: none; border: none;
      color: var(--md-sys-color-primary, #6750a4);
      cursor: pointer; font-size: 14px; padding: 4px 8px;
    }
    .mrl-list { list-style: none; margin: 0; padding: 0; }
    .mrl-item {
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      transition: background 0.15s;
    }
    .mrl-item:last-child { border-bottom: none; }
    .mrl-item-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      cursor: pointer;
      gap: 12px;
    }
    .mrl-item-summary:hover {
      background: var(--md-sys-color-surface-container-low, #f3eff4);
    }
    .mrl-item-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .mrl-priority-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .mrl-item-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mrl-item-meta {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }
    .mrl-item-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .mrl-status-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }
    .mrl-status-icon { font-size: 14px; }
    .mrl-status-pending {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #21005d);
    }
    .mrl-status-in-progress {
      background: #fff3e0;
      color: #e65100;
    }
    .mrl-status-resolved {
      background: var(--md-sys-color-tertiary-container, #d7f4ca);
      color: var(--md-sys-color-on-tertiary-container, #0d2007);
    }
    .mrl-status-rejected {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }
    .mrl-date {
      font-size: 12px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .mrl-chevron {
      font-size: 20px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .mrl-item-detail {
      padding: 0 20px 16px 42px;
    }
    .mrl-description {
      margin: 0 0 12px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1.6;
    }
    .mrl-info-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-bottom: 12px;
    }
    .mrl-info-row .material-symbols-outlined { font-size: 16px; }
    .mrl-resolution {
      display: flex;
      gap: 8px;
      background: var(--md-sys-color-tertiary-container, #d7f4ca);
      color: var(--md-sys-color-on-tertiary-container, #0d2007);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .mrl-resolution .material-symbols-outlined { font-size: 18px; flex-shrink: 0; }
    .mrl-resolution strong { display: block; margin-bottom: 4px; }
    .mrl-resolution p { margin: 0; }
    .mrl-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 4px; }
    .mrl-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 7px 14px;
      border: none;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .mrl-btn .material-symbols-outlined { font-size: 16px; }
    .mrl-btn-info {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #21005d);
    }
    .mrl-btn-success {
      background: var(--md-sys-color-tertiary-container, #d7f4ca);
      color: var(--md-sys-color-on-tertiary-container, #0d2007);
    }
    .mrl-btn-error {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }
  `],
})
export class MaintenanceRequestListComponent implements OnInit {
  /** @input Tenant id — load tenant-specific view */
  readonly tenantId = input<string | null>(null);
  /** @input Landlord id — load all requests for this landlord */
  readonly landlordId = input<string | null>(null);
  /** @input 'tenant' (read-only) or 'landlord' (with status actions) */
  readonly view = input<'tenant' | 'landlord'>('tenant');

  readonly service = inject(MaintenanceRequestService);

  readonly activeFilter = signal<MaintenanceStatus | 'all'>('all');
  readonly expandedId = signal<string | null>(null);

  readonly FILTER_TABS: Array<{ label: string; value: MaintenanceStatus | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  readonly requests = this.service.requests;
  readonly pendingCount = this.service.pendingCount;

  readonly filtered = computed(() => {
    const filter = this.activeFilter();
    const all = this.requests();
    return filter === 'all' ? all : all.filter(r => r.status === filter);
  });

  ngOnInit(): void {
    const tid = this.tenantId();
    const lid = this.landlordId();
    if (tid) this.service.loadForTenant(tid);
    else if (lid) this.service.loadForLandlord(lid);
  }

  /** Toggle detail expand for a request. */
  toggleExpand(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  /** Get display label for a status. */
  statusLabel(status: MaintenanceStatus): string {
    return STATUS_LABEL[status];
  }

  /** Get material icon name for a status. */
  statusIcon(status: MaintenanceStatus): string {
    return STATUS_ICON[status];
  }

  /** Get priority dot color. */
  priorityColor(priority: MaintenancePriority): string {
    return PRIORITY_DOT[priority];
  }

  /** Mark request as in-progress. */
  markInProgress(id: string): void {
    this.service.updateStatus(id, { status: 'in-progress' });
  }

  /** Mark request as resolved. */
  markResolved(id: string): void {
    this.service.updateStatus(id, {
      status: 'resolved',
      resolution: 'Issue has been addressed by the landlord.',
    });
    this.expandedId.set(null);
  }

  /** Mark request as rejected. */
  markRejected(id: string): void {
    this.service.updateStatus(id, { status: 'rejected' });
    this.expandedId.set(null);
  }
}
