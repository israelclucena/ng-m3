import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorPickerComponent', () => {
  let fixture: ComponentFixture<ColorPickerComponent>;
  let component: ColorPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ColorPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(ColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render label and default hex in the trigger', () => {
    fixture.componentRef.setInput('label', 'Brand color');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.iu-color-picker__label');
    const hex = fixture.nativeElement.querySelector('.iu-color-picker__hex');
    expect(label?.textContent?.trim()).toBe('Brand color');
    expect(hex?.textContent?.trim()).toBe('#6750a4');
  });

  it('should toggle open state and render the panel', () => {
    expect(component.open()).toBe(false);
    expect(fixture.nativeElement.querySelector('.iu-color-picker__panel')).toBeNull();

    const trigger = fixture.nativeElement.querySelector('.iu-color-picker__trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    expect(component.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('.iu-color-picker__panel')).not.toBeNull();
  });

  it('should compute rgb from the current hex', () => {
    expect(component.rgb()).toEqual({ r: 103, g: 80, b: 164 });
  });

  it('should select a palette color and update hex/rgb', () => {
    component.toggle();
    fixture.detectChanges();

    component.selectPaletteColor('#ffffff');
    fixture.detectChanges();

    expect(component.currentHex()).toBe('#ffffff');
    expect(component.rgb()).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('should update hex on RGB channel input', () => {
    const evt = { target: { value: '0' } } as unknown as Event;
    component.onRgbInput('r', evt);
    component.onRgbInput('g', evt);
    component.onRgbInput('b', evt);
    expect(component.currentHex()).toBe('#000000');
  });

  it('should clamp opacity between 0 and 100', () => {
    component.onOpacityInput({ target: { value: '150' } } as unknown as Event);
    expect(component.opacity()).toBe(100);
    component.onOpacityInput({ target: { value: '-5' } } as unknown as Event);
    expect(component.opacity()).toBe(0);
    component.onOpacityInput({ target: { value: '42' } } as unknown as Event);
    expect(component.opacity()).toBe(42);
  });

  it('should expose previewColor as rgba when opacity < 100', () => {
    expect(component.previewColor()).toBe('#6750a4');
    component.onOpacityInput({ target: { value: '50' } } as unknown as Event);
    expect(component.previewColor()).toBe('rgba(103,80,164,0.50)');
  });

  it('should normalize 3-char hex on blur', () => {
    component.hexInput.set('#abc');
    component.onHexBlur();
    expect(component.hexInput()).toBe('#aabbcc');
  });

  it('should emit colorChange and colorChangeRgba on confirm and close panel', () => {
    const hexSpy = jest.fn();
    const rgbaSpy = jest.fn();
    component.colorChange.subscribe(hexSpy);
    component.colorChangeRgba.subscribe(rgbaSpy);

    component.toggle();
    component.selectPaletteColor('#000000');
    component.onOpacityInput({ target: { value: '75' } } as unknown as Event);
    component.confirm();

    expect(hexSpy).toHaveBeenCalledWith('#000000');
    expect(rgbaSpy).toHaveBeenCalledWith('rgba(0,0,0,0.75)');
    expect(component.open()).toBe(false);
  });

  it('should hide opacity row when showOpacity is false', () => {
    fixture.componentRef.setInput('showOpacity', false);
    component.toggle();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-color-picker__opacity-row')).toBeNull();
  });
});
