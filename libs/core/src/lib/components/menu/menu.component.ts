import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import '@material/web/menu/sub-menu.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type MenuPositioning = 'absolute' | 'fixed' | 'popover';

/**
 * IU Menu — Angular wrapper over @material/web menu.
 *
 * Usage:
 *   <div style="position: relative;">
 *     <iu-button id="anchor" label="Open Menu" (clicked)="menuOpen = !menuOpen"></iu-button>
 *     <iu-menu [open]="menuOpen" anchor="anchor" (closed)="menuOpen = false">
 *       <md-menu-item><div slot="headline">Item 1</div></md-menu-item>
 *       <md-menu-item><div slot="headline">Item 2</div></md-menu-item>
 *     </iu-menu>
 *   </div>
 */
@Component({
  selector: 'iu-menu',
  standalone: true,
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MenuComponent {
  // --- Inputs ---
  /** Whether the menu is open */
  open = input<boolean>(false);

  /** ID of the anchor element */
  anchor = input<string>('');

  /** Positioning strategy */
  positioning = input<MenuPositioning>('absolute');

  // --- Outputs ---
  opened = output<void>();
  closed = output<void>();
  itemSelected = output<Event>();

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-menu'];
    if (this.open()) c.push('iu-menu--open');
    return c.join(' ');
  });

  onOpened(): void {
    this.opened.emit();
  }

  onClosed(): void {
    this.closed.emit();
  }

  onItemSelected(e: Event): void {
    this.itemSelected.emit(e);
  }
}
