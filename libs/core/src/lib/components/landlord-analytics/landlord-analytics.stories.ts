import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OccupancyChartComponent } from './occupancy-chart.component';
import { RevenueWidgetComponent } from './revenue-widget.component';
import { ListingStatsCardComponent } from './listing-stats-card.component';
import type { OccupancySummary, RevenueSummary, ListingStats } from './landlord-analytics.types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockOccupancy: OccupancySummary = {
  propertyId: 'p1',
  propertyTitle: 'Apartamento T2 no Chiado',
  yearlyAverage: 87,
  data: [
    { month: 'Jan', occupancyRate: 100, occupied: true },
    { month: 'Fev', occupancyRate: 100, occupied: true },
    { month: 'Mar', occupancyRate: 100, occupied: true },
    { month: 'Abr', occupancyRate: 67,  occupied: true },
    { month: 'Mai', occupancyRate: 0,   occupied: false },
    { month: 'Jun', occupancyRate: 100, occupied: true },
    { month: 'Jul', occupancyRate: 100, occupied: true },
    { month: 'Ago', occupancyRate: 100, occupied: true },
    { month: 'Set', occupancyRate: 100, occupied: true },
    { month: 'Out', occupancyRate: 100, occupied: true },
    { month: 'Nov', occupancyRate: 100, occupied: true },
    { month: 'Dez', occupancyRate: 77,  occupied: true },
  ],
};

const mockRevenue: RevenueSummary = {
  currency: 'EUR',
  totalRevenue: 14400,
  totalExpenses: 3100,
  netProfit: 11300,
  growthPercent: 12,
  data: [
    { month: 'Jan', revenue: 1200, expenses: 250, net: 950 },
    { month: 'Fev', revenue: 1200, expenses: 400, net: 800 },
    { month: 'Mar', revenue: 1200, expenses: 200, net: 1000 },
    { month: 'Abr', revenue: 800,  expenses: 300, net: 500 },
    { month: 'Mai', revenue: 0,    expenses: 600, net: -600 },
    { month: 'Jun', revenue: 1200, expenses: 200, net: 1000 },
    { month: 'Jul', revenue: 1200, expenses: 250, net: 950 },
    { month: 'Ago', revenue: 1200, expenses: 150, net: 1050 },
    { month: 'Set', revenue: 1200, expenses: 250, net: 950 },
    { month: 'Out', revenue: 1200, expenses: 200, net: 1000 },
    { month: 'Nov', revenue: 1200, expenses: 300, net: 900 },
    { month: 'Dez', revenue: 900,  expenses: 300, net: 600 },
  ],
};

const mockListings: ListingStats[] = [
  {
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 no Chiado',
    propertyAddress: 'Rua do Alecrim 45, Lisboa',
    status: 'occupied',
    monthlyRent: 1200,
    currency: 'EUR',
    occupancyRate: 87,
    totalViews: 1420,
    totalInquiries: 34,
    activeBookings: 1,
    lastActivity: '2026-03-10',
    rating: 4.7,
    reviewCount: 12,
  },
  {
    propertyId: 'p2',
    propertyTitle: 'Studio em Alfama',
    propertyAddress: 'Beco do Espírito Santo 8, Lisboa',
    status: 'vacant',
    monthlyRent: 850,
    currency: 'EUR',
    occupancyRate: 62,
    totalViews: 780,
    totalInquiries: 21,
    activeBookings: 0,
    lastActivity: '2026-03-01',
    rating: 4.2,
    reviewCount: 7,
  },
  {
    propertyId: 'p3',
    propertyTitle: 'Moradia T3 na Ajuda',
    propertyAddress: 'Calçada da Ajuda 120, Lisboa',
    status: 'maintenance',
    monthlyRent: 1600,
    currency: 'EUR',
    occupancyRate: 45,
    totalViews: 320,
    totalInquiries: 8,
    activeBookings: 0,
    lastActivity: '2026-02-20',
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'LisboaRent/LandlordAnalytics',
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Landlord Analytics Dashboard** — Metrics and insights for property owners.

Three components:
- \`OccupancyChartComponent\` (\`iu-occupancy-chart\`) — SVG bar chart of monthly occupancy.
- \`RevenueWidgetComponent\` (\`iu-revenue-widget\`) — Revenue/profit KPIs with sparkline.
- \`ListingStatsCardComponent\` (\`iu-listing-stats-card\`) — Per-listing analytics card with status, rent, views, and actions.

Feature flag: \`LANDLORD_ANALYTICS\`
        `.trim(),
      },
    },
  },
};

export default meta;

// ─── Story 1: Full Dashboard ──────────────────────────────────────────────────

@Component({
  selector: 'story-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, OccupancyChartComponent, RevenueWidgetComponent, ListingStatsCardComponent],
  template: `
    <div style="padding:24px; max-width:900px; display:flex; flex-direction:column; gap:24px; font-family:sans-serif;">
      <h2 style="margin:0; font-size:20px;">Dashboard do Senhorio</h2>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <iu-occupancy-chart [summary]="occupancy" />
        <iu-revenue-widget [summary]="revenue" />
      </div>

      <h3 style="margin:0; font-size:16px;">Os meus imóveis</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;">
        @for (listing of listings; track listing.propertyId) {
          <iu-listing-stats-card
            [stats]="listing"
            (viewDetails)="log.set('view: ' + $event)"
            (editListing)="log.set('edit: ' + $event)"
          />
        }
      </div>
      @if (log()) {
        <pre style="padding:8px; background:#1e1e1e; color:#9cdcfe; border-radius:6px; font-size:12px;">{{ log() }}</pre>
      }
    </div>
  `,
})
class FullDashboardStoryComponent {
  readonly occupancy = mockOccupancy;
  readonly revenue = mockRevenue;
  readonly listings = mockListings;
  readonly log = signal('');
}

export const FullDashboard: StoryObj = {
  render: () => ({ component: FullDashboardStoryComponent }) as any,
  name: 'Full Dashboard',
};

// ─── Story 2: Occupancy Chart alone ──────────────────────────────────────────

export const OccupancyChart: StoryObj = {
  render: () => ({
    component: OccupancyChartComponent,
    props: { summary: mockOccupancy },
  }),
  name: 'Occupancy Chart',
};

// ─── Story 3: Listing States ──────────────────────────────────────────────────

@Component({
  selector: 'story-listing-states',
  standalone: true,
  imports: [CommonModule, ListingStatsCardComponent],
  template: `
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; padding:16px;">
      @for (l of listings; track l.propertyId) {
        <iu-listing-stats-card [stats]="l" />
      }
    </div>
  `,
})
class ListingStatesStoryComponent {
  readonly listings = mockListings;
}

export const ListingStates: StoryObj = {
  render: () => ({ component: ListingStatesStoryComponent }) as any,
  name: 'Listing Stats — All Status States',
};
