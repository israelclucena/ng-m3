import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, PortfolioLifecycleWidgetComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around the shared `PortfolioLifecycleWidgetComponent`
 * (Sprint 051) — operational counterpart to the tax-lifecycle widget. Shows
 * move-in / steady / move-out stages, inventory delta and suggested caução
 * retention across the 8-property portfolio. Click routes to the catalog.
 *
 * Sprint 052 — gated by `DASHBOARD_LIFECYCLE_WIDGET`.
 */
@Component({
  selector: 'app-portfolio-lifecycle-widget',
  standalone: true,
  imports: [CardComponent, PortfolioLifecycleWidgetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="Portfolio Operational Lifecycle"
      avatar="autorenew"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-portfolio-lifecycle />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-portfolio-lifecycle { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class PortfolioLifecycleWidgetWrapperComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'portfolio-lifecycle' });
  }
}
