/**
 * @fileoverview TenantDashboardService — Sprint 033
 *
 * Signal-based analytics service for tenant (renter) dashboard data.
 * Provides computed signals for payment history, upcoming bookings,
 * spending analytics, and favourite properties.
 *
 * Companion to PaymentReceiptComponent, MyBookingsComponent, and
 * the ResourceSnapshot pattern (RESOURCE_SNAPSHOT).
 *
 * Feature flag: TENANT_DASHBOARD
 */
import { Injectable, signal, computed } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single tenant payment record */
export interface TenantPayment {
  /** Unique payment id */
  id: string;
  /** Invoice reference (e.g. INV-2026-0042) */
  invoiceRef: string;
  /** Property title */
  propertyTitle: string;
  /** Property address */
  propertyAddress: string;
  /** ISO date of payment */
  paidAt: string;
  /** Amount in EUR */
  amount: number;
  /** Payment status */
  status: 'paid' | 'pending' | 'overdue';
  /** Month label (e.g. "Jan 2026") */
  monthLabel: string;
}

/** An upcoming booking / active rental */
export interface TenantBooking {
  /** Unique booking id */
  id: string;
  /** Property title */
  propertyTitle: string;
  /** Property address */
  propertyAddress: string;
  /** Optional property thumbnail */
  propertyImageUrl?: string;
  /** Lease/booking start date (ISO) */
  startDate: string;
  /** Lease/booking end date (ISO) */
  endDate: string;
  /** Monthly rent in EUR */
  monthlyRent: number;
  /** Booking state */
  status: 'active' | 'upcoming' | 'past';
  /** Days until move-in (0 if active) */
  daysUntilStart?: number;
}

/** A favourite property summary */
export interface TenantFavouriteProperty {
  /** Unique property id */
  id: string;
  /** Property title */
  title: string;
  /** Full address */
  address: string;
  /** Neighbourhood / area */
  neighbourhood: string;
  /** Monthly rent in EUR */
  monthlyRent: number;
  /** Optional thumbnail URL */
  imageUrl?: string;
  /** Date saved (ISO) */
  savedAt: string;
  /** Whether still available */
  available: boolean;
  /** Average rating */
  rating?: number;
}

/** Monthly spending data point */
export interface TenantSpendingPoint {
  /** Month label (e.g. "Jan") */
  month: string;
  /** Rent paid in EUR */
  rent: number;
  /** Other fees (service, cleaning, etc.) in EUR */
  fees: number;
  /** Total amount */
  total: number;
}

/** Top-level KPI snapshot for the tenant */
export interface TenantKPIs {
  /** Total rent paid in trailing 12 months */
  totalPaidTtm: number;
  /** Average monthly spend TTM */
  avgMonthlySpend: number;
  /** Number of active/upcoming bookings */
  activeBookings: number;
  /** Number of completed rentals */
  completedRentals: number;
  /** Number of saved favourite properties */
  savedFavourites: number;
  /** Most expensive month label */
  peakMonth: string;
  /** Currency code */
  currency: string;
}

