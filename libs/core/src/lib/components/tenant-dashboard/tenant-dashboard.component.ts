/**
 * @fileoverview TenantDashboardComponent — Sprint 033
 *
 * `iu-tenant-dashboard` — signal-based renter analytics dashboard.
 *
 * Provides the tenant (renter) counterpart to LandlordRevenueComponent.
 * Shows KPI cards (total paid TTM, avg monthly, active bookings, saved favourites),
 * 12-month spending bar chart, payment history table, upcoming bookings, and
 * favourite properties list.
 *
 * Patterns used:
 * - Angular Signals only (no RxJS)
 * - Standalone component
 * - effect() to trigger load() on tenantId change
 * - M3 design tokens throughout
 *
 * Feature flag: TENANT_DASHBOARD
 *
 * @example
 * ```html
 * <iu-tenant-dashboard [tenantId]="currentUser().id" />
 * ```
 */
import { Component, input, effect, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TenantDashboardService,
  TenantPayment,
  TenantBooking,
  TenantFavouriteProperty,
  TenantSpendingPoint,
  TenantKPIs,
} from '../../services/tenant-dashboard.service';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-tenant-dashboard`
 *
 * Full-width renter analytics dashboard with KPIs, spending chart,
 * payment history, active bookings, and saved favourites.
 *
 * Feature flag: TENANT_DASHBOARD
 */
@Component({
  selector: 'iu-tenant-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-tenant-dashboard">

      <!-- ── Header ── -->
      <div class="td-header">
        <div class="td-header-left">
          <span class="material-symbols-outlined td-header-icon">person</span>
          <div>
            <h2 class="td-title">Tenant Dashboard</h2>
            <p class="td-subtitle">Your rental overview — trailing 12 months</p>
          </div>
        </div>
        <button class="td-refresh-btn" (click)="refresh()" [disabled]="svc.isLoading()">
          <span class="material-symbols-outlined" [class.spinning]="svc.isLoading()">refresh</span>
          Refresh
        </button>
      </div>

      <!-- ── Loading ── -->
      @if (svc.isLoading()) {
        <div class="td-loading">
          <div class="td-spinner"></div>
          <p>Loading your dashboard…</p>
        </div>
      }

      <!-- ── Error ── -->
      @if (svc.error()) {
        <div class="td-error">
          <span class="material-symbols-outlined">error</span>
          <p>{{ svc.error() }}</p>
          <button class="td-error-retry" (click)="refresh()">Try again</button>
        </div>
      }

      <!-- ── Content ── -->
      @if (!svc.isLoading() && svc.dashboard()) {

        <!-- KPI Cards -->
        @if (svc.kpis(); as kpis) {
          <div class="td-kpi-grid">

            <div class="td-kpi-card td-kpi-primary">
              <span class="material-symbols-outlined td-kpi-icon">payments</span>
              <div class="td-kpi-body">
                <span class="td-kpi-label">Total Paid (TTM)</span>
                <span class="td-kpi-value">{{ svc.formatAmount(kpis.totalPaidTtm) }}</span>
                <span class="td-kpi-sub">{{ kpis.currency }} · last 12 months</span>
              </div>
            </div>

            <div class="td-kpi-card">
              <span class="material-symbols-outlined td-kpi-icon">calendar_month</span>
              <div class="td-kpi-body">
                <span class="td-kpi-label">Avg / Month</span>
                <span class="td-kpi-value">{{ svc.formatAmount(kpis.avgMonthlySpend) }}</span>
                <span class="td-kpi-sub">12-month average</span>
              </div>
            </div>

            <div class="td-kpi-card">
              <span class="material-symbols-outlined td-kpi-icon">home</span>
              <div class="td-kpi-body">
                <span class="td-kpi-label">Active Bookings</span>
                <span class="td-kpi-value">{{ kpis.activeBookings }}</span>
                <span class="td-kpi-sub">{{ kpis.completedRentals }} completed</span>
              </div>
            </div>

            <div class="td-kpi-card">
              <span class="material-symbols-outlined td-kpi-icon">favorite</span>
              <div class="td-kpi-body">
                <span class="td-kpi-label">Saved Properties</span>
                <span class="td-kpi-value">{{ kpis.savedFavourites }}</span>
                <span class="td-kpi-sub">Peak month: {{ kpis.peakMonth }}</span>
              </div>
            </div>

          </div>
        }

        <!-- Active Rental Banner -->
        @if (svc.activeRental(); as rental) {
          <div class="td-active-rental">
            <div class="td-active-rental-left">
              <span class="td-active-badge">
                <span class="material-symbols-outlined">check_circle</span>
                Active Lease
              </span>
              <h3 class="td-rental-title">{{ rental.propertyTitle }}</h3>
              <p class="td-rental-address">{{ rental.propertyAddress }}</p>
            </div>
            <div class="td-active-rental-right">
              <div class="td-rental-stat">
                <span class="td-rental-stat-label">Monthly Rent</span>
                <span class="td-rental-stat-value">{{ svc.formatAmount(rental.monthlyRent) }}</span>
              </div>
              <div class="td-rental-stat">
                <span class="td-rental-stat-label">Lease End</span>
                <span class="td-rental-stat-value">{{ rental.endDate | date:'MMM yyyy' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Spending Chart + Payment History (side-by-side on wide screens) -->
        <div class="td-row">

          <!-- Spending Chart -->
          <div class="td-card td-chart-card">
            <div class="td-card-header">
              <span class="material-symbols-outlined">bar_chart</span>
              <h3>Monthly Spending</h3>
            </div>
            <div class="td-chart-area">
              @for (point of svc.spendingHistory(); track point.month) {
                <div class="td-chart-col">
                  <div class="td-chart-bars">
                    <div
                      class="td-bar td-bar-fees"
                      [style.height.%]="barHeight(point.fees, maxSpend())"
                      [title]="'Fees: ' + svc.formatAmount(point.fees)"
                    ></div>
                    <div
                      class="td-bar td-bar-rent"
                      [style.height.%]="barHeight(point.rent, maxSpend())"
                      [title]="'Rent: ' + svc.formatAmount(point.rent)"
                    ></div>
                  </div>
                  <span class="td-chart-label">{{ point.month }}</span>
                </div>
              }
            </div>
            <div class="td-chart-legend">
              <span class="td-legend-item"><span class="td-legend-dot td-dot-rent"></span>Rent</span>
              <span class="td-legend-item"><span class="td-legend-dot td-dot-fees"></span>Fees</span>
            </div>
          </div>

          <!-- Upcoming Booking -->
          @if (svc.nextBooking(); as next) {
            <div class="td-card td-upcoming-card">
              <div class="td-card-header">
                <span class="material-symbols-outlined">event_upcoming</span>
                <h3>Upcoming Lease</h3>
              </div>
              <div class="td-upcoming-body">
                <span class="td-upcoming-badge">
                  <span class="material-symbols-outlined">schedule</span>
                  {{ next.daysUntilStart }} days to go
                </span>
                <h4 class="td-upcoming-title">{{ next.propertyTitle }}</h4>
                <p class="td-upcoming-address">{{ next.propertyAddress }}</p>
                <div class="td-upcoming-dates">
                  <div class="td-upcoming-date">
                    <span class="td-upcoming-date-label">Move-in</span>
                    <span class="td-upcoming-date-value">{{ next.startDate | date:'d MMM yyyy' }}</span>
                  </div>
                  <span class="material-symbols-outlined td-upcoming-arrow">arrow_forward</span>
                  <div class="td-upcoming-date">
                    <span class="td-upcoming-date-label">Lease End</span>
                    <span class="td-upcoming-date-value">{{ next.endDate | date:'d MMM yyyy' }}</span>
                  </div>
                </div>
                <div class="td-upcoming-rent">
                  <span class="td-upcoming-rent-label">Monthly Rent</span>
                  <span class="td-upcoming-rent-value">{{ svc.formatAmount(next.monthlyRent) }}</span>
                </div>
              </div>
            </div>
          }

        </div>

        <!-- Payment History -->
        <div class="td-card">
          <div class="td-card-header">
            <span class="material-symbols-outlined">receipt_long</span>
            <h3>Payment History</h3>
            <span class="td-payment-count">{{ svc.paidCount() }} paid</span>
          </div>
          <div class="td-payment-table">
            <div class="td-payment-header-row">
              <span>Invoice</span>
              <span>Property</span>
              <span>Month</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            @for (payment of svc.payments(); track payment.id) {
              <div class="td-payment-row">
                <span class="td-payment-ref">{{ payment.invoiceRef }}</span>
                <span class="td-payment-property">{{ payment.propertyTitle }}</span>
                <span class="td-payment-month">{{ payment.monthLabel }}</span>
                <span class="td-payment-amount">{{ svc.formatAmount(payment.amount) }}</span>
                <span class="td-payment-status td-status-{{ payment.status }}">
                  <span class="material-symbols-outlined td-status-icon">
                    @switch (payment.status) {
                      @case ('paid') { check_circle }
                      @case ('pending') { pending }
                      @case ('overdue') { error }
                    }
                  </span>
                  {{ payment.status | titlecase }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Favourite Properties -->
        <div class="td-card">
          <div class="td-card-header">
            <span class="material-symbols-outlined">favorite</span>
            <h3>Saved Properties</h3>
          </div>
          <div class="td-favourites-grid">
            @for (fav of svc.favourites(); track fav.id) {
              <div class="td-fav-card" [class.td-fav-unavailable]="!fav.available">
                <div class="td-fav-header">
                  <div class="td-fav-placeholder">
                    <span class="material-symbols-outlined">apartment</span>
                  </div>
                  @if (!fav.available) {
                    <span class="td-fav-unavailable-badge">Unavailable</span>
                  }
                </div>
                <div class="td-fav-body">
                  <h4 class="td-fav-title">{{ fav.title }}</h4>
                  <p class="td-fav-address">
                    <span class="material-symbols-outlined td-fav-pin">location_on</span>
                    {{ fav.neighbourhood }}
                  </p>
                  <div class="td-fav-footer">
                    <span class="td-fav-rent">{{ svc.formatAmount(fav.monthlyRent) }}<span class="td-fav-mo">/mo</span></span>
                    @if (fav.rating) {
                      <span class="td-fav-rating">
                        <span class="material-symbols-outlined td-fav-star">star</span>
                        {{ fav.rating }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      }<!-- /content -->

    </div>
  `,
  styles: [`
    .iu-tenant-dashboard {
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .td-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .td-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .td-header-icon {
      font-size: 32px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .td-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
    }
    .td-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-refresh-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      background: transparent;
      color: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    .td-refresh-btn:hover:not(:disabled) {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .td-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Loading / Error ── */
    .td-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 16px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--md-sys-color-surface-variant, #e7e0ec);
      border-top-color: var(--md-sys-color-primary, #6750a4);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .td-error {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #ffdad6);
      color: var(--md-sys-color-on-error-container, #410002);
    }
    .td-error-retry {
      margin-left: auto;
      padding: 6px 14px;
      border-radius: 14px;
      border: none;
      background: var(--md-sys-color-error, #b3261e);
      color: white;
      cursor: pointer;
    }

    /* ── KPI Grid ── */
    .td-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .td-kpi-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px;
      border-radius: 16px;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .td-kpi-primary {
      background: var(--md-sys-color-primary-container, #eaddff);
      border-color: var(--md-sys-color-primary, #6750a4);
    }
    .td-kpi-icon {
      font-size: 24px;
      color: var(--md-sys-color-primary, #6750a4);
      margin-top: 2px;
    }
    .td-kpi-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .td-kpi-label {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .td-kpi-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      line-height: 1;
    }
    .td-kpi-sub {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    /* ── Active Rental Banner ── */
    .td-active-rental {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px;
      border-radius: 16px;
      background: var(--md-sys-color-secondary-container, #e8def8);
      border: 1px solid var(--md-sys-color-secondary, #625b71);
    }
    .td-active-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--md-sys-color-secondary, #625b71);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .td-active-badge .material-symbols-outlined {
      font-size: 16px;
      color: var(--md-sys-color-secondary, #625b71);
    }
    .td-rental-title {
      margin: 0 0 4px;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .td-rental-address {
      margin: 0;
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-active-rental-right {
      display: flex;
      gap: 32px;
    }
    .td-rental-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: right;
    }
    .td-rental-stat-label {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-rental-stat-value {
      font-size: 1.1rem;
      font-weight: 600;
    }

    /* ── Row layout ── */
    .td-row {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 16px;
    }
    @media (max-width: 900px) {
      .td-row { grid-template-columns: 1fr; }
    }

    /* ── Card ── */
    .td-card {
      border-radius: 16px;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      overflow: hidden;
    }
    .td-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .td-card-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      flex: 1;
    }
    .td-card-header .material-symbols-outlined {
      color: var(--md-sys-color-primary, #6750a4);
    }
    .td-payment-count {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      padding: 2px 8px;
      border-radius: 10px;
    }

    /* ── Spending Chart ── */
    .td-chart-card {
      display: flex;
      flex-direction: column;
    }
    .td-chart-area {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding: 24px 20px 8px;
      height: 160px;
      overflow-x: auto;
    }
    .td-chart-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 1;
      min-width: 28px;
      height: 100%;
      justify-content: flex-end;
    }
    .td-chart-bars {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 2px;
      justify-content: flex-end;
      height: 120px;
    }
    .td-bar {
      width: 16px;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.4s ease;
    }
    .td-bar-rent {
      background: var(--md-sys-color-primary, #6750a4);
    }
    .td-bar-fees {
      background: var(--md-sys-color-secondary, #625b71);
      opacity: 0.7;
    }
    .td-chart-label {
      font-size: 0.6rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-align: center;
    }
    .td-chart-legend {
      display: flex;
      gap: 16px;
      padding: 8px 20px 16px;
    }
    .td-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .td-dot-rent { background: var(--md-sys-color-primary, #6750a4); }
    .td-dot-fees { background: var(--md-sys-color-secondary, #625b71); opacity: 0.7; }

    /* ── Upcoming Card ── */
    .td-upcoming-card {}
    .td-upcoming-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .td-upcoming-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-tertiary, #7d5260);
      padding: 4px 10px;
      border-radius: 12px;
      width: fit-content;
    }
    .td-upcoming-badge .material-symbols-outlined { font-size: 14px; }
    .td-upcoming-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }
    .td-upcoming-address {
      margin: 0;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-upcoming-dates {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .td-upcoming-date {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .td-upcoming-date-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-upcoming-date-value {
      font-size: 0.875rem;
      font-weight: 500;
    }
    .td-upcoming-arrow {
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 18px;
    }
    .td-upcoming-rent {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 8px;
    }
    .td-upcoming-rent-label {
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-upcoming-rent-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }

    /* ── Payment Table ── */
    .td-payment-table {
      overflow-x: auto;
    }
    .td-payment-header-row,
    .td-payment-row {
      display: grid;
      grid-template-columns: 160px 1fr 130px 110px 110px;
      gap: 8px;
      padding: 10px 20px;
      align-items: center;
      font-size: 0.875rem;
    }
    .td-payment-header-row {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-variant, #e7e0ec);
    }
    .td-payment-row {
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .td-payment-row:last-child { border-bottom: none; }
    .td-payment-ref {
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-payment-amount { font-weight: 500; }
    .td-payment-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      border-radius: 12px;
      padding: 2px 8px;
      width: fit-content;
    }
    .td-status-icon { font-size: 14px; }
    .td-status-paid {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-secondary, #625b71);
    }
    .td-status-pending {
      background: #fff3e0;
      color: #e65100;
    }
    .td-status-overdue {
      background: var(--md-sys-color-error-container, #ffdad6);
      color: var(--md-sys-color-error, #b3261e);
    }

    /* ── Favourites Grid ── */
    .td-favourites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0;
    }
    .td-fav-card {
      border-right: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
    }
    .td-fav-card:nth-child(4n) { border-right: none; }
    .td-fav-unavailable { opacity: 0.6; }
    .td-fav-header {
      position: relative;
      height: 90px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .td-fav-placeholder .material-symbols-outlined {
      font-size: 40px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .td-fav-unavailable-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 0.65rem;
      background: var(--md-sys-color-error-container, #ffdad6);
      color: var(--md-sys-color-error, #b3261e);
      padding: 2px 6px;
      border-radius: 8px;
    }
    .td-fav-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .td-fav-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.2;
    }
    .td-fav-address {
      margin: 0;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .td-fav-pin { font-size: 14px; }
    .td-fav-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .td-fav-rent {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .td-fav-mo {
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-fav-rating {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .td-fav-star { font-size: 14px; color: #f9a825; }
  `],
})
export class TenantDashboardComponent implements OnInit {

