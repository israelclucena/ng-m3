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
  type ExpressivePalette,
} from '../../tokens/expressive.tokens';

/** A single labelled shape-scale swatch. */
interface ShapeSwatch {
  readonly label: string;
  readonly radius: number;
}

/** A named vibrant palette with its key. */
interface PaletteEntry extends ExpressivePalette {
  readonly key: string;
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
    <section class="iu-expressive" [style.--iu-exp-primary]="palette().primary"
             [style.--iu-exp-secondary]="palette().secondary"
             [style.--iu-exp-tertiary]="palette().tertiary">
      <header class="iu-expressive__header">
        <h3 class="iu-expressive__title">Material 3 Expressive</h3>
        <p class="iu-expressive__subtitle">Shape · Color · Motion — preview antes de ativar</p>
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
    </section>
  `,
  styleUrl: './expressive-showcase.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpressiveShowcaseComponent {
  /** Which vibrant palette to highlight as active */
  paletteKey = input<string>('vibrant');

  /** The active palette (falls back to `vibrant`) */
  readonly palette = computed<ExpressivePalette>(
    () => EXPRESSIVE_PALETTES[this.paletteKey()] ?? EXPRESSIVE_PALETTES['vibrant'],
  );

  /** Ordered shape-scale swatches for display */
  readonly shapes = computed<ShapeSwatch[]>(() => [
    { label: 'Extra small', radius: EXPRESSIVE_SHAPE.extraSmall },
    { label: 'Small', radius: EXPRESSIVE_SHAPE.small },
    { label: 'Medium', radius: EXPRESSIVE_SHAPE.medium },
    { label: 'Large', radius: EXPRESSIVE_SHAPE.large },
    { label: 'Large increased', radius: EXPRESSIVE_SHAPE.largeIncreased },
    { label: 'Extra large', radius: EXPRESSIVE_SHAPE.extraLarge },
    { label: 'Extra large increased', radius: EXPRESSIVE_SHAPE.extraLargeIncreased },
    { label: 'Extra extra large', radius: EXPRESSIVE_SHAPE.extraExtraLarge },
  ]);

  /** All vibrant palettes as an array with keys */
  readonly palettes = computed<PaletteEntry[]>(() =>
    Object.entries(EXPRESSIVE_PALETTES).map(([key, p]) => ({ key, ...p })),
  );

  /** Emphasized spring transition applied to interactive elements */
  readonly hoverTransition = computed(() =>
    springToTransition(EXPRESSIVE_SPRING.spatialDefault, 'all'),
  );
}
