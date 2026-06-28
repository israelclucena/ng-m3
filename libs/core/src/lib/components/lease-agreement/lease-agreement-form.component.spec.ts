import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaseAgreementFormComponent } from './lease-agreement-form.component';
import { LeaseAgreement } from '../../services/lease-agreement.service';

describe('LeaseAgreementFormComponent', () => {
  let fixture: ComponentFixture<LeaseAgreementFormComponent>;
  let component: LeaseAgreementFormComponent;

  /** Set all the required inputs so the component can render. */
  function setInputs(): void {
    fixture.componentRef.setInput('landlordId', 'landlord-001');
    fixture.componentRef.setInput('landlordName', 'Carlos Mendes');
    fixture.componentRef.setInput('propertyId', 'p1');
    fixture.componentRef.setInput('propertyTitle', 'Apartamento T2 no Chiado');
    fixture.componentRef.setInput('propertyAddress', 'Rua Garrett 42, Lisboa');
    fixture.componentRef.setInput('tenantId', 'tenant-001');
    fixture.componentRef.setInput('tenantName', 'Ana Ferreira');
  }

  /** Fill the form with values that pass every validator. */
  function fillValid(): void {
    component.form.fields.leaseType.setValue('fixed');
    component.form.fields.startDate.setValue('2026-07-01');
    component.form.fields.endDate.setValue('2027-07-01');
    component.form.fields.monthlyRent.setValue('1200');
    component.form.fields.depositAmount.setValue('2400');
    component.form.fields.terms.setValue('x'.repeat(60));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaseAgreementFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaseAgreementFormComponent);
    component = fixture.componentInstance;
    setInputs();
    fixture.detectChanges();
  });

  // ── defaults ────────────────────────────────────────────────────────────────

  it('starts invalid with the default lease type and not saving', () => {
    expect(component.form.valid()).toBe(false);
    expect(component.form.fields.leaseType.value()).toBe('fixed');
    expect(component.saving()).toBe(false);
    expect(component.submittedSuccess()).toBe(false);
    expect(component.leaseTypeOptions.length).toBe(3);
  });

  // ── validation ────────────────────────────────────────────────────────────────

  it('becomes valid once all required fields are filled', () => {
    fillValid();
    expect(component.form.valid()).toBe(true);
  });

  it('rejects terms shorter than 50 characters', () => {
    fillValid();
    component.form.fields.terms.setValue('too short');
    expect(component.form.fields.terms.invalid()).toBe(true);
    expect(component.form.valid()).toBe(false);
  });

  it('flags missing dates as required', () => {
    fillValid();
    component.form.fields.startDate.setValue('');
    expect(component.form.fields.startDate.invalid()).toBe(true);
    expect(component.form.fields.startDate.firstError()).toContain('início');
  });

  // ── submit guards ──────────────────────────────────────────────────────────────

  it('does not submit an invalid form', () => {
    let emitted = 0;
    component.submitted.subscribe(() => emitted++);
    component.onSubmit({ preventDefault() {} } as unknown as Event);
    expect(component.saving()).toBe(false);
    expect(emitted).toBe(0);
  });

  // ── submit success (async) ───────────────────────────────────────────────────

  it('creates the lease and emits after the async delay', () => {
    jest.useFakeTimers();
    try {
      fillValid();
      let created: LeaseAgreement | undefined;
      component.submitted.subscribe((l) => (created = l));

      component.onSubmit({ preventDefault() {} } as unknown as Event);
      expect(component.saving()).toBe(true);

      jest.advanceTimersByTime(500);

      expect(component.saving()).toBe(false);
      expect(component.submittedSuccess()).toBe(true);
      expect(created).toBeDefined();
      expect(created!.monthlyRent).toBe(1200);
      expect(created!.depositAmount).toBe(2400);
      expect(created!.leaseType).toBe('fixed');
      expect(created!.tenantName).toBe('Ana Ferreira');
    } finally {
      jest.useRealTimers();
    }
  });

  // ── labels + outputs ─────────────────────────────────────────────────────────

  it('getLeaseTypeLabel maps known types and echoes unknown ones', () => {
    expect(component.getLeaseTypeLabel('fixed')).toBe('Prazo Fixo');
    expect(component.getLeaseTypeLabel('month-to-month')).toBe('Renovação Mensal');
    expect(component.getLeaseTypeLabel('mystery')).toBe('mystery');
  });

  it('cancelled output fires when the user cancels', () => {
    let cancelled = 0;
    component.cancelled.subscribe(() => cancelled++);
    component.cancelled.emit();
    expect(cancelled).toBe(1);
  });
});
