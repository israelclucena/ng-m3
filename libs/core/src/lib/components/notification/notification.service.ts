import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationConfig {
  /** Notification message */
  message: string;
  /** Notification type (determines icon and color) */
  type?: NotificationType;
  /** Action button text */
  action?: string;
  /** Auto-dismiss duration in ms (0 = manual dismiss only) */
  duration?: number;
  /** Callback when action is clicked */
  onAction?: () => void;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export interface NotificationItem extends Required<Omit<NotificationConfig, 'onAction' | 'onDismiss'>> {
  id: string;
  onAction?: () => void;
  onDismiss?: () => void;
  timestamp: number;
}

/**
 * NotificationService — Queued notification system built on snackbar patterns.
 *
 * Supports multiple notification types, queuing (max 1 visible at a time),
 * auto-dismiss, and action callbacks. Uses Angular Signals throughout.
 *
 * @example
 * ```typescript
 * constructor(private notify: NotificationService) {}
 *
 * this.notify.success('Item saved!');
 * this.notify.error('Failed to load data', { action: 'Retry', onAction: () => this.load() });
 * this.notify.info('New update available', { duration: 8000 });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _queue = signal<NotificationItem[]>([]);
  private _current = signal<NotificationItem | null>(null);
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _idCounter = 0;

  /** Current visible notification (readonly) */
  readonly current = this._current.asReadonly();

  /** Queue length (readonly) */
  readonly queueLength = computed(() => this._queue().length);

  /** Whether a notification is currently showing */
  readonly isVisible = computed(() => this._current() !== null);

  /** Show a notification with full config */
  show(config: NotificationConfig): string {
    const item: NotificationItem = {
      id: `notif-${++this._idCounter}-${Date.now()}`,
      message: config.message,
      type: config.type ?? 'info',
      action: config.action ?? '',
      duration: config.duration ?? 4000,
      onAction: config.onAction,
      onDismiss: config.onDismiss,
      timestamp: Date.now(),
    };

    if (this._current() === null) {
      this._showItem(item);
    } else {
      this._queue.update(q => [...q, item]);
    }

    return item.id;
  }

  /** Shorthand: info notification */
  info(message: string, opts?: Partial<NotificationConfig>): string {
    return this.show({ ...opts, message, type: 'info' });
  }

  /** Shorthand: success notification */
  success(message: string, opts?: Partial<NotificationConfig>): string {
    return this.show({ ...opts, message, type: 'success' });
  }

  /** Shorthand: warning notification */
  warning(message: string, opts?: Partial<NotificationConfig>): string {
    return this.show({ ...opts, message, type: 'warning' });
  }

  /** Shorthand: error notification */
  error(message: string, opts?: Partial<NotificationConfig>): string {
    return this.show({ ...opts, message, type: 'error', duration: opts?.duration ?? 6000 });
  }

  /** Dismiss current notification and show next in queue */
  dismiss(): void {
    const current = this._current();
    if (current?.onDismiss) {
      current.onDismiss();
    }
    this._clearTimer();
    this._current.set(null);
    this._showNext();
  }

  /** Trigger action on current notification */
  triggerAction(): void {
    const current = this._current();
    if (current?.onAction) {
      current.onAction();
    }
    this.dismiss();
  }

  /** Clear all queued notifications (does not dismiss current) */
  clearQueue(): void {
    this._queue.set([]);
  }

  /** Clear everything including current */
  clearAll(): void {
    this._clearTimer();
    this._queue.set([]);
    this._current.set(null);
  }

  /** Get icon for notification type */
  static getIcon(type: NotificationType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  private _showItem(item: NotificationItem): void {
    this._clearTimer();
    this._current.set(item);
    if (item.duration > 0) {
      this._timer = setTimeout(() => this.dismiss(), item.duration);
    }
  }

  private _showNext(): void {
    const queue = this._queue();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      this._queue.set(rest);
      // Small delay between notifications for visual separation
      setTimeout(() => this._showItem(next), 200);
    }
  }

  private _clearTimer(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
