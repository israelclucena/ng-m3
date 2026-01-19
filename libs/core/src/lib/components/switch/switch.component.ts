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
 * IU Switch — Angular wrapper over @material/web md-switch.
 *
 * M3 spec: 52×32px track, 28px handle selected / 16px unselected.
 *
 * Usage:
 *   <iu-switch label="Dark mode" [selected]="true"></iu-switch>
 *   <iu-switch [icons]="true" label="Notifications"></iu-switch>
 */
@Component({
  selector: 'iu-switch',
  standalone: true,
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SwitchComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // --- Inputs ---
  selected = input<boolean>(false);
  disabled = input<boolean>(false);
  icons = input<boolean>(false);
  label = input<string>('');
  ariaLabel = input<string>('');

  // --- Outputs ---
  change = output<boolean>();

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement & { selected: boolean };
    this.change.emit(target.selected);
  }
}
