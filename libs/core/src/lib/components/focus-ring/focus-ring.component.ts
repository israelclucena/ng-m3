import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

/**
 * IU Focus Ring — Angular wrapper over @material/web md-focus-ring.
 *
 * Adds an M3 focus ring to any focusable element.
 * Place inside the same container as the focusable element.
 *
 * Usage:
 *   <div style="position: relative;">
 *     <iu-focus-ring></iu-focus-ring>
 *     <button>Focusable</button>
 *   </div>
 */
@Component({
  selector: 'iu-focus-ring',
  standalone: true,
  templateUrl: './focus-ring.component.html',
  styleUrl: './focus-ring.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FocusRingComponent {
  /** Make focus ring visible even without keyboard focus (for demos) */
  visible = input<boolean>(false);

  /** Render as inward ring instead of outward */
  inward = input<boolean>(false);
}
