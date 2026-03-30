/**
 * @fileoverview TenantApplicationService — Sprint 035
 *
 * Mock CRUD service for tenant rental applications in the LisboaRent platform.
 * Closes the flow: Property → Application → Booking → Lease.
 *
 * Patterns:
 * - Angular Signals only (no RxJS)
 * - Zoneless compatible
 * - In-memory mock store
 *
 * Feature flags: TENANT_APPLICATION, APPLICATION_REVIEW
 *
 * @example
 * ```ts
 * const svc = inject(TenantApplicationService);
 * svc.loadForTenant('tenant-001');
 * svc.applications(); // Signal<TenantApplication[]>
 * ```
 */
import { Injectable, signal, computed } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export type EmploymentType =
  | 'employed'
  | 'self-employed'
  | 'student'
  | 'retired'
  | 'unemployed';

/** Reference from a previous landlord or employer. */
export interface TenantReference {
  id: string;
  name: string;
  relationship: 'landlord' | 'employer' | 'personal';
  phone?: string;
  email?: string;
  notes?: string;
}

/** A tenant rental application. */
export interface TenantApplication {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  landlordId: string;
  propertyId: string;
  propertyTitle: string;
  status: ApplicationStatus;
  employmentType: EmploymentType;
  monthlyIncome: number;
  employer?: string;
  nif: string;         // Portuguese tax number
  nationality: string;
  occupation: string;
  numOccupants: number;
  hasPets: boolean;
  coverLetter: string;
  references: TenantReference[];
  documentIds: string[];   // attached UploadFile IDs
  reviewNotes?: string;    // landlord's internal notes
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new application (tenant-side). */
export interface CreateApplicationPayload {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  landlordId: string;
  propertyId: string;
  propertyTitle: string;
  employmentType: EmploymentType;
  monthlyIncome: number;
  employer?: string;
  nif: string;
  nationality: string;
  occupation: string;
  numOccupants: number;
  hasPets: boolean;
  coverLetter: string;
  references: Omit<TenantReference, 'id'>[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const SEED_APPLICATIONS: TenantApplication[] = [
  {
    id: 'app-001',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    tenantEmail: 'ana.ferreira@email.pt',
    tenantPhone: '+351 912 345 678',
    landlordId: 'landlord-001',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    status: 'approved',
    employmentType: 'employed',
    monthlyIncome: 2800,
    employer: 'Tech Lisboa Lda.',
    nif: '123456789',
    nationality: 'Portuguesa',
    occupation: 'Engenheira de Software',
    numOccupants: 2,
    hasPets: false,
    coverLetter: 'Somos um casal jovem e profissional, sem animais de estimação. Procuramos estabilidade a longo prazo e prometemos tratar o imóvel com todo o cuidado.',
    references: [
      { id: 'ref-1', name: 'António Lopes', relationship: 'landlord', phone: '+351 965 111 222', notes: 'Senhorio anterior — 2 anos sem incidentes.' },
    ],
    documentIds: [],
    reviewNotes: 'Candidatura excelente. Rendimento 2.3x a renda. Recomendado.',
    submittedAt: '2026-03-15T09:00:00Z',
    reviewedAt: '2026-03-16T14:30:00Z',
    createdAt: '2026-03-14T11:00:00Z',
    updatedAt: '2026-03-16T14:30:00Z',
  },
  {
    id: 'app-002',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    tenantEmail: 'ana.ferreira@email.pt',
    tenantPhone: '+351 912 345 678',
    landlordId: 'landlord-002',
    propertyId: 'p4',
    propertyTitle: 'T1 no Príncipe Real',
    status: 'under-review',
    employmentType: 'employed',
    monthlyIncome: 2800,
    employer: 'Tech Lisboa Lda.',
    nif: '123456789',
    nationality: 'Portuguesa',
    occupation: 'Engenheira de Software',
    numOccupants: 2,
    hasPets: false,
    coverLetter: 'Inquilinos responsáveis com histórico impecável. Flexíveis em datas de entrada.',
    references: [],
    documentIds: [],
    submittedAt: '2026-03-28T10:00:00Z',
    createdAt: '2026-03-27T18:00:00Z',
    updatedAt: '2026-03-28T10:00:00Z',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TenantApplicationService {
  private readonly _applications = signal<TenantApplication[]>(SEED_APPLICATIONS);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** All applications. */
  readonly applications = this._applications.asReadonly();

  /** Loading state. */
  readonly loading = this._loading.asReadonly();

  /** Error message. */
  readonly error = this._error.asReadonly();

  /** Applications by status. */
  readonly byStatus = (status: ApplicationStatus) =>
    computed(() => this._applications().filter(a => a.status === status));

  /** Pending applications (for landlord review panel). */
  readonly pendingReview = computed(() =>
    this._applications().filter(a => a.status === 'submitted' || a.status === 'under-review')
  );

  /** Approved applications. */
  readonly approved = computed(() =>
    this._applications().filter(a => a.status === 'approved')
  );

  /**
   * Load applications for a tenant.
   * @param tenantId - The tenant's ID.
   */
  loadForTenant(tenantId: string): void {
    this._loading.set(true);
    setTimeout(() => {
      this._applications.set(SEED_APPLICATIONS.filter(a => a.tenantId === tenantId));
      this._loading.set(false);
    }, 300);
  }

  /**
   * Load applications for a landlord (review panel).
   * @param landlordId - The landlord's ID.
   */
  loadForLandlord(landlordId: string): void {
    this._loading.set(true);
    setTimeout(() => {
      this._applications.set(SEED_APPLICATIONS.filter(a => a.landlordId === landlordId));
      this._loading.set(false);
    }, 300);
  }

  /**
   * Get an application by ID.
   * @param id - Application ID.
   */
  getById(id: string): TenantApplication | undefined {
    return this._applications().find(a => a.id === id);
  }

  /**
   * Submit a new application (saves as draft first, then submits).
   * @param payload - Application data.
   * @returns Created TenantApplication.
   */
  submit(payload: CreateApplicationPayload): TenantApplication {
    const now = new Date().toISOString();
    const app: TenantApplication = {
      id: `app-${uid()}`,
      ...payload,
      references: payload.references.map(r => ({ id: uid(), ...r })),
      status: 'submitted',
      documentIds: [],
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this._applications.update(list => [app, ...list]);
    return app;
  }

  /**
   * Approve an application (landlord action).
   * @param id - Application ID.
   * @param notes - Optional review notes.
   */
  approve(id: string, notes?: string): void {
    const now = new Date().toISOString();
    this._applications.update(list =>
      list.map(a =>
        a.id === id
          ? { ...a, status: 'approved', reviewNotes: notes, reviewedAt: now, updatedAt: now }
          : a
      )
    );
  }

  /**
   * Reject an application (landlord action).
   * @param id - Application ID.
   * @param reason - Rejection reason.
   */
  reject(id: string, reason: string): void {
    const now = new Date().toISOString();
    this._applications.update(list =>
      list.map(a =>
        a.id === id
          ? { ...a, status: 'rejected', rejectionReason: reason, reviewedAt: now, updatedAt: now }
          : a
      )
    );
  }

  /**
   * Move application to 'under-review'.
   * @param id - Application ID.
   */
  markUnderReview(id: string): void {
    const now = new Date().toISOString();
    this._applications.update(list =>
      list.map(a =>
        a.id === id ? { ...a, status: 'under-review', updatedAt: now } : a
      )
    );
  }

  /**
   * Withdraw an application (tenant action).
   * @param id - Application ID.
   */
  withdraw(id: string): void {
    const now = new Date().toISOString();
    this._applications.update(list =>
      list.map(a =>
        a.id === id ? { ...a, status: 'withdrawn', updatedAt: now } : a
      )
    );
  }
}
