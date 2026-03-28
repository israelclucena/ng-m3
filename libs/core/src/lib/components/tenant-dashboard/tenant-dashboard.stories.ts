/**
 * @fileoverview TenantDashboardComponent stories — Sprint 033
 *
 * CSF3 stories for `iu-tenant-dashboard`.
 * Feature flag: TENANT_DASHBOARD
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { TenantDashboardComponent } from '@israel-ui/core';

const meta: Meta<TenantDashboardComponent> = {
  title: 'Sprint 033/TenantDashboard',
  component: TenantDashboardComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**\`iu-tenant-dashboard\`** — Renter analytics dashboard.

Provides the tenant-side counterpart to \`LandlordRevenueComponent\`:
- 4 KPI cards (total paid TTM, avg monthly, active bookings, saved favourites)
- Active rental banner
- 12-month spending bar chart (rent + fees stacked)
- Upcoming lease card
- Full payment history table with invoice refs and status
- Saved favourite properties grid

Feature flag: \`TENANT_DASHBOARD\`
        `.trim(),
      },
    },
  },
};

export default meta;
type Story = StoryObj<TenantDashboardComponent>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default — auto-loads with mock tenant data.
 * Shows all sections: KPIs, active rental, chart, payment history, favourites.
 */
export const Default: Story = {
  args: {
    tenantId: 'tenant-001',
    autoLoad: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully loaded state with mock data. Auto-loads on render via `effect()` on `tenantId`.',
      },
    },
  },
};

/**
 * NoAutoLoad — renders with no data; use the Refresh button to load.
 * Useful for testing the empty/loading state.
 */
export const NoAutoLoad: Story = {
  args: {
    tenantId: 'tenant-001',
    autoLoad: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component renders empty; click **Refresh** to trigger the 550ms mock load.',
      },
    },
  },
};

/**
 * AnonymousTenant — no tenantId provided; loads generic demo data.
 */
export const AnonymousTenant: Story = {
  args: {
    tenantId: undefined,
    autoLoad: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'No `tenantId` set — loads with undefined id, simulating a guest/anonymous renter view.',
      },
    },
  },
};
