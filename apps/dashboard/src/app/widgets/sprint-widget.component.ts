import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent, ProgressComponent } from '@israel-ui/core';

@Component({
  selector: 'app-sprint-widget',
  standalone: true,
  imports: [CardComponent, ProgressComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="elevated" title="Sprint Progress" avatar="sprint">
      <div class="widget">
        <div class="widget__header">
          <span class="widget__label">Sprint 002</span>
          <span class="trend-badge trend-badge--up">↑ On track</span>
        </div>
        <div class="widget__kpi">
          <span class="kpi-value">50%</span>
          <span class="widget__sublabel">3 of 6 tasks</span>
        </div>
        <iu-progress type="linear" [value]="0.5"></iu-progress>
        <div class="widget__footer">
          <span class="widget__meta">Due: 28 Feb</span>
          <span class="widget__meta">4 days left</span>
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
      margin-bottom: 12px;
    }
    .widget__label {
      font-weight: 600;
      font-size: 15px;
      color: var(--md-sys-color-on-surface);
    }
    .widget__kpi {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 16px;
    }
    .widget__sublabel {
      font-size: 13px;
      color: var(--dashboard-text-medium, var(--md-sys-color-on-surface-variant));
    }
    .widget__footer {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 12px;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
    }
    .widget__meta { font-weight: 500; }
  `],
})
export class SprintWidgetComponent {}
