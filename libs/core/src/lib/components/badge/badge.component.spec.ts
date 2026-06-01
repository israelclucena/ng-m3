import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to large variant, visible, and undefined value', () => {
    expect(component.variant()).toBe('large');
    expect(component.visible()).toBe(true);
    expect(component.value()).toBeUndefined();
  });

  it('should compose hostClass based on variant', () => {
    expect(component.hostClass()).toBe('iu-badge iu-badge--large');

    fixture.componentRef.setInput('variant', 'small');
    fixture.detectChanges();

    expect(component.hostClass()).toBe('iu-badge iu-badge--small');
  });

  it('should include hidden class when visible is false', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    expect(component.hostClass()).toContain('iu-badge--hidden');
  });

  it('should return empty displayValue for small variant regardless of value', () => {
    fixture.componentRef.setInput('variant', 'small');
    fixture.componentRef.setInput('value', 5);
    fixture.detectChanges();

    expect(component.displayValue()).toBe('');
  });

  it('should return empty displayValue when value is undefined', () => {
    expect(component.displayValue()).toBe('');
  });

  it('should display numeric value as string for large variant', () => {
    fixture.componentRef.setInput('value', 12);
    fixture.detectChanges();

    expect(component.displayValue()).toBe('12');
  });

  it('should cap numeric values greater than 999 to "999+"', () => {
    fixture.componentRef.setInput('value', 1500);
    fixture.detectChanges();

    expect(component.displayValue()).toBe('999+');
  });

  it('should display string values as-is', () => {
    fixture.componentRef.setInput('value', 'new');
    fixture.detectChanges();

    expect(component.displayValue()).toBe('new');
  });

  it('should render displayValue inside the span', () => {
    fixture.componentRef.setInput('value', 7);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span.iu-badge');
    expect(span).toBeTruthy();
    expect(span.textContent.trim()).toBe('7');
  });

  it('should set aria-label based on whether displayValue is present', () => {
    let span = fixture.nativeElement.querySelector('span.iu-badge');
    expect(span.getAttribute('aria-label')).toBe('notification');

    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();

    span = fixture.nativeElement.querySelector('span.iu-badge');
    expect(span.getAttribute('aria-label')).toBe('3 notifications');
  });
});
