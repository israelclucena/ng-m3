import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyAvailabilityComponent } from './property-availability.component';

describe('PropertyAvailabilityComponent', () => {
  let fixture: ComponentFixture<PropertyAvailabilityComponent>;
  let component: PropertyAvailabilityComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyAvailabilityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('propertyId', 'prop-123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('should render two months side-by-side', () => {
    expect(component.months().length).toBe(2);
    const monthEls = fixture.nativeElement.querySelectorAll('.iu-availability__month');
    expect(monthEls.length).toBe(2);
  });

  it('should render both month labels in the title', () => {
    const title = fixture.nativeElement.querySelector('.iu-availability__title');
    expect(title.textContent).toContain(component.months()[0].label);
    expect(title.textContent).toContain(component.months()[1].label);
  });

  it('should render day headers', () => {
    const headers = fixture.nativeElement.querySelectorAll('.iu-availability__day-header');
    // 7 headers per month, two months
    expect(headers.length).toBe(14);
  });

  it('should not render selection summary when nothing is selected', () => {
    expect(component.selectedRange()).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-availability__summary')).toBeNull();
  });

  it('should not show min-stay legend by default (minStay = 1)', () => {
    expect(fixture.nativeElement.querySelector('.iu-availability__legend-minstay')).toBeNull();
  });

  it('should show min-stay legend when minStay > 1', () => {
    fixture.componentRef.setInput('minStay', 4);
    fixture.detectChanges();
    const legend = fixture.nativeElement.querySelector('.iu-availability__legend-minstay');
    expect(legend).toBeTruthy();
    expect(legend.textContent).toContain('Min stay: 4 nights');
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('should disable "previous" at the current month', () => {
    expect(component.canGoPrev()).toBe(false);
    const prevBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.iu-availability__nav-btn');
    expect(prevBtn.disabled).toBe(true);
  });

  it('should enable "previous" after navigating forward', () => {
    component.nextMonth();
    expect(component.canGoPrev()).toBe(true);
    component.prevMonth();
    expect(component.canGoPrev()).toBe(false);
  });

  it('should wrap year boundary going forward (December → January next year)', () => {
    const now = new Date();
    const stepsToDecember = 11 - now.getMonth();
    for (let i = 0; i < stepsToDecember; i++) component.nextMonth();
    expect(component.months()[0].label).toBe(`December ${now.getFullYear()}`);
    component.nextMonth();
    expect(component.months()[0].label).toBe(`January ${now.getFullYear() + 1}`);
  });

  it('should wrap year boundary going backward (January → December previous year)', () => {
    const now = new Date();
    const stepsToNextJanuary = 12 - now.getMonth();
    for (let i = 0; i < stepsToNextJanuary; i++) component.nextMonth();
    expect(component.months()[0].label).toBe(`January ${now.getFullYear() + 1}`);
    component.prevMonth();
    expect(component.months()[0].label).toBe(`December ${now.getFullYear()}`);
  });

  // ── Date selection ───────────────────────────────────────────────────────────

  it('should set start on first click without producing a range', () => {
    component.selectDay(new Date(2030, 5, 10));
    expect(component.selectedRange()).toBeNull();
  });

  it('should complete a range on a valid second click and emit dateRangeSelected', () => {
    const spy = jest.fn();
    component.dateRangeSelected.subscribe(spy);
    const start = new Date(2030, 5, 10);
    const end = new Date(2030, 5, 15);
    component.selectDay(start);
    component.selectDay(end);
    expect(component.selectedRange()).toEqual({ start, end });
    expect(component.nightCount()).toBe(5);
    expect(spy).toHaveBeenCalledWith({ start, end });
  });

  it('should reset start when the second click is before the start', () => {
    component.selectDay(new Date(2030, 5, 15));
    component.selectDay(new Date(2030, 5, 10));
    expect(component.selectedRange()).toBeNull();
  });

  it('should reset start when the range is shorter than minStay', () => {
    fixture.componentRef.setInput('minStay', 3);
    component.selectDay(new Date(2030, 5, 10));
    component.selectDay(new Date(2030, 5, 12)); // 2 nights < 3
    expect(component.selectedRange()).toBeNull();
  });

  it('should reset start when the selected range conflicts with a booked range', () => {
    fixture.componentRef.setInput('bookedDates', [
      { start: new Date(2030, 5, 12), end: new Date(2030, 5, 13) },
    ]);
    component.selectDay(new Date(2030, 5, 10));
    component.selectDay(new Date(2030, 5, 15)); // spans the booked 12–13
    expect(component.selectedRange()).toBeNull();
  });

  it('should compute nightCount of 1 for consecutive days', () => {
    component.selectDay(new Date(2030, 5, 10));
    component.selectDay(new Date(2030, 5, 11));
    expect(component.nightCount()).toBe(1);
  });

  it('should report nightCount 0 when no range is selected', () => {
    expect(component.nightCount()).toBe(0);
  });

  // ── Inquiry ─────────────────────────────────────────────────────────────────

  it('should not emit inquiryRequested without a selected range', () => {
    const spy = jest.fn();
    component.inquiryRequested.subscribe(spy);
    component.requestInquiry();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit inquiryRequested with the selected range', () => {
    const spy = jest.fn();
    component.inquiryRequested.subscribe(spy);
    const start = new Date(2030, 5, 10);
    const end = new Date(2030, 5, 15);
    component.selectDay(start);
    component.selectDay(end);
    component.requestInquiry();
    expect(spy).toHaveBeenCalledWith({ start, end });
  });

  it('should render the selection summary with night count once a range is chosen', () => {
    component.selectDay(new Date(2030, 5, 10));
    component.selectDay(new Date(2030, 5, 15));
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.iu-availability__summary');
    expect(summary).toBeTruthy();
    expect(summary.textContent).toContain('5 nights');
  });

  // ── Booked dates ─────────────────────────────────────────────────────────────

  it('should mark booked days in the computed calendar', () => {
    const now = new Date();
    const bookedDay = new Date(now.getFullYear(), now.getMonth() + 1, 15); // future, in view
    fixture.componentRef.setInput('bookedDates', [{ start: bookedDay, end: bookedDay }]);
    fixture.detectChanges();
    const allDays = component.months().flatMap((m) => m.days);
    expect(allDays.some((d) => d.isBooked)).toBe(true);
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  it('should format a date with day, month and year', () => {
    const formatted = component.formatDate(new Date(2026, 5, 15));
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Jun');
  });

  it('should annotate booked cells in the day label', () => {
    const cell = {
      date: new Date(2026, 5, 15), day: 15, isBooked: true, isSelected: false,
      isStart: false, isEnd: false, isInRange: false, isPast: false,
      isBeyondMax: false, isEmpty: false,
    };
    expect(component.formatDayLabel(cell)).toContain('(booked)');
  });

  it('should annotate past cells in the day label', () => {
    const cell = {
      date: new Date(2020, 0, 1), day: 1, isBooked: false, isSelected: false,
      isStart: false, isEnd: false, isInRange: false, isPast: true,
      isBeyondMax: false, isEmpty: false,
    };
    expect(component.formatDayLabel(cell)).toContain('(past)');
  });
});
