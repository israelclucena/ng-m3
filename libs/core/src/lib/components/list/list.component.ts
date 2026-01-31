import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';

/**
 * IU List — Angular wrapper over @material/web md-list.
 *
 * Usage:
 *   <iu-list>
 *     <iu-list-item headline="Item 1"></iu-list-item>
 *     <iu-list-item headline="Item 2" supportingText="Description"></iu-list-item>
 *   </iu-list>
 */
@Component({
  selector: 'iu-list',
  standalone: true,
  template: `<md-list class="iu-list"><ng-content /></md-list>`,
  styleUrl: './list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent {}
