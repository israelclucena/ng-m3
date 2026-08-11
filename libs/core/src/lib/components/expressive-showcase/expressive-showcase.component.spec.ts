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

  it('renders one button per demo variant plus a FAB', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.iu-expressive__btn');
    expect(buttons.length).toBe(component.buttons().length);
    expect(fixture.nativeElement.querySelectorAll('.iu-expressive__fab').length).toBe(1);
  });

  it('renders every demo card and chip', () => {
    const cards = fixture.nativeElement.querySelectorAll('.iu-expressive__card');
    const chips = fixture.nativeElement.querySelectorAll('.iu-expressive__chip');
    expect(cards.length).toBe(component.cards().length);
    expect(chips.length).toBe(component.chips().length);
  });

  it('exposes distinct spring transitions per surface (property + duration)', () => {
    expect(component.pressTransition()).toMatch(/^transform \d+ms cubic-bezier\(/);
    expect(component.shapeTransition()).toMatch(/^border-radius \d+ms cubic-bezier\(/);
    expect(component.liftTransition()).toMatch(/^all \d+ms cubic-bezier\(/);
    // Faster spring (press) resolves to a shorter duration than the slow lift.
    const pressMs = Number(component.pressTransition().match(/(\d+)ms/)?.[1]);
    const liftMs = Number(component.liftTransition().match(/(\d+)ms/)?.[1]);
    expect(pressMs).toBeLessThan(liftMs);
  });

  it('renders in expressive mode by default (no baseline modifier)', () => {
    expect(component.mode()).toBe('expressive');
    expect(component.isBaseline()).toBe(false);
    const section = fixture.nativeElement.querySelector('.iu-expressive');
    expect(section.classList.contains('iu-expressive--baseline')).toBe(false);
    expect(component.headerTitle()).toContain('Expressive');
  });

  describe('baseline mode (A/B counterpart)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'baseline');
      fixture.detectChanges();
    });

    it('applies the baseline modifier class', () => {
      expect(component.isBaseline()).toBe(true);
      const section = fixture.nativeElement.querySelector('.iu-expressive');
      expect(section.classList.contains('iu-expressive--baseline')).toBe(true);
    });

    it('swaps the header copy to signal the current (non-expressive) surface', () => {
      expect(component.headerTitle()).not.toContain('Expressive');
    });

    it('uses tame standard transitions instead of springs', () => {
      expect(component.hoverTransition()).toBe('all 200ms cubic-bezier(0.4, 0, 0.2, 1)');
      expect(component.shapeTransition()).toBe('border-radius 200ms cubic-bezier(0.4, 0, 0.2, 1)');
      expect(component.pressTransition()).toBe('transform 200ms cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('uses a tamer, lower-contrast shape scale than Expressive', () => {
      expect(component.shapes().length).toBe(8);
      const baselineMax = Math.max(...component.shapes().map((s) => s.radius));
      expect(baselineMax).toBeLessThan(EXPRESSIVE_SHAPE.extraExtraLarge);
    });
  });
});
