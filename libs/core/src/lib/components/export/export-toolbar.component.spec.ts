import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExportToolbarComponent } from './export-toolbar.component';
import { ExportService, ExportFormat, ExportOptions } from './export.service';

describe('ExportToolbarComponent', () => {
  let fixture: ComponentFixture<ExportToolbarComponent>;
  let component: ExportToolbarComponent;
  let exportSpy: jest.Mock;
  let mockSvc: {
    exporting: ReturnType<typeof signal<boolean>>;
    lastResult: ReturnType<typeof signal<string>>;
    export: jest.Mock;
  };

  beforeEach(async () => {
    exportSpy = jest.fn().mockResolvedValue(undefined);
    mockSvc = {
      exporting: signal(false),
      lastResult: signal(''),
      export: exportSpy,
    };

    await TestBed.configureTestingModule({
      imports: [ExportToolbarComponent],
      providers: [{ provide: ExportService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('has expected input defaults', () => {
    expect(component.filename()).toBe('israel-ui-dashboard');
  });

  it('exposes a buttons array with PDF/PNG/JSON/CSV entries in order', () => {
    expect(component.buttons.length).toBe(4);
    const formats = component.buttons.map((b) => b.format);
    expect(formats).toEqual<ExportFormat[]>(['pdf', 'png', 'json', 'csv']);
    const labels = component.buttons.map((b) => b.label);
    expect(labels).toEqual(['PDF', 'PNG', 'JSON', 'CSV']);
    const icons = component.buttons.map((b) => b.icon);
    expect(icons).toEqual(['picture_as_pdf', 'image', 'data_object', 'table']);
  });

  it('injects the ExportService instance', () => {
    expect(component.svc).toBe(mockSvc as unknown as ExportService);
  });

  it('doExport() calls svc.export with the configured format and filename', () => {
    component.doExport('pdf');
    expect(exportSpy).toHaveBeenCalledTimes(1);
    const args = exportSpy.mock.calls[0][0] as ExportOptions;
    expect(args.format).toBe('pdf');
    expect(args.filename).toBe('israel-ui-dashboard');
    expect(args.data).toBeUndefined();
  });

  it('doExport() uses the current filename input value', () => {
    fixture.componentRef.setInput('filename', 'custom-report');
    fixture.detectChanges();
    component.doExport('csv');
    const args = exportSpy.mock.calls[0][0] as ExportOptions;
    expect(args.filename).toBe('custom-report');
    expect(args.format).toBe('csv');
  });

  it('renders the toolbar label "Exportar"', () => {
    const label = fixture.nativeElement.querySelector('.export-toolbar__label') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Exportar');
  });

  it('renders one button per entry in buttons array with correct labels', () => {
    const btns = fixture.nativeElement.querySelectorAll('.export-btn');
    expect(btns.length).toBe(4);
    expect((btns[0] as HTMLElement).textContent).toContain('PDF');
    expect((btns[1] as HTMLElement).textContent).toContain('PNG');
    expect((btns[2] as HTMLElement).textContent).toContain('JSON');
    expect((btns[3] as HTMLElement).textContent).toContain('CSV');
  });

  it('sets title attribute on each export button matching its label', () => {
    const btns = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.export-btn');
    expect(btns[0].title).toBe('PDF');
    expect(btns[1].title).toBe('PNG');
    expect(btns[2].title).toBe('JSON');
    expect(btns[3].title).toBe('CSV');
  });

  it('clicking a button triggers doExport with the matching format', () => {
    const btns = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.export-btn');
    btns[2].click(); // JSON
    expect(exportSpy).toHaveBeenCalledTimes(1);
    const args = exportSpy.mock.calls[0][0] as ExportOptions;
    expect(args.format).toBe('json');
  });

  it('disables buttons and adds loading class when svc.exporting() is true', () => {
    mockSvc.exporting.set(true);
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.export-btn');
    btns.forEach((b) => {
      expect(b.disabled).toBe(true);
      expect(b.classList.contains('export-btn--loading')).toBe(true);
    });
  });

  it('does not render the result span when lastResult is empty', () => {
    expect(fixture.nativeElement.querySelector('.export-toolbar__result')).toBeNull();
  });

  it('renders the result span with lastResult text when populated', () => {
    mockSvc.lastResult.set('Exportado como PDF');
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('.export-toolbar__result') as HTMLElement;
    expect(result).toBeTruthy();
    expect(result.textContent?.trim()).toBe('Exportado como PDF');
  });

  it('renders icons inside each export button', () => {
    const btns = fixture.nativeElement.querySelectorAll('.export-btn');
    const icons = Array.from(btns).map(
      (b) => (b as HTMLElement).querySelector('.material-symbols-outlined')?.textContent?.trim(),
    );
    expect(icons).toEqual(['picture_as_pdf', 'image', 'data_object', 'table']);
  });
});
