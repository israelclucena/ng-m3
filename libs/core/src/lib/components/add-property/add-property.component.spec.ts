import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPropertyComponent, NewPropertyForm } from './add-property.component';

describe('AddPropertyComponent', () => {
  let fixture: ComponentFixture<AddPropertyComponent>;
  let component: AddPropertyComponent;

  /** Fills the bare minimum required fields so isValid() returns true. */
  function fillRequired(): void {
    component.form.title = 'Apartamento T2 em Príncipe Real';
    component.form.type = 'apartment';
    component.form.location = 'Príncipe Real, Lisboa';
    component.form.priceMonthly = 1200;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPropertyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts on step 0 with default form values', () => {
    expect(component.currentStep()).toBe(0);
    expect(component.form.title).toBe('');
    expect(component.form.bedrooms).toBe(1);
    expect(component.form.bathrooms).toBe(1);
    expect(component.form.features).toEqual([]);
    expect(component.form.imageUrls).toEqual([]);
  });

  it('declares the 4 expected steps with the correct labels', () => {
    expect(component.steps.map((s) => s.label)).toEqual([
      'Informações',
      'Detalhes',
      'Descrição',
      'Publicar',
    ]);
  });

  it('renders one step bubble per step in the progress track', () => {
    const bubbles = fixture.nativeElement.querySelectorAll('.step-item');
    expect(bubbles.length).toBe(component.steps.length);
  });

  it('marks the current step as active in the progress track', () => {
    const firstItem = fixture.nativeElement.querySelector('.step-item');
    expect(firstItem.classList.contains('active')).toBe(true);
    component.currentStep.set(2);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.step-item');
    expect(items[0].classList.contains('done')).toBe(true);
    expect(items[1].classList.contains('done')).toBe(true);
    expect(items[2].classList.contains('active')).toBe(true);
  });

  it('renders the Basic Info section while on step 0', () => {
    const title = fixture.nativeElement.querySelector('.section-title');
    expect(title.textContent.trim()).toBe('Informações Básicas');
  });

  it('renders the Details section on step 1', () => {
    component.currentStep.set(1);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.section-title').textContent.trim(),
    ).toBe('Detalhes do Imóvel');
  });

  it('renders the Description & Media section on step 2', () => {
    component.currentStep.set(2);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.section-title').textContent.trim(),
    ).toBe('Descrição e Média');
  });

  it('renders the Review section on step 3', () => {
    component.currentStep.set(3);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.section-title').textContent.trim(),
    ).toBe('Rever e Publicar');
  });

  it('onNext() advances the step counter', () => {
    component.onNext();
    expect(component.currentStep()).toBe(1);
    component.onNext();
    expect(component.currentStep()).toBe(2);
  });

  it('onNext() never advances past the last step', () => {
    component.currentStep.set(component.steps.length - 1);
    component.onNext();
    expect(component.currentStep()).toBe(component.steps.length - 1);
  });

  it('onBack() decrements the step counter but stays >= 0', () => {
    component.currentStep.set(2);
    component.onBack();
    expect(component.currentStep()).toBe(1);
    component.onBack();
    component.onBack();
    component.onBack();
    expect(component.currentStep()).toBe(0);
  });

  it('disables the "Anterior" button on step 0', () => {
    const back = fixture.nativeElement.querySelector('.nav-btn.secondary') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
  });

  it('enables the "Anterior" button once past step 0', () => {
    component.currentStep.set(1);
    fixture.detectChanges();
    const back = fixture.nativeElement.querySelector('.nav-btn.secondary') as HTMLButtonElement;
    expect(back.disabled).toBe(false);
  });

  it('clicking the Anterior button calls onBack()', () => {
    component.currentStep.set(2);
    fixture.detectChanges();
    const back = fixture.nativeElement.querySelector('.nav-btn.secondary') as HTMLButtonElement;
    back.click();
    expect(component.currentStep()).toBe(1);
  });

  it('clicking the Seguinte button calls onNext()', () => {
    const next = fixture.nativeElement.querySelector('.nav-btn.primary') as HTMLButtonElement;
    next.click();
    expect(component.currentStep()).toBe(1);
  });

  it('shows the Publicar button instead of Seguinte on the final step', () => {
    component.currentStep.set(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.nav-btn.primary')).toBeNull();
    const submitBtn = fixture.nativeElement.querySelector('.nav-btn.success') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.textContent).toContain('Publicar');
  });

  it('isValid() returns false with default empty form', () => {
    expect(component.isValid()).toBe(false);
  });

  it('isValid() returns true once title, type, location and priceMonthly are set', () => {
    // Mutate form fields before the first isValid() read so the computed
    // captures the populated state on its initial evaluation.
    component.form.title = 'X';
    component.form.type = 'apartment';
    component.form.location = 'L';
    component.form.priceMonthly = 1000;
    expect(component.isValid()).toBe(true);
  });

  it('disables the Publicar button while the form is invalid', () => {
    component.currentStep.set(3);
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('.nav-btn.success') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it('shows a validation warning on the review step when invalid', () => {
    component.currentStep.set(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.validation-warn')).toBeTruthy();
  });

  it('hides the validation warning on the review step when valid', () => {
    fillRequired();
    component.currentStep.set(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.validation-warn')).toBeNull();
  });

  it('onSubmit() does NOT emit when the form is invalid', () => {
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    component.onSubmit();
    expect(emitted.length).toBe(0);
  });

  it('onSubmit() emits a shallow copy of the form when valid', () => {
    fillRequired();
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    component.onSubmit();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).not.toBe(component.form);
    expect(emitted[0].title).toBe('Apartamento T2 em Príncipe Real');
    expect(emitted[0].type).toBe('apartment');
    expect(emitted[0].priceMonthly).toBe(1200);
  });

  it('clicking the Publicar button emits submitted when valid', () => {
    fillRequired();
    component.currentStep.set(3);
    fixture.detectChanges();
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    const submit = fixture.nativeElement.querySelector('.nav-btn.success') as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    submit.click();
    expect(emitted.length).toBe(1);
  });

  it('clicking Cancelar emits the cancelled output', () => {
    let cancelled = false;
    component.cancelled.subscribe(() => (cancelled = true));
    const cancel = fixture.nativeElement.querySelector('.cancel-btn') as HTMLButtonElement;
    cancel.click();
    expect(cancelled).toBe(true);
  });

  it('adjust() increments bedrooms within bounds', () => {
    component.form.bedrooms = 4;
    component.adjust('bedrooms', 1);
    expect(component.form.bedrooms).toBe(5);
  });

  it('adjust() clamps bedrooms at the upper bound of 10', () => {
    component.form.bedrooms = 10;
    component.adjust('bedrooms', 1);
    expect(component.form.bedrooms).toBe(10);
  });

  it('adjust() clamps bedrooms at the lower bound of 0 (studio)', () => {
    component.form.bedrooms = 0;
    component.adjust('bedrooms', -1);
    expect(component.form.bedrooms).toBe(0);
  });

  it('adjust() clamps bathrooms at the lower bound of 1', () => {
    component.form.bathrooms = 1;
    component.adjust('bathrooms', -1);
    expect(component.form.bathrooms).toBe(1);
  });

  it('adjust() clamps bathrooms at the upper bound of 5', () => {
    component.form.bathrooms = 5;
    component.adjust('bathrooms', 1);
    expect(component.form.bathrooms).toBe(5);
  });

  it('hasFeature() reflects the features array', () => {
    expect(component.hasFeature('Varanda')).toBe(false);
    component.form.features = ['Varanda'];
    expect(component.hasFeature('Varanda')).toBe(true);
  });

  it('toggleFeature() adds a feature when missing and removes it when present', () => {
    component.toggleFeature('Garagem');
    expect(component.form.features).toEqual(['Garagem']);
    component.toggleFeature('Piscina');
    expect(component.form.features).toEqual(['Garagem', 'Piscina']);
    component.toggleFeature('Garagem');
    expect(component.form.features).toEqual(['Piscina']);
  });

  it('onImagesInput() splits a textarea value into trimmed, non-empty URLs', () => {
    const event = {
      target: { value: ' https://a.com \n\nhttps://b.com\n  ' },
    } as unknown as Event;
    component.onImagesInput(event);
    expect(component.form.imageUrls).toEqual(['https://a.com', 'https://b.com']);
  });

  it('typeLabel() maps known types to Portuguese labels', () => {
    expect(component.typeLabel('apartment')).toBe('Apartamento');
    expect(component.typeLabel('studio')).toBe('Estúdio');
    expect(component.typeLabel('house')).toBe('Moradia');
    expect(component.typeLabel('penthouse')).toBe('Penthouse');
    expect(component.typeLabel('villa')).toBe('Villa');
  });

  it('typeLabel() falls back to the input or an em-dash for unknown values', () => {
    expect(component.typeLabel('')).toBe('—');
    expect(component.typeLabel('unknown')).toBe('unknown');
  });

  it('renders the review card values from the form on step 3', () => {
    fillRequired();
    component.form.bedrooms = 2;
    component.form.bathrooms = 1;
    component.form.areaSqm = 75;
    component.currentStep.set(3);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.review-card') as HTMLElement;
    expect(card.textContent).toContain('Apartamento T2 em Príncipe Real');
    expect(card.textContent).toContain('Apartamento');
    expect(card.textContent).toContain('Príncipe Real, Lisboa');
  });

  it('renders a feature chip per featureOption on step 2', () => {
    component.currentStep.set(2);
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.feat-chip');
    expect(chips.length).toBe(component.featureOptions.length);
  });

  it('clicking a feature chip toggles it as selected', () => {
    component.currentStep.set(2);
    fixture.detectChanges();
    const firstChip = fixture.nativeElement.querySelector('.feat-chip') as HTMLElement;
    expect(firstChip.classList.contains('selected')).toBe(false);
    firstChip.click();
    fixture.detectChanges();
    expect(component.form.features.length).toBe(1);
    const refreshed = fixture.nativeElement.querySelector('.feat-chip') as HTMLElement;
    expect(refreshed.classList.contains('selected')).toBe(true);
  });
});
