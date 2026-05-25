import { TestBed } from '@angular/core/testing';
import {
  TenantApplicationService,
  type CreateApplicationPayload,
} from './tenant-application.service';

function basePayload(
  overrides: Partial<CreateApplicationPayload> = {},
): CreateApplicationPayload {
  return {
    tenantId: 'tenant-099',
    tenantName: 'New Tenant',
    tenantEmail: 'new.tenant@email.pt',
    tenantPhone: '+351 911 222 333',
    landlordId: 'landlord-005',
    propertyId: 'p9',
    propertyTitle: 'Test Property',
    employmentType: 'employed',
    monthlyIncome: 1800,
    employer: 'Test Co.',
    nif: '987654321',
    nationality: 'Portuguesa',
    occupation: 'Designer',
    numOccupants: 1,
    hasPets: false,
    coverLetter: 'Some cover letter',
    references: [],
    ...overrides,
  };
}

describe('TenantApplicationService', () => {
  let service: TenantApplicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantApplicationService);
  });

  it('seeds with two mock applications', () => {
    const all = service.applications();
    expect(all.length).toBe(2);
    expect(all.map(a => a.id)).toEqual(['app-001', 'app-002']);
  });

  it('initial loading=false and error=null', () => {
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('pendingReview computed includes submitted + under-review applications', () => {
    expect(service.pendingReview().map(a => a.id)).toEqual(['app-002']);
  });

  it('approved computed includes only status=approved applications', () => {
    expect(service.approved().map(a => a.id)).toEqual(['app-001']);
  });

  it('byStatus(status) returns matching applications', () => {
    const approved = service.byStatus('approved');
    const draft = service.byStatus('draft');
    expect(approved().map(a => a.id)).toEqual(['app-001']);
    expect(draft()).toEqual([]);
  });

  it('loadForTenant flips loading true synchronously then false after 300ms', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-001');
      expect(service.loading()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.applications().every(a => a.tenantId === 'tenant-001')).toBe(true);
      expect(service.applications().length).toBe(2);
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
      expect(service.applications().every(a => a.landlordId === 'landlord-001')).toBe(true);
      expect(service.applications().length).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForTenant with unknown id leaves applications empty after flush', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-zzz');
      jest.advanceTimersByTime(300);
      expect(service.applications()).toEqual([]);
      expect(service.pendingReview()).toEqual([]);
      expect(service.approved()).toEqual([]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('getById returns the application matching the id', () => {
    expect(service.getById('app-001')?.tenantName).toBe('Ana Ferreira');
    expect(service.getById('app-zzz')).toBeUndefined();
  });

  it('submit prepends a new submitted application with generated id + reference ids', () => {
    const before = service.applications().length;
    const created = service.submit(
      basePayload({
        references: [
          { name: 'Ref One', relationship: 'landlord', phone: '+351 999' },
        ],
      }),
    );
    const after = service.applications();
    expect(after.length).toBe(before + 1);
    expect(after[0]).toBe(created);
    expect(created.id).toMatch(/^app-/);
    expect(created.status).toBe('submitted');
    expect(created.references[0].id).toBeTruthy();
    expect(created.references[0].name).toBe('Ref One');
    expect(created.submittedAt).toBe(created.createdAt);
    expect(created.updatedAt).toBe(created.createdAt);
  });

  it('submit reflects new entry in pendingReview computed', () => {
    expect(service.pendingReview().length).toBe(1);
    service.submit(basePayload());
    expect(service.pendingReview().length).toBe(2);
  });

  it('approve mutates status + reviewNotes + reviewedAt for the targeted application', () => {
    const before = service.applications().find(a => a.id === 'app-002')!;
    service.approve('app-002', 'All checks passed');
    const after = service.applications().find(a => a.id === 'app-002')!;
    expect(after.status).toBe('approved');
    expect(after.reviewNotes).toBe('All checks passed');
    expect(after.reviewedAt).toBeTruthy();
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });

  it('approve without notes leaves reviewNotes undefined', () => {
    service.approve('app-002');
    const r = service.applications().find(a => a.id === 'app-002')!;
    expect(r.status).toBe('approved');
    expect(r.reviewNotes).toBeUndefined();
  });

  it('reject mutates status + rejectionReason + reviewedAt', () => {
    service.reject('app-002', 'Income below threshold');
    const r = service.applications().find(a => a.id === 'app-002')!;
    expect(r.status).toBe('rejected');
    expect(r.rejectionReason).toBe('Income below threshold');
    expect(r.reviewedAt).toBeTruthy();
  });

  it('markUnderReview transitions status to under-review', () => {
    service.submit(basePayload());
    const newId = service.applications()[0].id;
    service.markUnderReview(newId);
    expect(service.applications().find(a => a.id === newId)!.status).toBe('under-review');
  });

  it('withdraw transitions status to withdrawn', () => {
    service.withdraw('app-002');
    expect(service.applications().find(a => a.id === 'app-002')!.status).toBe('withdrawn');
  });

  it('approve on unknown id is a no-op', () => {
    const before = service.applications();
    service.approve('app-zzz', 'note');
    expect(service.applications()).toEqual(before);
  });

  it('reject on unknown id is a no-op', () => {
    const before = service.applications();
    service.reject('app-zzz', 'reason');
    expect(service.applications()).toEqual(before);
  });

  it('pendingReview recomputes after status transitions', () => {
    expect(service.pendingReview().length).toBe(1);
    service.approve('app-002');
    expect(service.pendingReview().length).toBe(0);
  });
});
