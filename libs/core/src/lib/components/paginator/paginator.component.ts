import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Page size options emitted with page change events */
export interface PaginatorPageEvent {
  /** New zero-based page index */
  pageIndex: number;
  /** Previous zero-based page index */
  previousPageIndex: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  length: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Paginator — M3-styled page navigation bar.
 *
 * Signal-driven, no RxJS. Supports page size selection and ellipsis rendering
 * for large page counts. Designed to extend `PROPERTY_LISTING` pages.
 *
 * Feature flag: `PAGINATOR`
 *
 * @example
 * ```html
 * <iu-paginator
 *   [length]="totalItems"
 *   [pageSize]="9"
 *   [(pageIndex)]="currentPage"
 *   (page)="onPageChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-paginator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .iu-paginator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      flex-wrap: wrap;
      padding: 12px 0;
      font-family: var(--md-sys-typescale-label-large-font, Roboto, sans-serif);
    }

    .iu-paginator__info {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      margin-right: 12px;
    }

    .iu-paginator__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 8px;
      border-radius: var(--md-sys-shape-corner-full, 50px);
      border: none;
      background: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      color: var(--md-sys-color-on-surface, #1C1B1F);
      transition: background 150ms cubic-bezier(.2,0,0,1);
      position: relative;
      outline: none;
    }

    .iu-paginator__btn:hover:not(:disabled) {
      background: var(--md-sys-color-on-surface, #1C1B1F08);
    }

    .iu-paginator__btn:focus-visible {
      outline: 3px solid var(--md-sys-color-primary, #6750A4);
      outline-offset: 2px;
    }

    .iu-paginator__btn:disabled {
      opacity: .38;
      cursor: default;
    }

    .iu-paginator__btn--active {
      background: var(--md-sys-color-secondary-container, #E8DEF8);
      color: var(--md-sys-color-on-secondary-container, #1D192B);
      font-weight: 700;
    }

    .iu-paginator__btn--nav {
      font-size: 18px;
      color: var(--md-sys-color-primary, #6750A4);
    }

    .iu-paginator__ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      user-select: none;
    }

    .iu-paginator__size-select {
      margin-left: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
    }

    .iu-paginator__select {
      background: var(--md-sys-color-surface-variant, #E7E0EC);
      border: 1px solid var(--md-sys-color-outline, #79747E);
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      color: var(--md-sys-color-on-surface, #1C1B1F);
      cursor: pointer;
      outline: none;
    }
    .iu-paginator__select:focus-visible {
      outline: 2px solid var(--md-sys-color-primary, #6750A4);
    }
  `],
  template: `
    <nav class="iu-paginator" [attr.aria-label]="'Paginação'">
      <!-- Range info -->
      @if (showInfo()) {
        <span class="iu-paginator__info">{{ rangeLabel() }}</span>
      }

      <!-- First / Prev buttons -->
      <button
        class="iu-paginator__btn iu-paginator__btn--nav"
        (click)="first()"
        [disabled]="pageIndex() === 0"
        title="Primeira página"
        aria-label="Primeira página"
      >«</button>

      <button
        class="iu-paginator__btn iu-paginator__btn--nav"
        (click)="prev()"
        [disabled]="pageIndex() === 0"
        title="Página anterior"
        aria-label="Página anterior"
      >‹</button>

      <!-- Page numbers -->
      @for (page of visiblePages(); track page) {
        @if (page === -1) {
          <span class="iu-paginator__ellipsis">…</span>
        } @else {
          <button
            class="iu-paginator__btn"
            [class.iu-paginator__btn--active]="page === pageIndex()"
            (click)="goTo(page)"
            [attr.aria-current]="page === pageIndex() ? 'page' : null"
            [attr.aria-label]="'Página ' + (page + 1)"
          >{{ page + 1 }}</button>
        }
      }

      <!-- Next / Last buttons -->
      <button
        class="iu-paginator__btn iu-paginator__btn--nav"
        (click)="next()"
        [disabled]="pageIndex() >= lastPage()"
        title="Próxima página"
        aria-label="Próxima página"
      >›</button>

      <button
        class="iu-paginator__btn iu-paginator__btn--nav"
        (click)="last()"
        [disabled]="pageIndex() >= lastPage()"
        title="Última página"
        aria-label="Última página"
      >»</button>

      <!-- Page size selector -->
      @if (pageSizeOptions().length > 1) {
        <div class="iu-paginator__size-select">
          <span>Por página:</span>
          <select
            class="iu-paginator__select"
            [value]="pageSize()"
            (change)="onSizeChange($event)"
            aria-label="Itens por página"
          >
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </div>
      }
    </nav>
  `,
})
export class PaginatorComponent {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** Total number of items */
  readonly length = input<number>(0);

  /** Items per page */
  readonly pageSize = input<number>(9);

  /** Current zero-based page index (two-way bindable) */
  readonly pageIndex = model<number>(0);

  /** Available page size options (shown as a select). Pass [] to hide. */
  readonly pageSizeOptions = input<number[]>([6, 9, 12, 24]);

  /** Whether to display the "X–Y of Z" range label */
  readonly showInfo = input<boolean>(true);

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted on every page or page-size change */
  readonly page = output<PaginatorPageEvent>();

  // ── Computed ─────────────────────────────────────────────────────────────────

  protected readonly lastPage = computed(() =>
    Math.max(0, Math.ceil(this.length() / this.pageSize()) - 1),
  );

  protected readonly rangeLabel = computed(() => {
    const from = this.pageIndex() * this.pageSize() + 1;
    const to = Math.min(from + this.pageSize() - 1, this.length());
    return `${from}–${to} de ${this.length()}`;
  });

  /**
   * Produces an array of page indices (0-based) with -1 representing an ellipsis.
   * Always shows first, last, and a window around the current page.
   */
  protected readonly visiblePages = computed<number[]>(() => {
    const current = this.pageIndex();
    const last = this.lastPage();
    if (last <= 6) {
      return Array.from({ length: last + 1 }, (_, i) => i);
    }
    const pages: number[] = [];
    const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
    addPage(0);
    if (current > 2) pages.push(-1);
    for (let i = Math.max(1, current - 1); i <= Math.min(last - 1, current + 1); i++) {
      addPage(i);
    }
    if (current < last - 2) pages.push(-1);
    addPage(last);
    return pages;
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  protected goTo(page: number): void {
    if (page === this.pageIndex()) return;
    const prev = this.pageIndex();
    this.pageIndex.set(page);
    this._emit(prev);
  }

  protected first(): void { this.goTo(0); }
  protected prev(): void { this.goTo(Math.max(0, this.pageIndex() - 1)); }
  protected next(): void { this.goTo(Math.min(this.lastPage(), this.pageIndex() + 1)); }
  protected last(): void { this.goTo(this.lastPage()); }

  protected onSizeChange(event: Event): void {
    const newSize = Number((event.target as HTMLSelectElement).value);
    const prev = this.pageIndex();
    this.pageIndex.set(0);
    this.page.emit({ pageIndex: 0, previousPageIndex: prev, pageSize: newSize, length: this.length() });
  }

  private _emit(previousPageIndex: number): void {
    this.page.emit({
      pageIndex: this.pageIndex(),
      previousPageIndex,
      pageSize: this.pageSize(),
      length: this.length(),
    });
  }
}
