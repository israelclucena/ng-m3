import { Injectable, signal, computed } from '@angular/core';

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'waste' | 'other';
export type BillStatus = 'pending' | 'paid' | 'overdue' | 'disputed';
export type BillPayer = 'landlord' | 'tenant' | 'split';

export interface UtilityBill {
  id: string;
  propertyId: string;
  propertyAddress: string;
  type: UtilityType;
  provider: string;
  amount: number;
  currency: string;
  payer: BillPayer;
  splitRatio?: number;         // landlord % when payer=split
  status: BillStatus;
  issueDate: string;           // ISO date
  dueDate: string;             // ISO date
  paidDate?: string;           // ISO date
  period: string;              // e.g. "March 2026"
  receiptUrl?: string;
  notes?: string;
}

export interface AddBillPayload {
  propertyId: string;
  propertyAddress: string;
  type: UtilityType;
  provider: string;
  amount: number;
  currency?: string;
  payer: BillPayer;
  splitRatio?: number;
  dueDate: string;
  issueDate?: string;
  period: string;
  notes?: string;
}

const MOCK_BILLS: UtilityBill[] = [
  {
    id: 'ub001',
    propertyId: 'prop-001',
    propertyAddress: 'Rua do Alecrim 45, Lisboa',
    type: 'electricity',
    provider: 'EDP',
    amount: 87.40,
    currency: 'EUR',
    payer: 'tenant',
    status: 'paid',
    issueDate: '2026-03-01',
    dueDate: '2026-03-20',
    paidDate: '2026-03-15',
    period: 'February 2026',
  },
  {
    id: 'ub002',
    propertyId: 'prop-001',
    propertyAddress: 'Rua do Alecrim 45, Lisboa',
    type: 'water',
    provider: 'EPAL',
    amount: 34.20,
    currency: 'EUR',
    payer: 'landlord',
    status: 'overdue',
    issueDate: '2026-02-15',
    dueDate: '2026-03-05',
    period: 'January 2026',
    notes: 'Reminder sent 2026-03-10',
  },
  {
    id: 'ub003',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    type: 'gas',
    provider: 'Galp',
    amount: 56.80,
    currency: 'EUR',
    payer: 'split',
    splitRatio: 40,
    status: 'pending',
    issueDate: '2026-03-10',
    dueDate: '2026-04-05',
    period: 'March 2026',
  },
  {
    id: 'ub004',
    propertyId: 'prop-002',
    propertyAddress: 'Avenida Liberdade 120, Lisboa',
    type: 'internet',
    provider: 'NOS',
    amount: 39.99,
    currency: 'EUR',
    payer: 'tenant',
    status: 'paid',
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    paidDate: '2026-03-12',
    period: 'March 2026',
  },
  {
    id: 'ub005',
    propertyId: 'prop-003',
    propertyAddress: 'Mouraria 3, Lisboa',
    type: 'electricity',
    provider: 'EDP',
    amount: 112.60,
    currency: 'EUR',
    payer: 'landlord',
    status: 'disputed',
    issueDate: '2026-03-08',
    dueDate: '2026-03-28',
    period: 'February 2026',
    notes: 'Meter reading discrepancy — awaiting correction from EDP.',
  },
  {
    id: 'ub006',
    propertyId: 'prop-003',
    propertyAddress: 'Mouraria 3, Lisboa',
    type: 'waste',
    provider: 'CML',
    amount: 18.00,
    currency: 'EUR',
    payer: 'landlord',
    status: 'paid',
    issueDate: '2026-03-01',
    dueDate: '2026-03-31',
    paidDate: '2026-03-20',
    period: 'Q1 2026',
  },
];

/** UtilityBillsService — manage and track utility bills across a property portfolio. */
@Injectable({ providedIn: 'root' })
export class UtilityBillsService {
  private _bills = signal<UtilityBill[]>(MOCK_BILLS);
  private _filterStatus = signal<BillStatus | 'all'>('all');
  private _filterType = signal<UtilityType | 'all'>('all');
  private _filterProperty = signal<string | 'all'>('all');

  readonly bills = this._bills.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly filterType = this._filterType.asReadonly();

  readonly filtered = computed(() => {
    let list = this._bills();
    const s = this._filterStatus();
    const t = this._filterType();
    const p = this._filterProperty();
    if (s !== 'all') list = list.filter(b => b.status === s);
    if (t !== 'all') list = list.filter(b => b.type === t);
    if (p !== 'all') list = list.filter(b => b.propertyId === p);
    return list;
  });

  readonly kpis = computed(() => {
    const all = this._bills();
    const totalDue = all.filter(b => b.status === 'pending' || b.status === 'overdue')
      .reduce((s, b) => s + b.amount, 0);
    const totalPaid = all.filter(b => b.status === 'paid')
      .reduce((s, b) => s + b.amount, 0);
    const overdue = all.filter(b => b.status === 'overdue').length;
    const disputed = all.filter(b => b.status === 'disputed').length;
    return { totalDue, totalPaid, overdue, disputed };
  });

  /**
   * Add a new utility bill.
   * @param payload - bill data
   */
  addBill(payload: AddBillPayload): void {
    const bill: UtilityBill = {
      id: `ub${Date.now()}`,
      currency: 'EUR',
      issueDate: new Date().toISOString().split('T')[0],
      splitRatio: 50,
      status: 'pending',
      ...payload,
    };
    this._bills.update(bs => [bill, ...bs]);
  }

  /**
   * Mark a bill as paid.
   * @param id - bill id
   */
  markPaid(id: string): void {
    this._bills.update(bs =>
      bs.map(b => b.id === id ? {
        ...b,
        status: 'paid' as BillStatus,
        paidDate: new Date().toISOString().split('T')[0],
      } : b)
    );
  }

  /**
   * Dispute a bill.
   * @param id - bill id
   * @param notes - reason for dispute
   */
  disputeBill(id: string, notes: string): void {
    this._bills.update(bs =>
      bs.map(b => b.id === id ? {
        ...b,
        status: 'disputed' as BillStatus,
        notes,
      } : b)
    );
  }

  /** Set status filter. */
  setFilterStatus(s: BillStatus | 'all'): void { this._filterStatus.set(s); }
  /** Set utility type filter. */
  setFilterType(t: UtilityType | 'all'): void { this._filterType.set(t); }
  /** Set property filter. */
  setFilterProperty(p: string | 'all'): void { this._filterProperty.set(p); }

  /** Icon for each utility type. */
  typeIcon(type: UtilityType): string {
    const icons: Record<UtilityType, string> = {
      electricity: '⚡',
      water: '💧',
      gas: '🔥',
      internet: '📶',
      waste: '♻️',
      other: '📄',
    };
    return icons[type];
  }

  /** Status colour. */
  statusColor(status: BillStatus): string {
    const colors: Record<BillStatus, string> = {
      pending: '#F9A825',
      paid: '#388E3C',
      overdue: '#D32F2F',
      disputed: '#7B1FA2',
    };
    return colors[status];
  }
}
