import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaseSigningFlowComponent } from './lease-signing-flow.component';
import { SignatureStateService } from '../../services/signature-state.service';
import { LeaseAgreementService } from '../../services/lease-agreement.service';

const DATA_URL = 'data:image/png;base64,AAAA';

describe('LeaseSigningFlowComponent', () => {
  let fixture: ComponentFixture<LeaseSigningFlowComponent>;
  let component: LeaseSigningFlowComponent;
  let sig: SignatureStateService;
  let leaseSvc: LeaseAgreementService;

  /** Create the fixture with the three required inputs set. */
  function create(role: 'landlord' | 'tenant', leaseId = 'lease-002'): void {
    fixture = TestBed.createComponent(LeaseSigningFlowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('leaseId', leaseId);
    fixture.componentRef.setInput('currentRole', role);
    fixture.componentRef.setInput('currentUserName', 'João Costa');
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseSigningFlowComponent],
    }).compileComponents();

    sig = TestBed.inject(SignatureStateService);
    leaseSvc = TestBed.inject(LeaseAgreementService);
    // Each service is providedIn:root → fresh per test, but reset defensively.
    sig.resetFlow();
  });

  // ── lease resolution ──────────────────────────────────────────────────────

  it('resolves the lease for the given id', () => {
    create('landlord', 'lease-001');
    expect(component.lease()?.id).toBe('lease-001');
    expect(component.lease()?.propertyTitle).toBe('Apartamento T2 no Chiado');
  });

  it('lease() is undefined for an unknown id', () => {
    create('landlord', 'does-not-exist');
    expect(component.lease()).toBeUndefined();
  });

  // ── initial idle state ─────────────────────────────────────────────────────

  it('starts in the idle state with no steps done', () => {
    create('landlord');
    expect(sig.state()).toBe('idle');
    expect(component.landlordDone()).toBe(false);
    expect(component.tenantDone()).toBe(false);
    expect(component.isLandlordStep()).toBe(false);
    expect(component.isTenantStep()).toBe(false);
  });

  // ── state machine ───────────────────────────────────────────────────────────

  it('startFlow puts the flow in landlord_pending', () => {
    create('landlord');
    component.startFlow();
    expect(sig.state()).toBe('landlord_pending');
    expect(component.isLandlordStep()).toBe(true);
  });

  it('onLandlordSigned captures the signature and advances to landlord_signed', () => {
    create('landlord');
    component.startFlow();
    component.onLandlordSigned(DATA_URL);

    expect(sig.state()).toBe('landlord_signed');
    expect(component.landlordDone()).toBe(true);
    const captured = sig.landlordSignature();
    expect(captured?.dataUrl).toBe(DATA_URL);
    expect(captured?.signerName).toBe('João Costa');
  });

  it('advanceToTenant moves landlord_signed → tenant_pending', () => {
    create('landlord');
    component.startFlow();
    component.onLandlordSigned(DATA_URL);
    sig.advanceToTenant();

    expect(sig.state()).toBe('tenant_pending');
    expect(component.isTenantStep()).toBe(true);
    expect(component.landlordDone()).toBe(true);
  });

  it('completes the flow once both parties have signed', () => {
    create('landlord');
    component.startFlow();
    component.onLandlordSigned(DATA_URL);
    sig.advanceToTenant();
    component.onTenantSigned('data:image/png;base64,BBBB');

    expect(sig.state()).toBe('completed');
    expect(sig.isCompleted()).toBe(true);
    expect(component.landlordDone()).toBe(true);
    expect(component.tenantDone()).toBe(true);
    expect(sig.tenantSignature()?.dataUrl).toBe('data:image/png;base64,BBBB');
  });

  it('marks the lease as active in LeaseAgreementService on completion', () => {
    create('landlord', 'lease-002');
    component.startFlow();
    component.onLandlordSigned(DATA_URL);
    sig.advanceToTenant();
    component.onTenantSigned(DATA_URL);

    const lease = leaseSvc.getById('lease-002');
    expect(lease?.signedByLandlord).toBe(true);
    expect(lease?.signedByTenant).toBe(true);
    expect(lease?.status).toBe('active');
  });

  // ── outputs ───────────────────────────────────────────────────────────────

  it('emitCompleted emits the lease id', () => {
    create('landlord', 'lease-002');
    let emitted: string | undefined;
    component.completed.subscribe((id) => (emitted = id));
    component.emitCompleted();
    expect(emitted).toBe('lease-002');
  });

  // ── helpers ─────────────────────────────────────────────────────────────────

  it('formatDate returns a non-empty localized string', () => {
    create('landlord');
    const out = component.formatDate('2026-04-01T09:00:00Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  // ── DOM smoke ───────────────────────────────────────────────────────────────

  it('shows the start button to the landlord while idle', () => {
    create('landlord');
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Começar a Assinar');
  });

  it('shows a waiting message to the tenant while idle', () => {
    create('tenant');
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('aguardar a assinatura do senhorio');
  });

  it('renders the completion screen once both have signed', () => {
    create('landlord', 'lease-002');
    component.startFlow();
    component.onLandlordSigned(DATA_URL);
    sig.advanceToTenant();
    component.onTenantSigned(DATA_URL);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Contrato Assinado!');
  });
});
