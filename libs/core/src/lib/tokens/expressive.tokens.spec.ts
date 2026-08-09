import {
  EXPRESSIVE_DURATION,
  EXPRESSIVE_EASING,
  EXPRESSIVE_PALETTES,
  EXPRESSIVE_SHAPE,
  EXPRESSIVE_SPRING,
  EXPRESSIVE_TOKENS,
  EXPRESSIVE_TYPE_EMPHASIS,
  springToTransition,
} from './expressive.tokens';

describe('Expressive tokens', () => {
  it('shape scale increases monotonically up to xxl', () => {
    const ordered = [
      EXPRESSIVE_SHAPE.none,
      EXPRESSIVE_SHAPE.extraSmall,
      EXPRESSIVE_SHAPE.small,
      EXPRESSIVE_SHAPE.medium,
      EXPRESSIVE_SHAPE.large,
      EXPRESSIVE_SHAPE.largeIncreased,
      EXPRESSIVE_SHAPE.extraLarge,
      EXPRESSIVE_SHAPE.extraLargeIncreased,
      EXPRESSIVE_SHAPE.extraExtraLarge,
    ];
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i]).toBeGreaterThan(ordered[i - 1]);
    }
    expect(EXPRESSIVE_SHAPE.full).toBe(9999);
  });

  it('spatial springs are slightly bouncy (<1) and effects springs never overshoot (=1)', () => {
    expect(EXPRESSIVE_SPRING.spatialFast.damping).toBeLessThan(1);
    expect(EXPRESSIVE_SPRING.spatialDefault.damping).toBeLessThan(1);
    expect(EXPRESSIVE_SPRING.spatialSlow.damping).toBeLessThan(1);
    expect(EXPRESSIVE_SPRING.effectsFast.damping).toBe(1);
    expect(EXPRESSIVE_SPRING.effectsDefault.damping).toBe(1);
    expect(EXPRESSIVE_SPRING.effectsSlow.damping).toBe(1);
  });

  it('fast springs are stiffer than slow springs', () => {
    expect(EXPRESSIVE_SPRING.spatialFast.stiffness).toBeGreaterThan(EXPRESSIVE_SPRING.spatialSlow.stiffness);
    expect(EXPRESSIVE_SPRING.effectsFast.stiffness).toBeGreaterThan(EXPRESSIVE_SPRING.effectsSlow.stiffness);
  });

  it('durations ramp monotonically across the scale', () => {
    const seq = Object.values(EXPRESSIVE_DURATION);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1]);
    }
  });

  it('easing tokens are valid cubic-bezier strings', () => {
    for (const curve of Object.values(EXPRESSIVE_EASING)) {
      expect(curve).toMatch(/^cubic-bezier\(([-\d.]+,\s*){3}[-\d.]+\)$/);
    }
  });

  it('type emphasis weights are ordered and within CSS font-weight range', () => {
    const weights = [
      EXPRESSIVE_TYPE_EMPHASIS.regular,
      EXPRESSIVE_TYPE_EMPHASIS.medium,
      EXPRESSIVE_TYPE_EMPHASIS.emphasized,
      EXPRESSIVE_TYPE_EMPHASIS.strong,
    ];
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
    expect(weights[0]).toBeGreaterThanOrEqual(100);
    expect(weights[weights.length - 1]).toBeLessThanOrEqual(900);
  });

  it('every vibrant palette exposes 3 valid hex colors', () => {
    const hex = /^#[0-9A-F]{6}$/i;
    for (const p of Object.values(EXPRESSIVE_PALETTES)) {
      expect(p.name).toBeTruthy();
      expect(p.primary).toMatch(hex);
      expect(p.secondary).toMatch(hex);
      expect(p.tertiary).toMatch(hex);
    }
  });

  it('aggregate token set wires up every sub-scale', () => {
    expect(EXPRESSIVE_TOKENS.shape).toBe(EXPRESSIVE_SHAPE);
    expect(EXPRESSIVE_TOKENS.spring).toBe(EXPRESSIVE_SPRING);
    expect(EXPRESSIVE_TOKENS.easing).toBe(EXPRESSIVE_EASING);
    expect(EXPRESSIVE_TOKENS.duration).toBe(EXPRESSIVE_DURATION);
    expect(EXPRESSIVE_TOKENS.typeEmphasis).toBe(EXPRESSIVE_TYPE_EMPHASIS);
    expect(EXPRESSIVE_TOKENS.palettes).toBe(EXPRESSIVE_PALETTES);
  });

  describe('springToTransition', () => {
    it('produces a valid CSS transition string with the given property', () => {
      const t = springToTransition(EXPRESSIVE_SPRING.spatialDefault, 'transform');
      expect(t).toMatch(/^transform \d+ms cubic-bezier\(/);
    });

    it('defaults the property to "all"', () => {
      expect(springToTransition(EXPRESSIVE_SPRING.effectsDefault)).toMatch(/^all /);
    });

    it('stiffer springs yield shorter durations', () => {
      const fast = parseInt(springToTransition(EXPRESSIVE_SPRING.spatialFast).match(/(\d+)ms/)![1], 10);
      const slow = parseInt(springToTransition(EXPRESSIVE_SPRING.spatialSlow).match(/(\d+)ms/)![1], 10);
      expect(fast).toBeLessThan(slow);
    });

    it('clamps duration into the 120–600ms band', () => {
      const veryStiff = springToTransition({ damping: 1, stiffness: 100000 });
      const verySoft = springToTransition({ damping: 1, stiffness: 1 });
      expect(parseInt(veryStiff.match(/(\d+)ms/)![1], 10)).toBe(120);
      expect(parseInt(verySoft.match(/(\d+)ms/)![1], 10)).toBe(600);
    });

    it('bouncy springs use the decelerate curve, damped springs use emphasized', () => {
      expect(springToTransition({ damping: 0.8, stiffness: 700 })).toContain(EXPRESSIVE_EASING.emphasizedDecelerate);
      expect(springToTransition({ damping: 1, stiffness: 700 })).toContain(EXPRESSIVE_EASING.emphasized);
    });
  });
});
