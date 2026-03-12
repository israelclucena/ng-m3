import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/secondary-tab.js';
import '@material/web/icon/icon.js';
import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  input,
  output,
  viewChild,
} from '@angular/core';

export type TabVariant = 'primary' | 'secondary';

/**
 * IU Tabs — Angular wrapper over @material/web tabs.
 *
 * Usage:
 *   <iu-tabs variant="primary" [activeTabIndex]="0" (change)="onTab($event)">
 *     <md-primary-tab>Home</md-primary-tab>
 *     <md-primary-tab>Settings</md-primary-tab>
 *   </iu-tabs>
 */
@Component({
  selector: 'iu-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TabsComponent implements AfterViewInit {
  /** primary uses md-primary-tab, secondary uses md-secondary-tab */
  variant = input<TabVariant>('primary');

  /** Index of the initially active tab */
  activeTabIndex = input<number>(0);

  /** Emits the new active tab index on change */
  change = output<number>();

  tabsRef = viewChild<ElementRef>('tabsEl');

  ngAfterViewInit(): void {
    const el = this.tabsRef()?.nativeElement;
    if (el) {
      el.activeTabIndex = this.activeTabIndex();
      el.addEventListener('change', () => {
        this.change.emit(el.activeTabIndex);
      });
    }
  }
}
