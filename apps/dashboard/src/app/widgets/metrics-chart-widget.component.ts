import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LineChartComponent,
  BarChartComponent,
  DonutChartComponent,
  LineChartSeries,
  BarChartDataPoint,
  DonutChartSegment,
} from '@israel-ui/core';

type ChartTab = 'line' | 'bar' | 'donut';

/**
 * Metrics Chart Widget — demonstrates all 3 chart types.
 * Protected by CHART_COMPONENTS feature flag.
 */
@Component({
  selector: 'app-metrics-chart-widget',
  standalone: true,
  imports: [CommonModule, LineChartComponent, BarChartComponent, DonutChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-widget">
      <div class="widget-header">
        <span class="material-symbols-outlined">insights</span>
        <h3>Métricas</h3>
        <div class="tab-pills">
          @for (tab of tabs; track tab.id) {
            <button
              class="tab-pill"
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >{{ tab.label }}</button>
          }
        </div>
      </div>

      <div class="widget-body">
        @switch (activeTab()) {
          @case ('line') {
            <iu-line-chart
              [series]="lineSeries"
              title="Progresso Semanal"
              [width]="chartWidth"
              [height]="200"
              [showLegend]="true"
            />
          }
          @case ('bar') {
            <iu-bar-chart
              [data]="barData"
              title="Commits por Dia"
              [width]="chartWidth"
              [height]="200"
            />
          }
          @case ('donut') {
            <iu-donut-chart
              [segments]="donutData"
              title="Status Componentes"
              [size]="200"
              centerLabel="Total"
              [showLegend]="true"
            />
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .chart-widget {
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .widget-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
      flex: 1;
    }
    .widget-header .material-symbols-outlined {
      color: var(--md-sys-color-primary);
      font-size: 20px;
    }
    .tab-pills {
      display: flex;
      gap: 4px;
    }
    .tab-pill {
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .tab-pill.active {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border-color: transparent;
      font-weight: 600;
    }
    .widget-body {
      display: flex;
      justify-content: center;
    }
  `],
})
export class MetricsChartWidgetComponent {
  activeTab = signal<ChartTab>('line');

  tabs: { id: ChartTab; label: string }[] = [
    { id: 'line', label: 'Linha' },
    { id: 'bar', label: 'Barra' },
    { id: 'donut', label: 'Donut' },
  ];

  get chartWidth(): number {
    return 400;
  }

  lineSeries: LineChartSeries[] = [
    {
      name: 'Commits',
      data: [
        { label: 'Seg', value: 3 },
        { label: 'Ter', value: 7 },
        { label: 'Qua', value: 5 },
        { label: 'Qui', value: 9 },
        { label: 'Sex', value: 6 },
        { label: 'Sáb', value: 12 },
        { label: 'Dom', value: 4 },
      ],
    },
    {
      name: 'Issues',
      data: [
        { label: 'Seg', value: 1 },
        { label: 'Ter', value: 3 },
        { label: 'Qua', value: 2 },
        { label: 'Qui', value: 5 },
        { label: 'Sex', value: 3 },
        { label: 'Sáb', value: 4 },
        { label: 'Dom', value: 2 },
      ],
    },
  ];

  barData: BarChartDataPoint[] = [
    { label: 'Seg', value: 3 },
    { label: 'Ter', value: 7 },
    { label: 'Qua', value: 5 },
    { label: 'Qui', value: 9 },
    { label: 'Sex', value: 6 },
    { label: 'Sáb', value: 12 },
    { label: 'Dom', value: 4 },
  ];

  donutData: DonutChartSegment[] = [
    { label: 'Prontos', value: 32 },
    { label: 'WIP', value: 6 },
    { label: 'Faltam', value: 4 },
  ];
}
