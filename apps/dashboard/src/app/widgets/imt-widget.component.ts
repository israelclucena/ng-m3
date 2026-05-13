import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, IMTCalculatorComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around `IMTCalculatorComponent` (Sprint 048).
 * Exposes the IMT (transmissões onerosas) calculator on the main dashboard and
 * routes to the full catalog section on click.
 *
 * Sprint 053 — gated by `DASHBOARD_IMT_WIDGET`.
 */
@Component({
  selector: 'app-imt-widget',
  standalone: true,
  imports: [CardComponent, IMTCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="IMT Calculator"
      avatar="receipt_long"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-imt-calculator />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-imt-calculator { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class ImtWidgetComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'imt' });
  }
}
