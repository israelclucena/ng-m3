import { Injectable, signal, computed } from '@angular/core';

export type RenewalStatus = 'expiring_soon' | 'offer_sent' | 'accepted' | 'declined' | 'expired';

export interface LeaseRenewal {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  currentEndDate: string;      // ISO date
  proposedEndDate: string;     // ISO date
  currentMonthlyRent: number;
  proposedMonthlyRent: number;
  rentChangePercent: number;   // calculated
  status: RenewalStatus;
  offerSentAt?: string;
  respondedAt?: string;
  declineReason?: string;
  notes?: string;
  daysUntilExpiry: number;     // calculated at runtime
}

export interface SendRenewalOfferPayload {
  leaseId: string;
  proposedEndDate: string;
  proposedMonthlyRent: number;
  notes?: string;
}

const today = '2026-04-02';

const MOCK_RENEWALS: LeaseRenewal[] = [
  {
    id: 'rn001',
    leaseId: 'lease-001',
    propertyId: 'prop-001',
    propertyAddress: 'Rua Augusta 45, Lisboa',
    tenantId: 'tenant-001',
    tenantName: 'Ana Silva',
    currentEndDate: '2026-05-01',
    proposedEndDate: '2027-05-01',
    currentMonthlyRent: 1200,
    proposedMonthlyRent: 1250,
    rentChangePercent: 4.2,
    status: 'offer_sent',
    offerSentAt: '2026-03-28T10:00:00Z',
    daysUntilExpiry: 29,
    notes: 'Good tenant, reliable payments, minor rent adjustment to match market.',
  },
  {
    id: 'rn002',
    leaseId: 'lease-002',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    tenantId: 'tenant-002',
    tenantName: 'Carlos Mendes',
    currentEndDate: '2026-05-15',
    proposedEndDate: '2027-05-15',
    currentMonthlyRent: 1800,
    proposedMonthlyRent: 1800,
    rentChangePercent: 0,
    status: 'expiring_soon',
    daysUntilExpiry: 43,
    notes: 'Loyal tenant of 3 years — no rent increase.',
  },
  {
    id: 'rn003',
    leaseId: 'lease-003',
    propertyId: 'prop-003',
    propertyAddress: 'Bairro Alto 8, Lisboa',
    tenantId: 'tenant-003',
    tenantName: 'Sofia Costa',
    currentEndDate: '2026-06-30',
    proposedEndDate: '2027-06-30',
    currentMonthlyRent: 900,
    proposedMonthlyRent: 950,
    rentChangePercent: 5.6,
    status: 'accepted',
    offerSentAt: '2026-03-20T08:00:00Z',
    respondedAt: '2026-03-22T14:00:00Z',
    daysUntilExpiry: 89,
  },
  {
    id: 'rn004',
    leaseId: 'lease-004',
    propertyId: 'prop-004',
    propertyAddress: 'Alfama 22, Lisboa',
    tenantId: 'tenant-004',
    tenantName: 'Miguel Ferreira',
    currentEndDate: '2026-04-20',
    proposedEndDate: '2027-04-20',
    currentMonthlyRent: 1500,
    proposedMonthlyRent: 1600,
    rentChangePercent: 6.7,
    status: 'declined',
    offerSentAt: '2026-03-10T09:00:00Z',
    respondedAt: '2026-03-15T11:00:00Z',
    declineReason: 'Relocating to Porto in May.',
    daysUntilExpiry: 18,
  },
];

/** LeaseRenewalService — manages lease renewal workflow for landlords and tenants. */
@Injectable({ providedIn: 'root' })
export class LeaseRenewalService {
  private _renewals = signal<LeaseRenewal[]>(MOCK_RENEWALS);
  private _filter = signal<RenewalStatus | 'all'>('all');

  readonly renewals = this._renewals.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly filtered = computed(() => {
    const f = this._filter();
    return f === 'all'
      ? this._renewals()
      : this._renewals().filter(r => r.status === f);
  });

  readonly kpis = computed(() => {
    const all = this._renewals();
    const urgent = all.filter(r => r.daysUntilExpiry <= 30 && (r.status === 'expiring_soon' || r.status === 'offer_sent')).length;
    return {
      expiringSoon: all.filter(r => r.status === 'expiring_soon').length,
      offerSent: all.filter(r => r.status === 'offer_sent').length,
      accepted: all.filter(r => r.status === 'accepted').length,
      declined: all.filter(r => r.status === 'declined').length,
      urgent,
    };
  });

  /**
   * Send a renewal offer to the tenant.
   * @param id - renewal record id
   * @param payload - proposed renewal terms
   */
  sendOffer(id: string, payload: SendRenewalOfferPayload): void {
    this._renewals.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        proposedEndDate: payload.proposedEndDate,
        proposedMonthlyRent: payload.proposedMonthlyRent,
        rentChangePercent: +((payload.proposedMonthlyRent - r.currentMonthlyRent) / r.currentMonthlyRent * 100).toFixed(1),
        status: 'offer_sent' as RenewalStatus,
        offerSentAt: new Date().toISOString(),
        notes: payload.notes ?? r.notes,
      } : r)
    );
  }

  /**
   * Tenant accepts a renewal offer.
   * @param id - renewal record id
   */
  accept(id: string): void {
    this._renewals.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'accepted' as RenewalStatus,
        respondedAt: new Date().toISOString(),
      } : r)
    );
  }

  /**
   * Tenant declines a renewal offer.
   * @param id - renewal record id
   * @param reason - optional decline reason
   */
  decline(id: string, reason?: string): void {
    this._renewals.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'declined' as RenewalStatus,
        respondedAt: new Date().toISOString(),
        declineReason: reason,
      } : r)
    );
  }

  /** Set status filter. */
  setFilter(f: RenewalStatus | 'all'): void {
    this._filter.set(f);
  }

  /** Urgency class helper — returns 'high' | 'medium' | 'low'. */
  urgency(r: LeaseRenewal): 'high' | 'medium' | 'low' {
    if (r.daysUntilExpiry <= 30) return 'high';
    if (r.daysUntilExpiry <= 60) return 'medium';
    return 'low';
  }
}
