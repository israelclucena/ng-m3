import { TestBed } from '@angular/core/testing';
import {
  UtilityBillsService,
  type AddBillPayload,
  type BillStatus,
  type UtilityType,
} from './utility-bills.service';

describe('UtilityBillsService', () => {
  let service: UtilityBillsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtilityBillsService);
  });

  it('seeds with the mock bill list spanning every utility type seeded', () => {
    const bills = service.bills();
    expect(bills.length).toBe(6);
    const types = new Set(bills.map(b => b.type));
    for (const t of ['electricity', 'water', 'gas', 'internet', 'waste'] as UtilityType[]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it('filtered returns the full list when every filter is "all"', () => {
    expect(service.filtered().length).toBe(service.bills().length);
  });

  it('setFilterStatus narrows filtered to bills with that status', () => {
    service.setFilterStatus('paid');
    expect(service.filterStatus()).toBe('paid');
    expect(service.filtered().every(b => b.status === 'paid')).toBe(true);
    expect(service.filtered().length).toBe(3);
  });

  it('setFilterType narrows filtered to bills of that utility type', () => {
    service.setFilterType('electricity');
    expect(service.filterType()).toBe('electricity');
    expect(service.filtered().every(b => b.type === 'electricity')).toBe(true);
    expect(service.filtered().length).toBe(2);
  });

  it('setFilterProperty narrows filtered to one propertyId', () => {
    service.setFilterProperty('prop-001');
    expect(service.filtered().every(b => b.propertyId === 'prop-001')).toBe(true);
    expect(service.filtered().length).toBe(2);
  });

  it('filters compose — status + type combined intersect', () => {
    service.setFilterStatus('paid');
    service.setFilterType('electricity');
    const out = service.filtered();
    expect(out.every(b => b.status === 'paid' && b.type === 'electricity')).toBe(true);
    expect(out.length).toBe(1);
  });

  it('kpis sums totalDue across pending+overdue, totalPaid across paid only', () => {
    const k = service.kpis();
    // pending: ub003 (56.80) + overdue: ub002 (34.20) = 91.00
    expect(k.totalDue).toBeCloseTo(91.0, 2);
    // paid: ub001 (87.40) + ub004 (39.99) + ub006 (18.00) = 145.39
    expect(k.totalPaid).toBeCloseTo(145.39, 2);
    expect(k.overdue).toBe(1);
    expect(k.disputed).toBe(1);
  });

  it('addBill prepends to bills with defaulted currency/status and generated id', () => {
    const payload: AddBillPayload = {
      propertyId: 'prop-009',
      propertyAddress: 'Test 1, Lisboa',
      type: 'gas',
      provider: 'Galp',
      amount: 42.5,
      payer: 'tenant',
      dueDate: '2026-06-01',
      period: 'May 2026',
    };
    const before = service.bills().length;
    service.addBill(payload);
    const after = service.bills();
    expect(after.length).toBe(before + 1);
    const added = after[0];
    expect(added.id).toMatch(/^ub\d+/);
    expect(added.currency).toBe('EUR');
    expect(added.status).toBe('pending');
    expect(added.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(added.propertyId).toBe('prop-009');
  });

  it('addBill preserves caller-provided currency, status and issueDate over defaults', () => {
    const payload: AddBillPayload & { currency?: string; issueDate?: string } = {
      propertyId: 'prop-010',
      propertyAddress: 'Test 2, Lisboa',
      type: 'water',
      provider: 'EPAL',
      amount: 12,
      currency: 'USD',
      payer: 'landlord',
      issueDate: '2026-01-01',
      dueDate: '2026-01-31',
      period: 'January 2026',
    };
    service.addBill(payload);
    const added = service.bills()[0];
    expect(added.currency).toBe('USD');
    expect(added.issueDate).toBe('2026-01-01');
  });

  it('markPaid switches status to "paid" and stamps paidDate', () => {
    // ub002 is overdue at seed; flip it to paid
    service.markPaid('ub002');
    const b = service.bills().find(x => x.id === 'ub002')!;
    expect(b.status).toBe('paid');
    expect(b.paidDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(service.kpis().overdue).toBe(0);
  });

  it('markPaid on unknown id is a no-op', () => {
    const before = service.bills();
    service.markPaid('does-not-exist');
    expect(service.bills()).toEqual(before);
  });

  it('disputeBill sets status to "disputed" and stores provided notes', () => {
    service.disputeBill('ub001', 'Charge mismatch with meter reading');
    const b = service.bills().find(x => x.id === 'ub001')!;
    expect(b.status).toBe('disputed');
    expect(b.notes).toBe('Charge mismatch with meter reading');
    expect(service.kpis().disputed).toBe(2);
  });

  it('typeIcon returns a non-empty glyph for each defined utility type', () => {
    const types: UtilityType[] = ['electricity', 'water', 'gas', 'internet', 'waste', 'other'];
    for (const t of types) {
      expect(service.typeIcon(t).length).toBeGreaterThan(0);
    }
  });

  it('statusColor returns hex-like values for each bill status', () => {
    const statuses: BillStatus[] = ['pending', 'paid', 'overdue', 'disputed'];
    for (const s of statuses) {
      expect(service.statusColor(s)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('split bills retain their splitRatio when filtered through type', () => {
    service.setFilterType('gas');
    const out = service.filtered();
    expect(out.length).toBe(1);
    expect(out[0].payer).toBe('split');
    expect(out[0].splitRatio).toBe(40);
  });
});
