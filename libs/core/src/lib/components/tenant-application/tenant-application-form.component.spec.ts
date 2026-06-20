import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantApplicationFormComponent } from './tenant-application-form.component';
import { TenantApplicationService, TenantApplication } from '../../services/tenant-application.service';

describe('TenantApplicationFormComponent', () => {
  let fixture: ComponentFixture<TenantApplicationFormComponent>;
  let component: TenantApplicationFormComponent;
  let service: TenantApplicationService;

  const setInputs = (): void => {
    fixture.componentRef.setInput('tenantId', 'tenant-001');
    fixture.componentRef.setInput('tenantName', 'Ana Ferreira');
    fixture.componentRef.setInput('tenantEmail', 'ana@email.pt');
    fixture.componentRef.setInput('propertyId', 'p1');
    fixture.componentRef.setInput('propertyTitle', 'T2 no Chiado');
    fixture.componentRef.setInput('landlordId', 'landlord-001');
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantApplicationFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantApplicationFormComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TenantApplicationService);
    setInputs();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on the first (personal) step', () => {
    expect(component.currentStepIndex()).toBe(0);
    expect(component.currentStep()).toBe('personal');
  });

  // ── Step navigation ─────────────────────────────────────────────────────────

  it('should advance and rewind through steps within bounds', () => {
    component.nextStep();
    expect(component.currentStep()).toBe('employment');
    component.prevStep();
    expect(component.currentStep()).toBe('personal');
  });

  it('should not rewind before the first step', () => {
    component.prevStep();
    expect(component.currentStepIndex()).toBe(0);
  });

  it('should not advance past the last step', () => {
    for (let i = 0; i < 10; i++) component.nextStep();
    expect(component.currentStepIndex()).toBe(component.steps.length - 1);
    expect(component.currentStep()).toBe('review');
  });

  it('should mark earlier steps as done relative to the current index', () => {
    component.nextStep(); // now on 'employment'
    expect(component.isStepDone('personal')).toBe(true);
    expect(component.isStepDone('employment')).toBe(false);
    expect(component.isStepDone('review')).toBe(false);
  });

  // ── References (capped at 3) ────────────────────────────────────────────────

  it('should add, update and remove references', () => {
    component.addRef();
    expect(component.refs().length).toBe(1);
    const id = component.refs()[0].id;

    component.updateRef(id, 'name', 'António Lopes');
    expect(component.refs()[0].name).toBe('António Lopes');

    component.removeRef(id);
    expect(component.refs().length).toBe(0);
  });

  it('should cap references at three', () => {
    component.addRef();
    component.addRef();
    component.addRef();
    component.addRef(); // ignored
    expect(component.refs().length).toBe(3);
  });

  // ── employmentLabel helper ──────────────────────────────────────────────────

  it('should resolve employment labels and fall back to the raw value', () => {
    expect(component.employmentLabel('employed')).toBe('Trabalhador(a)');
    expect(component.employmentLabel('student')).toBe('Estudante');
    expect(component.employmentLabel('alien')).toBe('alien');
  });

  // ── Form validation gating ──────────────────────────────────────────────────

  it('should be invalid until required fields are filled', () => {
    expect(component.form.valid()).toBe(false);

    component.form.fields.phone.setValue('912345678');
    component.form.fields.nif.setValue('123456789');
    component.form.fields.nationality.setValue('Portuguesa');
    component.form.fields.monthlyIncome.setValue('2000');
    component.form.fields.occupation.setValue('Engenheira');
    component.form.fields.coverLetter.setValue(
      'Somos um casal responsável à procura de estabilidade a longo prazo.',
    );

    expect(component.form.valid()).toBe(true);
  });

  it('should reject a malformed NIF via the pattern validator', () => {
    component.form.fields.nif.setValue('12'); // not 9 digits
    expect(component.form.fields.nif.invalid()).toBe(true);
  });

  // ── Submit flow (async) ─────────────────────────────────────────────────────

  it('should submit through the service and surface the success state', () => {
    jest.useFakeTimers();
    try {
      const before = service.applications().length;
      let emitted: TenantApplication | undefined;
      component.submitted.subscribe((a) => (emitted = a));

      component.form.fields.phone.setValue('912345678');
      component.form.fields.nif.setValue('123456789');
      component.form.fields.monthlyIncome.setValue('2000');

      component.onSubmit();
      expect(component.saving()).toBe(true);

      jest.advanceTimersByTime(600);

      expect(component.saving()).toBe(false);
      expect(component.submittedSuccess()).toBe(true);
      expect(service.applications().length).toBe(before + 1);
      expect(emitted).toBeTruthy();
      expect(emitted!.status).toBe('submitted');
      expect(emitted!.monthlyIncome).toBe(2000);
      expect(emitted!.tenantName).toBe('Ana Ferreira');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should carry the entered references into the submitted application', () => {
    jest.useFakeTimers();
    try {
      component.addRef();
      const id = component.refs()[0].id;
      component.updateRef(id, 'name', 'Maria');

      let emitted: TenantApplication | undefined;
      component.submitted.subscribe((a) => (emitted = a));

      component.onSubmit();
      jest.advanceTimersByTime(600);

      expect(emitted!.references.length).toBe(1);
      expect(emitted!.references[0].name).toBe('Maria');
    } finally {
      jest.useRealTimers();
    }
  });
});
