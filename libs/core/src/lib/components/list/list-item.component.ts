import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type ListItemType = 'text' | 'button' | 'link';

/**
 * IU List Item — Angular wrapper over @material/web md-list-item.
 *
 * Usage:
 *   <iu-list-item headline="Title" supportingText="Subtitle"></iu-list-item>
 */
@Component({
  selector: 'iu-list-item',
  standalone: true,
  templateUrl: './list-item.component.html',
  styleUrl: './list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListItemComponent {
  // --- Inputs ---
  /** Primary text */
  headline = input<string>('');

  /** Secondary text */
  supportingText = input<string>('');

  /** Item type */
  type = input<ListItemType>('text');

  /** Disabled state */
  disabled = input<boolean>(false);

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-list-item', `iu-list-item--${this.type()}`];
    if (this.disabled()) c.push('iu-list-item--disabled');
    return c.join(' ');
  });
}
