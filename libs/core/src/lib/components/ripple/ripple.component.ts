import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

/**
 * IU Ripple — Angular wrapper over @material/web md-ripple.
 *
 * Add to any interactive element with position: relative.
 *
 * Usage:
 *   <div style="position: relative;">
 *     <iu-ripple></iu-ripple>
 *     Clickable content
 *   </div>
 */
@Component({
  selector: 'iu-ripple',
  standalone: true,
  templateUrl: './ripple.component.html',
  styleUrl: './ripple.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RippleComponent {
  /** Disable ripple effect */
  disabled = input<boolean>(false);
}
