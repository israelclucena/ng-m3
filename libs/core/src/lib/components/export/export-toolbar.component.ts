import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService, ExportFormat } from './export.service';

/**
 * ExportToolbar — Dashboard export toolbar with PDF/PNG/JSON/CSV buttons.
 *
 * Wraps ExportService and shows export status feedback.
 *
 * @example
 * ```html
 * <iu-export-toolbar filename="my-dashboard"></iu-export-toolbar>
 * ```
 */
@Component({
  selector: 'iu-export-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-toolbar">
      <span class="export-toolbar__label">
        <span class="material-symbols-outlined">download</span>
        Exportar
      </span>

      <div class="export-toolbar__actions">
        @for (btn of buttons; track btn.format) {
          <button
            class="export-btn"
            [class.export-btn--loading]="svc.exporting()"
            [disabled]="svc.exporting()"
            (click)="doExport(btn.format)"
            [title]="btn.label"
          >
            <span class="material-symbols-outlined">{{ btn.icon }}</span>
            <span>{{ btn.label }}</span>
          </button>
        }
      </div>

      @if (svc.lastResult()) {
        <span class="export-toolbar__result">{{ svc.lastResult() }}</span>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .export-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container, #ece6f0);
      border-radius: 16px;
    }
    .export-toolbar__label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.9rem;
    }
    .export-toolbar__actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .export-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid var(--md-sys-color-outline, #79747e);
      border-radius: 20px;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      .material-symbols-outlined { font-size: 18px; }
      &:hover:not(:disabled) {
        background: var(--md-sys-color-primary-container, #eaddff);
        color: var(--md-sys-color-on-primary-container, #21005d);
        border-color: transparent;
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .export-toolbar__result {
      font-size: 0.85rem;
      color: var(--md-sys-color-primary);
      margin-left: auto;
    }
  `],
})
export class ExportToolbarComponent {
  readonly svc = inject(ExportService);

  /** Base filename for exported files */
  filename = input<string>('israel-ui-dashboard');

  readonly buttons: { format: ExportFormat; label: string; icon: string }[] = [
    { format: 'pdf',  label: 'PDF',  icon: 'picture_as_pdf' },
    { format: 'png',  label: 'PNG',  icon: 'image' },
    { format: 'json', label: 'JSON', icon: 'data_object' },
    { format: 'csv',  label: 'CSV',  icon: 'table' },
  ];

  doExport(format: ExportFormat): void {
    this.svc.export({
      format,
      filename: this.filename(),
      data: format === 'json' || format === 'csv' ? undefined : undefined,
    });
  }
}
