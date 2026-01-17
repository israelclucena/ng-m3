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
 * IU Checkbox — Angular wrapper over @material/web md-checkbox.
 *
 * M3 spec: 18×18px icon, 48×48px touch target, corner radius 2px.
 *
 * Usage:
 *   <iu-checkbox label="Accept terms" [checked]="true"></iu-checkbox>
 *   <iu-checkbox [indeterminate]="true"></iu-checkbox>
 */
@Component({
  selector: 'iu-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckboxComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // --- Inputs ---
  checked = input<boolean>(false);
  indeterminate = input<boolean>(false);
  disabled = input<boolean>(false);
  label = input<string>('');
  ariaLabel = input<string>('');

  // --- Outputs ---
  change = output<boolean>();

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement & { checked: boolean };
    this.change.emit(target.checked);
  }
}
