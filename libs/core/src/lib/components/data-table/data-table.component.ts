import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface DataTableColumn<T = any> {
  /** Unique key matching the data property */
  key: string;
  /** Display header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Optional width (CSS value) */
  width?: string;
  /** Optional cell formatter */
  format?: (value: any, row: T) => string;
  /** Text alignment */
  align?: 'start' | 'center' | 'end';
}

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

/**
 * DataTable — Full-featured data table with sorting, filtering, and pagination.
 *
 * Uses Angular Signals for all reactive state. No RxJS.
 *
 * @example
 * ```html
 * <iu-data-table
 *   [columns]="columns"
 *   [data]="users()"
 *   [pageSize]="10"
 *   [filterable]="true"
 * />
 * ```
 */
@Component({
  selector: 'iu-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-data-table">
      @if (filterable()) {
        <div class="iu-data-table__toolbar">
          <div class="iu-data-table__search">
            <span class="material-symbols-outlined iu-data-table__search-icon">search</span>
            <input
              type="text"
              class="iu-data-table__search-input"
              [placeholder]="filterPlaceholder()"
              [value]="filterText()"
              (input)="onFilterInput($event)"
            />
            @if (filterText()) {
              <button class="iu-data-table__clear" (click)="clearFilter()">
                <span class="material-symbols-outlined">close</span>
              </button>
            }
          </div>
        </div>
      }

      <div class="iu-data-table__container">
        <table class="iu-data-table__table">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  class="iu-data-table__header"
                  [class.iu-data-table__header--sortable]="col.sortable"
                  [class.iu-data-table__header--sorted]="sortState().column === col.key && sortState().direction !== 'none'"
                  [style.width]="col.width || 'auto'"
                  [style.text-align]="col.align || 'start'"
                  (click)="col.sortable ? toggleSort(col.key) : null"
                >
                  <span class="iu-data-table__header-content">
                    {{ col.label }}
                    @if (col.sortable) {
                      <span class="material-symbols-outlined iu-data-table__sort-icon">
                        {{ getSortIcon(col.key) }}
                      </span>
                    }
                  </span>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of paginatedData(); track $index) {
              <tr class="iu-data-table__row" (click)="rowClick.emit(row)">
                @for (col of columns(); track col.key) {
                  <td
                    class="iu-data-table__cell"
                    [style.text-align]="col.align || 'start'"
                  >
                    {{ getCellValue(row, col) }}
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns().length" class="iu-data-table__empty">
                  {{ emptyMessage() }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (paginated()) {
        <div class="iu-data-table__pagination">
          <span class="iu-data-table__pagination-info">
            {{ paginationInfo() }}
          </span>
          <div class="iu-data-table__pagination-controls">
            <button
              class="iu-data-table__page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(0)"
            >
              <span class="material-symbols-outlined">first_page</span>
            </button>
            <button
              class="iu-data-table__page-btn"
              [disabled]="currentPage() === 0"
              (click)="goToPage(currentPage() - 1)"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="iu-data-table__page-number">
              {{ currentPage() + 1 }} / {{ totalPages() }}
            </span>
            <button
              class="iu-data-table__page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(currentPage() + 1)"
            >
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <button
              class="iu-data-table__page-btn"
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="goToPage(totalPages() - 1)"
            >
              <span class="material-symbols-outlined">last_page</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './data-table.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends Record<string, any> = Record<string, any>> {
  /** Column definitions */
  columns = input.required<DataTableColumn<T>[]>();
  /** Data rows */
  data = input.required<T[]>();
  /** Enable filtering */
  filterable = input(false);
  /** Filter placeholder text */
  filterPlaceholder = input('Search...');
  /** Enable pagination */
  paginated = input(true);
  /** Rows per page */
  pageSize = input(10);
  /** Empty state message */
  emptyMessage = input('No data available');

  /** Emitted when a row is clicked */
  rowClick = output<T>();
  /** Emitted on sort change */
  sortChange = output<SortState>();
  /** Emitted on page change */
  pageChange = output<PageEvent>();

  /** Current filter text */
  filterText = signal('');
  /** Current sort state */
  sortState = signal<SortState>({ column: '', direction: 'none' });
  /** Current page index (0-based) */
  currentPage = signal(0);

  /** Filtered data */
  filteredData = computed(() => {
    const text = this.filterText().toLowerCase().trim();
    const rows = this.data();
    if (!text) return rows;
    return rows.filter(row =>
      this.columns().some(col => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(text);
      })
    );
  });

  /** Sorted data */
  sortedData = computed(() => {
    const { column, direction } = this.sortState();
    const rows = [...this.filteredData()];
    if (!column || direction === 'none') return rows;

    return rows.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp: number;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return direction === 'desc' ? -cmp : cmp;
    });
  });

  /** Total pages */
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedData().length / this.pageSize()))
  );

  /** Paginated data slice */
  paginatedData = computed(() => {
    if (!this.paginated()) return this.sortedData();
    const start = this.currentPage() * this.pageSize();
    return this.sortedData().slice(start, start + this.pageSize());
  });

  /** Pagination info text */
  paginationInfo = computed(() => {
    const total = this.sortedData().length;
    const start = this.currentPage() * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, total);
    return total ? `${start}–${end} of ${total}` : '0 results';
  });

  /** Handle filter input */
  onFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterText.set(value);
    this.currentPage.set(0);
  }

  /** Clear filter */
  clearFilter(): void {
    this.filterText.set('');
    this.currentPage.set(0);
  }

  /** Toggle sort on a column */
  toggleSort(key: string): void {
    const current = this.sortState();
    let direction: SortDirection;
    if (current.column === key) {
      direction = current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? 'none' : 'asc';
    } else {
      direction = 'asc';
    }
    const newState: SortState = { column: key, direction };
    this.sortState.set(newState);
    this.sortChange.emit(newState);
    this.currentPage.set(0);
  }

  /** Get sort icon for a column */
  getSortIcon(key: string): string {
    const { column, direction } = this.sortState();
    if (column !== key || direction === 'none') return 'unfold_more';
    return direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /** Get formatted cell value */
  getCellValue(row: T, col: DataTableColumn<T>): string {
    const val = row[col.key];
    if (col.format) return col.format(val, row);
    return val != null ? String(val) : '';
  }

  /** Navigate to page */
  goToPage(page: number): void {
    const clamped = Math.max(0, Math.min(page, this.totalPages() - 1));
    this.currentPage.set(clamped);
    this.pageChange.emit({
      pageIndex: clamped,
      pageSize: this.pageSize(),
      length: this.sortedData().length,
    });
  }
}
