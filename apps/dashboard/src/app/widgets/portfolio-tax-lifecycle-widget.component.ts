import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, PortfolioTaxLifecycleWidgetComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around the shared `PortfolioTaxLifecycleWidgetComponent`
 * (Sprint 049). Surfaces aggregate recurring annual tax burden across the
 * 8-property portfolio (IMI + AIMI + IRS Cat. F) on the main dashboard, and
 * routes through to the full catalog view on click.
 *
 * Sprint 052 — gated by `DASHBOARD_TAX_LIFECYCLE_WIDGET`.
 */
@Component({
  selector: 'app-portfolio-tax-lifecycle-widget',
  standalone: true,
  imports: [CardComponent, PortfolioTaxLifecycleWidgetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="Portfolio Tax Lifecycle"
      avatar="calculate"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-portfolio-tax-lifecycle />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-portfolio-tax-lifecycle { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class PortfolioTaxLifecycleWidgetWrapperComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'portfolio-tax-lifecycle' });
  }
}
