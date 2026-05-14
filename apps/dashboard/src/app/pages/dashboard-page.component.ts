/**
 * DashboardPageComponent — Sprint 022
 *
 * Standalone routed page for the main dashboard view.
 * Extracted from AppComponent to enable route-level code splitting.
 *
 * Route: /dashboard
 * Feature flag: always visible (no flag guard)
 */
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '@israel-ui/core';
import { FeatureFlags } from '../feature-flags';
import { SprintWidgetComponent } from '../widgets/sprint-widget.component';
import { InvestmentWidgetComponent } from '../widgets/investment-widget.component';
import { WeatherWidgetComponent } from '../widgets/weather-widget.component';
import { CountdownWidgetComponent } from '../widgets/countdown-widget.component';
import { StreakWidgetComponent } from '../widgets/streak-widget.component';
import { QuickLinksWidgetComponent } from '../widgets/quick-links-widget.component';
import { MetricsChartWidgetComponent } from '../widgets/metrics-chart-widget.component';
import { DraggableDashboardComponent } from '../widgets/draggable-dashboard.component';
import { PortfolioRoundupWidgetComponent } from '../widgets/portfolio-roundup-widget.component';
import { PortfolioTaxLifecycleWidgetWrapperComponent } from '../widgets/portfolio-tax-lifecycle-widget.component';
import { PortfolioLifecycleWidgetWrapperComponent } from '../widgets/portfolio-lifecycle-widget.component';
import { MaisValiasWidgetComponent } from '../widgets/mais-valias-widget.component';
import { AimiWidgetComponent } from '../widgets/aimi-widget.component';
import { ImtWidgetComponent } from '../widgets/imt-widget.component';
import { AnnualTaxBurdenWidgetComponent } from '../widgets/annual-tax-burden-widget.component';
import { InsuranceTrackerWidgetComponent } from '../widgets/insurance-tracker-widget.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    SprintWidgetComponent,
    InvestmentWidgetComponent,
    WeatherWidgetComponent,
    CountdownWidgetComponent,
    StreakWidgetComponent,
    QuickLinksWidgetComponent,
    MetricsChartWidgetComponent,
    DraggableDashboardComponent,
    PortfolioRoundupWidgetComponent,
    PortfolioTaxLifecycleWidgetWrapperComponent,
    PortfolioLifecycleWidgetWrapperComponent,
    MaisValiasWidgetComponent,
    AimiWidgetComponent,
    ImtWidgetComponent,
    AnnualTaxBurdenWidgetComponent,
    InsuranceTrackerWidgetComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Stat Cards -->
    @if (flags.CARD_VARIANTS) {
      <div class="stat-cards-row">
        <iu-stat-card
          label="Components"
          value="73"
          change="73 ready"
          trend="up"
          icon="widgets"
          class="widget--animate"
        ></iu-stat-card>
        <iu-stat-card
          label="Sprint Progress"
          value="85%"
          change="+12%"
          trend="up"
          icon="sprint"
          class="widget--animate"
        ></iu-stat-card>
        <iu-stat-card
          label="Days to Brazil"
          value="14"
          change="14 Mar"
          trend="neutral"
          icon="flight"
          class="widget--animate"
        ></iu-stat-card>
      </div>
    }

    <!-- Widget Grid -->
    @if (flags.DRAG_DROP_WIDGETS) {
      <app-draggable-dashboard></app-draggable-dashboard>
    } @else {
      <div class="dashboard-grid">
        <app-sprint-widget class="widget--animate"></app-sprint-widget>
        <app-investment-widget class="widget--animate"></app-investment-widget>
        <app-weather-widget class="widget--animate"></app-weather-widget>
        <app-countdown-widget class="widget--animate"></app-countdown-widget>
        <app-streak-widget class="widget--animate"></app-streak-widget>
        <app-quick-links-widget class="widget--animate"></app-quick-links-widget>
        @if (flags.CHART_COMPONENTS) {
          <app-metrics-chart-widget class="widget--animate widget--wide"></app-metrics-chart-widget>
        }
        @if (flags.DASHBOARD_PORTFOLIO_ROUNDUP_WIDGET) {
          <app-portfolio-roundup-widget class="widget--animate widget--wide"></app-portfolio-roundup-widget>
        }
        @if (flags.DASHBOARD_TAX_LIFECYCLE_WIDGET) {
          <app-portfolio-tax-lifecycle-widget class="widget--animate widget--wide"></app-portfolio-tax-lifecycle-widget>
        }
        @if (flags.DASHBOARD_LIFECYCLE_WIDGET) {
          <app-portfolio-lifecycle-widget class="widget--animate widget--wide"></app-portfolio-lifecycle-widget>
        }
        @if (flags.DASHBOARD_MAIS_VALIAS_WIDGET) {
          <app-mais-valias-widget class="widget--animate widget--wide"></app-mais-valias-widget>
        }
        @if (flags.DASHBOARD_AIMI_WIDGET) {
          <app-aimi-widget class="widget--animate widget--wide"></app-aimi-widget>
        }
        @if (flags.DASHBOARD_IMT_WIDGET) {
          <app-imt-widget class="widget--animate widget--wide"></app-imt-widget>
        }
        @if (flags.DASHBOARD_ANNUAL_BURDEN_WIDGET) {
          <app-annual-tax-burden-widget class="widget--animate widget--wide"></app-annual-tax-burden-widget>
        }
        @if (flags.DASHBOARD_INSURANCE_TRACKER_WIDGET) {
          <app-insurance-tracker-widget class="widget--animate widget--wide"></app-insurance-tracker-widget>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class DashboardPageComponent {
  readonly flags = FeatureFlags;
}
