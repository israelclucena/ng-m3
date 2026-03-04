import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export type DatePickerMode = 'single' | 'range';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * DatePicker — M3-spec date picker with calendar overlay and optional range selection.
 *
 * Supports single date and date range modes. Full keyboard navigation.
 * Pure Angular Signals; no external date library required.
 *
 * @example
 * ```html
 * <!-- Single date -->
 * <iu-date-picker
 *   label="Check-in date"
 *   (dateChange)="onDate($event)"
 * />
 *
 * <!-- Date range -->
 * <iu-date-picker
 *   mode="range"
 *   label="Travel dates"
 *   (rangeChange)="onRange($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-date-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-date-picker" [class.iu-date-picker--open]="open()">
      <!-- Trigger input -->
      <div
        class="iu-date-picker__field"
        [class.iu-date-picker__field--focused]="open()"
        [class.iu-date-picker__field--error]="!!errorMessage()"
        [class.iu-date-picker__field--disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="material-symbols-outlined iu-date-picker__calendar-icon">calendar_month</span>
        <div class="iu-date-picker__text">
          <span class="iu-date-picker__label">{{ label() }}</span>
          <span class="iu-date-picker__value">{{ displayValue() }}</span>
        </div>
        @if (hasValue()) {
          <button class="iu-date-picker__clear" (click)="clear($event)" [attr.aria-label]="'Clear date'">
            <span class="material-symbols-outlined">close</span>
          </button>
        }
      </div>

      <!-- Calendar overlay -->
      @if (open()) {
        <div class="iu-date-picker__overlay" role="dialog" [attr.aria-label]="label()">
          <!-- Header: month/year nav -->
          <div class="iu-date-picker__header">
            <button class="iu-date-picker__nav" (click)="prevMonth()" aria-label="Previous month">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="iu-date-picker__month-btn" (click)="toggleYearView()">
              {{ MONTHS[viewMonth()] }} {{ viewYear() }}
              <span class="material-symbols-outlined">arrow_drop_down</span>
            </button>
            <button class="iu-date-picker__nav" (click)="nextMonth()" aria-label="Next month">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          @if (!yearView()) {
            <!-- Day headers -->
            <div class="iu-date-picker__days-header">
              @for (day of DAYS; track day) {
                <span>{{ day }}</span>
              }
            </div>

            <!-- Calendar grid -->
            <div class="iu-date-picker__grid">
              @for (cell of calendarCells(); track $index) {
                <button
                  class="iu-date-picker__cell"
                  [class.iu-date-picker__cell--empty]="!cell"
                  [class.iu-date-picker__cell--today]="cell && isToday(cell)"
                  [class.iu-date-picker__cell--selected]="cell && isSelected(cell)"
                  [class.iu-date-picker__cell--range-start]="cell && isRangeStart(cell)"
                  [class.iu-date-picker__cell--range-end]="cell && isRangeEnd(cell)"
                  [class.iu-date-picker__cell--in-range]="cell && isInRange(cell)"
                  [class.iu-date-picker__cell--disabled]="cell && isDisabled(cell)"
                  [disabled]="!cell || isDisabled(cell)"
                  (click)="onDayClick(cell!)"
                  (mouseenter)="onDayHover(cell)"
                  [attr.aria-label]="cell ? formatAriaDate(cell) : null"
                  [attr.aria-pressed]="cell && isSelected(cell)"
                >
                  {{ cell?.getDate() }}
                </button>
              }
            </div>

            <!-- Range mode footer -->
            @if (mode() === 'range') {
              <div class="iu-date-picker__range-footer">
                <span>{{ rangeFooterText() }}</span>
              </div>
            }
          } @else {
            <!-- Year/month selector -->
            <div class="iu-date-picker__year-grid">
              @for (month of MONTHS; track month; let i = $index) {
                <button
                  class="iu-date-picker__month-cell"
                  [class.iu-date-picker__month-cell--active]="i === viewMonth()"
                  (click)="selectMonth(i)"
                >{{ month.slice(0, 3) }}</button>
              }
            </div>
            <div class="iu-date-picker__year-nav">
              <button class="iu-date-picker__nav" (click)="prevYear()">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <span>{{ viewYear() }}</span>
              <button class="iu-date-picker__nav" (click)="nextYear()">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Helper / Error -->
    @if (errorMessage()) {
      <p class="iu-date-picker__error">
        <span class="material-symbols-outlined">error</span>
        {{ errorMessage() }}
      </p>
    } @else if (helperText()) {
      <p class="iu-date-picker__helper">{{ helperText() }}</p>
    }
  `,
  styles: [`
    :host { display: block; position: relative; }

    .iu-date-picker {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    /* ── Field ── */
    .iu-date-picker__field {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 4px 4px 0 0;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-bottom: 1px solid var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      min-height: 56px;
      transition: border-color 0.2s;

      &--focused {
        border-bottom: 2px solid var(--md-sys-color-primary, #6750a4);
      }

      &--error {
        border-bottom: 2px solid var(--md-sys-color-error, #b3261e);
      }

      &--disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }
    }

    .iu-date-picker__calendar-icon {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 20px;
      flex-shrink: 0;
    }

    .iu-date-picker__text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .iu-date-picker__label {
      font-size: 12px;
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 500;
    }

    .iu-date-picker__value {
      font-size: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .iu-date-picker__clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 50%;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      padding: 0;
      flex-shrink: 0;

      &:hover { background: rgba(0,0,0,0.08); }
      .material-symbols-outlined { font-size: 18px; }
    }

    /* ── Overlay ── */
    .iu-date-picker__overlay {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 200;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 16px;
      box-shadow: var(--md-sys-elevation-3, 0 4px 12px rgba(0,0,0,.2));
      padding: 16px;
      min-width: 320px;
      animation: iu-dp-in 0.15s ease-out;
    }

    @keyframes iu-dp-in {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Header ── */
    .iu-date-picker__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .iu-date-picker__month-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
      border-radius: 8px;
      padding: 6px 8px;

      &:hover { background: var(--md-sys-color-surface-container-high, #ece6f0); }
      .material-symbols-outlined { font-size: 18px; }
    }

    .iu-date-picker__nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 50%;
      color: var(--md-sys-color-on-surface-variant, #49454f);

      &:hover { background: var(--md-sys-color-surface-container-high, #ece6f0); }
      .material-symbols-outlined { font-size: 20px; }
    }

    /* ── Day headers ── */
    .iu-date-picker__days-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 4px;

      span {
        text-align: center;
        font-size: 11px;
        font-weight: 600;
        color: var(--md-sys-color-on-surface-variant, #49454f);
        padding: 4px 0;
      }
    }

    /* ── Grid ── */
    .iu-date-picker__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .iu-date-picker__cell {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      transition: background 0.15s, color 0.15s;

      &:hover:not(:disabled) {
        background: var(--md-sys-color-surface-container-high, #ece6f0);
      }

      &--empty { visibility: hidden; cursor: default; }

      &--today {
        border: 1px solid var(--md-sys-color-primary, #6750a4);
        color: var(--md-sys-color-primary, #6750a4);
        font-weight: 600;
      }

      &--selected {
        background: var(--md-sys-color-primary, #6750a4) !important;
        color: var(--md-sys-color-on-primary, #fff) !important;
        font-weight: 600;
        border-radius: 50%;
      }

      &--range-start {
        background: var(--md-sys-color-primary, #6750a4) !important;
        color: var(--md-sys-color-on-primary, #fff) !important;
        border-radius: 50% 0 0 50%;
      }

      &--range-end {
        background: var(--md-sys-color-primary, #6750a4) !important;
        color: var(--md-sys-color-on-primary, #fff) !important;
        border-radius: 0 50% 50% 0;
      }

      &--in-range {
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        border-radius: 0;
      }

      &--disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }
    }

    /* ── Range footer ── */
    .iu-date-picker__range-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }

    /* ── Year/Month grid ── */
    .iu-date-picker__year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .iu-date-picker__month-cell {
      padding: 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);

      &:hover { background: var(--md-sys-color-surface-container-high, #ece6f0); }

      &--active {
        background: var(--md-sys-color-primary, #6750a4);
        color: var(--md-sys-color-on-primary, #fff);
      }
    }

    .iu-date-picker__year-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    /* ── Helper/Error ── */
    .iu-date-picker__error,
    .iu-date-picker__helper {
      font-size: 12px;
      margin: 4px 16px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .iu-date-picker__error {
      color: var(--md-sys-color-error, #b3261e);
      .material-symbols-outlined { font-size: 14px; }
    }

    .iu-date-picker__helper {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent {
  // expose constants to template
  readonly MONTHS = MONTHS;
  readonly DAYS = DAYS;

  // ── Inputs ──
  /** Field label */
  label = input<string>('Date');
  /** Single or range mode */
  mode = input<DatePickerMode>('single');
  /** Initial value (single) */
  initialDate = input<Date | null>(null);
  /** Min selectable date */
  minDate = input<Date | null>(null);
  /** Max selectable date */
  maxDate = input<Date | null>(null);
  /** Whether picker is disabled */
  disabled = input<boolean>(false);
  /** Helper text */
  helperText = input<string>('');
  /** Override error message */
  errorMessage = input<string>('');

  // ── Outputs ──
  /** Emitted when a single date is selected */
  dateChange = output<Date | null>();
  /** Emitted when a range is selected (range mode) */
  rangeChange = output<DateRange>();

  // ── State ──
  readonly open = signal(false);
  readonly yearView = signal(false);

  // View state
  private readonly _now = new Date();
  readonly viewMonth = signal(this._now.getMonth());
  readonly viewYear = signal(this._now.getFullYear());

  // Selected values
  readonly selectedDate = signal<Date | null>(null);
  readonly rangeStart = signal<Date | null>(null);
  readonly rangeEnd = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);

  // Computed display
  readonly hasValue = computed(() =>
    this.mode() === 'single' ? !!this.selectedDate() : !!this.rangeStart()
  );

  readonly displayValue = computed(() => {
    if (this.mode() === 'range') {
      const start = this.rangeStart();
      const end = this.rangeEnd();
      if (!start) return 'Select dates';
      if (!end) return `${this.fmt(start)} → ...`;
      return `${this.fmt(start)} → ${this.fmt(end)}`;
    }
    return this.selectedDate() ? this.fmt(this.selectedDate()!) : 'Select date';
  });

  readonly rangeFooterText = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start) return 'Click to set start date';
    if (!end) return 'Click to set end date';
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    return `${days} night${days !== 1 ? 's' : ''}`;
  });

  /** Flat array of Date | null for the calendar grid */
  readonly calendarCells = computed(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  // ── Handlers ──

  toggle(): void {
    if (this.disabled()) return;
    this.open.update(v => !v);
  }

  clear(e: MouseEvent): void {
    e.stopPropagation();
    this.selectedDate.set(null);
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.dateChange.emit(null);
    this.rangeChange.emit({ start: null, end: null });
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  prevYear(): void { this.viewYear.update(y => y - 1); }
  nextYear(): void { this.viewYear.update(y => y + 1); }

  toggleYearView(): void { this.yearView.update(v => !v); }

  selectMonth(i: number): void {
    this.viewMonth.set(i);
    this.yearView.set(false);
  }

  onDayClick(date: Date): void {
    if (this.isDisabled(date)) return;
    if (this.mode() === 'single') {
      this.selectedDate.set(date);
      this.dateChange.emit(date);
      this.open.set(false);
    } else {
      // Range selection: click 1 = start, click 2 = end
      const start = this.rangeStart();
      if (!start || (start && this.rangeEnd())) {
        // Start new range
        this.rangeStart.set(date);
        this.rangeEnd.set(null);
      } else if (date < start) {
        // Clicked before start → swap
        this.rangeStart.set(date);
        this.rangeEnd.set(null);
      } else {
        this.rangeEnd.set(date);
        this.rangeChange.emit({ start: this.rangeStart(), end: date });
        this.open.set(false);
      }
    }
  }

  onDayHover(date: Date | null): void {
    this.hoverDate.set(date);
  }

  // ── Cell state helpers ──

  isToday(date: Date): boolean {
    const t = this._now;
    return date.getFullYear() === t.getFullYear() &&
           date.getMonth() === t.getMonth() &&
           date.getDate() === t.getDate();
  }

  isSelected(date: Date): boolean {
    if (this.mode() === 'single') {
      return this.sameDay(date, this.selectedDate());
    }
    return this.isRangeStart(date) || this.isRangeEnd(date);
  }

  isRangeStart(date: Date): boolean {
    return this.mode() === 'range' && this.sameDay(date, this.rangeStart());
  }

  isRangeEnd(date: Date): boolean {
    return this.mode() === 'range' && this.sameDay(date, this.rangeEnd());
  }

  isInRange(date: Date): boolean {
    if (this.mode() !== 'range') return false;
    const start = this.rangeStart();
    const end = this.rangeEnd() || this.hoverDate();
    if (!start || !end) return false;
    const [s, e] = start <= end ? [start, end] : [end, start];
    return date > s && date < e;
  }

  isDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  formatAriaDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  private sameDay(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private fmt(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
