import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusRingComponent } from './focus-ring.component';

describe('FocusRingComponent', () => {
  let fixture: ComponentFixture<FocusRingComponent>;
  let component: FocusRingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FocusRingComponent] }).compileComponents();
    fixture = TestBed.createComponent(FocusRingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should default visible to false', () => {
    expect(component.visible()).toBe(false);
  });

  it('should default inward to false', () => {
    expect(component.inward()).toBe(false);
  });

  it('should render an md-focus-ring element', () => {
    const el = fixture.nativeElement.querySelector('md-focus-ring');
    expect(el).toBeTruthy();
  });

  it('should reflect default visible=false as a property on md-focus-ring', () => {
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      visible?: boolean;
    };
    expect(el?.visible).toBe(false);
  });

  it('should reflect default inward=false as a property on md-focus-ring', () => {
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      inward?: boolean;
    };
    expect(el?.inward).toBe(false);
  });

  it('should propagate visible=true to the md-focus-ring property', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      visible?: boolean;
    };
    expect(el?.visible).toBe(true);
    expect(component.visible()).toBe(true);
  });

  it('should propagate inward=true to the md-focus-ring property', () => {
    fixture.componentRef.setInput('inward', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      inward?: boolean;
    };
    expect(el?.inward).toBe(true);
    expect(component.inward()).toBe(true);
  });

  it('should support both visible and inward set to true simultaneously', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('inward', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      visible?: boolean;
      inward?: boolean;
    };
    expect(el?.visible).toBe(true);
    expect(el?.inward).toBe(true);
  });

  it('should toggle visible back to false after being true', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-focus-ring') as HTMLElement & {
      visible?: boolean;
    };
    expect(el?.visible).toBe(false);
  });
});
