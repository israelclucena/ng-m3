import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EXPRESSIVE_PALETTES,
  EXPRESSIVE_SHAPE,
  EXPRESSIVE_SPRING,
  springToTransition,
  standardTransition,
  type ExpressivePalette,
} from '../../tokens/expressive.tokens';

/** Rendering mode: the vibrant Expressive treatment, or the tame baseline M3 for A/B comparison. */
export type ExpressiveMode = 'expressive' | 'baseline';

/** A single labelled shape-scale swatch. */
interface ShapeSwatch {
  readonly label: string;
  readonly radius: number;
}

/** A named vibrant palette with its key. */
interface PaletteEntry extends ExpressivePalette {
  readonly key: string;
}

/** An Expressive button style demonstrated in the surfaces block. */
interface DemoButton {
  readonly label: string;
  readonly variant: 'filled' | 'tonal' | 'outlined' | 'text';
}

/** An Expressive elevated card demonstrated in the surfaces block. */
interface DemoCard {
  readonly title: string;
  readonly body: string;
}

/**
 * ExpressiveShowcase — a flag-gated demo of the M3 Expressive token set.
 *
 * Renders the three pillars of Material 3 Expressive so they can be reviewed
 * before ratification: the contrasting shape scale, the vibrant palettes and
 * spring-based motion (hover a shape to feel the emphasized transition).
 *
 * Purely presentational and additive — it consumes {@link EXPRESSIVE_TOKENS}
 * and never mutates global theme state.
 *
 * @example
 * ```html
 * <iu-expressive-showcase [paletteKey]="'vibrant'" />
 * ```
 */
