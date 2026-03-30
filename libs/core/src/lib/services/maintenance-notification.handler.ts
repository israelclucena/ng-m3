/**
 * @fileoverview MaintenanceNotificationHandler — Sprint 035
 *
 * Bridges `MaintenanceRequestService` status transitions with `NotificationBellService`.
 * When a maintenance request status changes, the tenant receives an in-app notification.
 *
 * Purely additive — wraps `updateStatus()` calls without modifying the base service.
 *
 * Status transition messages:
 * - pending → in-progress : "O seu pedido está a ser tratado"
 * - in-progress → resolved : "O problema foi resolvido"
 * - * → rejected           : "O seu pedido foi recusado"
 *
 * Feature flag: MAINTENANCE_NOTIFICATIONS
 *
 * @example
 * ```ts
 * // In a component/page (landlord side):
 * const handler = inject(MaintenanceNotificationHandler);
 * handler.updateStatus('mr-001', { status: 'in-progress' });
 * // → MaintenanceRequestService updated + NotificationBellService notified
 * ```
 */
import { Injectable, inject } from '@angular/core';
import {
  MaintenanceRequestService,
  UpdateMaintenanceStatusPayload,
  MaintenanceStatus,
} from './maintenance-request.service';
import { NotificationBellService } from '../components/notification-bell/notification-bell.service';

// ─── Notification messages per transition ─────────────────────────────────────

interface TransitionMessage {
  title: string;
  body: (requestTitle: string, resolution?: string) => string;
}

const TRANSITION_MESSAGES: Partial<Record<MaintenanceStatus, TransitionMessage>> = {
  'in-progress': {
    title: 'Pedido em Tratamento',
    body: (t) => `O seu pedido "${t}" está a ser tratado pelo senhorio.`,
  },
  resolved: {
    title: 'Pedido Resolvido ✓',
    body: (t, res) =>
      res
        ? `O problema "${t}" foi resolvido. Notas: ${res}`
        : `O problema "${t}" foi marcado como resolvido.`,
  },
  rejected: {
    title: 'Pedido Recusado',
    body: (t) => `O seu pedido "${t}" foi recusado. Contacte o senhorio para mais informações.`,
  },
};

// ─── Handler Service ──────────────────────────────────────────────────────────

/**
 * MaintenanceNotificationHandler
 *
 * Injectable service that wraps `MaintenanceRequestService.updateStatus()`
 * and automatically pushes an `AppNotification` to `NotificationBellService`
 * when the status transition warrants user feedback.
 *
 * Feature flag: MAINTENANCE_NOTIFICATIONS
 */
@Injectable({ providedIn: 'root' })
export class MaintenanceNotificationHandler {
  private readonly maintenanceSvc = inject(MaintenanceRequestService);
  private readonly notifSvc = inject(NotificationBellService);

  /**
   * Update maintenance request status AND push a notification if applicable.
   *
   * @param id - Maintenance request ID
   * @param payload - Status update payload
   */
  updateStatus(id: string, payload: UpdateMaintenanceStatusPayload): void {
    // Fetch current request before update
    const request = this.maintenanceSvc.requests().find(r => r.id === id);

    // Apply status update via base service
    this.maintenanceSvc.updateStatus(id, payload);

    // Push notification if transition message exists
    const msg = TRANSITION_MESSAGES[payload.status];
    if (msg && request) {
      this.notifSvc.push(
        'system',
        msg.title,
        msg.body(request.title, payload.resolution),
        '/maintenance'
      );
    }
  }

  /**
   * Convenience: create a request AND push a notification to the landlord.
   * (Useful from tenant-side form submissions.)
   *
   * @param payload - Create payload (forwarded to MaintenanceRequestService)
   */
  createWithNotification(
    payload: Parameters<MaintenanceRequestService['create']>[0]
  ): ReturnType<MaintenanceRequestService['create']> {
    const created = this.maintenanceSvc.create(payload);
    this.notifSvc.push(
      'alert',
      `Novo Pedido de Manutenção`,
      `"${created.title}" — ${created.propertyTitle} (${created.priority} prioridade)`,
      '/maintenance'
    );
    return created;
  }

  /**
   * Expose read-only access to requests for templates that use the handler exclusively.
   * Delegates to the underlying service.
   */
  get requests() {
    return this.maintenanceSvc.requests;
  }

  /** Expose loading signal. */
  get loading() {
    return this.maintenanceSvc.loading;
  }
}
