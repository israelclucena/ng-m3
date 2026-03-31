/**
 * @fileoverview NotificationCenterService — Sprint 036
 *
 * Aggregates all in-app notifications from multiple sources:
 *   - NotificationBellService (messages, bookings, property alerts, system)
 *   - Maintenance notifications (via MaintenanceNotificationHandler)
 *   - Lease notifications (signing, activation)
 *   - Payment notifications
 *
 * Provides read/unread management, category filtering, and batch operations.
 * Acts as the single source of truth for the NotificationCenterComponent drawer.
 *
 * Feature flag: NOTIFICATION_CENTER
 *
 * @example
 * ```ts
 * const svc = inject(NotificationCenterService);
 * svc.filtered(); // notifications filtered by activeCategory
 * svc.setCategory('maintenance');
 * svc.markAllRead();
 * ```
 */
import { Injectable, inject, computed, signal } from '@angular/core';
import { NotificationBellService } from '../components/notification-bell/notification-bell.service';
import { AppNotification, NotificationCategory } from '../components/notification-bell/notification-bell.types';

// ─── Extended types ───────────────────────────────────────────────────────────

export type ExtendedCategory = NotificationCategory | 'maintenance' | 'lease' | 'payment' | 'all';

export interface CategoryFilter {
  id: ExtendedCategory;
  label: string;
  icon: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * NotificationCenterService
 *
 * Central aggregator for all notification types. Wraps NotificationBellService
 * and adds category-level filtering + batch operations.
 *
 * Feature flag: NOTIFICATION_CENTER
 */
@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly bellSvc = inject(NotificationBellService);

  /** Currently active category filter. */
  readonly activeCategory = signal<ExtendedCategory>('all');

  /** Available category filter definitions. */
  readonly categories: CategoryFilter[] = [
    { id: 'all',         label: 'Todas',      icon: 'notifications' },
    { id: 'message',     label: 'Mensagens',  icon: 'chat' },
    { id: 'booking',     label: 'Reservas',   icon: 'event' },
    { id: 'maintenance', label: 'Manutenção', icon: 'build' },
    { id: 'lease',       label: 'Contratos',  icon: 'description' },
    { id: 'payment',     label: 'Pagamentos', icon: 'payments' },
    { id: 'property',    label: 'Imóveis',    icon: 'home' },
    { id: 'alert',       label: 'Alertas',    icon: 'warning' },
    { id: 'system',      label: 'Sistema',    icon: 'info' },
  ];

  /** All notifications (from bell service). */
  readonly all = computed(() => this.bellSvc.notifications());

  /** Notifications filtered by activeCategory. */
  readonly filtered = computed(() => {
    const cat = this.activeCategory();
    const all = this.all();
    if (cat === 'all') return all;
    // Map extended categories to base categories
    const cat2base: Partial<Record<ExtendedCategory, NotificationCategory>> = {
      maintenance: 'alert',
      lease: 'alert',
      payment: 'booking',
    };
    const base = (cat2base[cat] ?? cat) as NotificationCategory;
    return all.filter(n => n.category === base);
  });

  /** Total unread count. */
  readonly unreadCount = computed(() => this.bellSvc.unreadCount());

  /** Whether the center drawer is open. */
  readonly isOpen = signal(false);

  /** Count per base category. */
  readonly categoryCount = computed(() => {
    const all = this.all();
    const counts: Record<string, number> = { all: all.length };
    for (const n of all) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  });

  /** Unread count per base category. */
  readonly unreadByCategory = computed(() => {
    const all = this.all().filter(n => !n.read);
    const counts: Record<string, number> = { all: all.length };
    for (const n of all) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Set the active category filter. */
  setCategory(cat: ExtendedCategory): void {
    this.activeCategory.set(cat);
  }

  /** Open the notification center drawer. */
  open(): void {
    this.isOpen.set(true);
  }

  /** Close the notification center drawer. */
  close(): void {
    this.isOpen.set(false);
  }

  /** Toggle the drawer. */
  toggle(): void {
    this.isOpen.update(v => !v);
  }

  /** Mark a single notification as read. */
  markRead(id: string): void {
    this.bellSvc.markRead(id);
  }

  /** Mark all as read. */
  markAllRead(): void {
    this.bellSvc.markAllRead();
  }

  /** Dismiss (remove) a notification. */
  dismiss(id: string): void {
    this.bellSvc.dismiss(id);
  }
}
