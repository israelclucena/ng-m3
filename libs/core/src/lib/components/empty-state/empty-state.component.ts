import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * EmptyState — Reusable empty/zero-state component with icon, title, description, and CTA.
 *
 * Supports content projection for custom illustrations via the `illustration` slot.
 *
 * @example
 * ```html
 * <iu-empty-state
 *   icon="inbox"
 *   title="No messages yet"
 *   description="Your inbox is empty. Start a conversation!"
 *   actionLabel="Compose"
 *   (actionClick)="compose()"
 * />
 * ```
 */
@Component({
  selector: 'iu-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-empty-state" [class]="'iu-empty-state--' + size()">
      <div class="iu-empty-state__illustration">
        <ng-content select="[illustration]" />
        @if (icon()) {
          <span class="material-symbols-outlined iu-empty-state__icon">{{ icon() }}</span>
        }
      </div>
      @if (title()) {
        <h3 class="iu-empty-state__title">{{ title() }}</h3>
      }
      @if (description()) {
        <p class="iu-empty-state__description">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button class="iu-empty-state__action" (click)="actionClick.emit()">
          {{ actionLabel() }}
        </button>
      }
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  /** Material icon name */
  icon = input('');
  /** Title text */
  title = input('');
  /** Description text */
  description = input('');
  /** CTA button label */
  actionLabel = input('');
  /** Size variant */
  size = input<'sm' | 'md' | 'lg'>('md');
  /** Emitted when CTA is clicked */
  actionClick = output<void>();
}
