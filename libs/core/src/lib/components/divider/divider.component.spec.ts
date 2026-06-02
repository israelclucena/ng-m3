import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DividerComponent } from './divider.component';

describe('DividerComponent', () => {
  let fixture: ComponentFixture<DividerComponent>;
  let component: DividerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DividerComponent] }).compileComponents();
    fixture = TestBed.createComponent(DividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should default all inset inputs to false', () => {
    expect(component.inset()).toBe(false);
    expect(component.insetStart()).toBe(false);
    expect(component.insetEnd()).toBe(false);
  });

  it('should render md-divider element', () => {
    const el = fixture.nativeElement.querySelector('md-divider');
    expect(el).toBeTruthy();
  });

  it('should have base hostClass "iu-divider" by default', () => {
    expect(component.hostClass()).toBe('iu-divider');
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement;
    expect(el.classList.contains('iu-divider')).toBe(true);
  });

  it('should reflect inset=true as property on md-divider and add modifier class', () => {
    fixture.componentRef.setInput('inset', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement & { inset?: boolean };
    expect(el.inset).toBe(true);
    expect(component.hostClass()).toContain('iu-divider--inset');
    expect(el.classList.contains('iu-divider--inset')).toBe(true);
  });

  it('should reflect insetStart=true as property on md-divider and add modifier class', () => {
    fixture.componentRef.setInput('insetStart', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement & { insetStart?: boolean };
    expect(el.insetStart).toBe(true);
    expect(component.hostClass()).toContain('iu-divider--inset-start');
    expect(el.classList.contains('iu-divider--inset-start')).toBe(true);
  });

  it('should reflect insetEnd=true as property on md-divider and add modifier class', () => {
    fixture.componentRef.setInput('insetEnd', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement & { insetEnd?: boolean };
    expect(el.insetEnd).toBe(true);
    expect(component.hostClass()).toContain('iu-divider--inset-end');
    expect(el.classList.contains('iu-divider--inset-end')).toBe(true);
  });

  it('should compose all modifier classes when every inset input is true', () => {
    fixture.componentRef.setInput('inset', true);
    fixture.componentRef.setInput('insetStart', true);
    fixture.componentRef.setInput('insetEnd', true);
    fixture.detectChanges();
    expect(component.hostClass()).toBe(
      'iu-divider iu-divider--inset iu-divider--inset-start iu-divider--inset-end',
    );
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement & {
      inset?: boolean;
      insetStart?: boolean;
      insetEnd?: boolean;
    };
    expect(el.inset).toBe(true);
    expect(el.insetStart).toBe(true);
    expect(el.insetEnd).toBe(true);
  });

  it('should toggle inset modifier class off when set back to false', () => {
    fixture.componentRef.setInput('inset', true);
    fixture.detectChanges();
    expect(component.hostClass()).toContain('iu-divider--inset');
    fixture.componentRef.setInput('inset', false);
    fixture.detectChanges();
    expect(component.hostClass()).toBe('iu-divider');
    const el = fixture.nativeElement.querySelector('md-divider') as HTMLElement & { inset?: boolean };
    expect(el.inset).toBe(false);
  });
});
