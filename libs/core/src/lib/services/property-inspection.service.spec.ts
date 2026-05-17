import { TestBed } from '@angular/core/testing';
import {
  PropertyInspectionService,
  type CreateInspectionPayload,
  type RoomCondition,
} from './property-inspection.service';

describe('PropertyInspectionService', () => {
  let service: PropertyInspectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyInspectionService);
  });

  const samplePayload = (overrides: Partial<CreateInspectionPayload> = {}): CreateInspectionPayload => ({
    propertyId: 'prop-099',
    propertyTitle: 'Test Property',
    tenantId: 'tenant-099',
    landlordId: 'landlord-099',
    type: 'routine',
    scheduledDate: '2026-05-20',
    rooms: ['Living Room', 'Bedroom'],
    ...overrides,
  });

  it('seeds with two inspection reports', () => {
    expect(service.reports().length).toBe(2);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('completedReports buckets only "completed" and "signed" statuses', () => {
    const completed = service.completedReports();
    expect(completed.length).toBe(1);
    expect(completed[0].status).toBe('signed');
  });

  it('pendingReports buckets only "draft" and "in-progress" statuses', () => {
    const pending = service.pendingReports();
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('in-progress');
  });

  it('create() prepends a draft with rooms mapped from name list', () => {
    const before = service.reports().length;
    const report = service.create(samplePayload());

    expect(service.reports().length).toBe(before + 1);
    expect(service.reports()[0].id).toBe(report.id);
    expect(report.id).toMatch(/^insp-\d+/);
    expect(report.status).toBe('draft');
    expect(report.rooms.length).toBe(2);
    expect(report.rooms[0]).toMatchObject({
      id: 'room-0',
      name: 'Living Room',
      condition: 'good',
      notes: '',
      photos: [],
    });
    expect(report.tenantSigned).toBe(false);
    expect(report.landlordSigned).toBe(false);
  });

  it('create() with an empty room list yields a draft with zero rooms', () => {
    const report = service.create(samplePayload({ rooms: [] }));
    expect(report.rooms).toEqual([]);
    expect(report.status).toBe('draft');
  });

  it('updateRoom() patches the named room and transitions draft → in-progress', () => {
    const report = service.create(samplePayload());
    service.updateRoom(report.id, 'room-0', {
      condition: 'fair',
      notes: 'Floor scuff near window',
    });

    const updated = service.reports().find(r => r.id === report.id)!;
    expect(updated.status).toBe('in-progress');
    const room = updated.rooms.find(r => r.id === 'room-0')!;
    expect(room.condition).toBe('fair');
    expect(room.notes).toBe('Floor scuff near window');
    // Other room untouched
    expect(updated.rooms.find(r => r.id === 'room-1')!.condition).toBe('good');
  });

  it('updateRoom() does not regress status once past draft', () => {
    // Seed report 'insp-001' is already signed
    service.updateRoom('insp-001', 'r1', { notes: 'Post-signature annotation' });
    const r = service.reports().find(x => x.id === 'insp-001')!;
    expect(r.status).toBe('signed');
    expect(r.rooms.find(rm => rm.id === 'r1')!.notes).toBe('Post-signature annotation');
  });

  it('updateRoom() on unknown report id is a no-op', () => {
    const before = service.reports();
    service.updateRoom('does-not-exist', 'r1', { notes: 'x' });
    expect(service.reports()).toEqual(before);
  });

  it('complete() stamps date + notes and sets status="completed"', () => {
    const report = service.create(samplePayload());
    service.complete(report.id, 'All rooms inspected, no issues.');

    const completed = service.reports().find(r => r.id === report.id)!;
    expect(completed.status).toBe('completed');
    expect(completed.inspectorNotes).toBe('All rooms inspected, no issues.');
    expect(completed.completedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(completed.overallCondition).toBeDefined();
  });

  it('complete() derives overallCondition from the worst room across the report', () => {
    const report = service.create(samplePayload({ rooms: ['A', 'B', 'C'] }));
    // A=excellent, B=good, C=poor
    service.updateRoom(report.id, 'room-0', { condition: 'excellent' });
    service.updateRoom(report.id, 'room-1', { condition: 'good' });
    service.updateRoom(report.id, 'room-2', { condition: 'poor' });

    service.complete(report.id, 'Mixed condition');
    const completed = service.reports().find(r => r.id === report.id)!;
    expect(completed.overallCondition).toBe<RoomCondition>('poor');
  });

  it('complete() with all excellent rooms produces overallCondition="excellent"', () => {
    const report = service.create(samplePayload({ rooms: ['A', 'B'] }));
    service.updateRoom(report.id, 'room-0', { condition: 'excellent' });
    service.updateRoom(report.id, 'room-1', { condition: 'excellent' });
    service.complete(report.id, 'Pristine');
    const completed = service.reports().find(r => r.id === report.id)!;
    expect(completed.overallCondition).toBe<RoomCondition>('excellent');
  });

  it('sign() flips only the requested role flag without finalising', () => {
    const report = service.create(samplePayload());
    service.sign(report.id, 'tenant');
    const r = service.reports().find(x => x.id === report.id)!;
    expect(r.tenantSigned).toBe(true);
    expect(r.landlordSigned).toBe(false);
    expect(r.status).toBe('draft');
  });

  it('sign() by both roles promotes status to "signed"', () => {
    const report = service.create(samplePayload());
    service.complete(report.id, 'Done');
    service.sign(report.id, 'tenant');
    service.sign(report.id, 'landlord');

    const r = service.reports().find(x => x.id === report.id)!;
    expect(r.status).toBe('signed');
    expect(r.tenantSigned).toBe(true);
    expect(r.landlordSigned).toBe(true);

    // Now appears in completedReports
    expect(service.completedReports().some(x => x.id === report.id)).toBe(true);
    expect(service.pendingReports().some(x => x.id === report.id)).toBe(false);
  });

  it('sign() on unknown id is a no-op', () => {
    const before = service.reports();
    service.sign('does-not-exist', 'tenant');
    expect(service.reports()).toEqual(before);
  });

  it('seed insp-001 has dual signatures and reflects in completedReports', () => {
    const r = service.reports().find(x => x.id === 'insp-001')!;
    expect(r.tenantSigned).toBe(true);
    expect(r.landlordSigned).toBe(true);
    expect(r.status).toBe('signed');
  });
});
