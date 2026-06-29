import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyBookingsComponent, BookingRecord } from './my-bookings.component';

/** Booking fixture, overridable per test. */
function booking(over: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: 'b1',
    propertyTitle: 'T2 no Chiado',
    propertyLocation: 'Lisboa',
    date: '12 Jun 2026',
    status: 'pending',
    type: 'visit',
    ...over,
  };
}

const SAMPLE: BookingRecord[] = [
  booking({ id: 'b1', type: 'visit', status: 'pending' }),
  booking({ id: 'b2', type: 'visit', status: 'confirmed' }),
  booking({ id: 'b3', type: 'inquiry', status: 'pending' }),
  booking({ id: 'b4', type: 'visit', status: 'completed' }),
  booking({ id: 'b5', type: 'inquiry', status: 'cancelled' }),
];

describe('MyBookingsComponent', () => {
  let fixture: ComponentFixture<MyBookingsComponent>;
  let component: MyBookingsComponent;

  function setBookings(list: BookingRecord[]): void {
    fixture.componentRef.setInput('bookings', list);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBookingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── defaults + total ────────────────────────────────────────────────────────

  it('defaults to an empty list with the "all" tab active', () => {
    expect(component.total()).toBe(0);
    expect(component.activeTab()).toBe('all');
    expect(component.filtered()).toEqual([]);
  });

  it('total() reflects the booking count', () => {
    setBookings(SAMPLE);
    expect(component.total()).toBe(5);
  });

  // ── tab filtering ───────────────────────────────────────────────────────────

  it('"all" tab returns every booking', () => {
    setBookings(SAMPLE);
    component.activeTab.set('all');
    expect(component.filtered().map((b) => b.id)).toEqual([
      'b1',
      'b2',
      'b3',
      'b4',
      'b5',
    ]);
  });

  it('"visit" / "inquiry" tabs filter by booking type', () => {
    setBookings(SAMPLE);

    component.activeTab.set('visit');
    expect(component.filtered().map((b) => b.id)).toEqual(['b1', 'b2', 'b4']);

    component.activeTab.set('inquiry');
    expect(component.filtered().map((b) => b.id)).toEqual(['b3', 'b5']);
  });

  it('"completed" tab includes completed and cancelled bookings', () => {
    setBookings(SAMPLE);
    component.activeTab.set('completed');
    expect(component.filtered().map((b) => b.id)).toEqual(['b4', 'b5']);
  });

  // ── countForTab ─────────────────────────────────────────────────────────────

  it('countForTab matches the filtered length for each tab', () => {
    setBookings(SAMPLE);
    expect(component.countForTab('all')).toBe(5);
    expect(component.countForTab('visit')).toBe(3);
    expect(component.countForTab('inquiry')).toBe(2);
    expect(component.countForTab('completed')).toBe(2);
  });

  // ── statusLabel ─────────────────────────────────────────────────────────────

  it('statusLabel maps each status to its PT label', () => {
    expect(component.statusLabel('pending')).toBe('Pendente');
    expect(component.statusLabel('confirmed')).toBe('Confirmado');
    expect(component.statusLabel('cancelled')).toBe('Cancelado');
    expect(component.statusLabel('completed')).toBe('Concluído');
  });

  // ── empty state ─────────────────────────────────────────────────────────────

  it('shows the empty state when no bookings match', () => {
    setBookings([booking({ type: 'visit' })]);
    component.activeTab.set('inquiry');
    fixture.detectChanges();

    const empty: HTMLElement = fixture.nativeElement.querySelector('.empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('nesta categoria');
  });

  it('header subtitle is singular for a single booking', () => {
    setBookings([booking()]);
    const sub: HTMLElement = fixture.nativeElement.querySelector('.header-sub');
    expect(sub.textContent).toContain('1 reserva no total');
  });

  // ── outputs ─────────────────────────────────────────────────────────────────

  it('emits cancel when the cancel action is clicked', () => {
    setBookings([booking({ id: 'b1', status: 'pending' })]);
    let emitted: BookingRecord | undefined;
    component.cancel.subscribe((b) => (emitted = b));

    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.action-btn.cancel');
    btn.click();

    expect(emitted?.id).toBe('b1');
  });

  it('emits view when the open action is clicked for a confirmed booking', () => {
    setBookings([booking({ id: 'b2', status: 'confirmed' })]);
    let emitted: BookingRecord | undefined;
    component.view.subscribe((b) => (emitted = b));

    const btn: HTMLButtonElement =
      fixture.nativeElement.querySelector('.action-btn.info');
    btn.click();

    expect(emitted?.id).toBe('b2');
  });

  it('does not render a cancel action for completed bookings', () => {
    setBookings([booking({ id: 'b4', status: 'completed' })]);
    const btn = fixture.nativeElement.querySelector('.action-btn.cancel');
    expect(btn).toBeNull();
  });
});
