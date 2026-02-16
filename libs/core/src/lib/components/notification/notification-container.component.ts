import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notification.service';

/**
 * NotificationContainer — Renders the current notification from NotificationService.
 *
 * Place once in your app root template:
 * ```html
 * <iu-notification-container />
 * ```
 */
@Component({
  selector: 'iu-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notification(); as notif) {
      <div class="iu-notification" [class]="hostClass()" role="alert" aria-live="polite">
        <span class="iu-notification__icon material-symbols-outlined">{{ icon() }}</span>
        <span class="iu-notification__message">{{ notif.message }}</span>
        @if (notif.action) {
          <button class="iu-notification__action" (click)="service.triggerAction()">
            {{ notif.action }}
          </button>
        }
        <button class="iu-notification__close" (click)="service.dismiss()" aria-label="Dismiss">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    }
  `,
  styleUrl: './notification-container.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainerComponent {
  readonly service = inject(NotificationService);

  readonly notification = this.service.current;

  readonly icon = computed(() => {
    const notif = this.notification();
    return notif ? NotificationService.getIcon(notif.type) : 'info';
  });

  readonly hostClass = computed(() => {
    const notif = this.notification();
    return notif ? `iu-notification--${notif.type}` : '';
  });
}
