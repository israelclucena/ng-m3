/**
 * @fileoverview ApplicationPipelineService — Sprint 036
 *
 * Signal-based Kanban state manager for tenant application pipelines.
 * Wraps TenantApplicationService and groups applications into 4 Kanban columns:
 *   applied → under_review → approved / rejected
 *
 * Provides column counts, per-column arrays, and drag-action methods
 * that delegate to the underlying TenantApplicationService.
 *
 * Feature flag: APPLICATION_PIPELINE
 *
 * @example
 * ```ts
 * const svc = inject(ApplicationPipelineService);
 * svc.load('landlord-001');
 * svc.columns(); // { applied, underReview, approved, rejected }
 * svc.moveToReview('app-001');
 * svc.approve('app-001');
 * ```
 */
import { Injectable, inject, computed, signal } from '@angular/core';
import {
  TenantApplicationService,
  TenantApplication,
  ApplicationStatus,
} from './tenant-application.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: string;
  label: string;
  icon: string;
  color: string;
  applications: TenantApplication[];
}

export interface PipelineColumns {
  applied: TenantApplication[];
  underReview: TenantApplication[];
  approved: TenantApplication[];
  rejected: TenantApplication[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * ApplicationPipelineService
 *
 * Groups applications into Kanban columns and provides action methods.
 * Feature flag: APPLICATION_PIPELINE
 */
@Injectable({ providedIn: 'root' })
export class ApplicationPipelineService {
  private readonly appSvc = inject(TenantApplicationService);

  /** Currently focused landlord ID (set via load()). */
  private readonly _landlordId = signal<string | null>(null);

  /** Whether the pipeline is loading. */
  readonly loading = computed(() => this.appSvc.loading());

  /** All applications for the current landlord. */
  readonly applications = computed(() => this.appSvc.applications());

  /** Grouped columns. */
  readonly columns = computed<PipelineColumns>(() => {
    const apps = this.applications();
    return {
      applied:     apps.filter(a => a.status === 'submitted' || a.status === 'draft'),
      underReview: apps.filter(a => a.status === 'under-review'),
      approved:    apps.filter(a => a.status === 'approved'),
      rejected:    apps.filter(a => a.status === 'rejected' || a.status === 'withdrawn'),
    };
  });

  /** Ordered column definitions for rendering. */
  readonly columnDefs = computed<KanbanColumn[]>(() => {
    const cols = this.columns();
    return [
      { id: 'applied',     label: 'Candidaturas',  icon: 'inbox',          color: 'secondary', applications: cols.applied },
      { id: 'underReview', label: 'Em Análise',     icon: 'search',         color: 'tertiary',  applications: cols.underReview },
      { id: 'approved',    label: 'Aprovadas',      icon: 'check_circle',   color: 'primary',   applications: cols.approved },
      { id: 'rejected',    label: 'Recusadas',      icon: 'cancel',         color: 'error',     applications: cols.rejected },
    ];
  });

  /** Total pipeline count. */
  readonly totalCount = computed(() => this.applications().length);

  /** Count by column. */
  readonly columnCounts = computed(() => {
    const cols = this.columns();
    return {
      applied:     cols.applied.length,
      underReview: cols.underReview.length,
      approved:    cols.approved.length,
      rejected:    cols.rejected.length,
    };
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Load all applications for a landlord.
   * @param landlordId - The landlord's user ID.
   */
  load(landlordId: string): void {
    this._landlordId.set(landlordId);
    this.appSvc.loadForLandlord(landlordId);
  }

  /**
   * Move an application from 'submitted' to 'under-review'.
   * @param appId - Application ID.
   */
  moveToReview(appId: string): void {
    this.appSvc.markUnderReview(appId);
  }

  /**
   * Approve an application.
   * @param appId - Application ID.
   */
  approve(appId: string): void {
    this.appSvc.approve(appId);
  }

  /**
   * Reject an application with an optional reason.
   * @param appId - Application ID.
   * @param reason - Optional rejection reason.
   */
  reject(appId: string, reason?: string): void {
    this.appSvc.reject(appId, reason ?? '');
  }
}
