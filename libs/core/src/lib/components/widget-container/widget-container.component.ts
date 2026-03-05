import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetResizeEvent {
  id: string;
  size: WidgetSize;
}

export interface WidgetCloseEvent {
  id: string;
}

export interface WidgetRefreshEvent {
  id: string;
}

// ─── Widget Container ─────────────────────────────────────────────────────────

/**
 * WidgetContainerComponent — Configurable card widget with resize handles, optional header actions,
 * loading state, and collapse behaviour.
 *
 * Designed to be composed inside `iu-widget-grid` but works standalone as well.
 *
 * @example
 * ```html
 * <iu-widget-container
 *   widgetId="revenue"
 *   title="Revenue"
 *   icon="payments"
 *   [resizable]="true"
 *   [closable]="true"
 *   (resize)="onResize($event)"
 *   (close)="onClose($event)"
 * >
 *   <!-- widget content here -->
 * </iu-widget-container>
 * ```
 */
@Component({
  selector: 'iu-widget-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-widget"
      [class]="widgetClasses()"
      [attr.data-widget-id]="widgetId()"
      [attr.aria-label]="title()"
      role="region"
    >
      <!-- ── Header ── -->
      <div class="iu-widget__header">
        <div class="iu-widget__title-group">
          @if (icon()) {
            <span class="material-symbols-outlined iu-widget__icon">{{ icon() }}</span>
          }
          <h3 class="iu-widget__title">{{ title() }}</h3>
          @if (subtitle()) {
            <span class="iu-widget__subtitle">{{ subtitle() }}</span>
          }
        </div>

        <div class="iu-widget__actions">
          @if (loading()) {
            <span class="iu-widget__spinner" aria-label="Loading" role="status">
              <span class="material-symbols-outlined iu-widget__spin-icon">progress_activity</span>
            </span>
          }

          @if (refreshable() && !loading()) {
            <button
              class="iu-widget__action-btn"
              (click)="onRefresh()"
              title="Refresh"
              aria-label="Refresh widget"
            >
              <span class="material-symbols-outlined">refresh</span>
            </button>
          }

          @if (resizable()) {
            <div class="iu-widget__size-group" role="group" aria-label="Widget size">
              @for (s of sizes; track s.value) {
                <button
                  class="iu-widget__size-btn"
                  [class.iu-widget__size-btn--active]="currentSize() === s.value"
                  (click)="setSize(s.value)"
                  [title]="s.label"
                  [attr.aria-label]="s.label"
                  [attr.aria-pressed]="currentSize() === s.value"
                >
                  <span class="material-symbols-outlined">{{ s.icon }}</span>
                </button>
              }
            </div>
          }

          @if (collapsible()) {
            <button
              class="iu-widget__action-btn"
              (click)="toggleCollapse()"
              [attr.aria-expanded]="!collapsed()"
              [title]="collapsed() ? 'Expand' : 'Collapse'"
              [attr.aria-label]="collapsed() ? 'Expand widget' : 'Collapse widget'"
            >
              <span class="material-symbols-outlined iu-widget__collapse-icon" [class.iu-widget__collapse-icon--collapsed]="collapsed()">
                expand_less
              </span>
            </button>
          }

          @if (closable()) {
            <button
              class="iu-widget__action-btn iu-widget__action-btn--close"
              (click)="onClose()"
              title="Close"
              aria-label="Close widget"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>
      </div>

      <!-- ── Body ── -->
      @if (!collapsed()) {
        <div class="iu-widget__body" [class.iu-widget__body--loading]="loading()">
          @if (loading()) {
            <div class="iu-widget__loading-overlay" aria-hidden="true">
              <span class="material-symbols-outlined iu-widget__loading-icon">progress_activity</span>
            </div>
          }
          <ng-content />
        </div>
      }

      <!-- ── Resize handle ── -->
      @if (resizable() && showDragHandle()) {
        <div
          class="iu-widget__drag-handle"
          title="Drag to resize"
          aria-label="Resize handle"
          role="separator"
          aria-orientation="horizontal"
        >
          <span class="material-symbols-outlined">drag_indicator</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .iu-widget {
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 16px;
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
      height: 100%;
      box-sizing: border-box;

      &:hover {
        border-color: var(--md-sys-color-outline, #79747e);
        box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,0.12));
      }

      /* ── Size variants ── */
      &--small  { min-height: 140px; }
      &--medium { min-height: 220px; }
      &--large  { min-height: 320px; }
      &--full   { min-height: 480px; }

      /* ── Elevation variant ── */
      &--elevated {
        background: var(--md-sys-color-surface, #fff);
        box-shadow: var(--md-sys-elevation-level2, 0 2px 8px rgba(0,0,0,0.15));
      }

      /* ── Compact variant ── */
      &--compact .iu-widget__header { padding: 10px 14px; }
      &--compact .iu-widget__body   { padding: 10px 14px; }
    }

    /* ── Header ── */
    .iu-widget__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px 10px;
      flex-shrink: 0;
    }

    .iu-widget__title-group {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .iu-widget__icon {
      font-size: 20px;
      color: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    .iu-widget__title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .iu-widget__subtitle {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      white-space: nowrap;
    }

    /* ── Actions ── */
    .iu-widget__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .iu-widget__action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.15s, color 0.15s;

      &:hover {
        background: var(--md-sys-color-surface-variant, #e7e0ec);
        color: var(--md-sys-color-on-surface, #1c1b1f);
      }

      &--close:hover {
        background: var(--md-sys-color-error-container, #f9dedc);
        color: var(--md-sys-color-error, #b3261e);
      }

      .material-symbols-outlined { font-size: 18px; }
    }

    .iu-widget__spinner {
      display: flex;
      align-items: center;
    }

    .iu-widget__spin-icon {
      font-size: 18px;
      color: var(--md-sys-color-primary, #6750a4);
      animation: iu-widget-spin 0.8s linear infinite;
    }

    .iu-widget__collapse-icon {
      font-size: 18px;
      transition: transform 0.2s;

      &--collapsed { transform: rotate(180deg); }
    }

    /* ── Size group ── */
    .iu-widget__size-group {
      display: flex;
      gap: 2px;
      background: var(--md-sys-color-surface-variant, #e7e0ec);
      border-radius: 8px;
      padding: 2px;
    }

    .iu-widget__size-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 0.12s, color 0.12s;

      &:hover { background: var(--md-sys-color-surface, #fff); }

      &--active {
        background: var(--md-sys-color-surface, #fff);
        color: var(--md-sys-color-primary, #6750a4);
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      }

      .material-symbols-outlined { font-size: 16px; }
    }

    /* ── Body ── */
    .iu-widget__body {
      flex: 1;
      padding: 8px 16px 16px;
      overflow: auto;
      position: relative;
      min-height: 0;

      &--loading > *:not(.iu-widget__loading-overlay) { opacity: 0.3; pointer-events: none; }
    }

    .iu-widget__loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .iu-widget__loading-icon {
      font-size: 32px;
      color: var(--md-sys-color-primary, #6750a4);
      animation: iu-widget-spin 0.8s linear infinite;
    }

    /* ── Drag handle ── */
    .iu-widget__drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 24px;
      cursor: ns-resize;
      color: var(--md-sys-color-outline-variant, #cac4d0);
      border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      transition: color 0.15s;

      &:hover { color: var(--md-sys-color-primary, #6750a4); }

      .material-symbols-outlined { font-size: 16px; transform: rotate(90deg); }
    }

    @keyframes iu-widget-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetContainerComponent {
  /** Unique widget identifier */
  widgetId = input<string>('widget');
  /** Widget title */
  title = input<string>('Widget');
  /** Optional subtitle */
  subtitle = input<string>('');
  /** Material Symbol icon in header */
  icon = input<string>('');
  /** Initial size */
  size = input<WidgetSize>('medium');
  /** Whether size controls are shown */
  resizable = input<boolean>(false);
  /** Whether collapse toggle is shown */
  collapsible = input<boolean>(false);
  /** Whether close button is shown */
  closable = input<boolean>(false);
  /** Whether refresh button is shown */
  refreshable = input<boolean>(false);
  /** Loading state — shows spinner and dims content */
  loading = input<boolean>(false);
  /** Show bottom drag handle */
  showDragHandle = input<boolean>(false);
  /** Elevated surface style */
  elevated = input<boolean>(false);
  /** Compact header/body padding */
  compact = input<boolean>(false);

  // ── Outputs ──
  /** Fires when user selects a size */
  resize = output<WidgetResizeEvent>();
  /** Fires when close button clicked */
  close = output<WidgetCloseEvent>();
  /** Fires when refresh button clicked */
  refresh = output<WidgetRefreshEvent>();

  // ── Internal ──
  readonly currentSize = signal<WidgetSize>('medium');
  readonly collapsed = signal(false);

  readonly widgetClasses = computed(() => {
    const classes: string[] = [`iu-widget--${this.currentSize()}`];
    if (this.elevated()) classes.push('iu-widget--elevated');
    if (this.compact()) classes.push('iu-widget--compact');
    return classes.join(' ');
  });

  readonly sizes: { value: WidgetSize; label: string; icon: string }[] = [
    { value: 'small',  label: 'Small',  icon: 'crop_square' },
    { value: 'medium', label: 'Medium', icon: 'crop_3_2' },
    { value: 'large',  label: 'Large',  icon: 'crop_landscape' },
    { value: 'full',   label: 'Full',   icon: 'fullscreen' },
  ];

  setSize(size: WidgetSize): void {
    this.currentSize.set(size);
    this.resize.emit({ id: this.widgetId(), size });
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  onClose(): void {
    this.close.emit({ id: this.widgetId() });
  }

  onRefresh(): void {
    this.refresh.emit({ id: this.widgetId() });
  }
}


// ─── Widget Grid ──────────────────────────────────────────────────────────────

/**
 * WidgetGridComponent — CSS grid container for laying out WidgetContainerComponent instances.
 *
 * Provides a responsive auto-fill grid with configurable column minimum width.
 *
 * @example
 * ```html
 * <iu-widget-grid [minColWidth]="320">
 *   <iu-widget-container title="Revenue" icon="payments" />
 *   <iu-widget-container title="Users" icon="people" />
 * </iu-widget-grid>
 * ```
 */
@Component({
  selector: 'iu-widget-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-widget-grid"
      [style.--iu-widget-min-col]="minColWidth() + 'px'"
      [style.gap]="gap() + 'px'"
    >
      <ng-content />
    </div>
  `,
  styles: [`
    .iu-widget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--iu-widget-min-col, 280px), 1fr));
      align-items: start;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGridComponent {
  /** Minimum column width in pixels */
  minColWidth = input<number>(280);
  /** Grid gap in pixels */
  gap = input<number>(16);
}
