import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type NavDrawerVariant = 'standard' | 'modal';

export interface NavDrawerItem {
  icon?: string;
  label: string;
  active?: boolean;
  badge?: string | number;
  section?: string; // section header (if set, this item is a section divider)
}

/**
 * IU Navigation Drawer — Custom M3 implementation.
 *
 * Usage:
 *   <iu-nav-drawer [open]="true" variant="modal" [items]="navItems" (itemClick)="onNav($event)" />
 */
@Component({
  selector: 'iu-nav-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant() === 'modal' && open()) {
      <div class="iu-nav-drawer__scrim" (click)="dismiss()"></div>
    }
    <nav [class]="hostClass()">
      <div class="iu-nav-drawer__header">
        <ng-content select="[drawerHeader]"></ng-content>
      </div>
      <div class="iu-nav-drawer__items">
        @for (item of items(); track item.label; let i = $index) {
          @if (item.section) {
            <div class="iu-nav-drawer__section">{{ item.section }}</div>
          } @else {
            <button
              class="iu-nav-drawer__item"
              [class.iu-nav-drawer__item--active]="item.active"
              (click)="onItemClick(i)">
              @if (item.icon) {
                <span class="material-symbols-outlined iu-nav-drawer__icon">{{ item.icon }}</span>
              }
              <span class="iu-nav-drawer__label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="iu-nav-drawer__badge">{{ item.badge }}</span>
              }
            </button>
          }
        }
      </div>
    </nav>
  `,
  styleUrl: './nav-drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavDrawerComponent {
  open = input<boolean>(false);
  variant = input<NavDrawerVariant>('standard');
  items = input<NavDrawerItem[]>([]);

  itemClick = output<number>();
  dismissed = output<void>();

  hostClass = computed(() => {
    const classes = [
      'iu-nav-drawer',
      `iu-nav-drawer--${this.variant()}`,
    ];
    if (this.open()) classes.push('iu-nav-drawer--open');
    return classes.join(' ');
  });

  onItemClick(index: number): void {
    this.itemClick.emit(index);
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
