import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

/**
 * IU Card Component
 * Standalone, signal-based, M3-inspired.
 * Variants: elevated | filled | outlined
 *
 * Slots:
 *   - Default slot    → body content
 *   - [slot="header"] → custom header (overrides title/subtitle)
 *   - [slot="media"]  → image / media area
 *   - [slot="footer"] → action buttons area
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
  variant    = input<CardVariant>('elevated');
  title      = input<string>('');
  subtitle   = input<string>('');
  avatar     = input<string>('');   // Material icon name, e.g. 'home'
  clickable  = input<boolean>(false);
  disabled   = input<boolean>(false);
  fullWidth  = input<boolean>(false);

  // --- Outputs ---
  cardClick = output<Event>();

  // --- Computed ---
  hasTitle    = computed(() => !!this.title());
  hasSubtitle = computed(() => !!this.subtitle());
  hasAvatar   = computed(() => !!this.avatar());
  hasHeader   = computed(() => this.hasTitle() || this.hasSubtitle() || this.hasAvatar());

  hostClass = computed(() => {
    const c = ['iu-card', `iu-card--${this.variant()}`];
    if (this.clickable())  c.push('iu-card--clickable');
    if (this.disabled())   c.push('iu-card--disabled');
    if (this.fullWidth())  c.push('iu-card--full-width');
    return c.join(' ');
  });

  // --- Handlers ---
  onClick(e: Event): void {
    if (this.disabled()) return;
    if (this.clickable()) this.cardClick.emit(e);
  }
}
