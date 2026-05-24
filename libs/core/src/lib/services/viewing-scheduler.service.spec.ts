import { TestBed } from '@angular/core/testing';
import {
  ViewingSchedulerService,
  type RequestViewingPayload,
  type ViewingStatus,
} from './viewing-scheduler.service';

describe('ViewingSchedulerService', () => {
  let service: ViewingSchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewingSchedulerService);
  });

  it('seeds with the mock viewing list covering every status used in fixtures', () => {
    const all = service.viewings();
    expect(all.length).toBe(5);
    const statuses = new Set(all.map(v => v.status));
    for (const s of ['pending', 'confirmed', 'cancelled', 'completed'] as ViewingStatus[]) {
      expect(statuses.has(s)).toBe(true);
    }
  });

  it('kpis aggregates counts per status from seed data', () => {
    const k = service.kpis();
    expect(k.total).toBe(5);
    expect(k.pending).toBe(2);
    expect(k.confirmed).toBe(1);
    expect(k.completed).toBe(1);
    expect(k.cancelled).toBe(1);
  });

  it('default filter is "all" and filtered mirrors viewings', () => {
    expect(service.filter()).toBe('all');
    expect(service.filtered().length).toBe(service.viewings().length);
  });

  it('setFilter narrows filtered to viewings with that status', () => {
    service.setFilter('pending');
    expect(service.filter()).toBe('pending');
    expect(service.filtered().every(v => v.status === 'pending')).toBe(true);
    expect(service.filtered().length).toBe(2);
  });

  it('upcoming only returns pending+confirmed viewings, sorted by date+time ascending', () => {
    const up = service.upcoming();
    expect(up.every(v => v.status === 'pending' || v.status === 'confirmed')).toBe(true);
    expect(up.length).toBe(3);
    const keys = up.map(v => v.date + v.time);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });

  it('request prepends a pending viewing with generated id and default duration/type', () => {
    const payload: RequestViewingPayload = {
      propertyId: 'prop-009',
      propertyAddress: 'New Street, Lisboa',
      tenantId: 'tenant-099',
      tenantName: 'New Tenant',
      tenantEmail: 'new@email.com',
      date: '2026-06-01',
      time: '12:00',
    };
    const before = service.viewings().length;
    const slot = service.request(payload);
    const after = service.viewings();
    expect(after.length).toBe(before + 1);
    expect(after[0]).toBe(slot);
    expect(slot.id).toMatch(/^v\d+/);
    expect(slot.status).toBe('pending');
    expect(slot.durationMin).toBe(45);
    expect(slot.type).toBe('in_person');
    expect(slot.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('request honours caller-provided durationMin, type and notes', () => {
    const slot = service.request({
      propertyId: 'p1',
      propertyAddress: 'A',
      tenantId: 't1',
      tenantName: 'T',
      tenantEmail: 't@e.com',
      date: '2026-06-02',
      time: '09:00',
      durationMin: 30,
      type: 'virtual',
      notes: 'prefers afternoon',
    });
    expect(slot.durationMin).toBe(30);
    expect(slot.type).toBe('virtual');
    expect(slot.notes).toBe('prefers afternoon');
  });

  it('confirm transitions a pending viewing to confirmed', () => {
    service.confirm('v002');
    const v = service.viewings().find(x => x.id === 'v002')!;
    expect(v.status).toBe('confirmed');
  });

  it('cancel transitions a viewing to cancelled', () => {
    service.cancel('v001');
    const v = service.viewings().find(x => x.id === 'v001')!;
    expect(v.status).toBe('cancelled');
  });

  it('complete transitions a viewing to completed', () => {
    service.complete('v001');
    const v = service.viewings().find(x => x.id === 'v001')!;
    expect(v.status).toBe('completed');
  });

  it('markNoShow transitions a viewing to no_show', () => {
    service.markNoShow('v001');
    const v = service.viewings().find(x => x.id === 'v001')!;
    expect(v.status).toBe('no_show');
  });

  it('confirm on unknown id is a no-op (no entries mutated)', () => {
    const before = service.viewings();
    service.confirm('does-not-exist');
    expect(service.viewings()).toEqual(before);
  });

  it('cancel/complete/markNoShow on unknown ids are no-ops', () => {
    const before = service.viewings();
    service.cancel('nope');
    service.complete('nope');
    service.markNoShow('nope');
    expect(service.viewings()).toEqual(before);
  });

  it('kpis recompute reactively after a status transition', () => {
    expect(service.kpis().pending).toBe(2);
    expect(service.kpis().confirmed).toBe(1);
    service.confirm('v002');
    expect(service.kpis().pending).toBe(1);
    expect(service.kpis().confirmed).toBe(2);
  });

  it('upcoming drops a viewing once it is cancelled', () => {
    const beforeIds = service.upcoming().map(v => v.id);
    expect(beforeIds).toContain('v002');
    service.cancel('v002');
    const afterIds = service.upcoming().map(v => v.id);
    expect(afterIds).not.toContain('v002');
  });

  it('upcoming reflects a newly requested viewing in sorted position', () => {
    service.request({
      propertyId: 'p1',
      propertyAddress: 'A',
      tenantId: 't1',
      tenantName: 'T',
      tenantEmail: 't@e.com',
      date: '2026-04-04',
      time: '08:00',
    });
    const up = service.upcoming();
    const keys = up.map(v => v.date + v.time);
    expect(keys).toEqual([...keys].sort());
    expect(up.some(v => v.date === '2026-04-04' && v.time === '08:00')).toBe(true);
  });
});
