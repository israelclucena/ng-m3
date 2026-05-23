import { TestBed } from '@angular/core/testing';
import { ApplicationPipelineService } from './application-pipeline.service';
import {
  TenantApplicationService,
  TenantApplication,
} from './tenant-application.service';

function makeApp(overrides: Partial<TenantApplication> = {}): TenantApplication {
  const now = '2026-05-23T00:00:00Z';
  return {
    id: 'app-x',
    tenantId: 't1',
    tenantName: 'Test Tenant',
    tenantEmail: 't@example.pt',
    tenantPhone: '+351 900 000 000',
    landlordId: 'landlord-x',
    propertyId: 'p1',
    propertyTitle: 'Test Property',
    status: 'submitted',
    employmentType: 'employed',
    monthlyIncome: 2000,
    nif: '000000000',
    nationality: 'Portuguesa',
    occupation: 'Tester',
    numOccupants: 1,
    hasPets: false,
    coverLetter: '',
    references: [],
    documentIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ApplicationPipelineService', () => {
  let service: ApplicationPipelineService;
  let appSvc: TenantApplicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    appSvc = TestBed.inject(TenantApplicationService);
    service = TestBed.inject(ApplicationPipelineService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('exposes applications and loading delegated to TenantApplicationService', () => {
    expect(service.applications()).toBe(appSvc.applications());
    expect(service.loading()).toBe(appSvc.loading());
  });

  it('groups submitted + draft into "applied" column', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'submitted' }),
        makeApp({ id: 'a2', status: 'draft' }),
        makeApp({ id: 'a3', status: 'approved' }),
      ]);
    const cols = service.columns();
    expect(cols.applied.map(a => a.id).sort()).toEqual(['a1', 'a2']);
    expect(cols.approved.map(a => a.id)).toEqual(['a3']);
  });

  it('groups under-review into "underReview" column', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'under-review' }),
        makeApp({ id: 'a2', status: 'submitted' }),
      ]);
    const cols = service.columns();
    expect(cols.underReview.map(a => a.id)).toEqual(['a1']);
    expect(cols.applied.map(a => a.id)).toEqual(['a2']);
  });

  it('groups rejected + withdrawn into "rejected" column', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'rejected' }),
        makeApp({ id: 'a2', status: 'withdrawn' }),
        makeApp({ id: 'a3', status: 'approved' }),
      ]);
    const cols = service.columns();
    expect(cols.rejected.map(a => a.id).sort()).toEqual(['a1', 'a2']);
    expect(cols.approved.map(a => a.id)).toEqual(['a3']);
  });

  it('returns empty arrays for all columns when no applications', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([]);
    const cols = service.columns();
    expect(cols.applied).toEqual([]);
    expect(cols.underReview).toEqual([]);
    expect(cols.approved).toEqual([]);
    expect(cols.rejected).toEqual([]);
    expect(service.totalCount()).toBe(0);
  });

  it('columnDefs returns 4 columns in the expected order with M3 colors', () => {
    const defs = service.columnDefs();
    expect(defs.map(c => c.id)).toEqual(['applied', 'underReview', 'approved', 'rejected']);
    expect(defs.map(c => c.color)).toEqual(['secondary', 'tertiary', 'primary', 'error']);
    expect(defs.map(c => c.icon)).toEqual(['inbox', 'search', 'check_circle', 'cancel']);
    expect(defs.every(c => typeof c.label === 'string' && c.label.length > 0)).toBe(true);
  });

  it('columnDefs.applications mirrors columns content', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'submitted' }),
        makeApp({ id: 'a2', status: 'approved' }),
      ]);
    const defs = service.columnDefs();
    expect(defs.find(c => c.id === 'applied')!.applications.map(a => a.id)).toEqual(['a1']);
    expect(defs.find(c => c.id === 'approved')!.applications.map(a => a.id)).toEqual(['a2']);
  });

  it('totalCount reflects current applications length', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1' }),
        makeApp({ id: 'a2' }),
        makeApp({ id: 'a3' }),
      ]);
    expect(service.totalCount()).toBe(3);
  });

  it('columnCounts mirrors per-column lengths', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'submitted' }),
        makeApp({ id: 'a2', status: 'submitted' }),
        makeApp({ id: 'a3', status: 'under-review' }),
        makeApp({ id: 'a4', status: 'approved' }),
        makeApp({ id: 'a5', status: 'rejected' }),
        makeApp({ id: 'a6', status: 'withdrawn' }),
      ]);
    expect(service.columnCounts()).toEqual({
      applied: 2,
      underReview: 1,
      approved: 1,
      rejected: 2,
    });
  });

  it('load() delegates to TenantApplicationService.loadForLandlord', () => {
    const spy = jest.spyOn(appSvc, 'loadForLandlord').mockImplementation(() => undefined);
    service.load('landlord-001');
    expect(spy).toHaveBeenCalledWith('landlord-001');
  });

  it('moveToReview() delegates to TenantApplicationService.markUnderReview', () => {
    const spy = jest.spyOn(appSvc, 'markUnderReview');
    service.moveToReview('app-001');
    expect(spy).toHaveBeenCalledWith('app-001');
  });

  it('approve() delegates to TenantApplicationService.approve', () => {
    const spy = jest.spyOn(appSvc, 'approve');
    service.approve('app-001');
    expect(spy).toHaveBeenCalledWith('app-001');
  });

  it('reject() passes reason through to TenantApplicationService.reject', () => {
    const spy = jest.spyOn(appSvc, 'reject');
    service.reject('app-001', 'income too low');
    expect(spy).toHaveBeenCalledWith('app-001', 'income too low');
  });

  it('reject() defaults to empty string when reason omitted', () => {
    const spy = jest.spyOn(appSvc, 'reject');
    service.reject('app-001');
    expect(spy).toHaveBeenCalledWith('app-001', '');
  });

  it('columns recompute reactively when underlying applications change', () => {
    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([makeApp({ id: 'a1', status: 'submitted' })]);
    expect(service.columnCounts().applied).toBe(1);

    (appSvc as unknown as { _applications: { set: (v: TenantApplication[]) => void } })
      ._applications.set([
        makeApp({ id: 'a1', status: 'approved' }),
        makeApp({ id: 'a2', status: 'approved' }),
      ]);
    expect(service.columnCounts()).toEqual({
      applied: 0,
      underReview: 0,
      approved: 2,
      rejected: 0,
    });
  });
});
