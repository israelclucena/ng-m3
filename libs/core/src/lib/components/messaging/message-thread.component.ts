import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/button/filled-button.js';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, MessageThread } from './messaging.types';
import { CURRENT_USER_ID } from './messaging.service';

/**
 * MessageThreadComponent — renders a single conversation thread.
 *
 * Shows chat bubbles for each message, distinguishing between the current user
 * (right-aligned, primary colour) and the other participant (left-aligned, surface).
 *
 * @example
 * ```html
 * <iu-message-thread [thread]="thread" (messageSent)="onSend($event)" />
 * ```
 */
@Component({
  selector: 'iu-message-thread',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="iu-message-thread">
      <!-- Header -->
      <div class="iu-message-thread__header">
        <div class="iu-message-thread__participant">
          <div class="iu-message-thread__avatar">
            @if (thread()?.participantAvatar) {
              <img [src]="thread()!.participantAvatar" [alt]="thread()!.participantName" />
            } @else {
              <span>{{ initials() }}</span>
            }
          </div>
          <div class="iu-message-thread__participant-info">
            <span class="iu-message-thread__participant-name">{{ thread()?.participantName }}</span>
            @if (thread()?.propertyTitle) {
              <span class="iu-message-thread__property">{{ thread()!.propertyTitle }}</span>
            }
          </div>
        </div>
        @if (showClose()) {
          <md-icon-button (click)="closed.emit()">
            <md-icon>close</md-icon>
          </md-icon-button>
        }
      </div>

      <!-- Messages -->
      <div class="iu-message-thread__messages" #scrollContainer>
        @if (!thread() || thread()!.messages.length === 0) {
          <div class="iu-message-thread__empty">
            <md-icon>chat_bubble_outline</md-icon>
            <p>Ainda não há mensagens. Seja o primeiro a escrever!</p>
          </div>
        }
        @for (msg of thread()?.messages ?? []; track msg.id) {
          <div
            class="iu-message-bubble"
            [class.iu-message-bubble--mine]="isOwn(msg)"
            [class.iu-message-bubble--theirs]="!isOwn(msg)"
          >
            @if (!isOwn(msg)) {
              <div class="iu-message-bubble__avatar">
                <span>{{ initials() }}</span>
              </div>
            }
            <div class="iu-message-bubble__content">
              <p class="iu-message-bubble__text">{{ msg.text }}</p>
              <span class="iu-message-bubble__meta">
                {{ formatTime(msg.timestamp) }}
                @if (isOwn(msg)) {
                  <md-icon class="iu-message-bubble__read-icon">
                    {{ msg.read ? 'done_all' : 'done' }}
                  </md-icon>
                }
              </span>
            </div>
          </div>
        }
      </div>

      <!-- Input area -->
      <div class="iu-message-thread__input-area">
        <md-filled-text-field
          class="iu-message-thread__input"
          placeholder="Escreva uma mensagem…"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="submit()"
          supporting-text=""
        ></md-filled-text-field>
        <md-filled-button
          [disabled]="!draft().trim()"
          (click)="submit()"
          trailing-icon
        >
          Enviar
          <md-icon slot="icon">send</md-icon>
        </md-filled-button>
      </div>
    </div>
  `,
  styles: [`
    .iu-message-thread {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 420px;
      background: var(--md-sys-color-surface);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    /* Header */
    .iu-message-thread__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-shrink: 0;
    }
    .iu-message-thread__participant {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .iu-message-thread__avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      overflow: hidden;
      flex-shrink: 0;
    }
    .iu-message-thread__avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .iu-message-thread__participant-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .iu-message-thread__participant-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .iu-message-thread__property {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    /* Messages scrollable area */
    .iu-message-thread__messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .iu-message-thread__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 8px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-message-thread__empty md-icon {
      font-size: 48px;
      --md-icon-size: 48px;
    }
    .iu-message-thread__empty p {
      font-size: 14px;
      margin: 0;
    }

    /* Bubbles */
    .iu-message-bubble {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 75%;
    }
    .iu-message-bubble--mine {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    .iu-message-bubble--theirs {
      align-self: flex-start;
    }
    .iu-message-bubble__avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .iu-message-bubble__content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .iu-message-bubble--mine .iu-message-bubble__content {
      align-items: flex-end;
    }
    .iu-message-bubble--theirs .iu-message-bubble__content {
      align-items: flex-start;
    }
    .iu-message-bubble__text {
      margin: 0;
      padding: 10px 14px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
    }
    .iu-message-bubble--mine .iu-message-bubble__text {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border-bottom-right-radius: 4px;
    }
    .iu-message-bubble--theirs .iu-message-bubble__text {
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border-bottom-left-radius: 4px;
    }
    .iu-message-bubble__meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .iu-message-bubble__read-icon {
      font-size: 14px;
      --md-icon-size: 14px;
      color: var(--md-sys-color-primary);
    }

    /* Input area */
    .iu-message-thread__input-area {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      flex-shrink: 0;
    }
    .iu-message-thread__input {
      flex: 1;
      --md-filled-text-field-container-shape: 24px;
    }
  `],
})
export class MessageThreadComponent {
  /** The thread to display. */
  readonly thread = input<MessageThread | null>(null);

  /** Whether to show the close (X) button in the header. */
  readonly showClose = input<boolean>(false);

  /** Emitted when the user sends a new message (text). */
  readonly messageSent = output<string>();

  /** Emitted when the user clicks the close button. */
  readonly closed = output<void>();

  /** Ref to scroll container for auto-scroll. */
  private readonly scrollContainer = viewChild<ElementRef>('scrollContainer');

  /** Draft text for the input. */
  readonly draft = signal('');

  /** Computed initials for the other participant. */
  readonly initials = computed(() => {
    const name = this.thread()?.participantName ?? '';
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  constructor() {
    // Auto-scroll to bottom when messages change
    effect(() => {
      const thread = this.thread();
      if (thread) {
        setTimeout(() => {
          const el = this.scrollContainer()?.nativeElement as HTMLElement | undefined;
          if (el) el.scrollTop = el.scrollHeight;
        }, 50);
      }
    });
  }

  /** Check if a message belongs to the current user. */
  isOwn(msg: ChatMessage): boolean {
    return msg.senderId === CURRENT_USER_ID;
  }

  /** Format ISO timestamp to HH:MM. */
  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Submit the draft message. */
  submit(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.messageSent.emit(text);
    this.draft.set('');
  }
}
