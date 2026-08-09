import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpressiveShowcaseComponent } from './expressive-showcase.component';
import { EXPRESSIVE_PALETTES, EXPRESSIVE_SHAPE } from '../../tokens/expressive.tokens';

describe('ExpressiveShowcaseComponent', () => {
  let fixture: ComponentFixture<ExpressiveShowcaseComponent>;
  let component: ExpressiveShowcaseComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ExpressiveShowcaseComponent] }).compileComponents();
    fixture = TestBed.createComponent(ExpressiveShowcaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with the vibrant palette by default', () => {
    expect(component).toBeTruthy();
    expect(component.paletteKey()).toBe('vibrant');
    expect(component.palette()).toBe(EXPRESSIVE_PALETTES['vibrant']);
  });

  it('renders one shape swatch per Expressive shape token (8 shapes)', () => {
    const shapes = fixture.nativeElement.querySelectorAll('.iu-expressive__shape');
    expect(shapes.length).toBe(8);
    expect(component.shapes()[0].radius).toBe(EXPRESSIVE_SHAPE.extraSmall);
    expect(component.shapes().at(-1)?.radius).toBe(EXPRESSIVE_SHAPE.extraExtraLarge);
  });

  it('renders every vibrant palette chip', () => {
    const chips = fixture.nativeElement.querySelectorAll('.iu-expressive__palette');
    expect(chips.length).toBe(Object.keys(EXPRESSIVE_PALETTES).length);
  });

  it('marks the active palette chip', () => {
    fixture.componentRef.setInput('paletteKey', 'citrus');
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelectorAll('.iu-expressive__palette--active');
    expect(active.length).toBe(1);
    expect(component.palette()).toBe(EXPRESSIVE_PALETTES['citrus']);
  });

  it('falls back to vibrant when given an unknown palette key', () => {
    fixture.componentRef.setInput('paletteKey', 'does-not-exist');
    fixture.detectChanges();
    expect(component.palette()).toBe(EXPRESSIVE_PALETTES['vibrant']);
    const active = fixture.nativeElement.querySelectorAll('.iu-expressive__palette--active');
    expect(active.length).toBe(0);
  });

  it('exposes a spring-derived CSS transition', () => {
    expect(component.hoverTransition()).toMatch(/^all \d+ms cubic-bezier\(/);
  });
});
