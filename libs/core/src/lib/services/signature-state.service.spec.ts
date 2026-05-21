import { TestBed } from '@angular/core/testing';
import { SignatureStateService } from './signature-state.service';
import { LeaseAgreementService } from './lease-agreement.service';
import { NotificationBellService } from '../components/notification-bell/notification-bell.service';

describe('SignatureStateService', () => {
  let service: SignatureStateService;
  let leaseSvc: LeaseAgreementService;
  let notifSvc: NotificationBellService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignatureStateService);
    leaseSvc = TestBed.inject(LeaseAgreementService);
    notifSvc = TestBed.inject(NotificationBellService);
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  it('starts idle with no active flow', () => {
    expect(service.flow()).toBeNull();
    expect(service.state()).toBe('idle');
    expect(service.isActive()).toBe(false);
    expect(service.isCompleted()).toBe(false);
    expect(service.landlordSignature()).toBeNull();
    expect(service.tenantSignature()).toBeNull();
  });

  // ─── startFlow ───────────────────────────────────────────────────────────

  it('startFlow defaults to landlord initiator → landlord_pending', () => {
    service.startFlow('lease-001');
    expect(service.state()).toBe('landlord_pending');
    expect(service.isActive()).toBe(true);
    expect(service.flow()?.leaseId).toBe('lease-001');
  });

  it('startFlow with tenant initiator → tenant_pending', () => {
    service.startFlow('lease-002', 'tenant');
    expect(service.state()).toBe('tenant_pending');
  });

  it('startFlow clears any previous signatures', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.startFlow('lease-001');
    expect(service.landlordSignature()).toBeNull();
    expect(service.tenantSignature()).toBeNull();
    expect(service.flow()?.completedAt).toBeNull();
  });

  // ─── captureSignature ────────────────────────────────────────────────────

  it('captureSignature is a noop when no flow is active', () => {
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    expect(service.flow()).toBeNull();
    expect(service.state()).toBe('idle');
  });

  it('captureSignature(landlord) stores entry and advances to landlord_signed', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João Senhorio');
    expect(service.state()).toBe('landlord_signed');
    const sig = service.landlordSignature();
    expect(sig?.role).toBe('landlord');
    expect(sig?.dataUrl).toBe('data:image/png;base64,A');
    expect(sig?.signerName).toBe('João Senhorio');
    expect(sig?.signedAt).toBeTruthy();
    expect(service.tenantSignature()).toBeNull();
  });

  it('captureSignature(landlord) pushes a tenant notification', () => {
    const before = notifSvc.notifications().length;
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    expect(notifSvc.notifications().length).toBe(before + 1);
    const latest = notifSvc.notifications()[0];
    expect(latest.category).toBe('alert');
    expect(latest.title).toContain('Pronto para Assinar');
    expect(latest.body).toContain('João');
    expect(latest.actionRoute).toBe('/lease');
  });

  it('captureSignature(tenant) alone does not push a notification', () => {
    service.startFlow('lease-002', 'tenant');
    const before = notifSvc.notifications().length;
    service.captureSignature('tenant', 'data:image/png;base64,B', 'Ana');
    expect(notifSvc.notifications().length).toBe(before);
    expect(service.state()).toBe('tenant_signed');
    expect(service.tenantSignature()?.signerName).toBe('Ana');
  });

  // ─── advanceToTenant ────────────────────────────────────────────────────

  it('advanceToTenant moves landlord_signed → tenant_pending', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.advanceToTenant();
    expect(service.state()).toBe('tenant_pending');
  });

  it('advanceToTenant is a noop when not in landlord_signed', () => {
    service.startFlow('lease-001');
    service.advanceToTenant();
    expect(service.state()).toBe('landlord_pending');
  });

  it('advanceToTenant is a noop when no flow is active', () => {
    service.advanceToTenant();
    expect(service.flow()).toBeNull();
  });

  // ─── Completion ──────────────────────────────────────────────────────────

  it('both signatures captured → state becomes completed with timestamp', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.advanceToTenant();
    service.captureSignature('tenant', 'data:image/png;base64,B', 'Ana');
    expect(service.state()).toBe('completed');
    expect(service.isCompleted()).toBe(true);
    expect(service.flow()?.completedAt).toBeTruthy();
  });

  it('completion marks lease as active via LeaseAgreementService', () => {
    service.startFlow('lease-002');
    expect(leaseSvc.getById('lease-002')?.status).toBe('draft');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.captureSignature('tenant', 'data:image/png;base64,B', 'Ana');
    const lease = leaseSvc.getById('lease-002');
    expect(lease?.signedByLandlord).toBe(true);
    expect(lease?.signedByTenant).toBe(true);
    expect(lease?.status).toBe('active');
  });

  it('completion pushes a final "signed by both" notification', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    const after1 = notifSvc.notifications().length;
    service.captureSignature('tenant', 'data:image/png;base64,B', 'Ana');
    expect(notifSvc.notifications().length).toBe(after1 + 1);
    const latest = notifSvc.notifications()[0];
    expect(latest.category).toBe('alert');
    expect(latest.title).toContain('Ambas as Partes');
  });

  // ─── resetFlow ──────────────────────────────────────────────────────────

  it('resetFlow clears all state back to idle', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.resetFlow();
    expect(service.flow()).toBeNull();
    expect(service.state()).toBe('idle');
    expect(service.isActive()).toBe(false);
    expect(service.landlordSignature()).toBeNull();
  });

  it('resetFlow after completion still returns to idle', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    service.captureSignature('tenant', 'data:image/png;base64,B', 'Ana');
    expect(service.isCompleted()).toBe(true);
    service.resetFlow();
    expect(service.state()).toBe('idle');
    expect(service.isCompleted()).toBe(false);
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────

  it('captureSignature is idempotent role-wise (re-signing landlord re-emits push)', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    const after1 = notifSvc.notifications().length;
    service.captureSignature('landlord', 'data:image/png;base64,AA', 'João');
    expect(notifSvc.notifications().length).toBe(after1 + 1);
    expect(service.landlordSignature()?.dataUrl).toBe('data:image/png;base64,AA');
  });

  it('signedAt is a valid ISO 8601 string', () => {
    service.startFlow('lease-001');
    service.captureSignature('landlord', 'data:image/png;base64,A', 'João');
    const signedAt = service.landlordSignature()!.signedAt;
    expect(new Date(signedAt).toISOString()).toBe(signedAt);
  });
});
