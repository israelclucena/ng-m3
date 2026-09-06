import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

/**
 * Semantic shape of a card. Drives layout/emphasis only — the same component
 * covers every kind, replacing the sibling `card-variants/` components (NG-03).
 */
export type CardKind = 'plain' | 'action' | 'profile' | 'stat';

/** Vertical rhythm of a card. Only tightens/loosens padding — never layout. */
export type CardDensity = 'default' | 'comfortable' | 'compact';

/**
 * IU Card Component
 * Standalone, signal-based, M3-inspired.
 * Variants: elevated | filled | outlined
 * Kinds:    plain | action | profile | stat
 *
 * Slots:
 *   - Default slot    → body content
 *   - [slot="header"] → custom header (overrides title/subtitle)
 *   - [slot="media"]  → image / media area
 *   - [slot="footer"] → action buttons area
 *   - [slot="empty"]  → rendered instead of the body when `empty` is set
 *   - [slot="error"]  → custom copy inside the error state (with a retry button)
 *
 * States (Onda 9 / CARD_V2), resolved in priority order
 * loading → error → empty → content:
 *   - `loading`    → skeleton replaces the content, host is `aria-busy`
 *   - `error`      → the `[slot="error"]` copy + a retry button (`role="alert"`)
 *   - `empty`      → the `[slot="empty"]` content replaces the body
 *   - `selectable` → host becomes a toggle button (`aria-pressed`), Enter/Space
 *                    and click flip `selected` and emit `selectedChange`
 *   - `density`    → tightens/loosens the padding (default|comfortable|compact)
 *   - media        → `mediaSrc` renders an `<img>` with a `mediaAspectRatio` box
 *                    and a broken-image fallback when the source fails to load
 */
@Component({
  selector: 'iu-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  // --- Inputs ---
  /** Visual treatment of the card surface. */
  variant    = input<CardVariant>('elevated');
  /** Semantic shape of the card — adjusts host layout classes only. */
  kind       = input<CardKind>('plain');
  title      = input<string>('');
  subtitle   = input<string>('');
  avatar     = input<string>('');   // Material icon name, e.g. 'home'
  clickable  = input<boolean>(false);
  disabled   = input<boolean>(false);
  fullWidth  = input<boolean>(false);
  /** Swaps the whole content for a skeleton and marks the host `aria-busy`. */
  loading    = input<boolean>(false);
  /** Renders the `[slot="error"]` copy + a retry button instead of the body. */
  error      = input<boolean>(false);
  /** Renders the `[slot="empty"]` content instead of the body. */
  empty      = input<boolean>(false);
  /** Turns the card into a toggle button (`role=button` + `aria-pressed`). */
  selectable = input<boolean>(false);
  /** Padding rhythm — tightens/loosens spacing without touching layout. */
  density    = input<CardDensity>('default');
  /** Image source for the media area; renders an `<img>` with a fallback. */
  mediaSrc   = input<string>('');
  /** Alt text for `mediaSrc`. Empty = decorative image (aria-hidden `<img>`). */
  mediaAlt   = input<string>('');
  /** CSS `aspect-ratio` for the media box (e.g. `16 / 9`, `1 / 1`). */
  mediaAspectRatio = input<string>('16 / 9');

  // --- Two-way state ---
  /** Selection state. Two-way: emits `selectedChange` on every toggle. */
  selected = model<boolean>(false);

  // --- Outputs ---
  cardClick = output<Event>();
  /** Fired when the user clicks the retry button in the `error` state. */
  retry = output<void>();

  // --- Internal state ---
  /** Flips when `mediaSrc` fails to load. Reset whenever the source changes. */
  private mediaBroken = linkedSignal<string, boolean>({
    source: () => this.mediaSrc(),
    computation: () => false,
  });

  // --- Computed ---
  hasTitle    = computed(() => !!this.title());
  hasSubtitle = computed(() => !!this.subtitle());
  hasAvatar   = computed(() => !!this.avatar());
  hasHeader   = computed(() => this.hasTitle() || this.hasSubtitle() || this.hasAvatar());

  /** The card reacts to pointer/keyboard when it is clickable or selectable. */
  isInteractive = computed(() => this.clickable() || this.selectable());
  /** Priority: loading → error → empty → content. */
  showSkeleton  = computed(() => this.loading());
  showError     = computed(() => !this.loading() && this.error());
  showEmpty     = computed(() => !this.loading() && !this.error() && this.empty());
  showContent   = computed(() => !this.loading() && !this.error() && !this.empty());

  hasMedia          = computed(() => !!this.mediaSrc());
  showMediaImg      = computed(() => this.hasMedia() && !this.mediaBroken());
  showMediaFallback = computed(() => this.hasMedia() && this.mediaBroken());

  hostRole    = computed(() => (this.isInteractive() ? 'button' : null));
  hostTabIndex = computed(() => (this.isInteractive() && !this.disabled() ? 0 : null));
  ariaBusy    = computed(() => (this.loading() ? 'true' : null));
  ariaPressed = computed(() =>
    this.selectable() ? (this.selected() ? 'true' : 'false') : null,
  );
  ariaDisabled = computed(() => (this.disabled() ? 'true' : null));

  hostClass = computed(() => {
    const c = [
      'iu-card',
      `iu-card--${this.variant()}`,
      `iu-card--kind-${this.kind()}`,
      `iu-card--density-${this.density()}`,
    ];
    if (this.clickable())  c.push('iu-card--clickable');
    if (this.disabled())   c.push('iu-card--disabled');
    if (this.fullWidth())  c.push('iu-card--full-width');
    if (this.loading())    c.push('iu-card--loading');
    if (this.showError())  c.push('iu-card--error');
    if (this.showEmpty())  c.push('iu-card--empty');
    if (this.selectable()) c.push('iu-card--selectable');
    if (this.selectable() && this.selected()) c.push('iu-card--selected');
    return c.join(' ');
  });

  // --- Handlers ---
  /**
   * Single entry point for click + Enter/Space. Selection toggles first, then
   * `cardClick` fires — a card can be both selectable and clickable.
   * Inert while loading or in the error state (the card knows nothing / failed).
   */
  onActivate(e: Event): void {
    if (this.disabled() || this.loading() || this.error()) return;
    if (this.selectable()) {
      e.preventDefault();
      this.selected.set(!this.selected());
    }
    if (this.clickable()) this.cardClick.emit(e);
  }

  /** Retry button in the error state — never bubbles up to `onActivate`. */
  onRetry(e: Event): void {
    e.stopPropagation();
    this.retry.emit();
  }

  /** The media `<img>` failed to load → swap in the broken-image fallback. */
  onMediaError(): void {
    this.mediaBroken.set(true);
  }

  /** @deprecated Use {@link onActivate}. Kept so existing templates keep working. */
  onClick(e: Event): void {
    this.onActivate(e);
  }
}
