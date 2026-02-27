import {
  Component,
  signal,
  ChangeDetectionStrategy,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@israel-ui/core';
import { SprintWidgetComponent } from './sprint-widget.component';
import { InvestmentWidgetComponent } from './investment-widget.component';
import { WeatherWidgetComponent } from './weather-widget.component';
import { CountdownWidgetComponent } from './countdown-widget.component';
import { StreakWidgetComponent } from './streak-widget.component';
import { QuickLinksWidgetComponent } from './quick-links-widget.component';
import { MetricsChartWidgetComponent } from './metrics-chart-widget.component';
import { FeatureFlags } from '../feature-flags';

export interface DashboardWidgetDef {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

/**
 * Draggable dashboard grid — custom pointer-event drag-and-drop, no extra deps.
 * Persists order to localStorage. Protected by DRAG_DROP_WIDGETS flag.
 */
@Component({
  selector: 'app-draggable-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SprintWidgetComponent,
    InvestmentWidgetComponent,
    WeatherWidgetComponent,
    CountdownWidgetComponent,
    StreakWidgetComponent,
    QuickLinksWidgetComponent,
    MetricsChartWidgetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #gridEl
      class="draggable-grid"
      [class.is-dragging]="dragging()"
    >
      @for (widget of widgets(); track widget.id; let i = $index) {
        @if (widget.visible) {
          <div
            class="drag-item"
            [class.drag-over]="dragOverIndex() === i"
            [attr.data-index]="i"
          >
            <!-- Drag handle -->
            <div
              class="drag-handle"
              title="Arrastar"
              (pointerdown)="onDragStart($event, i)"
            >
              <span class="material-symbols-outlined">drag_indicator</span>
            </div>

            @switch (widget.id) {
              @case ('sprint') { <app-sprint-widget></app-sprint-widget> }
              @case ('investment') { <app-investment-widget></app-investment-widget> }
              @case ('weather') { <app-weather-widget></app-weather-widget> }
              @case ('countdown') { <app-countdown-widget></app-countdown-widget> }
              @case ('streak') { <app-streak-widget></app-streak-widget> }
              @case ('quicklinks') { <app-quick-links-widget></app-quick-links-widget> }
              @case ('charts') {
                @if (flags.CHART_COMPONENTS) {
                  <app-metrics-chart-widget></app-metrics-chart-widget>
                }
              }
            }
          </div>
        }
      }
    </div>

    <!-- Widget controls bar -->
    <div class="widget-controls">
      <span class="material-symbols-outlined controls-icon">tune</span>
      <span class="controls-label">Widgets:</span>
      @for (widget of widgets(); track widget.id) {
        <button
          class="widget-toggle"
          [class.active]="widget.visible"
          (click)="toggleWidget(widget.id)"
          [title]="(widget.visible ? 'Ocultar ' : 'Mostrar ') + widget.label"
        >
          <span class="material-symbols-outlined">{{ widget.icon }}</span>
        </button>
      }
      <button class="reset-btn" (click)="resetOrder()" title="Restaurar ordem padrão">
        <span class="material-symbols-outlined">restart_alt</span>
      </button>
    </div>
  `,
  styles: [`
    .draggable-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      padding: 4px;
      position: relative;
    }
    .draggable-grid.is-dragging { user-select: none; }
    .drag-item {
      position: relative;
      border-radius: 16px;
      transition: box-shadow 0.2s, transform 0.15s;
      cursor: default;
    }
    .drag-item.drag-over {
      box-shadow: 0 0 0 3px var(--md-sys-color-primary, #6750A4);
    }
    .drag-handle {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.15s;
      cursor: grab;
      background: var(--md-sys-color-surface-container-high, rgba(0,0,0,0.35));
      border-radius: 8px;
      padding: 2px 4px;
      display: flex;
      align-items: center;
    }
    .drag-handle:active { cursor: grabbing; }
    .drag-item:hover .drag-handle { opacity: 1; }
    .drag-handle .material-symbols-outlined {
      font-size: 16px;
      color: var(--md-sys-color-on-surface-variant, #ccc);
    }
    /* Widget controls */
    .widget-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      padding: 8px 14px;
      background: var(--md-sys-color-surface-container, #f3edf7);
      border-radius: 28px;
      width: fit-content;
    }
    .controls-icon { font-size: 18px; color: var(--md-sys-color-on-surface-variant); }
    .controls-label { font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-right: 4px; }
    .widget-toggle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.35;
      transition: opacity 0.15s, background 0.15s;
    }
    .widget-toggle.active {
      opacity: 1;
      background: var(--md-sys-color-primary-container);
    }
    .widget-toggle .material-symbols-outlined { font-size: 18px; color: var(--md-sys-color-on-surface); }
    .reset-btn {
      margin-left: 4px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      transition: background 0.15s;
    }
    .reset-btn:hover { background: var(--md-sys-color-surface-variant); }
    .reset-btn .material-symbols-outlined { font-size: 16px; }
  `],
})
export class DraggableDashboardComponent {
  flags = FeatureFlags;
  notificationService = inject(NotificationService);
  @ViewChild('gridEl') gridEl!: ElementRef<HTMLElement>;

  dragging = signal(false);
  dragOverIndex = signal<number | null>(null);

  private dragFromIndex = -1;
  private readonly STORAGE_KEY = 'dashboard-widget-order-v2';

  private readonly DEFAULT_WIDGETS: DashboardWidgetDef[] = [
    { id: 'sprint',      label: 'Sprint',        icon: 'sprint',                 visible: true },
    { id: 'investment',  label: 'Investimentos',  icon: 'trending_up',            visible: true },
    { id: 'weather',     label: 'Tempo',          icon: 'wb_sunny',               visible: true },
    { id: 'countdown',   label: 'Contagem',       icon: 'timer',                  visible: true },
    { id: 'streak',      label: 'Streak',         icon: 'local_fire_department',  visible: true },
    { id: 'quicklinks',  label: 'Links',          icon: 'link',                   visible: true },
    { id: 'charts',      label: 'Métricas',       icon: 'insights',               visible: true },
  ];

  widgets = signal<DashboardWidgetDef[]>(this.loadOrder());

  // ── Drag-and-Drop (pointer events) ──

  /** Called on pointerdown on a drag handle */
  onDragStart(event: PointerEvent, fromIndex: number): void {
    event.preventDefault();
    this.dragFromIndex = fromIndex;
    this.dragging.set(true);

    const onMove = (e: PointerEvent) => this.onDragMove(e);
    const onUp = (e: PointerEvent) => {
      this.onDragEnd(e);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  private onDragMove(event: PointerEvent): void {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const item = el?.closest('[data-index]');
    if (item) {
      const idx = parseInt((item as HTMLElement).dataset['index'] ?? '-1', 10);
      if (idx >= 0) this.dragOverIndex.set(idx);
    }
  }

  private onDragEnd(event: PointerEvent): void {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const item = el?.closest('[data-index]');
    const toIndex = item ? parseInt((item as HTMLElement).dataset['index'] ?? '-1', 10) : -1;

    if (toIndex >= 0 && toIndex !== this.dragFromIndex) {
      const visibleWidgets = [...this.widgets()];
      const [moved] = visibleWidgets.splice(this.dragFromIndex, 1);
      visibleWidgets.splice(toIndex, 0, moved);
      this.widgets.set(visibleWidgets);
      this.saveOrder();
      this.notificationService.show({ message: 'Layout guardado ✓', type: 'success', duration: 1800 });
    }

    this.dragging.set(false);
    this.dragOverIndex.set(null);
    this.dragFromIndex = -1;
  }

  // ── Persistence ──

  private loadOrder(): DashboardWidgetDef[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed: { id: string; visible: boolean }[] = JSON.parse(saved);
        const byId = Object.fromEntries(this.DEFAULT_WIDGETS.map(w => [w.id, w]));
        return parsed.map(p => ({ ...byId[p.id], visible: p.visible })).filter(w => w?.id);
      }
    } catch { /* ignore */ }
    return [...this.DEFAULT_WIDGETS];
  }

  private saveOrder(): void {
    try {
      const data = this.widgets().map(w => ({ id: w.id, visible: w.visible }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  toggleWidget(id: string): void {
    this.widgets.update(ws => ws.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
    this.saveOrder();
  }

  resetOrder(): void {
    this.widgets.set([...this.DEFAULT_WIDGETS]);
    localStorage.removeItem(this.STORAGE_KEY);
    this.notificationService.show({ message: 'Layout restaurado', type: 'info', duration: 1800 });
  }
}
