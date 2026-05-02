import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DataTableV2SortDir = 'asc' | 'desc' | null;

export interface DataTableV2Column<T = Record<string, unknown>> {
  /** Property key in the data object */
  key: keyof T & string;
  /** Display label */
  label: string;
  /** Optional fixed width (e.g. '80px') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Enable column sorting */
  sortable?: boolean;
}

export interface DataTableV2BulkAction {
  /** Action identifier */
  id: string;
  /** Label displayed in toolbar */
  label: string;
  /** Material Symbol icon name */
  icon?: string;
  /** Visual variant */
  variant?: 'default' | 'danger';
}

export interface DataTableV2SelectEvent<T> {
  selected: T[];
  mode: 'single' | 'multi';
}

export interface DataTableV2BulkActionEvent<T> {
  actionId: string;
  selected: T[];
}

export interface DataTableV2RowExpandEvent<T> {
  row: T;
  expanded: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * DataTableV2 — Enhanced data table with row selection, bulk actions, and expandable rows.
 *
 * Features over DataTable v1:
 * - Single/multi row selection with checkbox column
 * - Bulk actions toolbar (shown when rows selected)
 * - Row expand/collapse with content projection
 * - Sorting tri-state per column
 * - Full-text filter
 * - Pagination via Signals
 *
 * @example
 * ```html
 * <iu-data-table-v2
 *   [columns]="columns"
 *   [data]="rows"
 *   selectionMode="multi"
 *   [bulkActions]="actions"
 *   [expandable]="true"
 *   (selectionChange)="onSelect($event)"
 *   (bulkAction)="onBulkAction($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-data-table-v2',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-dtv2" [class.iu-dtv2--compact]="compact()">

      <!-- ── Filter bar ── -->
      @if (filterable()) {
        <div class="iu-dtv2__toolbar iu-dtv2__toolbar--filter">
          <span class="material-symbols-outlined iu-dtv2__search-icon">search</span>
          <input
            class="iu-dtv2__filter-input"
            type="text"
            [placeholder]="filterPlaceholder()"
            [value]="filterQuery()"
            (input)="onFilter($event)"
            aria-label="Filter rows"
          />
          @if (filterQuery()) {
            <button class="iu-dtv2__clear-btn" (click)="clearFilter()" aria-label="Clear filter">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>
      }

      <!-- ── Bulk action toolbar (visible when rows selected) ── -->
      @if (hasSelection() && bulkActions().length > 0) {
        <div class="iu-dtv2__toolbar iu-dtv2__toolbar--bulk" role="toolbar" aria-label="Bulk actions">
          <span class="iu-dtv2__selection-count">
            {{ selectedKeys().size }} row{{ selectedKeys().size !== 1 ? 's' : '' }} selected
          </span>
          <div class="iu-dtv2__bulk-actions">
            @for (action of bulkActions(); track action.id) {
              <button
                class="iu-dtv2__bulk-btn"
                [class.iu-dtv2__bulk-btn--danger]="action.variant === 'danger'"
                (click)="onBulkActionClick(action.id)"
                [attr.aria-label]="action.label"
              >
                @if (action.icon) {
                  <span class="material-symbols-outlined">{{ action.icon }}</span>
                }
                {{ action.label }}
              </button>
            }
          </div>
          <button class="iu-dtv2__bulk-btn iu-dtv2__bulk-btn--clear" (click)="clearSelection()" aria-label="Clear selection">
            <span class="material-symbols-outlined">close</span>
            Deselect all
          </button>
        </div>
      }

      <!-- ── Table ── -->
      <div class="iu-dtv2__scroll-wrap">
        <table class="iu-dtv2__table" role="grid" [attr.aria-rowcount]="filteredData().length">
          <thead class="iu-dtv2__thead">
            <tr>
              <!-- Select-all checkbox (multi only) -->
              @if (selectionMode() === 'multi') {
                <th class="iu-dtv2__th iu-dtv2__th--check" aria-label="Select all">
                  <label class="iu-dtv2__checkbox">
                    <input
                      type="checkbox"
                      [checked]="isAllSelected()"
                      [indeterminate]="isIndeterminate()"
                      (change)="toggleAll()"
                      aria-label="Select all rows"
                    />
                    <span class="iu-dtv2__check-mark"></span>
                  </label>
                </th>
              }
              <!-- Expand column -->
              @if (expandable()) {
                <th class="iu-dtv2__th iu-dtv2__th--expand"></th>
              }
              @for (col of columns(); track col.key) {
                <th
                  class="iu-dtv2__th"
                  [class.iu-dtv2__th--sortable]="col.sortable"
                  [class.iu-dtv2__th--sorted]="sortCol() === col.key"
                  [style.width]="col.width || 'auto'"
                  [style.text-align]="col.align || 'left'"
                  (click)="col.sortable && cycleSort(col.key)"
                  [attr.aria-sort]="getSortAriaLabel(col.key)"
                >
                  <span class="iu-dtv2__th-inner">
                    {{ col.label }}
                    @if (col.sortable) {
                      <span class="iu-dtv2__sort-icon material-symbols-outlined">
                        {{ getSortIcon(col.key) }}
                      </span>
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>

          <tbody class="iu-dtv2__tbody">
            @if (pagedData().length === 0) {
              <tr>
                <td
                  class="iu-dtv2__empty"
                  [attr.colspan]="colSpan()"
                >
                  <span class="material-symbols-outlined">search_off</span>
                  <span>{{ emptyMessage() }}</span>
                </td>
              </tr>
            }

            @for (row of pagedData(); track rowKey(row); let i = $index) {
              <!-- Main row -->
              <tr
                class="iu-dtv2__tr"
                [class.iu-dtv2__tr--selected]="isSelected(row)"
                [class.iu-dtv2__tr--expanded]="isExpanded(row)"
                (click)="onRowClick(row)"
                [attr.aria-selected]="isSelected(row)"
                role="row"
              >
                <!-- Checkbox -->
                @if (selectionMode() === 'multi') {
                  <td class="iu-dtv2__td iu-dtv2__td--check" (click)="$event.stopPropagation()">
                    <label class="iu-dtv2__checkbox">
                      <input
                        type="checkbox"
                        [checked]="isSelected(row)"
                        (change)="toggleRow(row)"
                        [attr.aria-label]="'Select row ' + (i + 1)"
                      />
                      <span class="iu-dtv2__check-mark"></span>
                    </label>
                  </td>
                }
                <!-- Expand toggle -->
                @if (expandable()) {
                  <td class="iu-dtv2__td iu-dtv2__td--expand" (click)="toggleExpand(row); $event.stopPropagation()">
                    <button class="iu-dtv2__expand-btn" [attr.aria-expanded]="isExpanded(row)" [attr.aria-label]="isExpanded(row) ? 'Collapse row' : 'Expand row'">
                      <span class="material-symbols-outlined iu-dtv2__expand-icon" [class.iu-dtv2__expand-icon--open]="isExpanded(row)">
                        chevron_right
                      </span>
                    </button>
                  </td>
                }
                <!-- Data cells -->
                @for (col of columns(); track col.key) {
                  <td
                    class="iu-dtv2__td"
                    [style.text-align]="col.align || 'left'"
                  >{{ row[col.key] }}</td>
                }
              </tr>

              <!-- Expand row -->
              @if (expandable() && isExpanded(row)) {
                <tr class="iu-dtv2__tr iu-dtv2__tr--detail" role="row">
                  <td [attr.colspan]="colSpan()" class="iu-dtv2__td iu-dtv2__td--detail">
                    <div class="iu-dtv2__detail-content">
                      @for (col of columns(); track col.key) {
                        <div class="iu-dtv2__detail-row">
                          <span class="iu-dtv2__detail-label">{{ col.label }}</span>
                          <span class="iu-dtv2__detail-value">{{ row[col.key] }}</span>
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- ── Pagination ── -->
      @if (totalPages() > 1) {
        <div class="iu-dtv2__pagination" role="navigation" aria-label="Table pagination">
          <span class="iu-dtv2__page-info">
            {{ pageStart() }}–{{ pageEnd() }} of {{ filteredData().length }}
          </span>
          <div class="iu-dtv2__page-controls">
            <button
              class="iu-dtv2__page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(0)"
              aria-label="First page"
            >
              <span class="material-symbols-outlined">first_page</span>
            </button>
            <button
              class="iu-dtv2__page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Previous page"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="iu-dtv2__page-label">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
            <button
              class="iu-dtv2__page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Next page"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              class="iu-dtv2__page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(totalPages() - 1)"
              aria-label="Last page"
            >
              <span class="material-symbols-outlined">last_page</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .iu-dtv2 {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 12px;
      overflow: hidden;
      background: var(--md-sys-color-surface, #fff);
      font-family: var(--md-sys-typescale-body-medium-font, system-ui);
    }

    /* ── Toolbars ── */
    .iu-dtv2__toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);

      &--filter {
        background: var(--md-sys-color-surface, #fff);
      }

      &--bulk {
        background: var(--md-sys-color-secondary-container, #e8def8);
        color: var(--md-sys-color-on-secondary-container, #1d192b);
        flex-wrap: wrap;
      }
    }

    .iu-dtv2__search-icon {
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }

    .iu-dtv2__filter-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);

      &::placeholder { color: var(--md-sys-color-on-surface-variant, #49454f); }
    }

    .iu-dtv2__clear-btn {
      display: flex;
      align-items: center;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 4px;
      border-radius: 50%;
      transition: background 0.15s;

      &:hover { background: var(--md-sys-color-surface-variant, #e7e0ec); }

      .material-symbols-outlined { font-size: 18px; }
    }

    .iu-dtv2__selection-count {
      font-size: 14px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .iu-dtv2__bulk-actions {
      display: flex;
      gap: 8px;
      flex: 1;
    }

    .iu-dtv2__bulk-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      transition: background 0.15s;

      &:hover { background: rgba(0,0,0,0.06); }

      &--danger {
        color: var(--md-sys-color-error, #b3261e);
        border-color: var(--md-sys-color-error, #b3261e);
        &:hover { background: var(--md-sys-color-error-container, #f9dedc); }
      }

      &--clear {
        margin-left: auto;
        border-color: transparent;
      }

      .material-symbols-outlined { font-size: 16px; }
    }

    /* ── Table ── */
    .iu-dtv2__scroll-wrap {
      overflow-x: auto;
    }

    .iu-dtv2__table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    .iu-dtv2__thead {
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .iu-dtv2__th {
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      white-space: nowrap;
      user-select: none;

      &--check, &--expand {
        width: 48px;
        padding: 0 8px;
      }

      &--sortable {
        cursor: pointer;
        &:hover .iu-dtv2__sort-icon { opacity: 1; }
      }

      &--sorted {
        color: var(--md-sys-color-primary, #6750a4);
        .iu-dtv2__sort-icon { opacity: 1; color: var(--md-sys-color-primary, #6750a4); }
      }
    }

    .iu-dtv2__th-inner {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .iu-dtv2__sort-icon {
      font-size: 16px;
      opacity: 0.3;
      transition: opacity 0.15s;
    }

    .iu-dtv2__tbody .iu-dtv2__tr {
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      cursor: pointer;
      transition: background 0.12s;

      &:hover { background: var(--md-sys-color-surface-container, #ece6f0); }

      &--selected {
        background: var(--md-sys-color-secondary-container, #e8def8);
        &:hover { background: color-mix(in srgb, var(--md-sys-color-secondary-container, #e8def8) 85%, #000); }
      }

      &--detail {
        cursor: default;
        background: var(--md-sys-color-surface-container-low, #f7f2fa);
        &:hover { background: var(--md-sys-color-surface-container-low, #f7f2fa); }
      }
    }

    .iu-dtv2__td {
      padding: 12px 16px;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      vertical-align: middle;

      &--check, &--expand { padding: 0 8px; }

      &--detail { padding: 0; }

      &--detail .iu-dtv2__detail-content {
        padding: 12px 16px 16px 48px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px 24px;
      }
    }

    .iu-dtv2__empty {
      padding: 48px 16px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);

      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .material-symbols-outlined { font-size: 40px; opacity: 0.4; }
    }

    /* ── Detail panel ── */
    .iu-dtv2__detail-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .iu-dtv2__detail-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-dtv2__detail-value {
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    /* ── Checkbox ── */
    .iu-dtv2__checkbox {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
      position: relative;

      input[type='checkbox'] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
    }

    .iu-dtv2__check-mark {
      width: 18px;
      height: 18px;
      border: 2px solid var(--md-sys-color-outline, #79747e);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.12s, border-color 0.12s;
      background: transparent;
      flex-shrink: 0;

      .iu-dtv2__checkbox:has(input:checked) & {
        background: var(--md-sys-color-primary, #6750a4);
        border-color: var(--md-sys-color-primary, #6750a4);

        &::after {
          content: '';
          display: block;
          width: 10px;
          height: 6px;
          border-left: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) translateY(-1px);
        }
      }

      .iu-dtv2__checkbox:has(input:indeterminate) & {
        background: var(--md-sys-color-primary, #6750a4);
        border-color: var(--md-sys-color-primary, #6750a4);

        &::after {
          content: '';
          display: block;
          width: 10px;
          height: 2px;
          background: #fff;
        }
      }
    }

    /* ── Expand button ── */
    .iu-dtv2__expand-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 50%;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.12s;

      &:hover { background: var(--md-sys-color-surface-variant, #e7e0ec); }
    }

    .iu-dtv2__expand-icon {
      font-size: 20px;
      transition: transform 0.2s;
    }
    .iu-dtv2__expand-icon--open { transform: rotate(90deg); }

    /* ── Pagination ── */
    .iu-dtv2__pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
    }

    .iu-dtv2__page-info {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-right: auto;
    }

    .iu-dtv2__page-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .iu-dtv2__page-label {
      font-size: 13px;
      padding: 0 8px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      min-width: 60px;
      text-align: center;
    }

    .iu-dtv2__page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.12s;

      &:hover:not(:disabled) { background: var(--md-sys-color-surface-variant, #e7e0ec); }
      &:disabled { opacity: 0.38; cursor: default; }

      .material-symbols-outlined { font-size: 20px; }
    }

    /* ── Compact variant ── */
    .iu-dtv2--compact {
      .iu-dtv2__th { padding: 10px 12px; }
      .iu-dtv2__td { padding: 8px 12px; }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableV2Component<T extends Record<string, unknown>> {
  /** Column definitions */
  columns = input<DataTableV2Column<T>[]>([]);
  /** Row data */
  data = input<T[]>([]);
  /** Row identifier key (defaults to 'id') */
  rowId = input<keyof T & string>('id');
  /** Selection mode */
  selectionMode = input<'none' | 'single' | 'multi'>('multi');
  /** Bulk action definitions */
  bulkActions = input<DataTableV2BulkAction[]>([]);
  /** Enable expandable rows */
  expandable = input<boolean>(false);
  /** Enable filter bar */
  filterable = input<boolean>(true);
  /** Filter input placeholder */
  filterPlaceholder = input<string>('Filter rows…');
  /** Rows per page (0 = no pagination) */
  pageSize = input<number>(10);
  /** Empty state message */
  emptyMessage = input<string>('No results found');
  /** Compact density */
  compact = input<boolean>(false);

  // ── Outputs ──
  /** Fires when selection changes */
  selectionChange = output<DataTableV2SelectEvent<T>>();
  /** Fires when a bulk action button is clicked */
  bulkAction = output<DataTableV2BulkActionEvent<T>>();
  /** Fires when a row is expanded or collapsed */
  rowExpand = output<DataTableV2RowExpandEvent<T>>();

  // ── Internal state ──
  readonly filterQuery = signal('');
  readonly currentPage = signal(0);
  readonly sortCol = signal<string | null>(null);
  readonly sortDir = signal<DataTableV2SortDir>(null);
  readonly selectedKeys = signal<Set<unknown>>(new Set());
  readonly expandedKeys = signal<Set<unknown>>(new Set());

  // ── Derived ──
  readonly filteredData = computed(() => {
    const q = this.filterQuery().trim().toLowerCase();
    let rows = this.data();
    if (q) {
      rows = rows.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
    }
    const col = this.sortCol();
    const dir = this.sortDir();
    if (col && dir) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[col] ?? '');
        const bv = String(b[col] ?? '');
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  });

  readonly totalPages = computed(() => {
    const ps = this.pageSize();
    if (ps <= 0) return 1;
    return Math.max(1, Math.ceil(this.filteredData().length / ps));
  });

  readonly pagedData = computed(() => {
    const ps = this.pageSize();
    if (ps <= 0) return this.filteredData();
    const start = this.currentPage() * ps;
    return this.filteredData().slice(start, start + ps);
  });

  readonly pageStart = computed(() => this.currentPage() * this.pageSize() + 1);
  readonly pageEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.pageSize(), this.filteredData().length)
  );

  readonly hasSelection = computed(() => this.selectedKeys().size > 0);

  readonly isAllSelected = computed(() => {
    const d = this.pagedData();
    return d.length > 0 && d.every(r => this.selectedKeys().has(this.rowKey(r)));
  });

  readonly isIndeterminate = computed(() => {
    const d = this.pagedData();
    const sel = d.filter(r => this.selectedKeys().has(this.rowKey(r)));
    return sel.length > 0 && sel.length < d.length;
  });

  readonly colSpan = computed(() => {
    let span = this.columns().length;
    if (this.selectionMode() === 'multi') span++;
    if (this.expandable()) span++;
    return span;
  });

  // ── Helpers ──
  rowKey(row: T): unknown {
    return row[this.rowId()];
  }

  isSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey(row));
  }

  isExpanded(row: T): boolean {
    return this.expandedKeys().has(this.rowKey(row));
  }

  getSortIcon(key: string): string {
    if (this.sortCol() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getSortAriaLabel(key: string): string | null {
    if (this.sortCol() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  selectedRows(): T[] {
    return this.data().filter(r => this.selectedKeys().has(this.rowKey(r)));
  }

  // ── Actions ──
  onFilter(e: Event): void {
    this.filterQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(0);
  }

  clearFilter(): void {
    this.filterQuery.set('');
    this.currentPage.set(0);
  }

  cycleSort(key: string): void {
    if (this.sortCol() !== key) {
      this.sortCol.set(key);
      this.sortDir.set('asc');
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
    } else {
      this.sortCol.set(null);
      this.sortDir.set(null);
    }
  }

  onRowClick(row: T): void {
    if (this.selectionMode() === 'none') return;
    if (this.selectionMode() === 'single') {
      const key = this.rowKey(row);
      const next = new Set<unknown>(this.isSelected(row) ? [] : [key]);
      this.selectedKeys.set(next);
      this.selectionChange.emit({ selected: this.selectedRows(), mode: 'single' });
    } else {
      this.toggleRow(row);
    }
  }

  toggleRow(row: T): void {
    const key = this.rowKey(row);
    const next = new Set(this.selectedKeys());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.selectedKeys.set(next);
    this.selectionChange.emit({ selected: this.selectedRows(), mode: 'multi' });
  }

  toggleAll(): void {
    const all = this.pagedData().map(r => this.rowKey(r));
    const current = this.selectedKeys();
    const allSel = all.every(k => current.has(k));
    const next = new Set(current);
    if (allSel) all.forEach(k => next.delete(k));
    else all.forEach(k => next.add(k));
    this.selectedKeys.set(next);
    this.selectionChange.emit({ selected: this.selectedRows(), mode: 'multi' });
  }

  clearSelection(): void {
    this.selectedKeys.set(new Set());
    this.selectionChange.emit({ selected: [], mode: 'multi' });
  }

  toggleExpand(row: T): void {
    const key = this.rowKey(row);
    const next = new Set(this.expandedKeys());
    const expanded = !next.has(key);
    if (expanded) next.add(key); else next.delete(key);
    this.expandedKeys.set(next);
    this.rowExpand.emit({ row, expanded });
  }

  onBulkActionClick(actionId: string): void {
    this.bulkAction.emit({ actionId, selected: this.selectedRows() });
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(0, Math.min(page, this.totalPages() - 1)));
  }
}
