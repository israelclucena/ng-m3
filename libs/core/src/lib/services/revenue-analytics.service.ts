/**
 * @fileoverview RevenueAnalyticsService — Sprint 030
 *
 * Signal-based analytics service for landlord revenue data.
 * Provides computed signals for MRR, total bookings, occupancy rate, and top properties.
 * Companion to LANDLORD_ANALYTICS + PAYMENT_GATEWAY — aggregates transaction signals.
 *
 * Feature flag: LANDLORD_REVENUE
 */
import { Injectable, signal, computed } from '@angular/core';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single monthly revenue data point */
export interface MonthlyRevenue {
  month: string;   // e.g. 'Jan', 'Fev', 'Mar'
  year: number;
  revenue: number;
  expenses: number;
  net: number;
  bookings: number;
  occupancyRate: number; // 0-100
}

/** Per-property summary for the leaderboard */
export interface PropertyRevenueSummary {
  propertyId: string;
  propertyTitle: string;
  monthlyRent: number;
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  trend: 'up' | 'down' | 'flat';
}

/** Top-level KPI snapshot */
export interface RevenueKPIs {
  mrr: number;             // Monthly Recurring Revenue (current month)
  arrProjected: number;    // Annualised Revenue Run Rate
  totalRevenueTtm: number; // Trailing 12 months
  totalExpensesTtm: number;
  netProfitTtm: number;
  totalBookingsTtm: number;
  avgOccupancyRate: number;
  growthMoM: number;       // Month-over-month growth %
  currency: string;
}

/** Complete analytics dataset for a landlord */
export interface LandlordAnalytics {
  kpis: RevenueKPIs;
  monthlyData: MonthlyRevenue[];
  topProperties: PropertyRevenueSummary[];
  lastUpdated: string;
}

// ─── Mock data helpers ────────────────────────────────────────────────────────

function buildMockMonthly(): MonthlyRevenue[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const revenues = [3600, 3600, 3800, 2400, 0, 3600, 4800, 4800, 4800, 4800, 4000, 3200];
  const expenses = [750, 1200, 600, 900, 1800, 600, 750, 450, 750, 600, 900, 900];
  const bookings = [3, 3, 4, 2, 0, 3, 4, 4, 4, 4, 4, 3];
  const occupancy = [90, 90, 95, 60, 0, 90, 100, 100, 100, 100, 87, 77];
  return months.map((m, i) => ({
    month: m,
    year: 2026,
    revenue: revenues[i],
    expenses: expenses[i],
    net: revenues[i] - expenses[i],
    bookings: bookings[i],
    occupancyRate: occupancy[i],
  }));
}

function buildMockProperties(): PropertyRevenueSummary[] {
  return [
    {
      propertyId: 'p1',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      monthlyRent: 1200,
      totalRevenue: 13800,
      totalBookings: 11,
      occupancyRate: 92,
      trend: 'up',
    },
    {
      propertyId: 'p2',
      propertyTitle: 'Studio — Alfama',
      monthlyRent: 850,
      totalRevenue: 7650,
      totalBookings: 9,
      occupancyRate: 75,
      trend: 'flat',
    },
    {
      propertyId: 'p3',
      propertyTitle: 'Moradia T3 — Ajuda',
      monthlyRent: 1600,
      totalRevenue: 9600,
      totalBookings: 6,
      occupancyRate: 50,
      trend: 'down',
    },
  ];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RevenueAnalyticsService {
  private readonly _analytics = signal<LandlordAnalytics | null>(null);
  private readonly _loading = signal(false);

  /** Whether analytics data is being loaded */
  readonly loading = this._loading.asReadonly();

  /** Raw analytics snapshot (null until loaded) */
  readonly analytics = this._analytics.asReadonly();

  /** KPIs — null if not loaded */
  readonly kpis = computed(() => this._analytics()?.kpis ?? null);

  /** Monthly revenue array (TTM) */
  readonly monthlyData = computed(() => this._analytics()?.monthlyData ?? []);

  /** Top properties by revenue */
  readonly topProperties = computed(() => this._analytics()?.topProperties ?? []);

  /** Best month by net profit */
  readonly bestMonth = computed(() => {
    const data = this.monthlyData();
    if (!data.length) return null;
    return data.reduce((best, m) => m.net > best.net ? m : best);
  });

  /** Current (latest) month */
  readonly currentMonth = computed(() => {
    const data = this.monthlyData();
    return data.length ? data[data.length - 1] : null;
  });

  /** Previous month (for MoM comparison) */
  readonly previousMonth = computed(() => {
    const data = this.monthlyData();
    return data.length >= 2 ? data[data.length - 2] : null;
  });

  /**
   * Load mock analytics data for a landlord.
   * In production: replace with createHttpResource() call.
   *
   * @param landlordId Used for future API integration
   */
  async load(landlordId = 'default'): Promise<void> {
    this._loading.set(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    const monthly = buildMockMonthly();
    const properties = buildMockProperties();

    const totalRevenueTtm = monthly.reduce((s, m) => s + m.revenue, 0);
    const totalExpensesTtm = monthly.reduce((s, m) => s + m.expenses, 0);
    const totalBookingsTtm = monthly.reduce((s, m) => s + m.bookings, 0);
    const avgOccupancy = Math.round(monthly.reduce((s, m) => s + m.occupancyRate, 0) / monthly.length);
    const mrr = monthly[monthly.length - 1].revenue;
    const prevMrr = monthly[monthly.length - 2].revenue;
    const growthMoM = prevMrr > 0 ? +((mrr - prevMrr) / prevMrr * 100).toFixed(1) : 0;

    const kpis: RevenueKPIs = {
      mrr,
      arrProjected: mrr * 12,
      totalRevenueTtm,
      totalExpensesTtm,
      netProfitTtm: totalRevenueTtm - totalExpensesTtm,
      totalBookingsTtm,
      avgOccupancyRate: avgOccupancy,
      growthMoM,
      currency: 'EUR',
    };

    this._analytics.set({
      kpis,
      monthlyData: monthly,
      topProperties: properties,
      lastUpdated: new Date().toISOString(),
    });
    this._loading.set(false);
  }

  /**
   * Format currency using pt-PT locale.
   */
  formatAmount(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  }

  /**
   * Reset analytics state.
   */
  reset(): void {
    this._analytics.set(null);
    this._loading.set(false);
  }
}
