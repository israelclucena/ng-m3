import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent, DateRange } from './date-picker.component';

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;

  const overlay = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.iu-date-picker__overlay');
  const field = (): HTMLElement =>
    fixture.nativeElement.querySelector('.iu-date-picker__field');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the default label and placeholder value', () => {
    const label = fixture.nativeElement.querySelector('.iu-date-picker__label');
    const value = fixture.nativeElement.querySelector('.iu-date-picker__value');
    expect(label.textContent).toContain('Date');
    expect(value.textContent).toContain('Select date');
  });

  // ── Open / close ─────────────────────────────────────────────────────────────

  it('should be closed initially', () => {
    expect(component.open()).toBe(false);
    expect(overlay()).toBeNull();
  });

  it('should open the calendar overlay when the field is clicked', () => {
    field().click();
    fixture.detectChanges();
    expect(component.open()).toBe(true);
    expect(overlay()).toBeTruthy();
  });

  it('should not open when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    field().click();
    fixture.detectChanges();
    expect(component.open()).toBe(false);
    expect(overlay()).toBeNull();
  });

  // ── Month / year navigation ──────────────────────────────────────────────────

  it('should wrap to the previous December when paging back from January', () => {
    component.viewMonth.set(0);
    component.viewYear.set(2026);
    component.prevMonth();
    expect(component.viewMonth()).toBe(11);
    expect(component.viewYear()).toBe(2025);
  });

  it('should wrap to the next January when paging forward from December', () => {
    component.viewMonth.set(11);
    component.viewYear.set(2026);
    component.nextMonth();
    expect(component.viewMonth()).toBe(0);
    expect(component.viewYear()).toBe(2027);
  });

  it('should page years directly', () => {
    component.viewYear.set(2026);
    component.nextYear();
    expect(component.viewYear()).toBe(2027);
    component.prevYear();
    component.prevYear();
    expect(component.viewYear()).toBe(2025);
  });

  it('should toggle the year view and pick a month from it', () => {
    component.toggleYearView();
    expect(component.yearView()).toBe(true);
    component.selectMonth(3);
    expect(component.viewMonth()).toBe(3);
    expect(component.yearView()).toBe(false);
  });

  // ── Calendar grid ────────────────────────────────────────────────────────────

  it('should build a grid padded to whole weeks with one cell per day', () => {
    component.viewMonth.set(5); // June 2026 — 30 days
    component.viewYear.set(2026);
    const cells = component.calendarCells();
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c !== null).length).toBe(30);
  });

  // ── Single selection ─────────────────────────────────────────────────────────

  it('should select a date, emit dateChange and close in single mode', () => {
    const spy = jest.fn();
    component.dateChange.subscribe(spy);
    const day = new Date(2026, 5, 15);
    component.open.set(true);
    component.onDayClick(day);
    expect(component.selectedDate()).toEqual(day);
    expect(spy).toHaveBeenCalledWith(day);
    expect(component.open()).toBe(false);
  });

  it('should report the selected day via isSelected()', () => {
    const day = new Date(2026, 5, 15);
    component.onDayClick(day);
    expect(component.isSelected(new Date(2026, 5, 15))).toBe(true);
    expect(component.isSelected(new Date(2026, 5, 16))).toBe(false);
  });

  // ── Range selection ──────────────────────────────────────────────────────────

  it('should show the range placeholder in range mode', () => {
    fixture.componentRef.setInput('mode', 'range');
    fixture.detectChanges();
    const value = fixture.nativeElement.querySelector('.iu-date-picker__value');
    expect(value.textContent).toContain('Select dates');
  });

  it('should emit rangeChange only after the second click', () => {
    fixture.componentRef.setInput('mode', 'range');
    fixture.detectChanges();
    const spy = jest.fn();
    component.rangeChange.subscribe(spy);
    const start = new Date(2026, 5, 10);
    const end = new Date(2026, 5, 15);

    component.onDayClick(start);
    expect(component.rangeStart()).toEqual(start);
    expect(component.rangeEnd()).toBeNull();
    expect(spy).not.toHaveBeenCalled();

    component.onDayClick(end);
    expect(spy).toHaveBeenCalledWith({ start, end } as DateRange);
    expect(component.rangeEnd()).toEqual(end);
  });

  it('should restart the range when the second click precedes the start', () => {
    fixture.componentRef.setInput('mode', 'range');
    fixture.detectChanges();
    const spy = jest.fn();
    component.rangeChange.subscribe(spy);

    component.onDayClick(new Date(2026, 5, 15));
    component.onDayClick(new Date(2026, 5, 10)); // earlier → becomes new start
    expect(component.rangeStart()).toEqual(new Date(2026, 5, 10));
    expect(component.rangeEnd()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── Clear ────────────────────────────────────────────────────────────────────

  it('should clear selection and emit null on clear()', () => {
    const dateSpy = jest.fn();
    component.dateChange.subscribe(dateSpy);
    component.onDayClick(new Date(2026, 5, 15));
    const evt = { stopPropagation: jest.fn() } as unknown as MouseEvent;
    component.clear(evt);
    expect(component.selectedDate()).toBeNull();
    expect(dateSpy).toHaveBeenLastCalledWith(null);
    expect(evt.stopPropagation).toHaveBeenCalled();
  });

  // ── min / max bounds ─────────────────────────────────────────────────────────

  it('should disable dates outside the min/max bounds', () => {
    fixture.componentRef.setInput('minDate', new Date(2026, 5, 10));
    fixture.componentRef.setInput('maxDate', new Date(2026, 5, 20));
    fixture.detectChanges();
    expect(component.isDisabled(new Date(2026, 5, 5))).toBe(true);
    expect(component.isDisabled(new Date(2026, 5, 25))).toBe(true);
    expect(component.isDisabled(new Date(2026, 5, 15))).toBe(false);
  });

  it('should not select a disabled date', () => {
    fixture.componentRef.setInput('minDate', new Date(2026, 5, 10));
    fixture.detectChanges();
    const spy = jest.fn();
    component.dateChange.subscribe(spy);
    component.onDayClick(new Date(2026, 5, 5));
    expect(component.selectedDate()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
