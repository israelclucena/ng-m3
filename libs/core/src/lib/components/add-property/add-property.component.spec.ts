import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPropertyComponent, NewPropertyForm } from './add-property.component';

describe('AddPropertyComponent', () => {
  let fixture: ComponentFixture<AddPropertyComponent>;
  let component: AddPropertyComponent;

  /** Fills the bare minimum required fields so isValid() returns true. */
  function fillRequired(): void {
    component.form.fields.title.setValue('Apartamento T2 em Príncipe Real');
    component.form.fields.type.setValue('apartment');
    component.form.fields.location.setValue('Príncipe Real, Lisboa');
    component.form.fields.priceMonthly.setValue(1200);
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
    expect(component.form.fields.title.value()).toBe('');
    expect(component.bedrooms()).toBe(1);
    expect(component.bathrooms()).toBe(1);
    expect(component.features()).toEqual([]);
    expect(component.imageUrls()).toEqual([]);
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
    component.form.fields.title.setValue('X');
    component.form.fields.type.setValue('apartment');
    component.form.fields.location.setValue('L');
    component.form.fields.priceMonthly.setValue(1000);
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

  it('shows an inline error on a required field once touched while empty', () => {
    const titleField = component.form.fields.title;
    expect(titleField.showError()).toBe(false);
    titleField.touch();
    fixture.detectChanges();
    expect(titleField.showError()).toBe(true);
    const err = fixture.nativeElement.querySelector('.field-error') as HTMLElement;
    expect(err).toBeTruthy();
    expect(err.textContent).toContain('Título obrigatório');
  });

  it('onSubmit() does NOT emit when the form is invalid', () => {
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    component.onSubmit();
    expect(emitted.length).toBe(0);
  });

  it('onSubmit() marks required fields touched when invalid', () => {
    component.onSubmit();
    expect(component.form.fields.title.touched()).toBe(true);
    expect(component.form.fields.priceMonthly.touched()).toBe(true);
  });

  it('onSubmit() emits a fresh snapshot object when valid', () => {
    fillRequired();
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    component.onSubmit();
    component.onSubmit();
    expect(emitted.length).toBe(2);
    // Each emit is a distinct object (snapshot copy), not shared state.
    expect(emitted[0]).not.toBe(emitted[1]);
    expect(emitted[0].title).toBe('Apartamento T2 em Príncipe Real');
    expect(emitted[0].type).toBe('apartment');
    expect(emitted[0].priceMonthly).toBe(1200);
  });

  it('snapshot carries the interactive-signal fields (bedrooms/features/toggles)', () => {
    fillRequired();
    component.bedrooms.set(3);
    component.furnished.set(true);
    component.features.set(['Garagem']);
    const emitted: NewPropertyForm[] = [];
    component.submitted.subscribe((p) => emitted.push(p));
    component.onSubmit();
    expect(emitted[0].bedrooms).toBe(3);
    expect(emitted[0].furnished).toBe(true);
    expect(emitted[0].features).toEqual(['Garagem']);
    // features is a copy — mutating the emitted payload must not touch state.
    emitted[0].features.push('Piscina');
    expect(component.features()).toEqual(['Garagem']);
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
    component.bedrooms.set(4);
    component.adjust('bedrooms', 1);
    expect(component.bedrooms()).toBe(5);
  });

  it('adjust() clamps bedrooms at the upper bound of 10', () => {
    component.bedrooms.set(10);
    component.adjust('bedrooms', 1);
    expect(component.bedrooms()).toBe(10);
  });

  it('adjust() clamps bedrooms at the lower bound of 0 (studio)', () => {
    component.bedrooms.set(0);
    component.adjust('bedrooms', -1);
    expect(component.bedrooms()).toBe(0);
  });

  it('adjust() clamps bathrooms at the lower bound of 1', () => {
    component.bathrooms.set(1);
    component.adjust('bathrooms', -1);
    expect(component.bathrooms()).toBe(1);
  });

  it('adjust() clamps bathrooms at the upper bound of 5', () => {
    component.bathrooms.set(5);
    component.adjust('bathrooms', 1);
    expect(component.bathrooms()).toBe(5);
  });

  it('hasFeature() reflects the features signal', () => {
    expect(component.hasFeature('Varanda')).toBe(false);
    component.features.set(['Varanda']);
    expect(component.hasFeature('Varanda')).toBe(true);
  });

  it('toggleFeature() adds a feature when missing and removes it when present', () => {
    component.toggleFeature('Garagem');
    expect(component.features()).toEqual(['Garagem']);
    component.toggleFeature('Piscina');
    expect(component.features()).toEqual(['Garagem', 'Piscina']);
    component.toggleFeature('Garagem');
    expect(component.features()).toEqual(['Piscina']);
  });

  it('onImagesInput() splits a textarea value into trimmed, non-empty URLs', () => {
    const event = {
      target: { value: ' https://a.com \n\nhttps://b.com\n  ' },
    } as unknown as Event;
    component.onImagesInput(event);
    expect(component.imageUrls()).toEqual(['https://a.com', 'https://b.com']);
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
    component.bedrooms.set(2);
    component.bathrooms.set(1);
    component.form.fields.areaSqm.setValue(75);
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
    expect(component.features().length).toBe(1);
    const refreshed = fixture.nativeElement.querySelector('.feat-chip') as HTMLElement;
    expect(refreshed.classList.contains('selected')).toBe(true);
  });
});
