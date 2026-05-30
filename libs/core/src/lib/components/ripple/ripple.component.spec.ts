import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RippleComponent } from './ripple.component';

describe('RippleComponent', () => {
  let fixture: ComponentFixture<RippleComponent>;
  let component: RippleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RippleComponent] }).compileComponents();
    fixture = TestBed.createComponent(RippleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render <md-ripple> element', () => {
    const el = fixture.nativeElement.querySelector('md-ripple');
    expect(el).toBeTruthy();
  });

  it('should default disabled to false', () => {
    const el = fixture.nativeElement.querySelector('md-ripple') as HTMLElement & { disabled?: boolean };
    const attr = el.getAttribute('disabled');
    const propFalsy = el.disabled === false || el.disabled === undefined;
    expect(attr === null && propFalsy).toBe(true);
  });

  it('should reflect disabled when input is set to true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-ripple') as HTMLElement & { disabled?: boolean };
    const attr = el.getAttribute('disabled');
    expect(attr !== null || el.disabled === true).toBe(true);
  });
});
