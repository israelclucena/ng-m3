import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, PortfolioRoundupComponent } from '@israel-ui/core';
import type { RoundupDetailKey } from '@israel-ui/core';

/**
 * Dashboard wrapper around the shared `PortfolioRoundupComponent`. Catches the
 * `(detail)` emission and navigates to `/features` with a fragment matching the
 * relevant trilogy section so the user lands directly on the detailed view.
 *
 * Sprint 046 — gated by `DASHBOARD_PORTFOLIO_ROUNDUP_WIDGET`.
 */
@Component({
  selector: 'app-portfolio-roundup-widget',
  standalone: true,
  imports: [CardComponent, PortfolioRoundupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card variant="filled" title="Portfolio Roundup" avatar="dashboard">
      <iu-portfolio-roundup (detail)="goToTrilogy($event)" />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-portfolio-roundup { display: block; }
  `],
})
export class PortfolioRoundupWidgetComponent {
  private readonly router = inject(Router);

  goToTrilogy(key: RoundupDetailKey): void {
    const fragment = {
      yield: 'portfolio-yield-overview',
      fiscal: 'portfolio-fiscal-summary',
      compliance: 'portfolio-compliance-matrix',
    }[key];
    this.router.navigate(['/features'], { fragment });
  }
}
