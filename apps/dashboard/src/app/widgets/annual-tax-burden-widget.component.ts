import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, AnnualPropertyTaxBurdenComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around `AnnualPropertyTaxBurdenComponent` (Sprint 053).
 * Surfaces the meta-aggregator that crosses IMI + AIMI + IRS Cat. F + Mais-Valias
 * for one fiscal year at portfolio level (with the 31/Mai, 31/Ago, 30/Nov IMI;
 * 30/Set AIMI; Mar–Jun IRS payment calendar) on the main dashboard, and routes
 * to the full catalog section on click.
 *
 * Sprint 054 — gated by `DASHBOARD_ANNUAL_BURDEN_WIDGET`.
 */
@Component({
  selector: 'app-annual-tax-burden-widget',
  standalone: true,
  imports: [CardComponent, AnnualPropertyTaxBurdenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="Annual Tax Burden"
      avatar="event_repeat"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-annual-property-tax-burden />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-annual-property-tax-burden { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class AnnualTaxBurdenWidgetComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'annual-tax-burden' });
  }
}
