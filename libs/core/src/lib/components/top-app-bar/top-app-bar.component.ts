import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type TopAppBarVariant = 'center-aligned' | 'small' | 'medium' | 'large';
export type TopAppBarScrollBehavior = 'fixed' | 'elevate' | 'collapse';

/**
 * IU Top App Bar — Custom M3 implementation.
 *
 * Usage:
 *   <iu-top-app-bar headline="My App" variant="small" />
 *   <iu-top-app-bar headline="Page Title" variant="large" leadingIcon="menu" />
 */
@Component({
  selector: 'iu-top-app-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-app-bar.component.html',
  styleUrl: './top-app-bar.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopAppBarComponent {
  /** Bar variant */
  variant = input<TopAppBarVariant>('small');

  /** Headline text */
  headline = input<string>('');

  /** Leading icon (Material Symbols name, e.g. 'menu', 'arrow_back') */
  leadingIcon = input<string>('');

  /** Trailing icons list */
  trailingIcons = input<string[]>([]);

  /** Scroll behavior */
  scrollBehavior = input<TopAppBarScrollBehavior>('fixed');

  /** Whether the bar is scrolled (elevated state) */
  scrolled = input<boolean>(false);

  /** Emitted when leading icon is clicked */
  leadingIconClick = output<void>();

  /** Emitted when a trailing icon is clicked */
  trailingIconClick = output<string>();

  hostClass = computed(() => {
    const classes = ['iu-top-app-bar', `iu-top-app-bar--${this.variant()}`];
    if (this.scrolled() && this.scrollBehavior() === 'elevate') {
      classes.push('iu-top-app-bar--scrolled');
    }
    return classes.join(' ');
  });

  hasLeadingIcon = computed(() => !!this.leadingIcon());
  hasTrailingIcons = computed(() => this.trailingIcons().length > 0);
}
