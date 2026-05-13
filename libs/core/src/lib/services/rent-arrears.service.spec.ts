import { TestBed } from '@angular/core/testing';
import { RentArrearsService, type ArrearsRecord } from './rent-arrears.service';

describe('RentArrearsService', () => {
  let service: RentArrearsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentArrearsService);
  });

  it('seeds with the 4 mock arrears records (1 legal, 1 plan, 1 reminder, 1 partial)', () => {
    expect(service.records().length).toBe(4);
    const statuses = service.records().map(r => r.status);
    expect(statuses).toEqual(expect.arrayContaining(['legal', 'payment_plan', 'reminder_sent', 'partial']));
  });

  it('kpis aggregate total outstanding across non-resolved records', () => {
    const expected = service.records()
      .filter(r => r.status !== 'resolved')
      .reduce((s, r) => s + r.amountOutstanding, 0);
    expect(service.kpis().totalOutstanding).toBe(expected);
  });

  it('kpis.critical counts legal status OR daysOverdue > 60', () => {
    const expected = service.records().filter(
      r => r.status !== 'resolved' && (r.status === 'legal' || r.daysOverdue > 60),
    ).length;
    expect(service.kpis().critical).toBe(expected);
  });

  it('kpis.avgDaysOverdue is rounded mean of non-resolved days overdue', () => {
    const open = service.records().filter(r => r.status !== 'resolved');
    const avg = Math.round(open.reduce((s, r) => s + r.daysOverdue, 0) / open.length);
    expect(service.kpis().avgDaysOverdue).toBe(avg);
  });

  it('filtered defaults to all records when filter is "all"', () => {
    expect(service.filtered().length).toBe(service.records().length);
    service.setFilter('legal');
    expect(service.filtered().every(r => r.status === 'legal')).toBe(true);
  });

  it('sendReminder bumps count, updates status to reminder_sent, sets today ISO date', () => {
    const before = service.records().find(r => r.id === 'ar003')!;
    service.sendReminder('ar003');
    const after = service.records().find(r => r.id === 'ar003')!;
    expect(after.reminderCount).toBe(before.reminderCount + 1);
    expect(after.status).toBe('reminder_sent');
    expect(after.lastReminderSent).toBe(new Date().toISOString().split('T')[0]);
  });

  it('setPaymentPlan flips status + activates plan + stores monthly amount', () => {
    service.setPaymentPlan('ar001', 600);
    const r = service.records().find(rec => rec.id === 'ar001')!;
    expect(r.status).toBe('payment_plan');
    expect(r.paymentPlanActive).toBe(true);
    expect(r.paymentPlanMonthly).toBe(600);
  });

  it('escalateToLegal sets status to legal without touching amounts', () => {
    const before = service.records().find(r => r.id === 'ar001')!;
    service.escalateToLegal('ar001');
    const after = service.records().find(r => r.id === 'ar001')!;
    expect(after.status).toBe('legal');
    expect(after.amountOutstanding).toBe(before.amountOutstanding);
  });

  it('markResolved zeroes outstanding and credits the full due amount', () => {
    const before = service.records().find(r => r.id === 'ar003')!;
    service.markResolved('ar003');
    const after = service.records().find(r => r.id === 'ar003')!;
    expect(after.status).toBe('resolved');
    expect(after.amountOutstanding).toBe(0);
    expect(after.amountPaid).toBe(before.amountDue);
  });

  it('resolved records drop out of kpis (open arrears only)', () => {
    const before = service.kpis().totalTenants;
    service.markResolved('ar001');
    expect(service.kpis().totalTenants).toBe(before - 1);
  });

  it('severity buckets: legal/>90 critical, >60 high, >30 medium, ≤30 low', () => {
    const make = (over: ArrearsRecord) => service.severity(over);
    const legal: ArrearsRecord = { ...service.records()[0], status: 'legal', daysOverdue: 10 };
    const critical: ArrearsRecord = { ...service.records()[0], status: 'overdue', daysOverdue: 100 };
    const high: ArrearsRecord = { ...service.records()[0], status: 'overdue', daysOverdue: 75 };
    const medium: ArrearsRecord = { ...service.records()[0], status: 'overdue', daysOverdue: 45 };
    const low: ArrearsRecord = { ...service.records()[0], status: 'overdue', daysOverdue: 10 };
    expect(make(legal)).toBe('critical');
    expect(make(critical)).toBe('critical');
    expect(make(high)).toBe('high');
    expect(make(medium)).toBe('medium');
    expect(make(low)).toBe('low');
  });

  it('unknown record ids are no-ops across mutations', () => {
    const snapshot = service.records();
    service.sendReminder('zzz');
    service.setPaymentPlan('zzz', 100);
    service.escalateToLegal('zzz');
    service.markResolved('zzz');
    expect(service.records()).toEqual(snapshot);
  });
});
