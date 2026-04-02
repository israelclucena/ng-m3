import { Injectable, signal, computed } from '@angular/core';

export type ArrearsStatus = 'overdue' | 'partial' | 'reminder_sent' | 'payment_plan' | 'legal' | 'resolved';

export interface ArrearsRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  propertyId: string;
  propertyAddress: string;
  amountDue: number;
  amountPaid: number;
  amountOutstanding: number;
  daysOverdue: number;
  dueSince: string;           // ISO date
  lastReminderSent?: string;  // ISO date
  reminderCount: number;
  status: ArrearsStatus;
  paymentPlanActive: boolean;
  paymentPlanMonthly?: number;
  notes?: string;
}

const MOCK_ARREARS: ArrearsRecord[] = [
  {
    id: 'ar001',
    tenantId: 'tenant-002',
    tenantName: 'Carlos Mendes',
    tenantEmail: 'carlos@email.com',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    amountDue: 1800,
    amountPaid: 0,
    amountOutstanding: 1800,
    daysOverdue: 45,
    dueSince: '2026-02-15',
    lastReminderSent: '2026-03-20',
    reminderCount: 3,
    status: 'reminder_sent',
    paymentPlanActive: false,
    notes: 'Tenant reports temporary job loss — agreed to review by April 10.',
  },
  {
    id: 'ar002',
    tenantId: 'tenant-005',
    tenantName: 'Rita Oliveira',
    tenantEmail: 'rita@email.com',
    propertyId: 'prop-005',
    propertyAddress: 'Mouraria 3, Lisboa',
    amountDue: 2400,
    amountPaid: 800,
    amountOutstanding: 1600,
    daysOverdue: 62,
    dueSince: '2026-01-30',
    lastReminderSent: '2026-03-25',
    reminderCount: 5,
    status: 'payment_plan',
    paymentPlanActive: true,
    paymentPlanMonthly: 400,
    notes: 'Payment plan: €400/month × 4 months. First instalment due April 5.',
  },
  {
    id: 'ar003',
    tenantId: 'tenant-006',
    tenantName: 'Diogo Santos',
    tenantEmail: 'diogo.santos@email.com',
    propertyId: 'prop-006',
    propertyAddress: 'Intendente 15, Lisboa',
    amountDue: 950,
    amountPaid: 475,
    amountOutstanding: 475,
    daysOverdue: 18,
    dueSince: '2026-03-15',
    lastReminderSent: '2026-03-28',
    reminderCount: 1,
    status: 'partial',
    paymentPlanActive: false,
  },
  {
    id: 'ar004',
    tenantId: 'tenant-007',
    tenantName: 'Mariana Lopes',
    tenantEmail: 'mariana@email.com',
    propertyId: 'prop-007',
    propertyAddress: 'Cais do Sodré 44, Lisboa',
    amountDue: 5400,
    amountPaid: 0,
    amountOutstanding: 5400,
    daysOverdue: 120,
    dueSince: '2025-12-01',
    lastReminderSent: '2026-03-01',
    reminderCount: 8,
    status: 'legal',
    paymentPlanActive: false,
    notes: 'Referred to legal team. Eviction proceedings initiated.',
  },
];

/** RentArrearsService — tracks overdue rent across landlord portfolio. */
@Injectable({ providedIn: 'root' })
export class RentArrearsService {
  private _records = signal<ArrearsRecord[]>(MOCK_ARREARS);
  private _filter = signal<ArrearsStatus | 'all'>('all');

  readonly records = this._records.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly filtered = computed(() => {
    const f = this._filter();
    return f === 'all'
      ? this._records()
      : this._records().filter(r => r.status === f);
  });

  readonly kpis = computed(() => {
    const all = this._records().filter(r => r.status !== 'resolved');
    const totalOutstanding = all.reduce((s, r) => s + r.amountOutstanding, 0);
    const totalTenants = all.length;
    const avgDaysOverdue = totalTenants > 0
      ? Math.round(all.reduce((s, r) => s + r.daysOverdue, 0) / totalTenants)
      : 0;
    const critical = all.filter(r => r.daysOverdue > 60 || r.status === 'legal').length;
    return { totalOutstanding, totalTenants, avgDaysOverdue, critical };
  });

  /**
   * Send an automated payment reminder to a tenant.
   * @param id - arrears record id
   */
  sendReminder(id: string): void {
    this._records.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'reminder_sent' as ArrearsStatus,
        lastReminderSent: new Date().toISOString().split('T')[0],
        reminderCount: r.reminderCount + 1,
      } : r)
    );
  }

  /**
   * Set up a payment plan for a tenant.
   * @param id - arrears record id
   * @param monthlyAmount - monthly instalment amount
   */
  setPaymentPlan(id: string, monthlyAmount: number): void {
    this._records.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'payment_plan' as ArrearsStatus,
        paymentPlanActive: true,
        paymentPlanMonthly: monthlyAmount,
      } : r)
    );
  }

  /**
   * Escalate to legal proceedings.
   * @param id - arrears record id
   */
  escalateToLegal(id: string): void {
    this._records.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'legal' as ArrearsStatus,
      } : r)
    );
  }

  /**
   * Mark an arrears record as resolved.
   * @param id - arrears record id
   */
  markResolved(id: string): void {
    this._records.update(rs =>
      rs.map(r => r.id === id ? {
        ...r,
        status: 'resolved' as ArrearsStatus,
        amountOutstanding: 0,
        amountPaid: r.amountDue,
      } : r)
    );
  }

  /** Set status filter. */
  setFilter(f: ArrearsStatus | 'all'): void {
    this._filter.set(f);
  }

  /** Severity classification for a record. */
  severity(r: ArrearsRecord): 'critical' | 'high' | 'medium' | 'low' {
    if (r.status === 'legal' || r.daysOverdue > 90) return 'critical';
    if (r.daysOverdue > 60) return 'high';
    if (r.daysOverdue > 30) return 'medium';
    return 'low';
  }
}
