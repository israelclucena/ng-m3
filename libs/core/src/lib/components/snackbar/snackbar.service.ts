import { Injectable, signal } from '@angular/core';

export interface SnackbarConfig {
  message: string;
  action?: string;
  duration?: number;
  variant?: 'single' | 'multi';
  closeable?: boolean;
}

export interface SnackbarState extends Required<Omit<SnackbarConfig, 'action' | 'closeable'>> {
  action: string;
  closeable: boolean;
  open: boolean;
  onAction?: () => void;
}

/**
 * SnackbarService — Programmatic snackbar management.
 *
 * Usage:
 *   constructor(private snackbar: SnackbarService) {}
 *
 *   this.snackbar.show({ message: 'Item deleted', action: 'Undo' });
 *   this.snackbar.show({ message: 'Saved!' });
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private _state = signal<SnackbarState>({
    message: '',
    action: '',
    duration: 4000,
    variant: 'single',
    closeable: false,
    open: false,
  });

  /** Current snackbar state (readonly signal) */
  readonly state = this._state.asReadonly();

  /** Show a snackbar */
  show(config: SnackbarConfig, onAction?: () => void): void {
    this._state.set({
      message: config.message,
      action: config.action ?? '',
      duration: config.duration ?? 4000,
      variant: config.variant ?? 'single',
      closeable: config.closeable ?? false,
      open: true,
      onAction,
    });
  }

  /** Dismiss the current snackbar */
  dismiss(): void {
    this._state.update((s) => ({ ...s, open: false }));
  }
}
