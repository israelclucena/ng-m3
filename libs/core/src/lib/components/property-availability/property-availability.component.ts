/**
 * @fileoverview PropertyAvailabilityComponent — Sprint 027
 *
 * Real-time booking availability calendar with signal-based state.
 * Shows two months side-by-side, highlights booked date ranges,
 * and emits selected ranges for booking inquiries.
 *
 * Feature flag: AVAILABILITY_CALENDAR
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  InputSignal,
  OutputEmitterRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateRange } from '../date-picker/date-picker.component';

/** Internal day cell for calendar rendering */
interface CalendarDay {
  date: Date;
  /** Day number (1-31) or 0 for empty padding cells */
  day: number;
  isBooked: boolean;
  isSelected: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isPast: boolean;
  isBeyondMax: boolean;
  isEmpty: boolean;
}

/** A calendar month grid */
interface CalendarMonth {
  year: number;
  month: number; // 0-indexed
  label: string;
  days: CalendarDay[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * PropertyAvailabilityComponent — displays a two-month availability calendar
 * for a rental property, showing booked date ranges and allowing users to
 * select a date range for inquiry.
 *
 * @example
 * ```html
 * <iu-property-availability
 *   [propertyId]="'prop-123'"
 *   [bookedDates]="bookedRanges()"
 *   [minStay]="2"
 *   (dateRangeSelected)="onRangeSelected($event)"
 *   (inquiryRequested)="onInquiry($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-property-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styleUrls: ['./property-availability.component.scss'],
  template: `
    <div class="iu-availability" role="region" aria-label="Availability calendar">

      <!-- Header -->
      <div class="iu-availability__header">
        <button
          class="iu-availability__nav-btn"
          (click)="prevMonth()"
          [disabled]="!canGoPrev()"
          aria-label="Previous month"
          type="button"
        >&#8249;</button>

        <span class="iu-availability__title">
          {{ months()[0].label }}
          <span class="iu-availability__title-sep">&nbsp;–&nbsp;</span>
          {{ months()[1].label }}
        </span>

        <button
          class="iu-availability__nav-btn"
          (click)="nextMonth()"
          aria-label="Next month"
          type="button"
        >&#8250;</button>
      </div>

      <!-- Calendar grid (two months) -->
      <div class="iu-availability__months">
        @for (month of months(); track month.label) {
          <div class="iu-availability__month">
            <div class="iu-availability__month-label">{{ month.label }}</div>
            <div class="iu-availability__day-headers">
              @for (d of dayHeaders; track d) {
                <div class="iu-availability__day-header">{{ d }}</div>
              }
            </div>
            <div class="iu-availability__days">
              @for (cell of month.days; track cell.isEmpty ? 'empty-' + $index : cell.date.toISOString()) {
                <button
                  class="iu-availability__day"
                  [class.iu-availability__day--empty]="cell.isEmpty"
                  [class.iu-availability__day--past]="cell.isPast"
                  [class.iu-availability__day--booked]="cell.isBooked"
                  [class.iu-availability__day--selected-start]="cell.isStart"
                  [class.iu-availability__day--selected-end]="cell.isEnd"
                  [class.iu-availability__day--in-range]="cell.isInRange"
                  [class.iu-availability__day--beyond-max]="cell.isBeyondMax"
                  [disabled]="cell.isEmpty || cell.isPast || cell.isBooked || cell.isBeyondMax"
                  [attr.aria-label]="cell.isEmpty ? null : formatDayLabel(cell)"
                  [attr.aria-pressed]="cell.isStart || cell.isEnd ? true : null"
                  (click)="!cell.isEmpty && selectDay(cell.date)"
                  type="button"
                >
                  {{ cell.isEmpty ? '' : cell.day }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Legend -->
      <div class="iu-availability__legend">
        <span class="iu-availability__legend-item">
          <span class="iu-availability__legend-dot iu-availability__legend-dot--booked"></span>
          Booked
        </span>
        <span class="iu-availability__legend-item">
          <span class="iu-availability__legend-dot iu-availability__legend-dot--selected"></span>
          Selected
        </span>
        @if (minStay() > 1) {
          <span class="iu-availability__legend-item iu-availability__legend-minstay">
            Min stay: {{ minStay() }} nights
          </span>
        }
      </div>

      <!-- Selection summary + CTA -->
      @if (selectedRange()) {
        <div class="iu-availability__summary">
          <span class="iu-availability__summary-text">
            {{ formatDate(selectedRange()!.start) }} → {{ formatDate(selectedRange()!.end) }}
            ({{ nightCount() }} night{{ nightCount() === 1 ? '' : 's' }})
          </span>
          <button
            class="iu-availability__cta"
            (click)="requestInquiry()"
            type="button"
          >Check Availability</button>
        </div>
      }

    </div>
  `,
})
export class PropertyAvailabilityComponent {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /** The property identifier to show availability for */
  readonly propertyId: InputSignal<string> = input.required<string>();

  /** Array of booked date ranges to block in the calendar */
  readonly bookedDates: InputSignal<Array<{ start: Date; end: Date }>> = input<Array<{ start: Date; end: Date }>>([]);

  /**
   * Minimum number of nights required for a booking.
   * Defaults to 1.
   */
  readonly minStay: InputSignal<number> = input<number>(1);

  /**
   * How many days ahead to allow selection.
   * Defaults to 90.
   */
  readonly maxAdvanceDays: InputSignal<number> = input<number>(90);

  // ── Outputs ────────────────────────────────────────────────────────────────

  /** Emits the selected date range whenever the user picks start + end dates */
  readonly dateRangeSelected: OutputEmitterRef<{ start: Date; end: Date }> = output<{ start: Date; end: Date }>();

  /** Emits the selected date range when the user clicks "Check Availability" */
  readonly inquiryRequested: OutputEmitterRef<{ start: Date; end: Date }> = output<{ start: Date; end: Date }>();

  // ── Internal state ─────────────────────────────────────────────────────────

  readonly dayHeaders = DAY_HEADERS;

  /** The first month shown (year + 0-indexed month) */
  private readonly viewStart = signal<{ year: number; month: number }>(
    (() => {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    })()
  );

  private readonly selectionStart = signal<Date | null>(null);
  private readonly selectionEnd = signal<Date | null>(null);

  readonly selectedRange = computed<{ start: Date; end: Date } | null>(() => {
    const s = this.selectionStart();
    const e = this.selectionEnd();
    if (!s || !e) return null;
    return { start: s, end: e };
  });

  readonly nightCount = computed<number>(() => {
    const r = this.selectedRange();
    if (!r) return 0;
    return Math.round((r.end.getTime() - r.start.getTime()) / 86_400_000);
  });

  readonly canGoPrev = computed(() => {
    const { year, month } = this.viewStart();
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
  });

  // ── Calendar computation ───────────────────────────────────────────────────

  readonly months = computed<CalendarMonth[]>(() => {
    const { year, month } = this.viewStart();
    return [
      this.buildMonth(year, month),
      this.buildMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1),
    ];
  });

  private buildMonth(year: number, month: number): CalendarMonth {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + this.maxAdvanceDays());

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];

    // Empty padding
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(0), day: 0, isBooked: false, isSelected: false,
        isStart: false, isEnd: false, isInRange: false, isPast: false,
        isBeyondMax: false, isEmpty: true,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        day: d,
        isEmpty: false,
        isPast: date < today,
        isBeyondMax: date > maxDate,
        isBooked: this.isBooked(date),
        isStart: this.isSameDay(date, this.selectionStart()),
        isEnd: this.isSameDay(date, this.selectionEnd()),
        isSelected: this.isSameDay(date, this.selectionStart()) || this.isSameDay(date, this.selectionEnd()),
        isInRange: this.isInSelectedRange(date),
      });
    }

    return {
      year, month, days,
      label: `${MONTH_NAMES[month]} ${year}`,
    };
  }

  private isBooked(date: Date): boolean {
    return this.bookedDates().some((r) => r.start && r.end && date >= r.start && date <= r.end);
  }

  private isInSelectedRange(date: Date): boolean {
    const s = this.selectionStart();
    const e = this.selectionEnd();
    if (!s || !e) return false;
    return date > s && date < e;
  }

  private isSameDay(a: Date, b: Date | null): boolean {
    if (!b) return false;
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  selectDay(date: Date): void {
    const s = this.selectionStart();
    if (!s || this.selectionEnd()) {
      // Start a new selection
      this.selectionStart.set(date);
      this.selectionEnd.set(null);
      return;
    }

    if (date <= s) {
      // Clicked before start — reset start
      this.selectionStart.set(date);
      return;
    }

    const nights = Math.round((date.getTime() - s.getTime()) / 86_400_000);
    if (nights < this.minStay()) {
      // Too short — reset and pick new start
      this.selectionStart.set(date);
      return;
    }

    // Check no booked dates in range
    const hasConflict = this.bookedDates().some((r) => r.start && r.end && r.start <= date && r.end >= s);
    if (hasConflict) {
      this.selectionStart.set(date);
      return;
    }

    this.selectionEnd.set(date);
    this.dateRangeSelected.emit({ start: s, end: date });
  }

  prevMonth(): void {
    const { year, month } = this.viewStart();
    if (month === 0) {
      this.viewStart.set({ year: year - 1, month: 11 });
    } else {
      this.viewStart.set({ year, month: month - 1 });
    }
  }

  nextMonth(): void {
    const { year, month } = this.viewStart();
    if (month === 11) {
      this.viewStart.set({ year: year + 1, month: 0 });
    } else {
      this.viewStart.set({ year, month: month + 1 });
    }
  }

  requestInquiry(): void {
    const r = this.selectedRange();
    if (r) {
      this.inquiryRequested.emit(r);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDayLabel(cell: CalendarDay): string {
    const status = cell.isBooked ? ' (booked)' : cell.isPast ? ' (past)' : '';
    return `${cell.date.toDateString()}${status}`;
  }
}
