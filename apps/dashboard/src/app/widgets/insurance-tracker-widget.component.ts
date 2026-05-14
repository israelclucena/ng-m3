import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, InsuranceTrackerComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around `InsuranceTrackerComponent` (Sprint 043).
 * Surfaces the landlord policy register (multirriscos / RC / conteúdo) with
 * the 3-bucket header (active / expiring-soon / expired) at-a-glance on the
 * main dashboard, and routes to the full catalog section on click.
 *
 * Sprint 054 — gated by `DASHBOARD_INSURANCE_TRACKER_WIDGET`. Closes the
 * 3-night carry-over of `InsuranceTrackerComponent` having no entry point in
 * the app since Sprint 043.
 */
@Component({
  selector: 'app-insurance-tracker-widget',
  standalone: true,
  imports: [CardComponent, InsuranceTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="Insurance Tracker"
      avatar="shield"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-insurance-tracker />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-insurance-tracker { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class InsuranceTrackerWidgetComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'insurance-tracker' });
  }
}
