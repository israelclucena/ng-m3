import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DataTableV2Component,
  DataTableV2Column,
  DataTableV2BulkAction,
} from '../data-table-v2/data-table-v2.component';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Minimal interface compatible with Angular's `resource()` and `httpResource()` APIs.
 * Components using ResourceDataTable should pass the result of `resource()` or `httpResource()`.
 */
export interface ResourceRef<T> {
  /** True while the resource is fetching */
  isLoading: () => boolean;
  /** The error thrown by the last fetch, if any */
  error: () => unknown;
  /** The resolved value, or undefined while loading / on error */
  value: () => T | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ResourceDataTable — Wraps DataTableV2 and manages Angular resource lifecycle states.
 *
 * Accepts an `httpResource<T[]>` or `resource<T[]>` directly and renders:
 * - M3 LinearProgressIndicator while loading
 * - Empty state with error message on failure
 * - Full DataTableV2 when data is available
 *
 * @example
 * ```html
 * <iu-resource-data-table
 *   [dataResource]="propertiesResource"
 *   [columns]="columns"
 * />
 * ```
 */
@Component({
  selector: 'iu-resource-data-table',
  standalone: true,
  imports: [CommonModule, DataTableV2Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Loading state: M3 LinearProgressIndicator -->
    @if (dataResource().isLoading()) {
      <div class="iu-rdt__loading" role="status" aria-label="Loading data…">
        <div class="iu-rdt__progress-track">
          <div class="iu-rdt__progress-indicator"></div>
        </div>
        <div class="iu-rdt__skeleton-rows">
          @for (row of skeletonRows(); track row) {
            <div class="iu-rdt__skeleton-row">
              <div class="iu-rdt__skeleton-cell iu-rdt__skeleton-cell--wide"></div>
              <div class="iu-rdt__skeleton-cell"></div>
              <div class="iu-rdt__skeleton-cell iu-rdt__skeleton-cell--narrow"></div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Error state -->
    @else if (dataResource().error()) {
      <div class="iu-rdt__error" role="alert">
        <span class="iu-rdt__error-icon material-symbols-outlined" aria-hidden="true">error_outline</span>
        <p class="iu-rdt__error-title">Failed to load data</p>
        <p class="iu-rdt__error-message">{{ errorMessage() }}</p>
      </div>
    }

    <!-- Data ready -->
    @else {
      <iu-data-table-v2
        [data]="rows()"
        [columns]="columns()"
        [bulkActions]="bulkActions()"
        [pageSize]="pageSize()"
      />
    }
  `,
  styles: [`
    /* ── ResourceDataTable ── */
    .iu-rdt__loading {
      padding: 16px;
    }

    /* M3 LinearProgressIndicator */
    .iu-rdt__progress-track {
      height: 4px;
      border-radius: 2px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      overflow: hidden;
      margin-bottom: 16px;
    }

    .iu-rdt__progress-indicator {
      height: 100%;
      width: 40%;
      background: var(--md-sys-color-primary, #6750a4);
      border-radius: 2px;
      animation: iu-rdt-progress 1.4s ease-in-out infinite;
    }

    @keyframes iu-rdt-progress {
      0%   { transform: translateX(-100%); }
      60%  { transform: translateX(250%); }
      100% { transform: translateX(250%); }
    }

    /* Skeleton rows */
    .iu-rdt__skeleton-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .iu-rdt__skeleton-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .iu-rdt__skeleton-cell {
      height: 16px;
      border-radius: 8px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      flex: 1;
      animation: iu-rdt-shimmer 1.6s ease-in-out infinite;
    }

    .iu-rdt__skeleton-cell--wide { flex: 2; }
    .iu-rdt__skeleton-cell--narrow { flex: 0.5; }

    @keyframes iu-rdt-shimmer {
      0%   { opacity: 1; }
      50%  { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* Error state */
    .iu-rdt__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      gap: 8px;
      text-align: center;
    }

    .iu-rdt__error-icon {
      font-size: 48px;
      color: var(--md-sys-color-error, #b3261e);
    }

    .iu-rdt__error-title {
      margin: 0;
      font-family: var(--md-sys-typescale-title-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-title-medium-size, 1rem);
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-rdt__error-message {
      margin: 0;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      font-size: var(--md-sys-typescale-body-medium-size, 0.875rem);
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
})
export class ResourceDataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {

  /**
   * Angular `resource()` or `httpResource()` reference that resolves to an array of T.
   * The component reacts to `isLoading()`, `error()`, and `value()` signals automatically.
   */
  dataResource = input.required<ResourceRef<T[]>>();

  /**
   * Column definitions for the DataTableV2.
   * See `DataTableV2Column<T>` for the full configuration options.
   */
  columns = input.required<DataTableV2Column<T>[]>();

  /**
   * Optional bulk actions shown in the DataTableV2 toolbar when rows are selected.
   */
  bulkActions = input<DataTableV2BulkAction[]>([]);

  /**
   * Number of rows per page.
   * @default 10
   */
  pageSize = input<number>(10);

  /** Resolved rows (empty array when loading or on error) */
  readonly rows = computed<T[]>(() => this.dataResource().value() ?? []);

  /** Human-readable error message extracted from the resource error */
  readonly errorMessage = computed(() => {
    const err = this.dataResource().error();
    if (!err) return '';
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'An unexpected error occurred. Please try again.';
  });

  /** Skeleton row count based on pageSize (capped at 5 for perf) */
  readonly skeletonRows = computed(() =>
    Array.from({ length: Math.min(this.pageSize(), 5) }, (_, i) => i)
  );
}
