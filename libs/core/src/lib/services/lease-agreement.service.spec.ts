import { TestBed } from '@angular/core/testing';
import { LeaseAgreementService, type CreateLeasePayload } from './lease-agreement.service';

const PAYLOAD: CreateLeasePayload = {
  tenantId: 'tenant-test',
  tenantName: 'João Teste',
  landlordId: 'landlord-test',
  landlordName: 'Maria Senhoria',
  propertyId: 'p-test',
  propertyTitle: 'T1 Bairro Alto',
  propertyAddress: 'Rua Teste 1, Lisboa',
  leaseType: 'fixed',
  monthlyRent: 950,
  depositAmount: 1900,
  startDate: '2026-06-01',
  endDate: '2027-05-31',
  terms: 'Termos de teste',
};

describe('LeaseAgreementService', () => {
  let service: LeaseAgreementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaseAgreementService);
  });

  it('seeds 2 mock leases (1 active, 1 draft)', () => {
    expect(service.leases().length).toBe(2);
    expect(service.activeLeases().length).toBe(1);
    expect(service.draftLeases().length).toBe(1);
    expect(service.closedLeases().length).toBe(0);
  });

  it('pendingSignatureCount tracks draft leases unsigned by tenant', () => {
    expect(service.pendingSignatureCount()).toBe(1);
  });

  it('create() returns a draft lease with both signatures false', () => {
    const created = service.create(PAYLOAD);
    expect(created.status).toBe('draft');
    expect(created.signedByTenant).toBe(false);
    expect(created.signedByLandlord).toBe(false);
    expect(created.id.startsWith('lease-')).toBe(true);
    expect(service.leases().length).toBe(3);
    expect(service.leases()[0].id).toBe(created.id);
  });

  it('sign() — tenant-only on a draft keeps status draft', () => {
    const created = service.create(PAYLOAD);
    service.sign(created.id, 'tenant');
    const after = service.getById(created.id)!;
    expect(after.signedByTenant).toBe(true);
    expect(after.signedByLandlord).toBe(false);
    expect(after.status).toBe('draft');
  });

  it('sign() — both parties transitions draft → active', () => {
    const created = service.create(PAYLOAD);
    service.sign(created.id, 'tenant');
    service.sign(created.id, 'landlord');
    const after = service.getById(created.id)!;
    expect(after.signedByTenant).toBe(true);
    expect(after.signedByLandlord).toBe(true);
    expect(after.status).toBe('active');
    expect(after.tenantSignedAt).toBeDefined();
    expect(after.landlordSignedAt).toBeDefined();
  });

  it('terminate() flips active lease to terminated and stores notes', () => {
    const active = service.activeLeases()[0];
    service.terminate(active.id, 'Mutual agreement');
    const after = service.getById(active.id)!;
    expect(after.status).toBe('terminated');
    expect(after.notes).toBe('Mutual agreement');
    expect(service.closedLeases().some(l => l.id === active.id)).toBe(true);
  });

  it('expire() flips active lease to expired', () => {
    const active = service.activeLeases()[0];
    service.expire(active.id);
    expect(service.getById(active.id)!.status).toBe('expired');
    expect(service.activeLeases().length).toBe(0);
  });

  it('attachDocument() appends a doc with a generated id', () => {
    const active = service.activeLeases()[0];
    const before = active.documents.length;
    service.attachDocument(active.id, {
      name: 'extra.pdf',
      url: '/mock/extra.pdf',
      uploadedAt: new Date().toISOString(),
    });
    const after = service.getById(active.id)!;
    expect(after.documents.length).toBe(before + 1);
    expect(after.documents[after.documents.length - 1].id).toBeDefined();
    expect(after.documents[after.documents.length - 1].name).toBe('extra.pdf');
  });

  it('getById() returns undefined for unknown ids', () => {
    expect(service.getById('nope')).toBeUndefined();
  });

  it('loadForTenant() filters the leases list async via setTimeout', () => {
    jest.useFakeTimers();
    try {
      service.loadForTenant('tenant-001');
      expect(service.loading()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.leases().every(l => l.tenantId === 'tenant-001')).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForLandlord() filters the leases list async via setTimeout', () => {
    jest.useFakeTimers();
    try {
      service.loadForLandlord('landlord-001');
      jest.advanceTimersByTime(300);
      expect(service.leases().every(l => l.landlordId === 'landlord-001')).toBe(true);
      expect(service.loading()).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('unknown id mutations are no-ops (sign / terminate / expire / attach)', () => {
    const snapshot = service.leases();
    service.sign('zzz', 'tenant');
    service.terminate('zzz');
    service.expire('zzz');
    service.attachDocument('zzz', { name: 'x', url: '/x', uploadedAt: 'now' });
    expect(service.leases()).toEqual(snapshot);
  });
});
