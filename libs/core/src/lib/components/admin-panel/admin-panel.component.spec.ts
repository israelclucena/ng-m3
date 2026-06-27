import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPanelComponent } from './admin-panel.component';
import type {
  AdminInquiry,
  AdminBooking,
  AdminReview,
  AdminProperty,
  AdminInquiryActionEvent,
  AdminBookingActionEvent,
  AdminReviewActionEvent,
  AdminPropertyActionEvent,
} from './admin-panel.types';

function inquiry(over: Partial<AdminInquiry> = {}): AdminInquiry {
  return {
    id: 'i1',
    tenantName: 'Ana Costa',
    tenantEmail: 'ana@example.com',
    propertyTitle: 'T2 Príncipe Real',
    propertyId: 'p1',
    message: 'Tenho interesse na visita.',
    receivedAt: '2026-06-20T10:00:00Z',
    status: 'new',
    unread: true,
    ...over,
  };
}

function booking(over: Partial<AdminBooking> = {}): AdminBooking {
  return {
    id: 'b1',
    tenantName: 'João Silva',
    tenantEmail: 'joao@example.com',
    propertyTitle: 'T2 Príncipe Real',
    propertyId: 'p1',
    bookingType: 'visit',
    requestedDate: '2026-07-01T00:00:00Z',
    status: 'pending_approval',
    submittedAt: '2026-06-20T10:00:00Z',
    ...over,
  };
}

function review(over: Partial<AdminReview> = {}): AdminReview {
  return {
    id: 'r1',
    authorName: 'Maria Lopes',
    propertyTitle: 'T2 Príncipe Real',
    propertyId: 'p1',
    rating: 4,
    body: 'Óptima estadia.',
    submittedAt: '2026-06-15T00:00:00Z',
    status: 'pending',
    flagged: false,
    landlordReplied: false,
    ...over,
  };
}

function prop(over: Partial<AdminProperty> = {}): AdminProperty {
  return {
    id: 'pr1',
    title: 'T2 Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    landlordName: 'Carlos Mendes',
    landlordEmail: 'carlos@example.com',
    monthlyRent: 1450,
    currency: 'EUR',
    status: 'active',
    listedAt: '2026-05-01T00:00:00Z',
    inquiryCount: 3,
    bookingCount: 1,
    viewCount: 42,
    ...over,
  };
}

