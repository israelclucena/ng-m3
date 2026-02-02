import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

/**
 * IU Divider — Angular wrapper over @material/web md-divider.
 *
 * Usage:
 *   <iu-divider></iu-divider>
 *   <iu-divider [inset]="true"></iu-divider>
 *   <iu-divider [insetStart]="true"></iu-divider>
 */
@Component({
  selector: 'iu-divider',
  standalone: true,
  templateUrl: './divider.component.html',
  styleUrl: './divider.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DividerComponent {
  // --- Inputs ---
  /** Inset on both sides */
  inset = input<boolean>(false);

  /** Inset on start side only */
  insetStart = input<boolean>(false);

  /** Inset on end side only */
  insetEnd = input<boolean>(false);

  // --- Computed ---
  hostClass = computed(() => {
    const c = ['iu-divider'];
    if (this.inset()) c.push('iu-divider--inset');
    if (this.insetStart()) c.push('iu-divider--inset-start');
    if (this.insetEnd()) c.push('iu-divider--inset-end');
    return c.join(' ');
  });
}
