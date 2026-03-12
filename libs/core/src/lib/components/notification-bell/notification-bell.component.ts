import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/button/text-button.js';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  ViewEncapsulation,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotification } from './notification-bell.types';
import { NotificationBellService } from './notification-bell.service';

/** Icon map per category. */
const CATEGORY_ICON: Record<string, string> = {
  message: 'chat',
  booking: 'event_available',
  property: 'home',
  system: 'info',
  alert: 'warning',
};

/** Colour class per category (uses M3 tokens via CSS). */
const CATEGORY_CLASS: Record<string, string> = {
  message: 'iu-notif-item--message',
  booking: 'iu-notif-item--booking',
  property: 'iu-notif-item--property',
  system: 'iu-notif-item--system',
  alert: 'iu-notif-item--alert',
};

/**
 * NotificationBellComponent — header bell icon with animated badge and dropdown panel.
 *
 * Integrates with NotificationBellService (signals-based) to show unread count
 * and a panel with recent notifications. Closes on outside click.
 *
 * @example
 * ```html
 * <iu-notification-bell (notificationClicked)="handleRoute($event)" />
 * ```
 */
@Component({
  selector: 'iu-notification-bell',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-notification-bell" [class.iu-notification-bell--open]="open()">
      <!-- Bell button -->
      <button
        class="iu-notification-bell__btn"
        (click)="togglePanel($event)"
        [attr.aria-label]="'Notificações' + (svc.unreadCount() > 0 ? ' (' + svc.unreadCount() + ' não lidas)' : '')"
        aria-haspopup="true"
        [attr.aria-expanded]="open()"
      >
        <md-icon class="iu-notification-bell__icon" [class.iu-notification-bell__icon--has-unread]="svc.hasUnread()">
          {{ svc.hasUnread() ? 'notifications_active' : 'notifications' }}
        </md-icon>
        @if (svc.unreadCount() > 0) {
          <span class="iu-notification-bell__badge">
            {{ svc.unreadCount() > 9 ? '9+' : svc.unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown panel -->
      @if (open()) {
        <div class="iu-notification-bell__panel" role="dialog" aria-label="Notificações">
          <!-- Panel header -->
          <div class="iu-notification-bell__panel-header">
            <span class="iu-notification-bell__panel-title">Notificações</span>
            @if (svc.hasUnread()) {
              <button
                class="iu-notification-bell__mark-all"
                (click)="markAll()"
              >
                Marcar todas como lidas
              </button>
            }
          </div>

          <!-- Notification list -->
          <ul class="iu-notification-bell__list">
            @if (svc.notifications().length === 0) {
              <li class="iu-notification-bell__empty">
                <md-icon>notifications_off</md-icon>
                <span>Sem notificações</span>
              </li>
            }
            @for (notif of svc.notifications(); track notif.id) {
              <li
                class="iu-notif-item"
                [class.iu-notif-item--unread]="!notif.read"
                [class]="[getCategoryClass(notif)]"
                (click)="onNotifClick(notif)"
                (keydown.enter)="onNotifClick(notif)"
                tabindex="0"
                role="button"
              >
                <div class="iu-notif-item__icon-wrap">
                  <md-icon class="iu-notif-item__icon">{{ getCategoryIcon(notif) }}</md-icon>
                </div>
                <div class="iu-notif-item__body">
                  <span class="iu-notif-item__title">{{ notif.title }}</span>
                  <span class="iu-notif-item__text">{{ notif.body }}</span>
                  <span class="iu-notif-item__time">{{ formatTime(notif.timestamp) }}</span>
                </div>
                <button
                  class="iu-notif-item__dismiss"
                  (click)="dismiss($event, notif.id)"
                  aria-label="Dispensar notificação"
                >
                  <md-icon>close</md-icon>
                </button>
                @if (!notif.read) {
                  <span class="iu-notif-item__dot"></span>
                }
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .iu-notification-bell {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    /* Bell button */
    .iu-notification-bell__btn {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-notification-bell__btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
    }
    .iu-notification-bell__btn:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: 2px;
    }
    .iu-notification-bell__icon {
      font-size: 24px;
      --md-icon-size: 24px;
      transition: color 0.2s ease;
    }
    .iu-notification-bell__icon--has-unread {
      color: var(--md-sys-color-primary);
      animation: bellRing 1s ease-in-out;
    }
    @keyframes bellRing {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(15deg); }
      40% { transform: rotate(-15deg); }
      60% { transform: rotate(8deg); }
      80% { transform: rotate(-8deg); }
    }

    /* Badge */
    .iu-notification-bell__badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      border-radius: 10px;
      padding: 1px 5px;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.4;
      min-width: 16px;
      text-align: center;
      border: 1.5px solid var(--md-sys-color-surface);
    }

    /* Panel */
    .iu-notification-bell__panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      max-height: 480px;
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface-container);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 16px;
      box-shadow: var(--md-sys-elevation-3,
        0 4px 8px rgba(0,0,0,0.12),
        0 8px 16px rgba(0,0,0,0.08));
      z-index: 1000;
      overflow: hidden;
      animation: panelIn 0.18s ease-out;
    }
    @keyframes panelIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Panel header */
    .iu-notification-bell__panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-shrink: 0;
    }
    .iu-notification-bell__panel-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .iu-notification-bell__mark-all {
      background: none;
      border: none;
      font-size: 12px;
      color: var(--md-sys-color-primary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .iu-notification-bell__mark-all:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
    }

    /* Notification list */
    .iu-notification-bell__list {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      flex: 1;
    }
    .iu-notification-bell__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      gap: 8px;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 14px;
    }
    .iu-notification-bell__empty md-icon {
      font-size: 36px;
      --md-icon-size: 36px;
    }

    /* Notification item */
    .iu-notif-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      cursor: pointer;
      transition: background 0.12s ease;
      outline: none;
    }
    .iu-notif-item:last-child {
      border-bottom: none;
    }
    .iu-notif-item:hover,
    .iu-notif-item:focus-visible {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
    }
    .iu-notif-item--unread {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 40%, transparent);
    }
    .iu-notif-item--unread:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary-container) 60%, transparent);
    }

    /* Icon wrap per category */
    .iu-notif-item__icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--md-sys-color-secondary-container);
    }
    .iu-notif-item--message  .iu-notif-item__icon-wrap { background: var(--md-sys-color-primary-container); }
    .iu-notif-item--booking  .iu-notif-item__icon-wrap { background: var(--md-sys-color-tertiary-container); }
    .iu-notif-item--alert    .iu-notif-item__icon-wrap { background: var(--md-sys-color-error-container); }

    .iu-notif-item__icon {
      font-size: 18px;
      --md-icon-size: 18px;
      color: var(--md-sys-color-on-secondary-container);
    }
    .iu-notif-item--message  .iu-notif-item__icon { color: var(--md-sys-color-on-primary-container); }
    .iu-notif-item--booking  .iu-notif-item__icon { color: var(--md-sys-color-on-tertiary-container); }
    .iu-notif-item--alert    .iu-notif-item__icon { color: var(--md-sys-color-on-error-container); }

    /* Text body */
    .iu-notif-item__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .iu-notif-item__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      line-height: 1.3;
    }
    .iu-notif-item__text {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .iu-notif-item__time {
      font-size: 11px;
      color: var(--md-sys-color-outline);
      margin-top: 2px;
    }

    /* Dismiss button */
    .iu-notif-item__dismiss {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0;
      transition: opacity 0.15s, background 0.15s;
      flex-shrink: 0;
    }
    .iu-notif-item:hover .iu-notif-item__dismiss {
      opacity: 1;
    }
    .iu-notif-item__dismiss:hover {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
    }
    .iu-notif-item__dismiss md-icon {
      font-size: 16px;
      --md-icon-size: 16px;
    }

    /* Unread dot */
    .iu-notif-item__dot {
      position: absolute;
      top: 14px;
      right: 12px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--md-sys-color-primary);
    }
  `],
})
export class NotificationBellComponent {
  /** Service injected. */
  readonly svc = inject(NotificationBellService);

  /** Panel open state. */
  readonly open = signal(false);

  /** Emitted when a notification with an actionRoute is clicked. */
  readonly notificationClicked = output<AppNotification>();

  /** Toggle the dropdown panel. */
  togglePanel(event: Event): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  /** Close on outside click. */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.open.set(false);
  }

  /** Handle notification row click. */
  onNotifClick(notif: AppNotification): void {
    this.svc.markRead(notif.id);
    this.notificationClicked.emit(notif);
    this.open.set(false);
  }

  /** Dismiss a notification (stop propagation so panel doesn't open). */
  dismiss(event: Event, id: string): void {
    event.stopPropagation();
    this.svc.dismiss(id);
  }

  /** Mark all as read. */
  markAll(): void {
    this.svc.markAllRead();
  }

  getCategoryIcon(notif: AppNotification): string {
    return CATEGORY_ICON[notif.category] ?? 'circle_notifications';
  }

  getCategoryClass(notif: AppNotification): string {
    return CATEGORY_CLASS[notif.category] ?? '';
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3_600_000;
    if (diffH < 1) return 'Agora mesmo';
    if (diffH < 24) return `há ${Math.floor(diffH)}h`;
    if (diffH < 48) return 'Ontem';
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }
}
