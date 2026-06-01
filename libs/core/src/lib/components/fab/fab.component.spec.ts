import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FabComponent } from './fab.component';

describe('FabComponent', () => {
  let fixture: ComponentFixture<FabComponent>;
  let component: FabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FabComponent] }).compileComponents();
    fixture = TestBed.createComponent(FabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to medium size + surface variant in hostClass', () => {
    expect(component.hostClass()).toBe('iu-fab iu-fab--medium iu-fab--surface');
  });

  it('should reflect size and variant inputs in hostClass', () => {
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('variant', 'primary');
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-fab iu-fab--large iu-fab--primary');
  });

  it('should append iu-fab--lowered when lowered is true', () => {
    fixture.componentRef.setInput('lowered', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-fab--lowered');
  });

  it('should append iu-fab--extended when label is provided', () => {
    fixture.componentRef.setInput('label', 'Compose');
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-fab--extended');
  });

  it('should NOT append iu-fab--extended when label is empty', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    expect(component.hostClass()).not.toContain('iu-fab--extended');
  });

  it('should render the icon name inside md-icon slot', () => {
    fixture.componentRef.setInput('icon', 'edit');
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('md-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('edit');
  });

  it('should emit clicked output when onClick is invoked', () => {
    const events: MouseEvent[] = [];
    component.clicked.subscribe((e) => events.push(e));
    const evt = new MouseEvent('click');
    component.onClick(evt);
    expect(events.length).toBe(1);
    expect(events[0]).toBe(evt);
  });

  it('should set aria-label attribute on md-fab when ariaLabel is provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Add new item');
    fixture.detectChanges();
    const fab = fixture.nativeElement.querySelector('md-fab');
    expect(fab.getAttribute('aria-label')).toBe('Add new item');
  });

  it('should omit aria-label attribute when ariaLabel is empty', () => {
    fixture.componentRef.setInput('ariaLabel', '');
    fixture.detectChanges();
    const fab = fixture.nativeElement.querySelector('md-fab');
    expect(fab.getAttribute('aria-label')).toBeNull();
  });
});
