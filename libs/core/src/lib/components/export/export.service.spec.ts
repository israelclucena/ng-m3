import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;
  let clickSpy: jest.SpyInstance;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExportService] });
    service = TestBed.inject(ExportService);

    // jsdom does not implement blob URLs — stub them so `_download` works.
    createObjectURL = jest.fn(() => 'blob:mock-url');
    revokeObjectURL = jest.fn();
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;

    // Intercept the anchor click that would trigger a real download/navigation.
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should be created with idle state', () => {
    expect(service).toBeTruthy();
    expect(service.exporting()).toBe(false);
    expect(service.lastResult()).toBe('');
  });

  // ── JSON export ──────────────────────────────────────────────────────────────

  it('exports JSON with provided data and triggers a download', async () => {
    await service.export({
      format: 'json',
      filename: 'report',
      data: [{ a: 1 }],
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(service.exporting()).toBe(false);
    expect(service.lastResult()).toContain('JSON');
  });

  it('exports JSON falling back to gathered dashboard data when none provided', async () => {
    await service.export({ format: 'json' });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(service.lastResult()).toContain('✅');
  });

  // ── CSV export ───────────────────────────────────────────────────────────────

  it('exports CSV with provided data', async () => {
    await service.export({
      format: 'csv',
      filename: 'data',
      data: [
        { name: 'a', value: 1 },
        { name: 'b', value: 2 },
      ],
    });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(service.lastResult()).toContain('CSV');
  });

  it('CSV export respects explicit csvKeys', async () => {
    // jsdom Blob has no readable `.text()`, so capture the raw parts the
    // service passes to the Blob constructor instead.
    const RealBlob = global.Blob;
    let captured = '';
    (global as unknown as { Blob: unknown }).Blob = class {
      constructor(parts: string[]) {
        captured = parts.join('');
      }
    };
    try {
      await service.export({
        format: 'csv',
        data: [{ name: 'a', value: 1, extra: 'hidden' }],
        csvKeys: ['name', 'value'],
      });
    } finally {
      (global as unknown as { Blob: unknown }).Blob = RealBlob;
    }
    expect(captured.split('\n')[0]).toBe('name,value');
    expect(captured).not.toContain('hidden');
  });

  it('CSV export with empty data does not download', async () => {
    await service.export({ format: 'csv', data: [] });
    expect(clickSpy).not.toHaveBeenCalled();
    // Empty data returns early inside _exportCsv but export() still marks success
    expect(service.exporting()).toBe(false);
  });

  // ── PDF export ───────────────────────────────────────────────────────────────

  it('exports PDF by invoking window.print', async () => {
    const printSpy = jest
      .spyOn(window, 'print')
      .mockImplementation(() => undefined);
    await service.export({ format: 'pdf' });
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(service.lastResult()).toContain('PDF');
  });

  // ── PNG export (error path) ──────────────────────────────────────────────────

  it('records an error when the PNG target element is not found', async () => {
    await service.export({ format: 'png', selector: '#does-not-exist' });
    expect(service.lastResult()).toContain('❌');
    expect(service.lastResult()).toContain('não encontrado');
    expect(service.exporting()).toBe(false);
  });

  // ── exporting flag lifecycle ─────────────────────────────────────────────────

  it('resets exporting flag to false even when the export errors (finally block)', async () => {
    expect(service.exporting()).toBe(false);
    // PNG with a missing element throws → the finally block must still clear the flag.
    await service.export({ format: 'png', selector: '#missing' });
    expect(service.exporting()).toBe(false);
    expect(service.lastResult()).toContain('❌');
  });
});
