import { Injectable, signal, computed } from '@angular/core';

/** Payment status for a rent period */
export type RentPaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

/** A single rent payment record for a given period */
export interface RentPayment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  landlordId: string;
  /** Human-readable label e.g. "April 2026" */
  periodLabel: string;
  /** ISO date — when rent is due */
  dueDate: string;
  /** ISO date — when tenant paid */
  paidDate?: string;
  /** Full rent amount */
  amount: number;
  /** Amount actually paid (may differ if partial) */
  paidAmount?: number;
  status: RentPaymentStatus;
  /** Reference to a payment receipt */
  receiptId?: string;
  notes?: string;
}

/** Payload for creating a new rent payment record */
export interface CreatePaymentPayload {
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  landlordId: string;
  periodLabel: string;
  dueDate: string;
  amount: number;
}

/**
 * RentPaymentPortalService — manages tenant rent payment records.
 * Provides signal-based state for payment schedule, outstanding balances,
 * payment history, and streak tracking.
 */
@Injectable({ providedIn: 'root' })
export class RentPaymentPortalService {
  readonly payments = signal<RentPayment[]>(this._seed());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Payments that are pending or overdue */
  readonly outstanding = computed(() =>
    this.payments().filter(p => p.status === 'pending' || p.status === 'overdue')
  );

  /** Payments that have been fully paid */
  readonly paidPayments = computed(() =>
    this.payments().filter(p => p.status === 'paid')
  );

  /** Sum of all payments made this calendar year */
  readonly totalPaidThisYear = computed(() => {
    const year = new Date().getFullYear().toString();
    return this.paidPayments()
      .filter(p => (p.paidDate ?? '').startsWith(year))
      .reduce((sum, p) => sum + (p.paidAmount ?? p.amount), 0);
  });

  /** Total amount still owed */
  readonly totalOutstanding = computed(() =>
    this.outstanding().reduce((sum, p) => sum + p.amount - (p.paidAmount ?? 0), 0)
  );

  /** The soonest upcoming or overdue payment */
  readonly nextDueDate = computed(() => {
    const pending = [...this.outstanding()].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );
    return pending[0] ?? null;
  });

  /** Number of consecutive months with successful payments */
  readonly paymentStreak = computed(() => this.paidPayments().length);

  /**
   * Load all payment records for a given tenant.
   * @param tenantId The tenant's unique identifier
   */
  loadForTenant(tenantId: string): void {
    this.loading.set(true);
    setTimeout(() => {
      this.payments.set(this._seed().filter(p => p.tenantId === tenantId));
      this.loading.set(false);
    }, 300);
  }

  /**
   * Load all payment records visible to a landlord.
   * @param landlordId The landlord's unique identifier
   */
  loadForLandlord(landlordId: string): void {
    this.loading.set(true);
    setTimeout(() => {
      this.payments.set(this._seed().filter(p => p.landlordId === landlordId));
      this.loading.set(false);
    }, 300);
  }

  /**
   * Record a payment against a pending/overdue entry.
   * @param paymentId The payment record to update
   * @param amount    Amount being paid
   */
  makePayment(paymentId: string, amount: number): void {
    this.payments.update(list =>
      list.map(p => {
        if (p.id !== paymentId) return p;
        const fullyPaid = amount >= p.amount;
        return {
          ...p,
          paidAmount: amount,
          paidDate: new Date().toISOString().split('T')[0],
          status: fullyPaid ? 'paid' : ('partial' as RentPaymentStatus),
          receiptId: `rcpt-${Date.now()}`,
        };
      })
    );
  }

  /**
   * Convenience: mark an entry as fully paid.
   * @param paymentId The payment record to mark paid
   */
  markPaid(paymentId: string): void {
    const payment = this.payments().find(p => p.id === paymentId);
    if (payment) this.makePayment(paymentId, payment.amount);
  }

  private _seed(): RentPayment[] {
    return [
      {
        id: 'rp-001',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        periodLabel: 'January 2026',
        dueDate: '2026-01-05',
        paidDate: '2026-01-03',
        amount: 1200,
        paidAmount: 1200,
        status: 'paid',
        receiptId: 'rcpt-001',
      },
      {
        id: 'rp-002',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        periodLabel: 'February 2026',
        dueDate: '2026-02-05',
        paidDate: '2026-02-04',
        amount: 1200,
        paidAmount: 1200,
        status: 'paid',
        receiptId: 'rcpt-002',
      },
      {
        id: 'rp-003',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        periodLabel: 'March 2026',
        dueDate: '2026-03-05',
        paidDate: '2026-03-05',
        amount: 1200,
        paidAmount: 1200,
        status: 'paid',
        receiptId: 'rcpt-003',
      },
      {
        id: 'rp-004',
        propertyId: 'prop-001',
        propertyTitle: 'Apartamento T2 — Baixa-Chiado',
        tenantId: 'tenant-001',
        landlordId: 'landlord-001',
        periodLabel: 'April 2026',
        dueDate: '2026-04-05',
        amount: 1200,
        status: 'pending',
      },
      {
        id: 'rp-005',
        propertyId: 'prop-002',
        propertyTitle: 'Studio — Alfama',
        tenantId: 'tenant-002',
        landlordId: 'landlord-001',
        periodLabel: 'March 2026',
        dueDate: '2026-03-05',
        amount: 850,
        status: 'overdue',
      },
      {
        id: 'rp-006',
        propertyId: 'prop-002',
        propertyTitle: 'Studio — Alfama',
        tenantId: 'tenant-002',
        landlordId: 'landlord-001',
        periodLabel: 'April 2026',
        dueDate: '2026-04-05',
        amount: 850,
        status: 'pending',
      },
    ];
  }
}
