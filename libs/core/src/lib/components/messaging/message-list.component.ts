import '@material/web/icon/icon.js';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageThread } from './messaging.types';

/**
 * MessageListComponent — shows a list of conversation threads.
 *
 * Displays participant name, last message preview, unread count badge, and timestamp.
 * Emits `threadSelected` when the user taps a thread row.
 *
 * @example
 * ```html
 * <iu-message-list [threads]="threads" (threadSelected)="onSelect($event)" />
 * ```
 */
@Component({
  selector: 'iu-message-list',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-message-list">
      <div class="iu-message-list__header">
        <h3 class="iu-message-list__title">
          <md-icon>chat</md-icon>
          Mensagens
          @if (totalUnread() > 0) {
            <span class="iu-message-list__total-badge">{{ totalUnread() }}</span>
          }
        </h3>
      </div>

      @if (threads().length === 0) {
        <div class="iu-message-list__empty">
          <md-icon>mark_chat_unread</md-icon>
          <p>Sem conversas ainda.</p>
          <span>As suas mensagens com senhorios aparecerão aqui.</span>
        </div>
      }

      <ul class="iu-message-list__items">
        @for (thread of sortedThreads(); track thread.id) {
          <li
            class="iu-message-list__item"
            [class.iu-message-list__item--unread]="thread.unreadCount > 0"
            (click)="threadSelected.emit(thread)"
            (keydown.enter)="threadSelected.emit(thread)"
            tabindex="0"
            role="button"
            [attr.aria-label]="'Conversa com ' + thread.participantName"
          >
            <!-- Avatar -->
            <div class="iu-message-list__avatar">
              @if (thread.participantAvatar) {
                <img [src]="thread.participantAvatar" [alt]="thread.participantName" />
              } @else {
                <span>{{ getInitials(thread.participantName) }}</span>
              }
              @if (thread.unreadCount > 0) {
                <span class="iu-message-list__unread-dot"></span>
              }
            </div>

            <!-- Body -->
            <div class="iu-message-list__body">
              <div class="iu-message-list__row">
                <span class="iu-message-list__name">{{ thread.participantName }}</span>
                <span class="iu-message-list__time">{{ formatDate(thread.lastMessageAt) }}</span>
              </div>
              @if (thread.propertyTitle) {
                <span class="iu-message-list__property">{{ thread.propertyTitle }}</span>
              }
              <div class="iu-message-list__row">
                <span class="iu-message-list__preview">
                  {{ getLastMessage(thread) }}
                </span>
                @if (thread.unreadCount > 0) {
                  <span class="iu-message-list__badge">{{ thread.unreadCount }}</span>
                }
              </div>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .iu-message-list {
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface);
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant);
      overflow: hidden;
    }

    /* Header */
    .iu-message-list__header {
      padding: 16px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
    }
    .iu-message-list__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .iu-message-list__total-badge {
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 700;
    }

    /* Empty */
    .iu-message-list__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      gap: 8px;
      color: var(--md-sys-color-on-surface-variant);
      text-align: center;
    }
    .iu-message-list__empty md-icon {
      font-size: 40px;
      --md-icon-size: 40px;
    }
    .iu-message-list__empty p {
      margin: 0;
      font-weight: 600;
    }
    .iu-message-list__empty span {
      font-size: 13px;
    }

    /* List items */
    .iu-message-list__items {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .iu-message-list__item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      transition: background 0.15s ease;
      outline: none;
    }
    .iu-message-list__item:last-child {
      border-bottom: none;
    }
    .iu-message-list__item:hover,
    .iu-message-list__item:focus-visible {
      background: var(--md-sys-color-surface-container-low);
    }
    .iu-message-list__item--unread {
      background: var(--md-sys-color-secondary-container, #e8def8);
    }
    .iu-message-list__item--unread:hover {
      background: color-mix(in srgb, var(--md-sys-color-secondary-container) 80%, var(--md-sys-color-secondary) 20%);
    }

    /* Avatar */
    .iu-message-list__avatar {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 700;
      flex-shrink: 0;
      overflow: visible;
    }
    .iu-message-list__avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .iu-message-list__unread-dot {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--md-sys-color-primary);
      border: 2px solid var(--md-sys-color-surface);
    }

    /* Body */
    .iu-message-list__body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .iu-message-list__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .iu-message-list__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .iu-message-list__time {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      flex-shrink: 0;
    }
    .iu-message-list__property {
      font-size: 12px;
      color: var(--md-sys-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .iu-message-list__preview {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .iu-message-list__item--unread .iu-message-list__preview {
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
    }
    .iu-message-list__badge {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-radius: 10px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
  `],
})
export class MessageListComponent {
  /** Thread list. */
  readonly threads = input<MessageThread[]>([]);

  /** Emitted when user selects a thread. */
  readonly threadSelected = output<MessageThread>();

  /** Computed sorted threads (unread first, then by timestamp). */
  get sortedThreads(): () => MessageThread[] {
    return () =>
      [...this.threads()].sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
  }

  /** Computed total unread. */
  totalUnread(): number {
    return this.threads().reduce((s, t) => s + t.unreadCount, 0);
  }

  /** Extracts initials from a name. */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /** Returns the last message preview text. */
  getLastMessage(thread: MessageThread): string {
    const last = thread.messages[thread.messages.length - 1];
    if (!last) return '';
    return last.text.length > 50 ? last.text.slice(0, 47) + '…' : last.text;
  }

  /** Formats ISO to relative / time string. */
  formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3_600_000;
    if (diffH < 24) {
      return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffH < 48) return 'Ontem';
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }
}
