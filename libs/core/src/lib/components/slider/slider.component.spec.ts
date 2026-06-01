import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SliderComponent } from './slider.component';

describe('SliderComponent', () => {
  let fixture: ComponentFixture<SliderComponent>;
  let component: SliderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SliderComponent] }).compileComponents();
    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('hostClass defaults to base class only when not disabled and not range', () => {
    expect(component.hostClass()).toBe('iu-slider');
  });

  it('hostClass includes disabled modifier when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-slider iu-slider--disabled');
  });

  it('hostClass includes range modifier when range input is true', () => {
    fixture.componentRef.setInput('range', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-slider iu-slider--range');
  });

  it('hostClass composes both modifiers when disabled and range are true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('range', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-slider iu-slider--disabled iu-slider--range');
  });

  it('renders single md-slider by default (no range attribute branch)', () => {
    const el = fixture.nativeElement.querySelector('md-slider');
    expect(el).toBeTruthy();
    expect(el?.hasAttribute('range')).toBe(false);
  });

  it('renders range md-slider when range input is true', () => {
    fixture.componentRef.setInput('range', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-slider');
    expect(el).toBeTruthy();
    expect(el?.hasAttribute('range')).toBe(true);
  });

  it('applies hostClass on the md-slider element', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-slider');
    expect(el?.getAttribute('class')).toContain('iu-slider--disabled');
  });

  it('exposes default input values', () => {
    expect(component.value()).toBe(50);
    expect(component.min()).toBe(0);
    expect(component.max()).toBe(100);
    expect(component.step()).toBe(0);
    expect(component.labeled()).toBe(false);
    expect(component.disabled()).toBe(false);
    expect(component.range()).toBe(false);
    expect(component.valueStart()).toBe(0);
    expect(component.valueEnd()).toBe(100);
  });

  it('accepts updated min/max/step/value inputs', () => {
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 200);
    fixture.componentRef.setInput('step', 5);
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    expect(component.min()).toBe(10);
    expect(component.max()).toBe(200);
    expect(component.step()).toBe(5);
    expect(component.value()).toBe(75);
  });

  it('emits change with element value on native change event (single mode)', () => {
    const spy = jest.fn();
    component.change.subscribe(spy);
    const el = component.sliderRef()?.nativeElement as HTMLElement & { value: number };
    el.value = 42;
    el.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(42);
  });

  it('emits input with element value on native input event (single mode)', () => {
    const spy = jest.fn();
    component.input.subscribe(spy);
    const el = component.sliderRef()?.nativeElement as HTMLElement & { value: number };
    el.value = 33;
    el.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith(33);
  });

  // Range-mode listener binds in ngAfterViewInit. Because the template swaps
  // md-slider elements via @if (range()), `range` must be set BEFORE first
  // detectChanges — otherwise the listener stays on the (now-detached) single
  // element while sliderRef() points to the freshly rendered range element.
  it('emits change with {start,end} payload in range mode', () => {
    const f = TestBed.createComponent(SliderComponent);
    f.componentRef.setInput('range', true);
    f.detectChanges();
    const spy = jest.fn();
    f.componentInstance.change.subscribe(spy);
    const el = f.componentInstance.sliderRef()?.nativeElement as HTMLElement & {
      valueStart: number;
      valueEnd: number;
    };
    el.valueStart = 15;
    el.valueEnd = 85;
    el.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ start: 15, end: 85 });
  });

  it('emits input with {start,end} payload in range mode', () => {
    const f = TestBed.createComponent(SliderComponent);
    f.componentRef.setInput('range', true);
    f.detectChanges();
    const spy = jest.fn();
    f.componentInstance.input.subscribe(spy);
    const el = f.componentInstance.sliderRef()?.nativeElement as HTMLElement & {
      valueStart: number;
      valueEnd: number;
    };
    el.valueStart = 20;
    el.valueEnd = 70;
    el.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith({ start: 20, end: 70 });
  });
});
