import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent, ListComponent, ListItemComponent } from '@israel-ui/core';

@Component({
  selector: 'app-investment-widget',
  standalone: true,
  imports: [CardComponent, ListComponent, ListItemComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="filled" title="Investments" avatar="trending_up">
      <div class="widget">
        <div class="widget__header">
          <span class="widget__label">PORTFOLIO</span>
          <span class="trend-badge trend-badge--up">↑ 3.2%</span>
        </div>
        <div class="widget__kpi">
          <span class="kpi-value">R$ 45.230</span>
        </div>
        <div class="fund-list">
          <div class="fund-row" *ngFor="let f of funds">
            <span class="fund-name">{{ f.name }}</span>
            <span class="fund-price">R$ {{ f.price }}</span>
            <span class="fund-dy">DY {{ f.dy }}%</span>
          </div>
        </div>
        <div class="widget__footer">
          <span class="widget__meta">Yield: R$ 382/mês</span>
          <span class="widget__meta">Próx div: 15 Mar</span>
        </div>
      </div>
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    .widget { padding: 4px 0; }
    .widget__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .widget__label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
      text-transform: uppercase;
    }
    .widget__kpi { margin-bottom: 16px; }
    .fund-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .fund-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 10px;
      background: var(--md-sys-color-surface-variant, #2A2D36);
      font-size: 13px;
    }
    .fund-name {
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      flex: 1;
    }
    .fund-price {
      color: var(--dashboard-text-medium, var(--md-sys-color-on-surface-variant));
    }
    .fund-dy {
      font-weight: 600;
      color: var(--dashboard-accent-green, var(--md-sys-color-primary));
      font-size: 12px;
    }
    .widget__footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
      padding-top: 10px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #2E3240);
    }
    .widget__meta { font-weight: 500; }
  `],
})
export class InvestmentWidgetComponent {
  funds = [
    { name: 'TGAR11', price: '81.11', dy: '14.49' },
    { name: 'XPML11', price: '98.50', dy: '9.82' },
    { name: 'HGLG11', price: '162.30', dy: '8.15' },
  ];
}
