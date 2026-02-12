import { Component, CUSTOM_ELEMENTS_SCHEMA, computed } from '@angular/core';
import { CardComponent } from '@israel-ui/core';

@Component({
  selector: 'app-countdown-widget',
  standalone: true,
  imports: [CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="elevated" title="Countdown" avatar="flight_takeoff">
      <div class="widget countdown">
        <div class="countdown__number">
          <span class="kpi-value countdown__days">{{ daysLeft() }}</span>
          <span class="countdown__unit">days</span>
        </div>
        <div class="countdown__dest">
          <span class="material-symbols-outlined">flag</span>
          <div>
            <span class="countdown__name">Viagem Brasil</span>
            <span class="countdown__date">14 Mar 2026</span>
          </div>
        </div>
        <div class="countdown__bar">
          <div class="countdown__bar-fill" [style.width.%]="progress()"></div>
        </div>
        <div class="countdown__meta">{{ progress() }}% elapsed</div>
      </div>
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    .widget { padding: 4px 0; }
    .countdown { text-align: center; }
    .countdown__number {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .countdown__days { font-size: 48px !important; }
    .countdown__unit {
      font-size: 16px;
      color: var(--dashboard-text-medium, var(--md-sys-color-on-surface-variant));
      font-weight: 500;
    }
    .countdown__dest {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 16px;
      text-align: left;
    }
    .countdown__dest .material-symbols-outlined {
      font-size: 24px;
      color: var(--dashboard-accent-purple, var(--md-sys-color-tertiary));
    }
    .countdown__name {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .countdown__date {
      display: block;
      font-size: 12px;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
    }
    .countdown__bar {
      height: 4px;
      border-radius: 99px;
      background: var(--md-sys-color-surface-variant, #2A2D36);
      overflow: hidden;
      margin-bottom: 8px;
    }
    .countdown__bar-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--dashboard-accent-purple, var(--md-sys-color-tertiary));
      transition: width 0.5s ease;
    }
    .countdown__meta {
      font-size: 11px;
      font-weight: 500;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
    }
  `],
})
export class CountdownWidgetComponent {
  private targetDate = new Date('2026-03-14T00:00:00');
  private startDate = new Date('2026-02-01T00:00:00');

  daysLeft = computed(() => {
    const now = new Date();
    const diff = this.targetDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  progress = computed(() => {
    const now = new Date();
    const total = this.targetDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    return Math.min(100, Math.round((elapsed / total) * 100));
  });
}