/** Full tenant dashboard dataset */
export interface TenantDashboard {
  kpis: TenantKPIs;
  payments: TenantPayment[];
  bookings: TenantBooking[];
  favourites: TenantFavouriteProperty[];
  spendingHistory: TenantSpendingPoint[];
  lastUpdated: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function buildMockPayments(): TenantPayment[] {
  const months = [
    { label: 'Mar 2026', iso: '2026-03-01' },
    { label: 'Fev 2026', iso: '2026-02-01' },
    { label: 'Jan 2026', iso: '2026-01-01' },
    { label: 'Dez 2025', iso: '2025-12-01' },
    { label: 'Nov 2025', iso: '2025-11-01' },
    { label: 'Out 2025', iso: '2025-10-01' },
    { label: 'Set 2025', iso: '2025-09-01' },
    { label: 'Ago 2025', iso: '2025-08-01' },
    { label: 'Jul 2025', iso: '2025-07-01' },
    { label: 'Jun 2025', iso: '2025-06-01' },
    { label: 'Mai 2025', iso: '2025-05-01' },
    { label: 'Abr 2025', iso: '2025-04-01' },
  ];

  return months.map((m, i) => ({
    id: `pay-${i + 1}`,
    invoiceRef: `INV-2026-${String(100 - i).padStart(4, '0')}`,
    propertyTitle: 'Apartamento T2 — Bairro Alto',
    propertyAddress: 'Rua do Alecrim 45, 1200-018 Lisboa',
    paidAt: m.iso,
    amount: 1250 + (i === 2 ? 0 : i === 4 ? 50 : 0), // minor variation
    status: i === 0 ? 'pending' : 'paid',
    monthLabel: m.label,
  }));
}

function buildMockBookings(): TenantBooking[] {
  return [
    {
      id: 'bk-001',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Alecrim 45, 1200-018 Lisboa',
      startDate: '2025-04-01',
      endDate: '2026-09-30',
      monthlyRent: 1250,
      status: 'active',
    },
    {
      id: 'bk-002',
      propertyTitle: 'Studio Moderno — Príncipe Real',
      propertyAddress: 'Rua Dom Pedro V 78, 1250-095 Lisboa',
      startDate: '2026-10-01',
      endDate: '2027-09-30',
      monthlyRent: 1100,
      status: 'upcoming',
      daysUntilStart: 187,
    },
  ];
}

function buildMockFavourites(): TenantFavouriteProperty[] {
  return [
    {
      id: 'fav-1',
      title: 'Studio em Alfama',
      address: 'Beco do Espírito Santo 8, Lisboa',
      neighbourhood: 'Alfama',
      monthlyRent: 950,
      savedAt: '2026-03-15',
      available: true,
      rating: 4.3,
    },
    {
      id: 'fav-2',
      title: 'T1 com Vista Rio — Cais do Sodré',
      address: 'Rua Nova do Carvalho 12, Lisboa',
      neighbourhood: 'Cais do Sodré',
      monthlyRent: 1350,
      savedAt: '2026-03-10',
      available: true,
      rating: 4.7,
    },
    {
      id: 'fav-3',
      title: 'T3 Familiar — Mouraria',
      address: 'Rua da Mouraria 55, Lisboa',
      neighbourhood: 'Mouraria',
      monthlyRent: 1800,
      savedAt: '2026-02-28',
      available: false,
      rating: 4.1,
    },
    {
      id: 'fav-4',
      title: 'Loft Industrial — Alcântara',
      address: 'Rua Fradesso da Silveira 10, Lisboa',
      neighbourhood: 'Alcântara',
      monthlyRent: 1150,
      savedAt: '2026-02-20',
      available: true,
      rating: 4.5,
    },
  ];
}

function buildMockSpending(): TenantSpendingPoint[] {
  const months = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'];
  const rents = [1200, 1200, 1200, 1200, 1200, 1250, 1250, 1250, 1250, 1250, 1250, 1250];
  const fees = [60, 60, 80, 60, 60, 60, 70, 60, 60, 60, 60, 60];
  return months.map((month, i) => ({
    month,
    rent: rents[i],
    fees: fees[i],
    total: rents[i] + fees[i],
  }));
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * TenantDashboardService — Sprint 033
 *
 * Signal-based service providing renter analytics and dashboard state.
 * Mirrors the landlord-side RevenueAnalyticsService pattern.
 *
 * Feature flag: TENANT_DASHBOARD
 */
@Injectable({ providedIn: 'root' })
export class TenantDashboardService {
  // ── State signals ──────────────────────────────────────────────────────────

  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _dashboard = signal<TenantDashboard | null>(null);

  // ── Public reads ───────────────────────────────────────────────────────────

  /** Whether data is loading */
  readonly isLoading = this._isLoading.asReadonly();

  /** Error message, if any */
  readonly error = this._error.asReadonly();

  /** Full dashboard dataset */
  readonly dashboard = this._dashboard.asReadonly();

  // ── Computed KPIs ──────────────────────────────────────────────────────────

  /** Top-level KPIs, null until loaded */
  readonly kpis = computed(() => this._dashboard()?.kpis ?? null);

  /** Payment history, newest first */
  readonly payments = computed(() => this._dashboard()?.payments ?? []);

  /** Active + upcoming bookings */
  readonly bookings = computed(() => this._dashboard()?.bookings ?? []);

  /** Favourite properties */
  readonly favourites = computed(() => this._dashboard()?.favourites ?? []);

  /** Monthly spending history (12 months) */
  readonly spendingHistory = computed(() => this._dashboard()?.spendingHistory ?? []);

  /** Count of paid invoices */
  readonly paidCount = computed(() => this.payments().filter(p => p.status === 'paid').length);

  /** Total paid TTM (from payments signal) */
  readonly totalPaidTtm = computed(() =>
    this.payments().filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  );

  /** Active rental (the one with status=active) */
  readonly activeRental = computed(() => this.bookings().find(b => b.status === 'active') ?? null);

  /** Next upcoming booking */
  readonly nextBooking = computed(() => this.bookings().find(b => b.status === 'upcoming') ?? null);

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Load tenant dashboard data for the given tenantId.
   * Returns mock data after a short simulated delay.
   *
   * @param tenantId - Optional tenant identifier (used for multi-tenant scenarios)
   */
  async load(tenantId?: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 550));

      const payments = buildMockPayments();
      const spendingHistory = buildMockSpending();
      const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const avgMonthly = Math.round(totalPaid / 11); // 11 paid months

      const kpis: TenantKPIs = {
        totalPaidTtm: totalPaid,
        avgMonthlySpend: avgMonthly,
        activeBookings: 1,
        completedRentals: 2,
        savedFavourites: 4,
        peakMonth: 'Set 2025', // highest rent + fees month
        currency: 'EUR',
      };

      this._dashboard.set({
        kpis,
        payments,
        bookings: buildMockBookings(),
        favourites: buildMockFavourites(),
        spendingHistory,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      this._error.set('Failed to load tenant dashboard data');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Format a currency amount using pt-PT locale.
   *
   * @param amount - Numeric value in EUR
   * @returns Formatted string like "1.250,00 €"
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
