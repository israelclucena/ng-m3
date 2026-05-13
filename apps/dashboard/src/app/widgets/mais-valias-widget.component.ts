import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, MaisValiasImobiliariasCalculatorComponent } from '@israel-ui/core';

/**
 * Dashboard wrapper around `MaisValiasImobiliariasCalculatorComponent` (Sprint 047).
 * Exposes the IRS Cat. G capital-gains calculator on the main dashboard and routes
 * to the full catalog section on click.
 *
 * Sprint 053 — gated by `DASHBOARD_MAIS_VALIAS_WIDGET`.
 */
@Component({
  selector: 'app-mais-valias-widget',
  standalone: true,
  imports: [CardComponent, MaisValiasImobiliariasCalculatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iu-card
      variant="filled"
      title="Mais-Valias Imobiliárias"
      avatar="trending_up"
      class="widget-clickable"
      (click)="goToDetail()"
    >
      <iu-mais-valias-imobiliarias-calculator />
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    iu-mais-valias-imobiliarias-calculator { display: block; }
    .widget-clickable { cursor: pointer; }
  `],
})
export class MaisValiasWidgetComponent {
  private readonly router = inject(Router);

  goToDetail(): void {
    this.router.navigate(['/features'], { fragment: 'mais-valias' });
  }
}
