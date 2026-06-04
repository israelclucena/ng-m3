jest.mock('@material/web/progress/linear-progress.js', () => ({}));
jest.mock('@material/web/progress/circular-progress.js', () => ({}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressComponent } from './progress.component';

type MdProgressEl = HTMLElement & {
  value?: number;
  indeterminate?: boolean;
  fourColor?: boolean;
};

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<ProgressComponent>;
  let component: ProgressComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgressComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.type()).toBe('linear');
    expect(component.value()).toBe(0);
    expect(component.indeterminate()).toBe(false);
    expect(component.fourColor()).toBe(false);
    expect(component.ariaLabel()).toBe('');
  });

  it('renders md-linear-progress by default (type="linear")', () => {
    const linear = fixture.nativeElement.querySelector('md-linear-progress');
    const circular = fixture.nativeElement.querySelector('md-circular-progress');
    expect(linear).toBeTruthy();
    expect(circular).toBeNull();
  });

  it('switches to md-circular-progress when type="circular"', () => {
    fixture.componentRef.setInput('type', 'circular');
    fixture.detectChanges();
    const linear = fixture.nativeElement.querySelector('md-linear-progress');
    const circular = fixture.nativeElement.querySelector('md-circular-progress');
    expect(circular).toBeTruthy();
    expect(linear).toBeNull();
  });

  it('hostClass defaults to "iu-progress iu-progress--linear"', () => {
    expect(component.hostClass()).toBe('iu-progress iu-progress--linear');
  });

  it('hostClass reflects type="circular"', () => {
    fixture.componentRef.setInput('type', 'circular');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-progress iu-progress--circular');
  });

  it('hostClass includes "iu-progress--indeterminate" when indeterminate=true', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-progress--indeterminate');
  });

  it('hostClass includes "iu-progress--four-color" when fourColor=true', () => {
    fixture.componentRef.setInput('fourColor', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-progress--four-color');
  });

  it('hostClass combines indeterminate and four-color modifiers', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.componentRef.setInput('fourColor', true);
    fixture.detectChanges();
    const cls = component.hostClass();
    expect(cls).toContain('iu-progress--indeterminate');
    expect(cls).toContain('iu-progress--four-color');
  });

  it('binds value, indeterminate, fourColor to md-linear-progress', () => {
    fixture.componentRef.setInput('value', 0.42);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.componentRef.setInput('fourColor', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-linear-progress') as MdProgressEl;
    expect(el.value).toBe(0.42);
    expect(el.indeterminate).toBe(true);
    expect(el.fourColor).toBe(true);
  });

  it('binds value, indeterminate, fourColor to md-circular-progress', () => {
    fixture.componentRef.setInput('type', 'circular');
    fixture.componentRef.setInput('value', 0.75);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.componentRef.setInput('fourColor', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-circular-progress') as MdProgressEl;
    expect(el.value).toBe(0.75);
    expect(el.indeterminate).toBe(true);
    expect(el.fourColor).toBe(true);
  });

  it('applies hostClass to md-linear-progress class attribute', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-linear-progress') as HTMLElement;
    expect(el.className).toContain('iu-progress');
    expect(el.className).toContain('iu-progress--linear');
    expect(el.className).toContain('iu-progress--indeterminate');
  });

  it('does not set aria-label attribute when ariaLabel() is empty', () => {
    const el = fixture.nativeElement.querySelector('md-linear-progress') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('sets aria-label attribute when ariaLabel() is non-empty', () => {
    fixture.componentRef.setInput('ariaLabel', 'Loading progress');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-linear-progress') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Loading progress');
  });

  it('sets aria-label attribute on md-circular-progress when type="circular"', () => {
    fixture.componentRef.setInput('type', 'circular');
    fixture.componentRef.setInput('ariaLabel', 'Spinner');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-circular-progress') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Spinner');
  });
});