describe('AdminPanelComponent', () => {
  let fixture: ComponentFixture<AdminPanelComponent>;
  let component: AdminPanelComponent;

  function setup(inputs: {
    inquiries?: AdminInquiry[];
    bookings?: AdminBooking[];
    reviews?: AdminReview[];
    properties?: AdminProperty[];
  } = {}): void {
    fixture.componentRef.setInput('inquiries', inputs.inquiries ?? []);
    fixture.componentRef.setInput('bookings', inputs.bookings ?? []);
    fixture.componentRef.setInput('reviews', inputs.reviews ?? []);
    fixture.componentRef.setInput('properties', inputs.properties ?? []);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPanelComponent);
    component = fixture.componentInstance;
  });

  // ── defaults ───────────────────────────────────────────────────────────────────

  it('defaults to the inquiries tab and "all" filters', () => {
    setup();
    expect(component.activeTab()).toBe('inquiries');
    expect(component.inquiryFilter()).toBe('all');
    expect(component.bookingFilter()).toBe('all');
    expect(component.reviewFilter()).toBe('all');
    expect(component.propertyFilter()).toBe('all');
  });

  // ── pending counts ─────────────────────────────────────────────────────────────

  it('counts pending inquiries by new status or unread flag', () => {
    setup({
      inquiries: [
        inquiry({ id: 'i1', status: 'new', unread: false }),
        inquiry({ id: 'i2', status: 'replied', unread: true }),
        inquiry({ id: 'i3', status: 'archived', unread: false }),
      ],
    });
    expect(component.pendingInquiries()).toBe(2);
  });

  it('counts pending bookings awaiting approval', () => {
    setup({
      bookings: [
        booking({ id: 'b1', status: 'pending_approval' }),
        booking({ id: 'b2', status: 'approved' }),
      ],
    });
    expect(component.pendingBookings()).toBe(1);
  });

  it('counts pending reviews as pending status or flagged', () => {
    setup({
      reviews: [
        review({ id: 'r1', status: 'pending', flagged: false }),
        review({ id: 'r2', status: 'approved', flagged: true }),
        review({ id: 'r3', status: 'approved', flagged: false }),
      ],
    });
    expect(component.pendingReviews()).toBe(2);
  });

  // ── filtering ──────────────────────────────────────────────────────────────────

  it('filters inquiries by unread and by status', () => {
    setup({
      inquiries: [
        inquiry({ id: 'i1', status: 'new', unread: true }),
        inquiry({ id: 'i2', status: 'archived', unread: false }),
      ],
    });
    expect(component.filteredInquiries().length).toBe(2);

    component.inquiryFilter.set('unread');
    expect(component.filteredInquiries().map((i) => i.id)).toEqual(['i1']);

    component.inquiryFilter.set('archived');
    expect(component.filteredInquiries().map((i) => i.id)).toEqual(['i2']);
  });

  it('filters bookings by status', () => {
    setup({
      bookings: [
        booking({ id: 'b1', status: 'pending_approval' }),
        booking({ id: 'b2', status: 'approved' }),
      ],
    });
    component.bookingFilter.set('approved');
    expect(component.filteredBookings().map((b) => b.id)).toEqual(['b2']);
  });

  it('filters reviews by flagged and by status', () => {
    setup({
      reviews: [
        review({ id: 'r1', status: 'pending', flagged: false }),
        review({ id: 'r2', status: 'approved', flagged: true }),
      ],
    });
    component.reviewFilter.set('flagged');
    expect(component.filteredReviews().map((r) => r.id)).toEqual(['r2']);

    component.reviewFilter.set('approved');
    expect(component.filteredReviews().map((r) => r.id)).toEqual(['r2']);
  });

  it('filters properties by status', () => {
    setup({
      properties: [
        prop({ id: 'pr1', status: 'active' }),
        prop({ id: 'pr2', status: 'paused' }),
      ],
    });
    component.propertyFilter.set('paused');
    expect(component.filteredProperties().map((p) => p.id)).toEqual(['pr2']);
  });

  // ── event routing ──────────────────────────────────────────────────────────────

  it('routes typed actions through emit to the matching output', () => {
    setup();
    let inq: AdminInquiryActionEvent | null = null;
    let bk: AdminBookingActionEvent | null = null;
    let rv: AdminReviewActionEvent | null = null;
    let pr: AdminPropertyActionEvent | null = null;
    component.inquiryAction.subscribe((e) => (inq = e));
    component.bookingAction.subscribe((e) => (bk = e));
    component.reviewAction.subscribe((e) => (rv = e));
    component.propertyAction.subscribe((e) => (pr = e));

    component.emit('inquiryAction', { inquiry: inquiry(), action: 'reply' });
    component.emit('bookingAction', { booking: booking(), action: 'approve' });
    component.emit('reviewAction', { review: review(), action: 'flag' });
    component.emit('propertyAction', { property: prop(), action: 'pause' });

    expect(inq!.action).toBe('reply');
    expect(bk!.action).toBe('approve');
    expect(rv!.action).toBe('flag');
    expect(pr!.action).toBe('pause');
  });

  // ── label helpers ──────────────────────────────────────────────────────────────

  it('maps status keys to Portuguese labels', () => {
    setup();
    expect(component.statusLabel('new')).toBe('Novo');
    expect(component.bookingStatusLabel('pending_approval')).toBe('Pendente');
    expect(component.reviewStatusLabel('approved')).toBe('Aprovada');
    expect(component.propertyStatusLabel('paused')).toBe('Pausada');
  });

  it('falls back to the raw key for unknown labels', () => {
    setup();
    expect(component.statusLabel('weird')).toBe('weird');
  });

  it('builds a five-slot star array from a rating', () => {
    setup();
    expect(component.starArray(3)).toEqual(['full', 'full', 'full', 'empty', 'empty']);
  });

  // ── tab badges ─────────────────────────────────────────────────────────────────

  it('wires tab badges to the pending counts', () => {
    setup({ inquiries: [inquiry({ status: 'new', unread: true })] });
    const inquiriesTab = component.tabs.find((t) => t.key === 'inquiries')!;
    expect(inquiriesTab.badge()).toBe(1);
  });
});
