/**
 * @fileoverview MaintenanceRequestService — Sprint 034
 *
 * Mock CRUD service for maintenance requests in the LisboaRent platform.
 * Tenants submit requests; landlords view/update status.
 *
 * Patterns:
 * - Angular Signals only (no RxJS)
 * - Zoneless compatible
 * - In-memory mock store (mirrors ResourceSnapshot pattern)
 *
 * Feature flag: MAINTENANCE_MODULE
 *
 * @example
 * ```ts
 * const svc = inject(MaintenanceRequestService);
 * svc.loadForTenant('tenant-001');
 * svc.requests(); // Signal<MaintenanceRequest[]>
 * ```
 */
import { Injectable, signal, computed } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaintenanceStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'structural'
  | 'pest'
  | 'other';

/** A single maintenance request entity. */
export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  propertyId: string;
  propertyTitle: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description: string;
  /** ISO date string */
  createdAt: string;
  /** ISO date string */
  updatedAt: string;
  /** Landlord notes */
  resolution?: string;
  /** Scheduled visit ISO date */
  scheduledDate?: string;
}

/** Payload to create a new maintenance request (tenant-side). */
export interface CreateMaintenanceRequestPayload {
  tenantId: string;
  tenantName: string;
  landlordId: string;
  propertyId: string;
  propertyTitle: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
}

/** Payload to update status (landlord-side). */
export interface UpdateMaintenanceStatusPayload {
  status: MaintenanceStatus;
  resolution?: string;
  scheduledDate?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REQUESTS: MaintenanceRequest[] = [
  {
    id: 'mr-001',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-001',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    category: 'plumbing',
    priority: 'high',
    status: 'in-progress',
    title: 'Fuga de água na casa de banho',
    description: 'Torneira do chuveiro a pingar constantemente. Já tentei apertar mas continua.',
    createdAt: '2026-03-20T10:00:00Z',
    updatedAt: '2026-03-21T09:00:00Z',
    scheduledDate: '2026-03-30T10:00:00Z',
  },
  {
    id: 'mr-002',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-001',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    category: 'electrical',
    priority: 'urgent',
    status: 'pending',
    title: 'Tomada da cozinha sem corrente',
    description: 'A tomada perto do fogão deixou de funcionar. Suspeito de curto-circuito.',
    createdAt: '2026-03-28T14:30:00Z',
    updatedAt: '2026-03-28T14:30:00Z',
  },
  {
    id: 'mr-003',
    tenantId: 'tenant-002',
    tenantName: 'João Santos',
    landlordId: 'landlord-001',
    propertyId: 'p2',
    propertyTitle: 'Studio em Alfama',
    category: 'hvac',
    priority: 'medium',
    status: 'resolved',
    title: 'Ar condicionado não arrefece',
    description: 'O AC liga mas não produz ar frio. Necessita de recarga de gás.',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-15T16:00:00Z',
    resolution: 'Técnico substituiu filtros e recarregou o gás. Sistema a funcionar normalmente.',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Signal-based service for maintenance request CRUD.
 * Uses an in-memory store simulating async operations.
 *
 * Feature flag: MAINTENANCE_MODULE
 */
@Injectable({ providedIn: 'root' })
export class MaintenanceRequestService {
  private readonly _requests = signal<MaintenanceRequest[]>(MOCK_REQUESTS);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** All loaded maintenance requests. */
  readonly requests = this._requests.asReadonly();

  /** Loading state. */
  readonly loading = this._loading.asReadonly();

  /** Last error message (null if none). */
  readonly error = this._error.asReadonly();

  /** Pending requests count. */
  readonly pendingCount = computed(() =>
    this._requests().filter(r => r.status === 'pending').length
  );

  /** Urgent requests count. */
  readonly urgentCount = computed(() =>
    this._requests().filter(r => r.priority === 'urgent' && r.status !== 'resolved').length
  );

  /**
   * Load requests for a specific tenant.
   * @param tenantId - The tenant's identifier
   */
  loadForTenant(tenantId: string): void {
    this._loading.set(true);
    this._error.set(null);
    setTimeout(() => {
      this._requests.set(MOCK_REQUESTS.filter(r => r.tenantId === tenantId));
      this._loading.set(false);
    }, 300);
  }

  /**
   * Load requests for a landlord (all tenants).
   * @param landlordId - The landlord's identifier
   */
  loadForLandlord(landlordId: string): void {
    this._loading.set(true);
    this._error.set(null);
    setTimeout(() => {
      this._requests.set(MOCK_REQUESTS.filter(r => r.landlordId === landlordId));
      this._loading.set(false);
    }, 300);
  }

  /**
   * Submit a new maintenance request (tenant action).
   * @param payload - Request creation payload
   * @returns The created MaintenanceRequest
   */
  create(payload: CreateMaintenanceRequestPayload): MaintenanceRequest {
    const now = new Date().toISOString();
    const newRequest: MaintenanceRequest = {
      ...payload,
      id: `mr-${Date.now()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this._requests.update(prev => [newRequest, ...prev]);
    return newRequest;
  }

  /**
   * Update the status of an existing request (landlord action).
   * @param id - Request identifier
   * @param payload - Status update payload
   */
  updateStatus(id: string, payload: UpdateMaintenanceStatusPayload): void {
    this._requests.update(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, ...payload, updatedAt: new Date().toISOString() }
          : r
      )
    );
  }

  /**
   * Delete a request by id.
   * @param id - Request identifier
   */
  delete(id: string): void {
    this._requests.update(prev => prev.filter(r => r.id !== id));
  }
}
