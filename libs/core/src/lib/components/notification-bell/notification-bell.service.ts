import { Injectable, computed, signal } from '@angular/core';
import { AppNotification, NotificationCategory } from './notification-bell.types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const SEED: AppNotification[] = [
  {
    id: 'n1',
    category: 'message',
    title: 'Nova mensagem de Carlos Mendes',
    body: 'Que dia funciona melhor para si?',
    timestamp: '2026-03-12T00:45:00Z',
    read: false,
    actionRoute: '/messages/thread-1',
  },
  {
    id: 'n2',
    category: 'booking',
    title: 'Reserva confirmada',
    body: 'A sua reserva para T2 Bairro Alto foi confirmada para 1–30 Abril.',
    timestamp: '2026-03-11T18:00:00Z',
    read: false,
    actionRoute: '/my-bookings',
  },
  {
    id: 'n3',
    category: 'property',
    title: 'Preço reduzido: Estúdio Intendente',
    body: 'O preço baixou de 820€ para 750€/mês. Aproveite!',
    timestamp: '2026-03-11T12:00:00Z',
    read: true,
    actionRoute: '/properties',
  },
  {
    id: 'n4',
    category: 'system',
    title: 'Perfil incompleto',
    body: 'Complete o seu perfil para aumentar a confiança dos senhorios.',
    timestamp: '2026-03-10T09:00:00Z',
    read: true,
    actionRoute: '/profile',
  },
];

/**
 * NotificationBellService — manages in-app notifications with Angular Signals.
 */
@Injectable({ providedIn: 'root' })
export class NotificationBellService {
  private readonly _notifications = signal<AppNotification[]>(SEED);

  /** All notifications newest-first. */
  readonly notifications = computed(() =>
    [...this._notifications()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );

  /** Count of unread notifications. */
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  /** Whether there are any unread. */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Mark a single notification as read. */
  markRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  /** Mark all as read. */
  markAllRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  /** Dismiss (remove) a notification. */
  dismiss(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  /**
   * Add a new notification programmatically (e.g., from a service push).
   * @param category - Notification category.
   * @param title - Short title.
   * @param body - Body text.
   * @param actionRoute - Optional route.
   */
  push(
    category: NotificationCategory,
    title: string,
    body: string,
    actionRoute?: string
  ): void {
    const n: AppNotification = {
      id: uid(),
      category,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      actionRoute,
    };
    this._notifications.update(list => [n, ...list]);
  }
}
