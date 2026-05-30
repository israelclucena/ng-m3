import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepperComponent, type StepperStep } from './stepper.component';

describe('StepperComponent', () => {
  let fixture: ComponentFixture<StepperComponent>;
  let component: StepperComponent;

  const sampleSteps: StepperStep[] = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Review' },
    { label: 'Done' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StepperComponent] }).compileComponents();
    fixture = TestBed.createComponent(StepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('renders one .iu-stepper__step per step in steps input', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.detectChanges();
    const stepEls = fixture.nativeElement.querySelectorAll('.iu-stepper__step');
    expect(stepEls.length).toBe(sampleSteps.length);
  });

  it('step at activeStep index has .iu-stepper__step--active class', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 2);
    fixture.detectChanges();
    const stepEls = fixture.nativeElement.querySelectorAll('.iu-stepper__step');
    expect(stepEls[2].classList.contains('iu-stepper__step--active')).toBe(true);
    expect(stepEls[0].classList.contains('iu-stepper__step--active')).toBe(false);
    expect(stepEls[1].classList.contains('iu-stepper__step--active')).toBe(false);
    expect(stepEls[3].classList.contains('iu-stepper__step--active')).toBe(false);
  });

  it('steps before activeStep have .iu-stepper__step--completed', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 2);
    fixture.detectChanges();
    const stepEls = fixture.nativeElement.querySelectorAll('.iu-stepper__step');
    expect(stepEls[0].classList.contains('iu-stepper__step--completed')).toBe(true);
    expect(stepEls[1].classList.contains('iu-stepper__step--completed')).toBe(true);
    expect(stepEls[2].classList.contains('iu-stepper__step--completed')).toBe(false);
    expect(stepEls[3].classList.contains('iu-stepper__step--completed')).toBe(false);
  });

  it('isCompleted(i) returns true for i < activeStep, false otherwise', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 2);
    fixture.detectChanges();
    expect(component.isCompleted(0)).toBe(true);
    expect(component.isCompleted(1)).toBe(true);
    expect(component.isCompleted(2)).toBe(false);
    expect(component.isCompleted(3)).toBe(false);
  });

  it('isClickable in linear mode returns true for i <= activeStep, false otherwise', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 1);
    fixture.componentRef.setInput('mode', 'linear');
    fixture.detectChanges();
    expect(component.isClickable(0)).toBe(true);
    expect(component.isClickable(1)).toBe(true);
    expect(component.isClickable(2)).toBe(false);
    expect(component.isClickable(3)).toBe(false);
  });

  it('isClickable in free mode returns true for any index', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 1);
    fixture.componentRef.setInput('mode', 'free');
    fixture.detectChanges();
    expect(component.isClickable(0)).toBe(true);
    expect(component.isClickable(1)).toBe(true);
    expect(component.isClickable(2)).toBe(true);
    expect(component.isClickable(3)).toBe(true);
  });

  it('next() emits stepChange with prev+1 when not last; does not emit on last', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 1);
    fixture.detectChanges();

    const spy = jest.fn();
    component.stepChange.subscribe(spy);

    component.next();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ previousIndex: 1, currentIndex: 2 });

    spy.mockClear();
    fixture.componentRef.setInput('activeStep', sampleSteps.length - 1);
    fixture.detectChanges();
    component.next();
    expect(spy).not.toHaveBeenCalled();
  });

  it('back() emits stepChange with prev-1 when not first; does not emit at 0', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 2);
    fixture.detectChanges();

    const spy = jest.fn();
    component.stepChange.subscribe(spy);

    component.back();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ previousIndex: 2, currentIndex: 1 });

    spy.mockClear();
    fixture.componentRef.setInput('activeStep', 0);
    fixture.detectChanges();
    component.back();
    expect(spy).not.toHaveBeenCalled();
  });

  it('finish() emits finished output (no value)', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.detectChanges();

    const spy = jest.fn();
    component.finished.subscribe(spy);

    component.finish();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onStepClick emits stepChange when clickable, does not emit when not clickable', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('activeStep', 1);
    fixture.componentRef.setInput('mode', 'linear');
    fixture.detectChanges();

    const spy = jest.fn();
    component.stepChange.subscribe(spy);

    // clickable: index 0 (completed)
    component.onStepClick(0);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ previousIndex: 1, currentIndex: 0 });

    spy.mockClear();
    // not clickable: index 3 (ahead in linear)
    component.onStepClick(3);
    expect(spy).not.toHaveBeenCalled();
  });

  it('showControls=false: nav buttons not rendered', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.componentRef.setInput('showControls', false);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('.iu-stepper__nav');
    expect(nav).toBeNull();
  });

  it('showControls=true (default): nav buttons are rendered', () => {
    fixture.componentRef.setInput('steps', sampleSteps);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('.iu-stepper__nav');
    expect(nav).not.toBeNull();
  });
});
