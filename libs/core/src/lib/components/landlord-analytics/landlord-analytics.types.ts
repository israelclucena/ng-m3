/**
 * landlord-analytics.types.ts — Shared types for Landlord Analytics Dashboard.
 * Feature flag: LANDLORD_ANALYTICS
 */

// ─── Occupancy ────────────────────────────────────────────────────────────────

/** Occupancy data point for a single month */
export interface OccupancyDataPoint {
  /** Short month label, e.g. "Jan", "Fev" */
  month: string;
  /** Occupancy rate 0–100 */
  occupancyRate: number;
  /** Whether the property was occupied */
  occupied: boolean;
}

/** Full occupancy summary for a property */
export interface OccupancySummary {
  propertyId: string;
  propertyTitle: string;
  yearlyAverage: number;
  data: OccupancyDataPoint[];
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

/** Revenue data point for a single month */
export interface RevenueDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

/** Revenue widget summary */
export interface RevenueSummary {
  currency: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  growthPercent: number;
  data: RevenueDataPoint[];
}

// ─── Listing Stats ────────────────────────────────────────────────────────────

/** Statistics for a single listing */
export interface ListingStats {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  status: 'occupied' | 'vacant' | 'pending' | 'maintenance';
  monthlyRent: number;
  currency: string;
  occupancyRate: number;
  totalViews: number;
  totalInquiries: number;
  activeBookings: number;
  lastActivity?: string;  // ISO date
  rating?: number;        // 0–5
  reviewCount?: number;
}