  // ── Deps ──────────────────────────────────────────────────────────────────

  /** @internal */
  readonly svc = inject(TenantDashboardService);

  // ── Inputs ────────────────────────────────────────────────────────────────

  /**
   * Tenant identifier. When changed, triggers a data reload.
   * @default undefined (loads demo data)
   */
  readonly tenantId = input<string | undefined>(undefined);

  /**
   * Auto-load on init.
   * @default true
   */
  readonly autoLoad = input<boolean>(true);

  // ── Computed ──────────────────────────────────────────────────────────────

  /**
   * Maximum spending total across all months (used to scale bar chart heights).
   * @internal
   */
  readonly maxSpend = computed(() => {
    const history = this.svc.spendingHistory();
    if (!history.length) return 1;
    return Math.max(...history.map(p => p.total));
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    // Reload when tenantId changes
    effect(() => {
      const id = this.tenantId();
      if (this.autoLoad()) {
        void this.svc.load(id);
      }
    });
  }

  ngOnInit(): void {
    // Auto-load handled by effect in constructor
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * Manually trigger a data refresh.
   */
  refresh(): void {
    void this.svc.load(this.tenantId());
  }

  /**
   * Calculate bar height as a percentage of the maximum spend.
   * Used for CSS height binding in the chart.
   *
   * @param value - The data point value
   * @param max - The maximum value across all points
   * @returns Percentage height (0–90)
   */
  barHeight(value: number, max: number): number {
    if (max === 0) return 0;
    return Math.max(4, Math.round((value / max) * 90));
  }
}
