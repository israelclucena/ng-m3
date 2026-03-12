import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
import '@material/web/button/filled-button.js';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

export type DialogType = 'alert' | 'simple';

/**
 * IU Dialog — Angular wrapper over @material/web md-dialog.
 *
 * Usage:
 *   <iu-dialog [open]="showDialog()" headline="Confirm" (closed)="onClose()">
 *     <p slot="content">Are you sure?</p>
 *     <div slot="actions">
 *       <iu-button variant="text" label="Cancel"></iu-button>
 *       <iu-button variant="primary" label="OK"></iu-button>
 *     </div>
 *   </iu-dialog>
 *
 * Slots:
 *   - content  → dialog body
 *   - actions  → footer action buttons
 */
@Component({
  selector: 'iu-dialog',
  standalone: true,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DialogComponent {
  private readonly el = inject(ElementRef<HTMLElement>);

  // --- Inputs ---
  /** Whether the dialog is open */
  open = input<boolean>(false);

  /** Dialog headline / title */
  headline = input<string>('');

  /** Supporting text (appears under headline if no content slot) */
  supportingText = input<string>('');

  /** Dialog type: 'alert' for non-dismissible, 'simple' for dismissible */
  type = input<DialogType>('simple');

  /** Material icon name for the headline icon */
  icon = input<string>('');

  // --- Outputs ---
  /** Emitted when the dialog opens */
  opened = output<void>();

  /** Emitted when the dialog closes (with returnValue) */
  closed = output<string>();

  // --- Computed ---
  hasIcon = computed(() => !!this.icon());
  hasHeadline = computed(() => !!this.headline());
  hasSupportingText = computed(() => !!this.supportingText());

  hostClass = computed(() => {
    const c = ['iu-dialog', `iu-dialog--${this.type()}`];
    return c.join(' ');
  });

  onOpened(): void {
    this.opened.emit();
  }

  onClosed(e: Event): void {
    const dialog = e.target as HTMLElement & { returnValue?: string };
    this.closed.emit(dialog.returnValue ?? '');
  }
}
