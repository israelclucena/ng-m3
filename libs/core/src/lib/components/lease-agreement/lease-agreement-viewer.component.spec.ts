import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaseAgreementViewerComponent } from './lease-agreement-viewer.component';
import {
  LeaseAgreementService,
  type LeaseAgreement,
} from '../../services/lease-agreement.service';

/** Build a lease, overridable per test. */
function lease(over: Partial<LeaseAgreement> = {}): LeaseAgreement {
  return {
    id: 'lease-1',
    tenantId: 'tenant-1',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-1',
    landlordName: 'Carlos Mendes',
    propertyId: 'p1',
    propertyTitle: 'T2 no Chiado',
    propertyAddress: 'Rua Garrett 42, Lisboa',
    leaseType: 'fixed',
    status: 'draft',
    monthlyRent: 1200,
    depositAmount: 2400,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    terms: 'Termos do contrato',
    documents: [],
    signedByTenant: false,
    signedByLandlord: false,
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-18T09:00:00Z',
    ...over,
  };
}

describe('LeaseAgreementViewerComponent', () => {
  let fixture: ComponentFixture<LeaseAgreementViewerComponent>;
  let component: LeaseAgreementViewerComponent;
  let mockSvc: { getById: jest.Mock; sign: jest.Mock };

  /** Call a method on the component without leaking `any`. */
  function call<T = unknown>(name: string, ...args: unknown[]): T {
    return (component as unknown as Record<string, (...a: unknown[]) => T>)[name](...args);
  }

  beforeEach(async () => {
    mockSvc = { getById: jest.fn(), sign: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LeaseAgreementViewerComponent],
      providers: [{ provide: LeaseAgreementService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaseAgreementViewerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentUserId', 'tenant-1');
    fixture.componentRef.setInput('currentUserRole', 'tenant');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── lease() resolution ────────────────────────────────────────────────────────

  it('prefers leaseData over a leaseId lookup', () => {
    const direct = lease({ id: 'direct' });
    fixture.componentRef.setInput('leaseData', direct);
    fixture.componentRef.setInput('leaseId', 'lease-1');
    expect(component.lease()).toBe(direct);
    expect(mockSvc.getById).not.toHaveBeenCalled();
  });

  it('looks a lease up by id when no leaseData is given', () => {
    const found = lease({ id: 'lease-1' });
    mockSvc.getById.mockReturnValue(found);
    fixture.componentRef.setInput('leaseId', 'lease-1');
    expect(component.lease()).toBe(found);
    expect(mockSvc.getById).toHaveBeenCalledWith('lease-1');
  });

  it('resolves to null when neither leaseData nor leaseId is provided', () => {
    expect(component.lease()).toBeNull();
  });

  it('resolves to null when the lookup misses', () => {
    mockSvc.getById.mockReturnValue(undefined);
    fixture.componentRef.setInput('leaseId', 'missing');
    expect(component.lease()).toBeNull();
  });

  // ── canSign() ─────────────────────────────────────────────────────────────────

  it('lets a tenant sign a draft they have not signed yet', () => {
    fixture.componentRef.setInput('leaseData', lease({ status: 'draft', signedByTenant: false }));
    expect(component.canSign()).toBe(true);
  });

  it('blocks signing once the tenant has already signed', () => {
    fixture.componentRef.setInput('leaseData', lease({ status: 'draft', signedByTenant: true }));
    expect(component.canSign()).toBe(false);
  });

  it('blocks signing on a non-draft lease', () => {
    fixture.componentRef.setInput('leaseData', lease({ status: 'active', signedByTenant: false }));
    expect(component.canSign()).toBe(false);
  });

  it('checks the landlord signature flag for a landlord', () => {
    fixture.componentRef.setInput('currentUserRole', 'landlord');
    fixture.componentRef.setInput('leaseData', lease({ status: 'draft', signedByLandlord: false }));
    expect(component.canSign()).toBe(true);
  });

  it('blocks signing immediately after a successful sign', () => {
    fixture.componentRef.setInput('leaseData', lease({ status: 'draft', signedByTenant: false }));
    component.signedSuccess.set(true);
    expect(component.canSign()).toBe(false);
  });

  // ── label / icon maps ─────────────────────────────────────────────────────────

  it('maps each status to its Portuguese label', () => {
    expect(call<string>('statusLabel', 'draft')).toBe('Rascunho');
    expect(call<string>('statusLabel', 'active')).toBe('Activo');
    expect(call<string>('statusLabel', 'terminated')).toBe('Rescindido');
  });

  it('maps each status to its icon', () => {
    expect(call<string>('statusIcon', 'active')).toBe('verified');
    expect(call<string>('statusIcon', 'expired')).toBe('schedule');
  });

  it('maps known lease types and falls back to the raw value', () => {
    expect(call<string>('leaseTypeLabel', 'fixed')).toBe('Prazo Fixo');
    expect(call<string>('leaseTypeLabel', 'month-to-month')).toBe('Renovação Mensal');
    expect(call<string>('leaseTypeLabel', 'weird')).toBe('weird');
  });

  // ── formatDate ────────────────────────────────────────────────────────────────

  it('renders a dash for a missing date', () => {
    expect(call<string>('formatDate', undefined)).toBe('—');
  });

  it('formats a present ISO date including its year', () => {
    expect(call<string>('formatDate', '2026-03-20T10:15:00Z')).toContain('2026');
  });

  // ── confirmSign ───────────────────────────────────────────────────────────────

  describe('confirmSign', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('signs through the service and emits after the delay', () => {
      const emitted: string[] = [];
      component.signed.subscribe((id) => emitted.push(id));
      fixture.componentRef.setInput('leaseData', lease({ id: 'lease-1', status: 'draft' }));

      call('confirmSign');
      expect(component.signing()).toBe(true);

      jest.advanceTimersByTime(600);

      expect(mockSvc.sign).toHaveBeenCalledWith('lease-1', 'tenant');
      expect(component.signing()).toBe(false);
      expect(component.signConfirming()).toBe(false);
      expect(component.signedSuccess()).toBe(true);
      expect(emitted).toEqual(['lease-1']);
    });

    it('does nothing when there is no resolved lease', () => {
      call('confirmSign');
      jest.advanceTimersByTime(600);
      expect(mockSvc.sign).not.toHaveBeenCalled();
    });
  });
});
