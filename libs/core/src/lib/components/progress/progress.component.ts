import '@material/web/progress/linear-progress.js';
import '@material/web/progress/circular-progress.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type ProgressType = 'linear' | 'circular';

/**
 * IU Progress — Angular wrapper over @material/web progress indicators.
 *
 * M3 spec: linear height 4px, circular 48×48px default.
 *
 * Usage:
 *   <iu-progress type="linear" [value]="0.6"></iu-progress>
 *   <iu-progress type="circular" [indeterminate]="true"></iu-progress>
 *   <iu-progress type="linear" [indeterminate]="true" [fourColor]="true"></iu-progress>
 */
@Component({
  selector: 'iu-progress',
  standalone: true,
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProgressComponent {
  // --- Inputs ---
  /** Progress indicator type */
  type = input<ProgressType>('linear');

  /** Determinate value (0–1) */
  value = input<number>(0);

  /** Indeterminate mode (infinite animation) */
  indeterminate = input<boolean>(false);

  /** Four-color indeterminate animation */
  fourColor = input<boolean>(false);

  /** Accessible label for screen readers */
  ariaLabel = input<string>('');

  // --- Derived ---
  hostClass = computed(() => {
    const c = ['iu-progress', `iu-progress--${this.type()}`];
    if (this.indeterminate()) c.push('iu-progress--indeterminate');
    if (this.fourColor())     c.push('iu-progress--four-color');
    return c.join(' ');
  });
}
