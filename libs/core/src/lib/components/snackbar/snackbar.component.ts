import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
  computed,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type SnackbarVariant = 'single' | 'multi';

/**
 * IU Snackbar — Custom M3 implementation.
 *
 * Usage:
 *   <iu-snackbar message="Item deleted" action="Undo" [open]="true" />
 *
 * For programmatic usage, use SnackbarService.
 */
@Component({
  selector: 'iu-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnackbarComponent implements OnInit, OnDestroy {
  /** Snackbar message */
  message = input<string>('');

  /** Action button text */
  action = input<string>('');

  /** Variant: single or multi-line */
  variant = input<SnackbarVariant>('single');

  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration = input<number>(4000);

  /** Whether snackbar is open */
  open = input<boolean>(false);

  /** Show close icon */
  closeable = input<boolean>(false);

  /** Emitted when action button is clicked */
  actionClick = output<void>();

  /** Emitted when snackbar is dismissed */
  dismissed = output<void>();

  visible = signal(false);

  private _timer: ReturnType<typeof setTimeout> | null = null;

  hostClass = computed(() => {
    const classes = ['iu-snackbar', `iu-snackbar--${this.variant()}`];
    if (this.visible()) classes.push('iu-snackbar--open');
    return classes.join(' ');
  });

  hasAction = computed(() => !!this.action());

  ngOnInit(): void {
    if (this.open()) {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  show(): void {
    this.visible.set(true);
    this.startTimer();
  }

  hide(): void {
    this.visible.set(false);
    this.clearTimer();
    this.dismissed.emit();
  }

  onAction(): void {
    this.actionClick.emit();
    this.hide();
  }

  private startTimer(): void {
    this.clearTimer();
    const d = this.duration();
    if (d > 0) {
      this._timer = setTimeout(() => this.hide(), d);
    }
  }

  private clearTimer(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
