import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BottomSheetVariant = 'standard' | 'modal';

/**
 * IU Bottom Sheet — Custom M3 implementation.
 *
 * Usage:
 *   <iu-bottom-sheet [open]="true" variant="modal" [dragHandle]="true">
 *     <p>Sheet content here</p>
 *   </iu-bottom-sheet>
 */
@Component({
  selector: 'iu-bottom-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant() === 'modal' && open()) {
      <div class="iu-bottom-sheet__scrim" (click)="dismiss()"></div>
    }
    <div [class]="hostClass()">
      @if (dragHandle()) {
        <div class="iu-bottom-sheet__handle-bar">
          <div class="iu-bottom-sheet__handle"></div>
        </div>
      }
      <div class="iu-bottom-sheet__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './bottom-sheet.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  /** Whether the sheet is open */
  open = input<boolean>(false);

  /** Sheet variant */
  variant = input<BottomSheetVariant>('standard');

  /** Show drag handle */
  dragHandle = input<boolean>(true);

  /** Emitted when sheet is dismissed (scrim click or drag) */
  dismissed = output<void>();

  hostClass = computed(() => {
    const classes = [
      'iu-bottom-sheet',
      `iu-bottom-sheet--${this.variant()}`,
    ];
    if (this.open()) classes.push('iu-bottom-sheet--open');
    return classes.join(' ');
  });

  dismiss(): void {
    this.dismissed.emit();
  }
}
