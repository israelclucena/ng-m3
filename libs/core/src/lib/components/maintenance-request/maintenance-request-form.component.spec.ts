import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaintenanceRequestFormComponent } from './maintenance-request-form.component';
import { MaintenanceRequestService, MaintenanceRequest } from '../../services/maintenance-request.service';

describe('MaintenanceRequestFormComponent', () => {
  let fixture: ComponentFixture<MaintenanceRequestFormComponent>;
  let component: MaintenanceRequestFormComponent;
  let service: MaintenanceRequestService;

  const setInputs = (): void => {
    fixture.componentRef.setInput('tenantId', 'tenant-001');
    fixture.componentRef.setInput('tenantName', 'Ana Ferreira');
    fixture.componentRef.setInput('landlordId', 'landlord-001');
    fixture.componentRef.setInput('propertyId', 'p1');
    fixture.componentRef.setInput('propertyTitle', 'T2 no Chiado');
  };

  /** Fill all fields with valid values so form.valid() === true. */
  const fillValid = (): void => {
    component.form.fields.category.setValue('plumbing');
    component.form.fields.priority.setValue('high');
    component.form.fields.title.setValue('Fuga de água');
    component.form.fields.description.setValue('A torneira do chuveiro pinga constantemente há dias.');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceRequestFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceRequestFormComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MaintenanceRequestService);
    setInputs();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty, invalid form', () => {
    expect(component.form.valid()).toBe(false);
    expect(component.submitting()).toBe(false);
    expect(component.submitted$()).toBe(false);
  });

  // ── Validation gating ────────────────────────────────────────────────────────

  it('should require all four fields to become valid', () => {
    fillValid();
    expect(component.form.valid()).toBe(true);
  });

  it('should reject a title shorter than five characters', () => {
    component.form.fields.title.setValue('abc');
    expect(component.form.fields.title.invalid()).toBe(true);
  });

  it('should reject a description shorter than twenty characters', () => {
    component.form.fields.description.setValue('curto');
    expect(component.form.fields.description.invalid()).toBe(true);
  });

  it('should reject an empty required category', () => {
    component.form.fields.category.setValue('');
    expect(component.form.fields.category.invalid()).toBe(true);
  });

  // ── Submit gating ────────────────────────────────────────────────────────────

  it('should not submit while the form is invalid', () => {
    const before = service.requests().length;
    component.onSubmit(new Event('submit'));
    expect(component.submitting()).toBe(false);
    expect(service.requests().length).toBe(before);
  });

  // ── Submit flow (async) ──────────────────────────────────────────────────────

  it('should create the request through the service and surface success', () => {
    jest.useFakeTimers();
    try {
      const before = service.requests().length;
      let emitted: MaintenanceRequest | undefined;
      component.submitted.subscribe((r) => (emitted = r));

      fillValid();
      component.onSubmit(new Event('submit'));
      expect(component.submitting()).toBe(true);

      jest.advanceTimersByTime(500);

      expect(component.submitting()).toBe(false);
      expect(component.submitted$()).toBe(true);
      expect(service.requests().length).toBe(before + 1);
      expect(emitted).toBeTruthy();
      expect(emitted!.status).toBe('pending');
      expect(emitted!.category).toBe('plumbing');
      expect(emitted!.priority).toBe('high');
      expect(emitted!.tenantName).toBe('Ana Ferreira');
      expect(emitted!.propertyId).toBe('p1');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should prevent the default form submission event', () => {
    const event = new Event('submit');
    const spy = jest.spyOn(event, 'preventDefault');
    component.onSubmit(event);
    expect(spy).toHaveBeenCalled();
  });

  // ── Reset ────────────────────────────────────────────────────────────────────

  it('should clear the success state on reset', () => {
    component.submitted$.set(true);
    component.submitting.set(true);
    component.resetForm();
    expect(component.submitted$()).toBe(false);
    expect(component.submitting()).toBe(false);
  });
});
