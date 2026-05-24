import { TestBed } from '@angular/core/testing';
import {
  MaintenanceRequestService,
  type CreateMaintenanceRequestPayload,
  type UpdateMaintenanceStatusPayload,
} from './maintenance-request.service';

function basePayload(
  overrides: Partial<CreateMaintenanceRequestPayload> = {},
): CreateMaintenanceRequestPayload {
  return {
    tenantId: 'tenant-099',
    tenantName: 'New Tenant',
    landlordId: 'landlord-001',
    propertyId: 'p9',
    propertyTitle: 'Test Property',
    category: 'plumbing',
    priority: 'medium',
    title: 'Sample issue',
    description: 'Some description',
    ...overrides,
  };
}

describe('MaintenanceRequestService', () => {
  let service: MaintenanceRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceRequestService);
  });

  it('seeds with three mock requests covering all status values', () => {
    const all = service.requests();
    expect(all.length).toBe(3);
    const statuses = new Set(all.map(r => r.status));
    expect(statuses.has('pending')).toBe(true);
    expect(statuses.has('in-progress')).toBe(true);
    expect(statuses.has('resolved')).toBe(true);
  });

  it('initial loading=false and error=null', () => {
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('pendingCount and urgentCount derived from seeded mock data', () => {
    // mr-002 is pending+urgent, mr-001 is in-progress+high, mr-003 is resolved+medium
    expect(service.pendingCount()).toBe(1);
    expect(service.urgentCount()).toBe(1);
  });

  it('loadForTenant flips loading true synchronously then false after timeout', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-001');
      expect(service.loading()).toBe(true);
      expect(service.error()).toBeNull();
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.requests().every(r => r.tenantId === 'tenant-001')).toBe(true);
      expect(service.requests().length).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForLandlord filters mock data to that landlord after timer flush', () => {
    jest.useFakeTimers();
    try {
      service.loadForLandlord('landlord-001');
      expect(service.loading()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.requests().every(r => r.landlordId === 'landlord-001')).toBe(true);
      expect(service.requests().length).toBe(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForTenant with unknown id leaves requests empty after flush', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-unknown');
      jest.advanceTimersByTime(300);
      expect(service.requests()).toEqual([]);
      expect(service.pendingCount()).toBe(0);
      expect(service.urgentCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('create prepends a new pending request with generated id and timestamps', () => {
    const before = service.requests().length;
    const created = service.create(basePayload({ title: 'Heater broken' }));
    const after = service.requests();
    expect(after.length).toBe(before + 1);
    expect(after[0]).toBe(created);
    expect(created.id).toMatch(/^mr-\d+/);
    expect(created.status).toBe('pending');
    expect(created.title).toBe('Heater broken');
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(created.updatedAt).toBe(created.createdAt);
  });

  it('create reflects new entry in pendingCount and urgentCount when applicable', () => {
    expect(service.pendingCount()).toBe(1);
    service.create(basePayload({ priority: 'urgent' }));
    expect(service.pendingCount()).toBe(2);
    expect(service.urgentCount()).toBe(2);
  });

  it('updateStatus mutates status + resolution + updatedAt for the targeted request', () => {
    const before = service.requests().find(r => r.id === 'mr-002')!;
    const payload: UpdateMaintenanceStatusPayload = {
      status: 'resolved',
      resolution: 'Electrician repaired the socket',
    };
    service.updateStatus('mr-002', payload);
    const after = service.requests().find(r => r.id === 'mr-002')!;
    expect(after.status).toBe('resolved');
    expect(after.resolution).toBe('Electrician repaired the socket');
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  it('updateStatus can carry scheduledDate without resolution', () => {
    service.updateStatus('mr-002', {
      status: 'in-progress',
      scheduledDate: '2026-04-10T09:00:00Z',
    });
    const r = service.requests().find(x => x.id === 'mr-002')!;
    expect(r.status).toBe('in-progress');
    expect(r.scheduledDate).toBe('2026-04-10T09:00:00Z');
  });

  it('updateStatus on unknown id is a no-op (no entries mutated)', () => {
    const before = service.requests();
    service.updateStatus('mr-zzz', { status: 'resolved' });
    expect(service.requests()).toEqual(before);
  });

  it('delete removes the request matching the given id', () => {
    const before = service.requests().length;
    service.delete('mr-001');
    const after = service.requests();
    expect(after.length).toBe(before - 1);
    expect(after.some(r => r.id === 'mr-001')).toBe(false);
  });

  it('delete on unknown id leaves requests unchanged', () => {
    const before = service.requests();
    service.delete('mr-does-not-exist');
    expect(service.requests()).toEqual(before);
  });

  it('urgentCount only counts urgent priority that is not yet resolved', () => {
    service.create(basePayload({ priority: 'urgent' }));
    expect(service.urgentCount()).toBe(2);
    // Resolving an urgent request should drop the count
    const urgentId = service.requests().find(r => r.priority === 'urgent')!.id;
    service.updateStatus(urgentId, { status: 'resolved' });
    expect(service.urgentCount()).toBe(1);
  });

  it('pendingCount recomputes after status transitions', () => {
    expect(service.pendingCount()).toBe(1);
    service.updateStatus('mr-002', { status: 'in-progress' });
    expect(service.pendingCount()).toBe(0);
  });
});
