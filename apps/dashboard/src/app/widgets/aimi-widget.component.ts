import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, AIMICalculatorComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around `AIMICalculatorComponent` (Sprint 048).
 * Exposes the Adicional ao IMI calculator on the main dashboard and routes
 * to the full catalog section on click.
 *
 * Sprint 053 — gated by `DASHBOARD_AIMI_WIDGET`.
 */
@Component({
  selector: 'app-aimi-widget',
  standalone: true,
  imports: [CardComponent, AIMICalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="AIMI Calculator"
      avatar="paid"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-aimi-calculator />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-aimi-calculator { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class AimiWidgetComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'aimi' });
  }
}
