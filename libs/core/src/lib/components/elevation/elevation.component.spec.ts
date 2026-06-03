import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElevationComponent } from './elevation.component';

describe('ElevationComponent', () => {
  let fixture: ComponentFixture<ElevationComponent>;
  let component: ElevationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElevationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ElevationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults level to 1', () => {
    expect(component.level()).toBe(1);
  });

  it('renders an md-elevation element', () => {
    const el = fixture.nativeElement.querySelector('md-elevation');
    expect(el).toBeTruthy();
  });

  it('sets --md-elevation-level CSS var to default (1)', () => {
    const el = fixture.nativeElement.querySelector('md-elevation') as HTMLElement;
    expect(el.style.getPropertyValue('--md-elevation-level')).toBe('1');
  });

  it('updates --md-elevation-level when level input changes', () => {
    fixture.componentRef.setInput('level', 3);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-elevation') as HTMLElement;
    expect(el.style.getPropertyValue('--md-elevation-level')).toBe('3');
  });

  it.each([0, 2, 3, 4, 5])('accepts level %i', (level) => {
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('md-elevation') as HTMLElement;
    expect(component.level()).toBe(level);
    expect(el.style.getPropertyValue('--md-elevation-level')).toBe(String(level));
  });
});
