import { TestBed } from '@angular/core/testing';
import { RentPaymentPortalService } from './rent-payment-portal.service';

describe('RentPaymentPortalService', () => {
  let service: RentPaymentPortalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentPaymentPortalService);
  });

  it('seeds with 6 payment records spanning 3 paid + 2 pending + 1 overdue', () => {
    expect(service.payments().length).toBe(6);
    const byStatus = service.payments().reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    expect(byStatus.paid).toBe(3);
    expect(byStatus.pending).toBe(2);
    expect(byStatus.overdue).toBe(1);
  });

  it('outstanding includes both pending and overdue (3 records in seed)', () => {
    expect(service.outstanding().length).toBe(3);
    expect(service.outstanding().every(p => p.status === 'pending' || p.status === 'overdue')).toBe(true);
  });

  it('paidPayments filters to status="paid" only (3 records in seed)', () => {
    expect(service.paidPayments().length).toBe(3);
    expect(service.paidPayments().every(p => p.status === 'paid')).toBe(true);
  });

  it('paymentStreak equals the number of paid payments', () => {
    expect(service.paymentStreak()).toBe(3);
  });

  it('totalOutstanding sums (amount − paidAmount) across pending+overdue', () => {
    // Seed: rp-004 pending 1200, rp-005 overdue 850, rp-006 pending 850 → total 2900
    expect(service.totalOutstanding()).toBe(2900);
  });

  it('totalPaidThisYear sums paid amounts whose paidDate begins with the current year', () => {
    const year = new Date().getFullYear().toString();
    const expected = service.paidPayments()
      .filter(p => (p.paidDate ?? '').startsWith(year))
      .reduce((s, p) => s + (p.paidAmount ?? p.amount), 0);
    expect(service.totalPaidThisYear()).toBe(expected);
  });

  it('nextDueDate returns the outstanding payment with the earliest dueDate', () => {
    // Seed earliest outstanding dueDate: 2026-03-05 (rp-005 overdue)
    const next = service.nextDueDate();
    expect(next?.id).toBe('rp-005');
    expect(next?.dueDate).toBe('2026-03-05');
  });

  it('nextDueDate returns null when there are no outstanding payments', () => {
    // Mark every outstanding as paid
    service.outstanding().forEach(p => service.markPaid(p.id));
    expect(service.nextDueDate()).toBeNull();
  });

  it('makePayment full amount transitions the entry to paid with paidDate + receiptId', () => {
    const target = service.outstanding()[0];
    service.makePayment(target.id, target.amount);
    const updated = service.payments().find(p => p.id === target.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.paidAmount).toBe(target.amount);
    expect(updated?.paidDate).toBeDefined();
    expect(updated?.receiptId).toMatch(/^rcpt-\d+$/);
  });

  it('makePayment with partial amount transitions to status="partial"', () => {
    const target = service.outstanding().find(p => p.amount === 1200);
    expect(target).toBeDefined();
    service.makePayment(target!.id, 600);
    const updated = service.payments().find(p => p.id === target!.id);
    expect(updated?.status).toBe('partial');
    expect(updated?.paidAmount).toBe(600);
  });

  it('markPaid is equivalent to makePayment(id, fullAmount)', () => {
    const target = service.outstanding()[0];
    service.markPaid(target.id);
    const updated = service.payments().find(p => p.id === target.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.paidAmount).toBe(target.amount);
  });

  it('markPaid on unknown id is a silent no-op', () => {
    const before = service.payments();
    service.markPaid('not-a-real-id');
    expect(service.payments()).toEqual(before);
  });

  it('loadForTenant flips loading on, then off, and narrows payments to that tenant', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-002');
      expect(service.loading()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.payments().every(p => p.tenantId === 'tenant-002')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForLandlord narrows payments to that landlord scope', () => {
    jest.useFakeTimers();
    try {
      service.loadForLandlord('landlord-001');
      jest.advanceTimersByTime(300);
      expect(service.payments().every(p => p.landlordId === 'landlord-001')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
