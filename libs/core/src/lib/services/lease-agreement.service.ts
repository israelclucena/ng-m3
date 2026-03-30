/**
 * @fileoverview LeaseAgreementService — Sprint 035
 *
 * Mock CRUD service for lease agreements in the LisboaRent platform.
 * Manages the full lifecycle: draft → active → expired / terminated.
 *
 * Patterns:
 * - Angular Signals only (no RxJS)
 * - Zoneless compatible
 * - In-memory mock store
 *
 * Feature flags: LEASE_MODULE, LEASE_VIEWER
 *
 * @example
 * ```ts
 * const svc = inject(LeaseAgreementService);
 * svc.loadForTenant('tenant-001');
 * svc.leases(); // Signal<LeaseAgreement[]>
 * ```
 */
import { Injectable, signal, computed } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaseStatus = 'draft' | 'active' | 'expired' | 'terminated';

export type LeaseType = 'fixed' | 'month-to-month' | 'short-term';

/** A single uploaded document attached to a lease. */
export interface LeaseDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

/** A lease agreement entity. */
export interface LeaseAgreement {
  id: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  leaseType: LeaseType;
  status: LeaseStatus;
  monthlyRent: number;
  depositAmount: number;
  startDate: string;     // ISO date string
  endDate: string;       // ISO date string
  terms: string;         // Full legal terms text
  documents: LeaseDocument[];
  signedByTenant: boolean;
  signedByLandlord: boolean;
  tenantSignedAt?: string;
  landlordSignedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

/** Payload to create a new lease agreement (landlord-side). */
export interface CreateLeasePayload {
  tenantId: string;
  tenantName: string;
  landlordId: string;
  landlordName: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  leaseType: LeaseType;
  monthlyRent: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
  terms: string;
  notes?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const MOCK_TERMS = `Este contrato de arrendamento é celebrado entre o Senhorio e o Inquilino, nos termos do Novo Regime do Arrendamento Urbano (NRAU), Lei n.º 6/2006, de 27 de Fevereiro, com as alterações subsequentes.

1. OBJECTO: O Senhorio dá de arrendamento ao Inquilino o imóvel identificado neste contrato, para uso exclusivamente habitacional.

2. DURAÇÃO: O contrato tem a duração estipulada, renovando-se automaticamente por períodos iguais salvo comunicação de oposição com a antecedência legal.

3. RENDA: A renda mensal é devida até ao dia 8 de cada mês, por transferência bancária para o IBAN indicado pelo Senhorio.

4. DEPÓSITO: O depósito de segurança é equivalente a dois meses de renda e será devolvido no prazo de 30 dias após a entrega das chaves, deduzidas eventuais despesas de reparação por danos imputáveis ao Inquilino.

5. UTILIZAÇÃO: O imóvel destina-se exclusivamente a habitação permanente. É proibida a sublocação sem autorização escrita do Senhorio.

6. CONSERVAÇÃO: O Inquilino obriga-se a conservar o imóvel no estado em que o recebeu, procedendo às pequenas reparações a seu cargo, de acordo com a lei.

7. RESCISÃO: O Senhorio pode resolver o contrato em caso de incumprimento do pagamento da renda por mais de dois meses ou por uso inadequado do imóvel.`;

const SEED_LEASES: LeaseAgreement[] = [
  {
    id: 'lease-001',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-001',
    landlordName: 'Carlos Mendes',
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyAddress: 'Rua Garrett 42, 2º Dto, 1200-204 Lisboa',
    leaseType: 'fixed',
    status: 'active',
    monthlyRent: 1200,
    depositAmount: 2400,
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    terms: MOCK_TERMS,
    documents: [
      { id: 'd1', name: 'contrato-assinado.pdf', url: '/mock/contrato-assinado.pdf', uploadedAt: '2026-03-20T10:00:00Z' },
    ],
    signedByTenant: true,
    signedByLandlord: true,
    tenantSignedAt: '2026-03-20T10:15:00Z',
    landlordSignedAt: '2026-03-20T09:00:00Z',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-03-20T10:15:00Z',
  },
  {
    id: 'lease-002',
    tenantId: 'tenant-001',
    tenantName: 'Ana Ferreira',
    landlordId: 'landlord-002',
    landlordName: 'Maria Santos',
    propertyId: 'p2',
    propertyTitle: 'Estúdio no Intendente',
    propertyAddress: 'Rua do Intendente 15, 3º Esq, 1100-300 Lisboa',
    leaseType: 'month-to-month',
    status: 'draft',
    monthlyRent: 750,
    depositAmount: 1500,
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    terms: MOCK_TERMS,
    documents: [],
    signedByTenant: false,
    signedByLandlord: true,
    landlordSignedAt: '2026-03-29T14:00:00Z',
    createdAt: '2026-03-28T11:00:00Z',
    updatedAt: '2026-03-29T14:00:00Z',
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LeaseAgreementService {
  private readonly _leases = signal<LeaseAgreement[]>(SEED_LEASES);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** All leases. */
  readonly leases = this._leases.asReadonly();

  /** Loading state. */
  readonly loading = this._loading.asReadonly();

  /** Error message, if any. */
  readonly error = this._error.asReadonly();

  /** Active leases (status === 'active'). */
  readonly activeLeases = computed(() =>
    this._leases().filter(l => l.status === 'active')
  );

  /** Draft leases awaiting signature. */
  readonly draftLeases = computed(() =>
    this._leases().filter(l => l.status === 'draft')
  );

  /** Expired or terminated leases. */
  readonly closedLeases = computed(() =>
    this._leases().filter(l => l.status === 'expired' || l.status === 'terminated')
  );

  /** Count of unsigned leases (draft + not signed by tenant). */
  readonly pendingSignatureCount = computed(() =>
    this._leases().filter(l => l.status === 'draft' && !l.signedByTenant).length
  );

  /**
   * Load leases for a specific tenant.
   * @param tenantId - The tenant's ID.
   */
  loadForTenant(tenantId: string): void {
    this._loading.set(true);
    this._error.set(null);
    // Simulate async — in production this would be an httpResource call
    setTimeout(() => {
      const filtered = SEED_LEASES.filter(l => l.tenantId === tenantId);
      this._leases.set(filtered);
      this._loading.set(false);
    }, 300);
  }

  /**
   * Load leases for a specific landlord.
   * @param landlordId - The landlord's ID.
   */
  loadForLandlord(landlordId: string): void {
    this._loading.set(true);
    this._error.set(null);
    setTimeout(() => {
      const filtered = SEED_LEASES.filter(l => l.landlordId === landlordId);
      this._leases.set(filtered);
      this._loading.set(false);
    }, 300);
  }

  /**
   * Get a lease by ID.
   * @param id - The lease ID.
   */
  getById(id: string): LeaseAgreement | undefined {
    return this._leases().find(l => l.id === id);
  }

  /**
   * Create a new lease agreement (landlord initiates).
   * @param payload - CreateLeasePayload.
   * @returns The created LeaseAgreement.
   */
  create(payload: CreateLeasePayload): LeaseAgreement {
    const now = new Date().toISOString();
    const lease: LeaseAgreement = {
      id: `lease-${uid()}`,
      ...payload,
      status: 'draft',
      documents: [],
      signedByTenant: false,
      signedByLandlord: false,
      createdAt: now,
      updatedAt: now,
    };
    this._leases.update(list => [lease, ...list]);
    return lease;
  }

  /**
   * Sign a lease (tenant or landlord).
   * @param id - Lease ID.
   * @param role - 'tenant' or 'landlord'.
   */
  sign(id: string, role: 'tenant' | 'landlord'): void {
    const now = new Date().toISOString();
    this._leases.update(list =>
      list.map(l => {
        if (l.id !== id) return l;
        const update: Partial<LeaseAgreement> =
          role === 'tenant'
            ? { signedByTenant: true, tenantSignedAt: now }
            : { signedByLandlord: true, landlordSignedAt: now };
        const updated = { ...l, ...update, updatedAt: now };
        // Activate if both parties have signed
        if (updated.signedByTenant && updated.signedByLandlord) {
          updated.status = 'active';
        }
        return updated;
      })
    );
  }

  /**
   * Terminate a lease.
   * @param id - Lease ID.
   * @param notes - Optional termination notes.
   */
  terminate(id: string, notes?: string): void {
    const now = new Date().toISOString();
    this._leases.update(list =>
      list.map(l =>
        l.id === id
          ? { ...l, status: 'terminated', notes, updatedAt: now }
          : l
      )
    );
  }

  /**
   * Mark a lease as expired.
   * @param id - Lease ID.
   */
  expire(id: string): void {
    const now = new Date().toISOString();
    this._leases.update(list =>
      list.map(l =>
        l.id === id ? { ...l, status: 'expired', updatedAt: now } : l
      )
    );
  }

  /**
   * Attach a document to a lease.
   * @param leaseId - Lease ID.
   * @param doc - Document to attach.
   */
  attachDocument(leaseId: string, doc: Omit<LeaseDocument, 'id'>): void {
    const now = new Date().toISOString();
    this._leases.update(list =>
      list.map(l =>
        l.id === leaseId
          ? {
              ...l,
              documents: [...l.documents, { id: uid(), ...doc }],
              updatedAt: now,
            }
          : l
      )
    );
  }
}
