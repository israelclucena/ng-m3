import { Injectable, signal, computed } from '@angular/core';

export type PropertyStatus = 'occupied' | 'vacant' | 'maintenance' | 'listed';

export interface PortfolioProperty {
  id: string;
  address: string;
  type: string;            // e.g. 'T2 Apartment'
  status: PropertyStatus;
  monthlyRent: number;
  currency: string;
  occupancyRate: number;   // 0-100
  pendingActions: number;  // maintenance requests, pending payments, etc.
  lastEvent: string;       // short description
  lastEventDate: string;   // ISO date
}

export interface PortfolioKPIs {
  totalProperties: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  totalMRR: number;        // Monthly Recurring Revenue
  avgOccupancyRate: number;
  pendingActions: number;
  currency: string;
}

export interface MonthlySnapshot {
  month: string;
  mrr: number;
  occupancyRate: number;
}

const MOCK_PROPERTIES: PortfolioProperty[] = [
  {
    id: 'prop-001',
    address: 'Rua do Alecrim 45, Lisboa',
    type: 'T2 Apartment',
    status: 'occupied',
    monthlyRent: 1200,
    currency: 'EUR',
    occupancyRate: 92,
    pendingActions: 1,
    lastEvent: 'Lease renewed for 12 months',
    lastEventDate: '2026-03-15',
  },
  {
    id: 'prop-002',
    address: 'Avenida Liberdade 120, Lisboa',
    type: 'T3 Apartment',
    status: 'occupied',
    monthlyRent: 1800,
    currency: 'EUR',
    occupancyRate: 88,
    pendingActions: 2,
    lastEvent: 'Rent arrears reminder sent',
    lastEventDate: '2026-03-28',
  },
  {
    id: 'prop-003',
    address: 'Mouraria 3, Lisboa',
    type: 'Studio',
    status: 'maintenance',
    monthlyRent: 850,
    currency: 'EUR',
    occupancyRate: 0,
    pendingActions: 3,
    lastEvent: 'Plumbing repair requested',
    lastEventDate: '2026-03-30',
  },
  {
    id: 'prop-004',
    address: 'Bairro Alto 22, Lisboa',
    type: 'T1 Apartment',
    status: 'listed',
    monthlyRent: 950,
    currency: 'EUR',
    occupancyRate: 0,
    pendingActions: 4,
    lastEvent: 'New viewing request received',
    lastEventDate: '2026-04-02',
  },
  {
    id: 'prop-005',
    address: 'Cais do Sodré 44, Lisboa',
    type: 'T2 Apartment',
    status: 'occupied',
    monthlyRent: 1400,
    currency: 'EUR',
    occupancyRate: 100,
    pendingActions: 0,
    lastEvent: 'Rent payment received',
    lastEventDate: '2026-04-01',
  },
];

const MOCK_MONTHLY: MonthlySnapshot[] = [
  { month: 'Oct', mrr: 4850, occupancyRate: 72 },
  { month: 'Nov', mrr: 5200, occupancyRate: 76 },
  { month: 'Dec', mrr: 5200, occupancyRate: 76 },
  { month: 'Jan', mrr: 5450, occupancyRate: 80 },
  { month: 'Feb', mrr: 5450, occupancyRate: 80 },
  { month: 'Mar', mrr: 6000, occupancyRate: 86 },
];

/** PortfolioOverviewService — high-level landlord portfolio analytics. */
@Injectable({ providedIn: 'root' })
export class PortfolioOverviewService {
  private _properties = signal<PortfolioProperty[]>(MOCK_PROPERTIES);
  private _monthlyData = signal<MonthlySnapshot[]>(MOCK_MONTHLY);

  readonly properties = this._properties.asReadonly();
  readonly monthlyData = this._monthlyData.asReadonly();

  readonly kpis = computed((): PortfolioKPIs => {
    const props = this._properties();
    const occupied = props.filter(p => p.status === 'occupied').length;
    const vacant = props.filter(p => p.status === 'vacant').length;
    const maintenance = props.filter(p => p.status === 'maintenance').length;
    const totalMRR = props
      .filter(p => p.status === 'occupied')
      .reduce((s, p) => s + p.monthlyRent, 0);
    const occupiedProps = props.filter(p => p.occupancyRate > 0);
    const avgOccupancyRate = occupiedProps.length > 0
      ? Math.round(occupiedProps.reduce((s, p) => s + p.occupancyRate, 0) / occupiedProps.length)
      : 0;
    const pendingActions = props.reduce((s, p) => s + p.pendingActions, 0);
    return {
      totalProperties: props.length,
      occupied,
      vacant,
      maintenance,
      totalMRR,
      avgOccupancyRate,
      pendingActions,
      currency: 'EUR',
    };
  });

  readonly mrrGrowth = computed(() => {
    const data = this._monthlyData();
    if (data.length < 2) return 0;
    const last = data[data.length - 1].mrr;
    const prev = data[data.length - 2].mrr;
    return prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
  });

  /** Status colour. */
  statusColor(status: PropertyStatus): string {
    const map: Record<PropertyStatus, string> = {
      occupied: '#388E3C',
      vacant: '#1976D2',
      maintenance: '#E65100',
      listed: '#7B1FA2',
    };
    return map[status];
  }

  /** Status label. */
  statusLabel(status: PropertyStatus): string {
    const map: Record<PropertyStatus, string> = {
      occupied: 'Occupied',
      vacant: 'Vacant',
      maintenance: 'Maintenance',
      listed: 'Listed',
    };
    return map[status];
  }
}
