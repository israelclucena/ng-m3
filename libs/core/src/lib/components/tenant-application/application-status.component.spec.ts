import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationStatusComponent } from './application-status.component';
import {
  TenantApplicationService,
  CreateApplicationPayload,
} from '../../services/tenant-application.service';

/** A minimal valid create payload for a landlord-001 application. */
function payload(over: Partial<CreateApplicationPayload> = {}): CreateApplicationPayload {
  return {
    tenantId: 'tenant-009',
    tenantName: 'Carlos Mendes',
    tenantEmail: 'carlos@email.pt',
    tenantPhone: '+351 911 111 111',
    landlordId: 'landlord-001',
    propertyId: 'p1',
    propertyTitle: 'T2 no Chiado',
    employmentType: 'employed',
    monthlyIncome: 2400,
    nif: '987654321',
    nationality: 'Portuguesa',
    occupation: 'Designer',
    numOccupants: 1,
    hasPets: false,
    coverLetter: 'Candidato responsável à procura de estabilidade.',
    references: [],
    ...over,
  };
}

describe('ApplicationStatusComponent', () => {
  let fixture: ComponentFixture<ApplicationStatusComponent>;
  let component: ApplicationStatusComponent;
  let service: TenantApplicationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationStatusComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TenantApplicationService);
    fixture.componentRef.setInput('landlordId', 'landlord-001');

    // ngOnInit → loadForLandlord uses a 300ms timer; settle it deterministically.
    jest.useFakeTimers();
    fixture.detectChanges();
    jest.advanceTimersByTime(300);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the landlord applications on init', () => {
    expect(service.loading()).toBe(false);
    expect(service.applications().every((a) => a.landlordId === 'landlord-001')).toBe(true);
    expect(service.applications().length).toBeGreaterThan(0);
  });

  // ── Filtering ────────────────────────────────────────────────────────────────

  it('should show every application under the "all" filter', () => {
    component.activeFilter.set('all');
    expect(component.filtered().length).toBe(service.applications().length);
  });

  it('should narrow the list to the active status filter', () => {
    component.activeFilter.set('approved');
    expect(component.filtered().every((a) => a.status === 'approved')).toBe(true);

    component.activeFilter.set('rejected');
    expect(component.filtered().length).toBe(
      service.applications().filter((a) => a.status === 'rejected').length,
    );
  });

  it('should count applications by status', () => {
    expect(component.countByStatus('all')).toBe(service.applications().length);
    expect(component.countByStatus('approved')).toBe(
      service.applications().filter((a) => a.status === 'approved').length,
    );
  });

  // ── Expand / collapse ────────────────────────────────────────────────────────

  it('should toggle a card open and closed', () => {
    component.toggle('app-001');
    expect(component.expandedId()).toBe('app-001');
    component.toggle('app-001');
    expect(component.expandedId()).toBeNull();
  });

  // ── Pure label helpers ───────────────────────────────────────────────────────

  it('should map every status to a Portuguese label', () => {
    expect(component.statusLabel('submitted')).toBe('Submetida');
    expect(component.statusLabel('under-review')).toBe('Em Análise');
    expect(component.statusLabel('approved')).toBe('Aprovada');
    expect(component.statusLabel('rejected')).toBe('Recusada');
  });

  it('should map employment types and fall back to the raw value', () => {
    expect(component.employmentLabel('employed')).toBe('Trabalhador(a)');
    expect(component.employmentLabel('retired')).toBe('Reformado(a)');
    expect(component.employmentLabel('astronaut')).toBe('astronaut');
  });

  it('should map reference relationships and fall back to the raw value', () => {
    expect(component.refRelLabel('landlord')).toBe('Senhorio anterior');
    expect(component.refRelLabel('mystery')).toBe('mystery');
  });

  it('should build uppercase initials from a name', () => {
    expect(component.initials('Carlos Mendes')).toBe('CM');
  });

  it('should compute the income-to-rent ratio percentage', () => {
    // 3600 income → 100% of the 1200€ × 3 benchmark.
    expect(component.ratioPercent(3600)).toBe(100);
    expect(component.ratioPercent(1800)).toBe(50);
  });

  it('should format a date and dash out a missing one', () => {
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate('2026-03-15T09:00:00Z')).toContain('2026');
  });

  // ── Landlord actions ─────────────────────────────────────────────────────────

  it('should approve an application and emit its id', () => {
    const created = service.submit(payload());
    component.expandedId.set(created.id);

    let emitted: string | undefined;
    component.approved.subscribe((id) => (emitted = id));

    component.approveApp(created.id);

    expect(emitted).toBe(created.id);
    expect(service.getById(created.id)!.status).toBe('approved');
    expect(component.expandedId()).toBeNull();
  });

  it('should reject an application with a reason and emit its id', () => {
    const created = service.submit(payload());
    component.rejectingId.set(created.id);
    component.rejectReason.set('Rendimento insuficiente');

    let emitted: string | undefined;
    component.rejected.subscribe((id) => (emitted = id));

    component.confirmReject(created.id);

    expect(emitted).toBe(created.id);
    const after = service.getById(created.id)!;
    expect(after.status).toBe('rejected');
    expect(after.rejectionReason).toBe('Rendimento insuficiente');
    expect(component.rejectingId()).toBeNull();
    expect(component.expandedId()).toBeNull();
  });

  it('should move a submitted application under review', () => {
    const created = service.submit(payload());
    component.markReview(created.id);
    expect(service.getById(created.id)!.status).toBe('under-review');
  });
});
