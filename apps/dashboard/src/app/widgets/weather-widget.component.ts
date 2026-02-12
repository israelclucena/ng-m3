import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CardComponent } from '@israel-ui/core';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <iu-card variant="outlined" title="Weather" avatar="cloud">
      <div class="widget">
        <div class="weather-main">
          <span class="material-symbols-outlined weather-icon">partly_cloudy_day</span>
          <div class="weather-info">
            <span class="kpi-value">16°C</span>
            <span class="weather-condition">Partly Cloudy</span>
          </div>
        </div>
        <div class="weather-location">
          <span class="material-symbols-outlined loc-icon">location_on</span>
          Lisboa, Portugal
        </div>
        <div class="weather-grid">
          <div class="weather-stat">
            <span class="stat-label">High / Low</span>
            <span class="stat-value">18° / 10°</span>
          </div>
          <div class="weather-stat">
            <span class="stat-label">Wind</span>
            <span class="stat-value">14 km/h NW</span>
          </div>
          <div class="weather-stat">
            <span class="stat-label">Humidity</span>
            <span class="stat-value">68%</span>
          </div>
        </div>
      </div>
    </iu-card>
  `,
  styles: [`
    :host { display: block; }
    .widget { padding: 4px 0; }
    .weather-main {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }
    .weather-icon {
      font-size: 48px;
      color: var(--dashboard-accent-blue, var(--md-sys-color-secondary));
    }
    .weather-info { display: flex; flex-direction: column; }
    .weather-condition {
      font-size: 13px;
      color: var(--dashboard-text-medium, var(--md-sys-color-on-surface-variant));
      margin-top: 2px;
    }
    .weather-location {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
      margin-bottom: 14px;
    }
    .loc-icon { font-size: 14px; }
    .weather-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant, #2E3240);
    }
    .weather-stat { text-align: center; }
    .stat-label {
      display: block;
      font-size: 11px;
      font-weight: 500;
      color: var(--dashboard-text-low, var(--md-sys-color-on-surface-variant));
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
  `],
})
export class WeatherWidgetComponent {}
