import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
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
 *
 * States (Onda 9 / CARD_V2):
 *   - `loading`    → skeleton replaces the content, host is `aria-busy`
 *   - `empty`      → the `[slot="empty"]` content replaces the body
 *   - `selectable` → host becomes a toggle button (`aria-pressed`), Enter/Space
 *                    and click flip `selected` and emit `selectedChange`
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
  /** Renders the `[slot="empty"]` content instead of the body. */
  empty      = input<boolean>(false);
  /** Turns the card into a toggle button (`role=button` + `aria-pressed`). */
  selectable = input<boolean>(false);

  // --- Two-way state ---
  /** Selection state. Two-way: emits `selectedChange` on every toggle. */
  selected = model<boolean>(false);

  // --- Outputs ---
  cardClick = output<Event>();

  // --- Computed ---
  hasTitle    = computed(() => !!this.title());
  hasSubtitle = computed(() => !!this.subtitle());
  hasAvatar   = computed(() => !!this.avatar());
  hasHeader   = computed(() => this.hasTitle() || this.hasSubtitle() || this.hasAvatar());

  /** The card reacts to pointer/keyboard when it is clickable or selectable. */
  isInteractive = computed(() => this.clickable() || this.selectable());
  /** Skeleton wins over the empty state — a loading card knows nothing yet. */
  showSkeleton  = computed(() => this.loading());
  showEmpty     = computed(() => !this.loading() && this.empty());
  showContent   = computed(() => !this.loading() && !this.empty());

  hostRole    = computed(() => (this.isInteractive() ? 'button' : null));
  hostTabIndex = computed(() => (this.isInteractive() && !this.disabled() ? 0 : null));
  ariaBusy    = computed(() => (this.loading() ? 'true' : null));
  ariaPressed = computed(() =>
    this.selectable() ? (this.selected() ? 'true' : 'false') : null,
  );
  ariaDisabled = computed(() => (this.disabled() ? 'true' : null));

  hostClass = computed(() => {
    const c = ['iu-card', `iu-card--${this.variant()}`, `iu-card--kind-${this.kind()}`];
    if (this.clickable())  c.push('iu-card--clickable');
    if (this.disabled())   c.push('iu-card--disabled');
    if (this.fullWidth())  c.push('iu-card--full-width');
    if (this.loading())    c.push('iu-card--loading');
    if (this.showEmpty())  c.push('iu-card--empty');
    if (this.selectable()) c.push('iu-card--selectable');
    if (this.selectable() && this.selected()) c.push('iu-card--selected');
    return c.join(' ');
  });

  // --- Handlers ---
  /**
   * Single entry point for click + Enter/Space. Selection toggles first, then
   * `cardClick` fires — a card can be both selectable and clickable.
   */
  onActivate(e: Event): void {
    if (this.disabled() || this.loading()) return;
    if (this.selectable()) {
      e.preventDefault();
      this.selected.set(!this.selected());
    }
    if (this.clickable()) this.cardClick.emit(e);
  }

  /** @deprecated Use {@link onActivate}. Kept so existing templates keep working. */
  onClick(e: Event): void {
    this.onActivate(e);
  }
}