@Component({
  selector: 'iu-expressive-showcase',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="iu-expressive"
             [class.iu-expressive--baseline]="isBaseline()"
             [style.--iu-exp-primary]="palette().primary"
             [style.--iu-exp-secondary]="palette().secondary"
             [style.--iu-exp-tertiary]="palette().tertiary">
      <header class="iu-expressive__header">
        <h3 class="iu-expressive__title">{{ headerTitle() }}</h3>
        <p class="iu-expressive__subtitle">{{ headerSubtitle() }}</p>
      </header>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Shape scale</span>
        <div class="iu-expressive__shapes">
          @for (s of shapes(); track s.label) {
            <div class="iu-expressive__shape"
                 [style.border-radius.px]="s.radius"
                 [style.transition]="hoverTransition()"
                 [title]="s.label + ' — ' + s.radius + 'px'">
              <span class="iu-expressive__shape-label">{{ s.radius }}</span>
            </div>
          }
        </div>
      </div>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Vibrant palettes</span>
        <div class="iu-expressive__palettes">
          @for (p of palettes(); track p.key) {
            <div class="iu-expressive__palette" [class.iu-expressive__palette--active]="p.key === paletteKey()">
              <span class="iu-expressive__swatch" [style.background]="p.primary"></span>
              <span class="iu-expressive__swatch" [style.background]="p.secondary"></span>
              <span class="iu-expressive__swatch" [style.background]="p.tertiary"></span>
              <span class="iu-expressive__palette-name">{{ p.name }}</span>
            </div>
          }
        </div>
      </div>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Spring motion</span>
        <button type="button" class="iu-expressive__motion" [style.transition]="hoverTransition()">
          Hover / focus me
        </button>
      </div>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Buttons</span>
        <div class="iu-expressive__buttons">
          @for (b of buttons(); track b.label) {
            <button type="button"
                    class="iu-expressive__btn"
                    [class.iu-expressive__btn--filled]="b.variant === 'filled'"
                    [class.iu-expressive__btn--tonal]="b.variant === 'tonal'"
                    [class.iu-expressive__btn--outlined]="b.variant === 'outlined'"
                    [class.iu-expressive__btn--text]="b.variant === 'text'"
                    [style.transition]="pressTransition()">
              {{ b.label }}
            </button>
          }
          <button type="button" class="iu-expressive__fab"
                  [style.transition]="shapeTransition()" aria-label="Create">
            <span class="iu-expressive__fab-plus">+</span>
          </button>
        </div>
      </div>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Cards</span>
        <div class="iu-expressive__cards">
          @for (c of cards(); track c.title) {
            <article class="iu-expressive__card" [style.transition]="liftTransition()">
              <h4 class="iu-expressive__card-title">{{ c.title }}</h4>
              <p class="iu-expressive__card-body">{{ c.body }}</p>
            </article>
          }
        </div>
      </div>

      <div class="iu-expressive__block">
        <span class="iu-expressive__label">Chips</span>
        <div class="iu-expressive__chips">
          @for (chip of chips(); track chip) {
            <button type="button" class="iu-expressive__chip" [style.transition]="pressTransition()">
              {{ chip }}
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './expressive-showcase.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpressiveShowcaseComponent {
  /** Which vibrant palette to highlight as active */
  paletteKey = input<string>('vibrant');

  /**
   * Rendering mode. `expressive` (default) applies the full vibrant treatment;
   * `baseline` renders the same surfaces with tame standard M3 shape/motion so
   * the two can sit side-by-side for A/B ratification.
   */
  mode = input<ExpressiveMode>('expressive');

  /** True when rendering the tame baseline M3 treatment. */
  readonly isBaseline = computed(() => this.mode() === 'baseline');

  /** The active palette (falls back to `vibrant`) */
  readonly palette = computed<ExpressivePalette>(
    () => EXPRESSIVE_PALETTES[this.paletteKey()] ?? EXPRESSIVE_PALETTES['vibrant'],
  );

  /** Header title reflecting the current mode */
  readonly headerTitle = computed(() =>
    this.isBaseline() ? 'Baseline M3' : 'Material 3 Expressive',
  );

  /** Header subtitle reflecting the current mode */
  readonly headerSubtitle = computed(() =>
    this.isBaseline()
      ? 'Shape · Color · Motion — versão atual (sem Expressive)'
      : 'Shape · Color · Motion — preview antes de ativar',
  );

  /** Dramatic, high-contrast Expressive shape scale */
  private readonly expressiveShapes: readonly ShapeSwatch[] = [
    { label: 'Extra small', radius: EXPRESSIVE_SHAPE.extraSmall },
    { label: 'Small', radius: EXPRESSIVE_SHAPE.small },
    { label: 'Medium', radius: EXPRESSIVE_SHAPE.medium },
    { label: 'Large', radius: EXPRESSIVE_SHAPE.large },
    { label: 'Large increased', radius: EXPRESSIVE_SHAPE.largeIncreased },
    { label: 'Extra large', radius: EXPRESSIVE_SHAPE.extraLarge },
    { label: 'Extra large increased', radius: EXPRESSIVE_SHAPE.extraLargeIncreased },
    { label: 'Extra extra large', radius: EXPRESSIVE_SHAPE.extraExtraLarge },
  ];

  /** Tame, low-contrast baseline scale — gentle linear ramp, same labels */
  private readonly baselineShapes: readonly ShapeSwatch[] = this.expressiveShapes.map(
    (s, i) => ({ label: s.label, radius: 2 + i * 2 }),
  );

  /** Ordered shape-scale swatches for display (mode-aware) */
  readonly shapes = computed<readonly ShapeSwatch[]>(() =>
    this.isBaseline() ? this.baselineShapes : this.expressiveShapes,
  );

  /** All vibrant palettes as an array with keys */
  readonly palettes = computed<PaletteEntry[]>(() =>
    Object.entries(EXPRESSIVE_PALETTES).map(([key, p]) => ({ key, ...p })),
  );

  /** Emphasized spring transition applied to interactive elements (tame in baseline) */
  readonly hoverTransition = computed(() =>
    this.isBaseline()
      ? standardTransition('all')
      : springToTransition(EXPRESSIVE_SPRING.spatialDefault, 'all'),
  );

  /** Snappy transform spring for press/hover feedback on buttons & chips (tame in baseline) */
  readonly pressTransition = computed(() =>
    this.isBaseline()
      ? standardTransition('transform')
      : springToTransition(EXPRESSIVE_SPRING.spatialFast, 'transform'),
  );

  /** Shape-morph spring — the Expressive signature; flat in baseline */
  readonly shapeTransition = computed(() =>
    this.isBaseline()
      ? standardTransition('border-radius')
      : springToTransition(EXPRESSIVE_SPRING.spatialDefault, 'border-radius'),
  );

  /** Soft, slow lift spring for card elevation (tame in baseline) */
  readonly liftTransition = computed(() =>
    this.isBaseline()
      ? standardTransition('all')
      : springToTransition(EXPRESSIVE_SPRING.spatialSlow, 'all'),
  );

  /** Button variants demonstrated with Expressive shape-morph + press motion */
  readonly buttons = computed<DemoButton[]>(() => [
    { label: 'Filled', variant: 'filled' },
    { label: 'Tonal', variant: 'tonal' },
    { label: 'Outlined', variant: 'outlined' },
    { label: 'Text', variant: 'text' },
  ]);

  /** Elevated cards demonstrated with the soft lift spring */
  readonly cards = computed<DemoCard[]>(() => [
    { title: 'Shape', body: 'Contrasting corner radii give each surface its own silhouette.' },
    { title: 'Motion', body: 'Physical springs make interactions feel alive, not linear.' },
  ]);

  /** Filter chips demonstrated with the snappy press spring */
  readonly chips = computed<string[]>(() => ['Vibrant', 'Spring', 'Emphasis', 'Shape']);
}
