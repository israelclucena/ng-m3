import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

/**
 * IU Elevation — Angular wrapper over @material/web md-elevation.
 *
 * Usage:
 *   <div style="position: relative;">
 *     <iu-elevation [level]="2"></iu-elevation>
 *     Content here
 *   </div>
 */
@Component({
  selector: 'iu-elevation',
  standalone: true,
  templateUrl: './elevation.component.html',
  styleUrl: './elevation.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ElevationComponent {
  /** M3 elevation level (0-5) */
  level = input<number>(1);
}
