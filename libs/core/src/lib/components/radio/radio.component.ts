import '@material/web/radio/radio.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * IU Radio — Angular wrapper over @material/web md-radio.
 *
 * M3 spec: 20×20px icon, 48×48px touch target.
 *
 * Usage:
 *   <iu-radio name="color" value="red" label="Red"></iu-radio>
 *   <iu-radio name="color" value="blue" label="Blue" [checked]="true"></iu-radio>
 */
@Component({
  selector: 'iu-radio',
  standalone: true,
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RadioComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // --- Inputs ---
  checked = input<boolean>(false);
  disabled = input<boolean>(false);
  name = input<string>('');
  value = input<string>('');
  label = input<string>('');
  ariaLabel = input<string>('');

  // --- Outputs ---
  change = output<string>();

  onChange(event: Event): void {
    this.change.emit(this.value());
  }
}
