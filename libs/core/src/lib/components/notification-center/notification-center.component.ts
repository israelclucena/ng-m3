/**
 * @fileoverview NotificationCenterComponent — Sprint 036
 *
 * `iu-notification-center` — Full notification center drawer with filtering.
 *
 * Features:
 *   - Slide-in drawer (right side) with M3 surface design
 *   - Category tabs: All, Messages, Bookings, Maintenance, Leases, Payments, System
 *   - Read/unread visual distinction
 *   - Individual dismiss action
 *   - Mark all read button
 *   - Empty state per category
 *   - Badge counter on trigger button
 *
 * Feature flag: NOTIFICATION_CENTER
 *
 * @example
 * ```html
 * <!-- Drawer trigger button + overlay -->
 * <iu-notification-center />
 *
 * <!-- Standalone open (controlled) -->
 * <iu-notification-center [forceOpen]="true" />
 * ```
 */
import {
  Component, input, inject, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationCenterService, ExtendedCategory } from '../../services/notification-center.service';
import { AppNotification, NotificationCategory } from '../notification-bell/notification-bell.types';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-notification-center`
 *
 * Full-featured notification center with category filtering, read/unread management,
 * and dismiss actions. Can be used as a standalone drawer or embedded.
 *
 * Feature flag: NOTIFICATION_CENTER
 */
@Component({
  selector: 'iu-notification-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <!-- Trigger button (shown when not embedded) -->
    @if (!embedded()) {
      <button type="button" class="nc-trigger" (click)="svc.toggle()"
        [class.nc-trigger--open]="svc.isOpen()"
        [attr.aria-label]="'Notificações' + (svc.unreadCount() > 0 ? ' (' + svc.unreadCount() + ' não lidas)' : '')">
        <span class="material-symbols-outlined">notifications</span>
        @if (svc.unreadCount() > 0) {
          <span class="nc-badge">{{ svc.unreadCount() > 99 ? '99+' : svc.unreadCount() }}</span>
        }
      </button>
    }

    <!-- Overlay -->
    @if (svc.isOpen() || embedded()) {
      @if (!embedded()) {
        <div class="nc-overlay" (click)="svc.close()"></div>
      }

      <!-- Drawer -->
      <div class="nc-drawer" [class.nc-drawer--embedded]="embedded()">
        <!-- Drawer header -->
        <div class="nc-header">
          <div class="nc-header-left">
            <span class="material-symbols-outlined nc-header-icon">notifications</span>
            <div>
              <h2 class="nc-title">Notificações</h2>
              @if (svc.unreadCount() > 0) {
                <p class="nc-subtitle">{{ svc.unreadCount() }} não lida{{ svc.unreadCount() !== 1 ? 's' : '' }}</p>
              }
            </div>
          </div>
          <div class="nc-header-actions">
            @if (svc.unreadCount() > 0) {
              <button type="button" class="nc-btn nc-btn--text" (click)="svc.markAllRead()">
                <span class="material-symbols-outlined">done_all</span>
                Marcar todas
              </button>
            }
            @if (!embedded()) {
              <button type="button" class="nc-close-btn" (click)="svc.close()" aria-label="Fechar">
                <span class="material-symbols-outlined">close</span>
              </button>
            }
          </div>
        </div>

        <!-- Category tabs -->
        <div class="nc-tabs">
          @for (cat of visibleCategories(); track cat.id) {
            <button type="button" class="nc-tab"
              [class.nc-tab--active]="svc.activeCategory() === cat.id"
              (click)="svc.setCategory(cat.id)">
              <span class="material-symbols-outlined nc-tab-icon">{{ cat.icon }}</span>
              {{ cat.label }}
              @if (unreadForCat(cat.id) > 0) {
                <span class="nc-tab-badge">{{ unreadForCat(cat.id) }}</span>
              }
            </button>
          }
        </div>

        <!-- Notifications list -->
        <div class="nc-list">
          @if (svc.filtered().length === 0) {
            <div class="nc-empty">
              <span class="material-symbols-outlined nc-empty-icon">notifications_off</span>
              <p>Sem notificações{{ svc.activeCategory() !== 'all' ? ' nesta categoria' : '' }}</p>
            </div>
          } @else {
            @for (n of svc.filtered(); track n.id) {
              <div class="nc-item" [class.nc-item--unread]="!n.read" (click)="onItemClick(n)">
                <!-- Category icon -->
                <div class="nc-item-icon" [attr.data-category]="n.category">
                  <span class="material-symbols-outlined">{{ categoryIcon(n.category) }}</span>
                </div>

                <!-- Content -->
                <div class="nc-item-content">
                  <div class="nc-item-title">{{ n.title }}</div>
                  <div class="nc-item-body">{{ n.body }}</div>
                  <div class="nc-item-time">{{ timeAgo(n.timestamp) }}</div>
                </div>

                <!-- Unread dot + dismiss -->
                <div class="nc-item-meta">
                  @if (!n.read) {
                    <div class="nc-unread-dot"></div>
                  }
                  <button type="button" class="nc-dismiss-btn"
                    (click)="dismiss(n.id, $event)"
                    aria-label="Dispensar notificação">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            }
          }
        </div>

        <!-- Footer -->
        <div class="nc-footer">
          <p class="nc-footer-text">
            {{ svc.all().length }} notificações no total
          </p>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { position: relative; }
    /* Trigger */
    .nc-trigger {
      position: relative;
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--md-sys-color-surface-container);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      transition: background 0.15s;
    }
    .nc-trigger:hover { background: var(--md-sys-color-surface-container-high); }
    .nc-trigger--open { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .nc-badge {
      position: absolute; top: 4px; right: 4px;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: var(--md-sys-color-error); color: var(--md-sys-color-on-error);
      font-size: 10px; font-weight: 700; padding: 0 4px;
      display: flex; align-items: center; justify-content: center;
    }
    /* Overlay */
    .nc-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.32);
      z-index: 200;
      animation: nc-fade-in 0.2s ease;
    }
    @keyframes nc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    /* Drawer */
    .nc-drawer {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 380px; max-width: 100vw;
      background: var(--md-sys-color-surface);
      box-shadow: -4px 0 24px rgba(0,0,0,0.16);
      z-index: 201;
      display: flex; flex-direction: column;
      animation: nc-slide-in 0.25s cubic-bezier(0.2,0,0,1);
    }
    @keyframes nc-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .nc-drawer--embedded {
      position: relative; top: auto; right: auto; bottom: auto;
      width: 100%; max-width: none;
      box-shadow: none; border-radius: 16px; animation: none;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
    /* Header */
    .nc-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 20px 20px 16px; gap: 12px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .nc-header-left { display: flex; align-items: flex-start; gap: 10px; }
    .nc-header-icon { font-size: 28px; color: var(--md-sys-color-primary); }
    .nc-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .nc-subtitle { margin: 2px 0 0; font-size: 12px; color: var(--md-sys-color-primary); }
    .nc-header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .nc-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: none;
    }
    .nc-btn--text { background: transparent; color: var(--md-sys-color-primary); }
    .nc-btn--text:hover { background: var(--md-sys-color-primary-container); }
    .nc-close-btn {
      width: 34px; height: 34px; border-radius: 50%; border: none;
      background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
    }
    .nc-close-btn:hover { background: var(--md-sys-color-surface-container); }
    /* Tabs */
    .nc-tabs {
      display: flex; gap: 4px; padding: 10px 12px;
      overflow-x: auto; border-bottom: 1px solid var(--md-sys-color-outline-variant);
      scrollbar-width: none;
    }
    .nc-tabs::-webkit-scrollbar { display: none; }
    .nc-tab {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 16px; white-space: nowrap;
      font-size: 12px; font-weight: 600; cursor: pointer; border: none;
      background: transparent; color: var(--md-sys-color-on-surface-variant);
      transition: all 0.15s;
    }
    .nc-tab:hover { background: var(--md-sys-color-surface-container); }
    .nc-tab--active {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }
    .nc-tab-icon { font-size: 14px; }
    .nc-tab-badge {
      background: var(--md-sys-color-error); color: var(--md-sys-color-on-error);
      min-width: 16px; height: 16px; border-radius: 8px;
      font-size: 10px; font-weight: 700; padding: 0 3px;
      display: flex; align-items: center; justify-content: center;
    }
    /* List */
    .nc-list { flex: 1; overflow-y: auto; padding: 8px; }
    .nc-empty {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 48px 16px; text-align: center;
      color: var(--md-sys-color-on-surface-variant); opacity: 0.6;
    }
    .nc-empty-icon { font-size: 40px; }
    .nc-empty p { margin: 0; font-size: 14px; }
    /* Items */
    .nc-item {
      display: flex; gap: 10px; padding: 12px 10px; border-radius: 10px;
      cursor: pointer; transition: background 0.12s; align-items: flex-start;
    }
    .nc-item:hover { background: var(--md-sys-color-surface-container-low); }
    .nc-item--unread { background: var(--md-sys-color-surface-container-lowest); }
    .nc-item-icon {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .nc-item-icon .material-symbols-outlined { font-size: 18px; }
    .nc-item-icon[data-category="message"]  { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
    .nc-item-icon[data-category="booking"]  { background: var(--md-sys-color-tertiary-container);  color: var(--md-sys-color-on-tertiary-container); }
    .nc-item-icon[data-category="property"] { background: var(--md-sys-color-primary-container);   color: var(--md-sys-color-on-primary-container); }
    .nc-item-icon[data-category="alert"]    { background: var(--md-sys-color-error-container);     color: var(--md-sys-color-on-error-container); }
    .nc-item-icon[data-category="system"]   { background: var(--md-sys-color-surface-container);   color: var(--md-sys-color-on-surface-variant); }
    .nc-item-content { flex: 1; min-width: 0; }
    .nc-item-title { font-weight: 600; font-size: 13px; color: var(--md-sys-color-on-surface); margin-bottom: 2px; }
    .nc-item--unread .nc-item-title { font-weight: 700; }
    .nc-item-body {
      font-size: 12px; color: var(--md-sys-color-on-surface-variant);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .nc-item-time { font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-top: 4px; opacity: 0.7; }
    .nc-item-meta { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; padding-top: 2px; }
    .nc-unread-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--md-sys-color-primary);
    }
    .nc-dismiss-btn {
      width: 24px; height: 24px; border-radius: 50%; border: none;
      background: transparent; cursor: pointer; opacity: 0;
      display: flex; align-items: center; justify-content: center;
      color: var(--md-sys-color-on-surface-variant); transition: opacity 0.15s;
    }
    .nc-dismiss-btn .material-symbols-outlined { font-size: 14px; }
    .nc-item:hover .nc-dismiss-btn { opacity: 1; }
    /* Footer */
    .nc-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .nc-footer-text { margin: 0; font-size: 12px; color: var(--md-sys-color-on-surface-variant); text-align: center; }
  `],
})
export class NotificationCenterComponent {
  readonly svc = inject(NotificationCenterService);

  /** @input If true, renders inline without overlay/trigger */
  readonly embedded = input(false);

  /** Only show categories that have notifications (+ 'all') */
  readonly visibleCategories = computed(() => {
    const counts = this.svc.categoryCount();
    return this.svc.categories.filter(cat =>
      cat.id === 'all' || (counts[cat.id as string] ?? 0) > 0
    );
  });

  onItemClick(n: AppNotification): void {
    if (!n.read) this.svc.markRead(n.id);
  }

  dismiss(id: string, e: Event): void {
    e.stopPropagation();
    this.svc.dismiss(id);
  }

  unreadForCat(catId: ExtendedCategory): number {
    const counts = this.svc.unreadByCategory();
    if (catId === 'all') return counts['all'] ?? 0;
    return counts[catId as string] ?? 0;
  }

  categoryIcon(cat: NotificationCategory): string {
    const map: Record<NotificationCategory, string> = {
      message: 'chat', booking: 'event', property: 'home',
      system: 'info', alert: 'warning',
    };
    return map[cat] ?? 'notifications';
  }

  timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `há ${days} dia${days !== 1 ? 's' : ''}`;
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }
}
