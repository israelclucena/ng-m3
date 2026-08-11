// M3 Expressive Tokens — LisboaRent Design System
//
// Material 3 Expressive is the 2025/2026 evolution of M3: more contrasting
// shapes, spring-based (physical) motion, vibrant color and emphasized
// typography. These tokens are additive and fully flag-gated — they do NOT
// alter the baseline M3 theme unless the `expressive-theme` class is applied
// (see ThemeService.setExpressive). Nothing here activates without explicit
// opt-in.
//
// Values grounded in the public M3 Expressive spec (m3.material.io) — shape
// scale, motion springs, emphasized easing and duration ramps.

/** Expressive shape scale (corner radii, px). Wider + more contrast than baseline M3. */
export const EXPRESSIVE_SHAPE = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 9999,
} as const;

/** Spring specs for physical (spatial/effects) motion. Damping ratio + stiffness. */
export interface SpringSpec {
  /** Damping ratio (0-1 = bouncy → critically damped) */
  readonly damping: number;
  /** Stiffness (higher = snappier) */
  readonly stiffness: number;
}

/**
 * Expressive motion springs. `spatial` moves position/size (slightly bouncy);
 * `effects` moves color/opacity (never overshoots — damping 1.0).
 */
export const EXPRESSIVE_SPRING: Record<'spatialFast' | 'spatialDefault' | 'spatialSlow' | 'effectsFast' | 'effectsDefault' | 'effectsSlow', SpringSpec> = {
  spatialFast: { damping: 0.9, stiffness: 1400 },
  spatialDefault: { damping: 0.9, stiffness: 700 },
  spatialSlow: { damping: 0.9, stiffness: 300 },
  effectsFast: { damping: 1.0, stiffness: 3800 },
  effectsDefault: { damping: 1.0, stiffness: 1600 },
  effectsSlow: { damping: 1.0, stiffness: 800 },
} as const;

/** Emphasized easing curves (cubic-bezier) — the signature of Expressive transitions. */
export const EXPRESSIVE_EASING = {
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/** Duration ramp (ms) — short → extraLong, matching M3 motion tokens. */
export const EXPRESSIVE_DURATION = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const;

/** Emphasized type weights — Expressive leans on variable-font emphasis for hierarchy. */
export const EXPRESSIVE_TYPE_EMPHASIS = {
  regular: 400,
  medium: 500,
  emphasized: 600,
  strong: 700,
} as const;

/** A vibrant Expressive color palette (more saturated than baseline M3). */
export interface ExpressivePalette {
  /** Palette display name */
  readonly name: string;
  readonly primary: string;
  readonly secondary: string;
  readonly tertiary: string;
}

/** Built-in vibrant palettes for the Expressive variant. */
export const EXPRESSIVE_PALETTES: Record<string, ExpressivePalette> = {
  vibrant: {
    name: 'Vibrant',
    primary: '#5E35B1',
    secondary: '#00897B',
    tertiary: '#D81B60',
  },
  citrus: {
    name: 'Citrus',
    primary: '#F4511E',
    secondary: '#FDD835',
    tertiary: '#43A047',
  },
  bloom: {
    name: 'Bloom',
    primary: '#AD1457',
    secondary: '#6A1B9A',
    tertiary: '#0288D1',
  },
} as const;

/** Aggregate Expressive token set (single import surface). */
export const EXPRESSIVE_TOKENS = {
  shape: EXPRESSIVE_SHAPE,
  spring: EXPRESSIVE_SPRING,
  easing: EXPRESSIVE_EASING,
  duration: EXPRESSIVE_DURATION,
  typeEmphasis: EXPRESSIVE_TYPE_EMPHASIS,
  palettes: EXPRESSIVE_PALETTES,
} as const;

/**
 * Convert a {@link SpringSpec} to an approximate CSS transition string.
 *
 * CSS has no native spring, so we derive an emphasized cubic-bezier transition
 * whose duration scales inversely with stiffness (snappier springs → shorter
 * transitions). Bouncier springs (lower damping) use the decelerate curve.
 *
 * @param spec spring specification
 * @param property CSS property to transition (default `all`)
 * @returns CSS `transition` value, e.g. `all 220ms cubic-bezier(...)`
 */
export function springToTransition(spec: SpringSpec, property = 'all'): string {
  // Map stiffness (300–3800) to a duration (~450ms → ~120ms), clamped.
  const duration = Math.round(Math.min(600, Math.max(120, 260000 / spec.stiffness)));
  const easing = spec.damping < 1 ? EXPRESSIVE_EASING.emphasizedDecelerate : EXPRESSIVE_EASING.emphasized;
  return `${property} ${duration}ms ${easing}`;
}

/** Baseline (non-Expressive) M3 standard easing — flat, no spring emphasis. */
export const BASELINE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Baseline M3 transition — the tame, spring-free counterpart to
 * {@link springToTransition}. Fixed 200ms with the standard easing curve,
 * used by the ExpressiveShowcase's A/B `baseline` mode so the same surface can
 * be compared with and without Expressive motion.
 *
 * @param property CSS property to transition (default `all`)
 * @returns CSS `transition` value, e.g. `all 200ms cubic-bezier(0.4, 0, 0.2, 1)`
 */
export function standardTransition(property = 'all'): string {
  return `${property} 200ms ${BASELINE_EASING}`;
}
