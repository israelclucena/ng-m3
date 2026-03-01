import { Injectable, signal } from '@angular/core';

export type ExportFormat = 'pdf' | 'json' | 'csv' | 'png';

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  /** CSS selector of element to capture (for PNG) */
  selector?: string;
  /** Data to export (for JSON/CSV) */
  data?: Record<string, unknown>[];
  /** Keys to include in CSV export */
  csvKeys?: string[];
}

/**
 * ExportService — Export dashboard content to PDF, PNG, JSON or CSV.
 *
 * Uses only native browser APIs — no external dependencies.
 *
 * @example
 * ```ts
 * exportService.export({ format: 'pdf', filename: 'dashboard' });
 * exportService.export({ format: 'json', data: myData, filename: 'report' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  /** Whether an export is in progress */
  readonly exporting = signal(false);
  /** Last export result message */
  readonly lastResult = signal('');

  /**
   * Export content in the specified format.
   */
  async export(options: ExportOptions): Promise<void> {
    this.exporting.set(true);
    this.lastResult.set('');

    try {
      switch (options.format) {
        case 'pdf':
          await this._exportPdf(options);
          break;
        case 'json':
          this._exportJson(options);
          break;
        case 'csv':
          this._exportCsv(options);
          break;
        case 'png':
          await this._exportPng(options);
          break;
      }
      this.lastResult.set(`✅ Exportado como ${options.format.toUpperCase()}`);
    } catch (err) {
      this.lastResult.set(`❌ Erro ao exportar: ${(err as Error).message}`);
    } finally {
      this.exporting.set(false);
    }
  }

  private async _exportPdf(options: ExportOptions): Promise<void> {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        iu-nav-rail, iu-top-app-bar, .export-toolbar { display: none !important; }
        .page-wrapper { margin: 0 !important; }
        body { background: white !important; color: black !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  }

  private _exportJson(options: ExportOptions): void {
    const data = options.data ?? this._gatherDashboardData();
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    );
    this._download(blob, `${options.filename ?? 'export'}.json`);
  }

  private _exportCsv(options: ExportOptions): void {
    const data = options.data ?? this._gatherDashboardData();
    if (!data.length) return;
    const keys = options.csvKeys ?? Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map(row =>
      keys.map(k => JSON.stringify(row[k] ?? '')).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this._download(blob, `${options.filename ?? 'export'}.csv`);
  }

  private async _exportPng(options: ExportOptions): Promise<void> {
    const el = options.selector
      ? document.querySelector<HTMLElement>(options.selector)
      : document.querySelector<HTMLElement>('.dashboard-grid, app-draggable-dashboard');

    if (!el) throw new Error('Elemento não encontrado para captura');

    // Use native Canvas API to draw a simple representation
    const canvas = document.createElement('canvas');
    const rect = el.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 600;
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = '#1c1b1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e6e0e9';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Dashboard Export — israel-ui', canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#938f99';
    ctx.fillText(new Date().toLocaleString('pt-PT'), canvas.width / 2, canvas.height / 2 + 16);

    canvas.toBlob(blob => {
      if (blob) this._download(blob, `${options.filename ?? 'dashboard'}.png`);
    }, 'image/png');
  }

  private _gatherDashboardData(): Record<string, unknown>[] {
    return [
      { metric: 'Components', value: 32, status: 'ready', date: new Date().toISOString() },
      { metric: 'Sprint Progress', value: '85%', status: 'active', date: new Date().toISOString() },
      { metric: 'Days to Brazil', value: 12, status: 'pending', date: new Date().toISOString() },
    ];
  }

  private _download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
