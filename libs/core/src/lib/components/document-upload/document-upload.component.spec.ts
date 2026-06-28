import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentUploadComponent } from './document-upload.component';
import type { UploadFile } from '../../utils/file-validators';

/** Build a File of an exact byte size and MIME type. */
function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('DocumentUploadComponent', () => {
  let fixture: ComponentFixture<DocumentUploadComponent>;
  let component: DocumentUploadComponent;

  /** Simulate a drop with the given files. */
  function drop(files: File[]): void {
    const ev = {
      preventDefault() {},
      stopPropagation() {},
      dataTransfer: { files },
    } as unknown as DragEvent;
    component.onDrop(ev);
  }

  beforeEach(async () => {
    // jsdom has no Object URL impl — stub so the image-preview path is safe.
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = jest.fn(
      () => 'blob:mock',
    );
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = jest.fn();

    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── defaults ────────────────────────────────────────────────────────────────

  it('starts with no files and not dragging', () => {
    expect(component.files()).toEqual([]);
    expect(component.dragging()).toBe(false);
    expect(component.hasErrors()).toBe(false);
    expect(component.errorCount()).toBe(0);
    expect(component.validFiles()).toEqual([]);
  });

  // ── derived: accept / hint / aria ─────────────────────────────────────────────

  it('accept() defaults to */* and joins types + extensions when set', () => {
    expect(component.accept()).toBe('*/*');
    fixture.componentRef.setInput('allowedTypes', ['application/pdf']);
    fixture.componentRef.setInput('allowedExtensions', ['.png']);
    expect(component.accept()).toBe('application/pdf,.png');
  });

  it('hintText() composes max size and accepted extensions', () => {
    fixture.componentRef.setInput('maxSizeMb', 5);
    fixture.componentRef.setInput('allowedExtensions', ['.pdf', '.jpg']);
    expect(component.hintText()).toBe('Max 5 MB · Accepted: .pdf, .jpg');
  });

  it('dropzoneAriaLabel() reflects single vs multiple', () => {
    expect(component.dropzoneAriaLabel()).toContain('Single file');
    fixture.componentRef.setInput('multiple', true);
    expect(component.dropzoneAriaLabel()).toContain('Multiple files');
  });

  // ── adding files ──────────────────────────────────────────────────────────────

  it('drop adds files and emits both change outputs', () => {
    fixture.componentRef.setInput('multiple', true);
    const all: UploadFile[][] = [];
    const valid: UploadFile[][] = [];
    component.filesChanged.subscribe((f) => all.push(f));
    component.validFilesChanged.subscribe((f) => valid.push(f));

    drop([makeFile('a.pdf', 'application/pdf', 100)]);

    expect(component.files().length).toBe(1);
    expect(all.at(-1)!.length).toBe(1);
    expect(valid.at(-1)!.length).toBe(1);
  });

  it('single mode keeps only the latest file', () => {
    drop([makeFile('a.pdf', 'application/pdf', 10)]);
    drop([makeFile('b.pdf', 'application/pdf', 10)]);
    expect(component.files().length).toBe(1);
    expect(component.files()[0].name).toBe('b.pdf');
  });

  it('multiple mode respects maxFiles by trimming the overflow', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('maxFiles', 2);
    drop([
      makeFile('a.pdf', 'application/pdf', 10),
      makeFile('b.pdf', 'application/pdf', 10),
      makeFile('c.pdf', 'application/pdf', 10),
    ]);
    expect(component.files().length).toBe(2);
    expect(component.isAtLimit()).toBe(true);
  });

  // ── validation ──────────────────────────────────────────────────────────────

  it('flags oversized files as invalid and excludes them from validFiles', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('maxSizeMb', 1); // 1 MB limit
    drop([
      makeFile('ok.pdf', 'application/pdf', 500),
      makeFile('big.pdf', 'application/pdf', 2 * 1024 * 1024),
    ]);
    expect(component.files().length).toBe(2);
    expect(component.hasErrors()).toBe(true);
    expect(component.errorCount()).toBe(1);
    expect(component.validFiles().length).toBe(1);
    expect(component.validFiles()[0].name).toBe('ok.pdf');
  });

  // ── removal ───────────────────────────────────────────────────────────────────

  it('removeFile removes a single entry by id', () => {
    fixture.componentRef.setInput('multiple', true);
    drop([
      makeFile('a.pdf', 'application/pdf', 10),
      makeFile('b.pdf', 'application/pdf', 10),
    ]);
    const id = component.files()[0].id;
    component.removeFile(id);
    expect(component.files().length).toBe(1);
    expect(component.files().some((f) => f.id === id)).toBe(false);
  });

  it('clearAll empties the list', () => {
    fixture.componentRef.setInput('multiple', true);
    drop([makeFile('a.pdf', 'application/pdf', 10)]);
    component.clearAll();
    expect(component.files()).toEqual([]);
  });

  // ── drag state + limit guards ─────────────────────────────────────────────────

  it('onDragOver sets dragging, onDragLeave clears it', () => {
    const ev = { preventDefault() {}, stopPropagation() {} } as unknown as DragEvent;
    component.onDragOver(ev);
    expect(component.dragging()).toBe(true);
    component.onDragLeave();
    expect(component.dragging()).toBe(false);
  });

  it('does not enter drag state nor accept drops when at the file limit', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('maxFiles', 1);
    drop([makeFile('a.pdf', 'application/pdf', 10)]);
    expect(component.isAtLimit()).toBe(true);

    const over = { preventDefault() {}, stopPropagation() {} } as unknown as DragEvent;
    component.onDragOver(over);
    expect(component.dragging()).toBe(false);

    drop([makeFile('b.pdf', 'application/pdf', 10)]);
    expect(component.files().length).toBe(1); // unchanged
  });

  // ── input change path ─────────────────────────────────────────────────────────

  it('onInputChange ingests files and resets the input value', () => {
    fixture.componentRef.setInput('multiple', true);
    const target = { files: [makeFile('a.pdf', 'application/pdf', 10)], value: 'x' };
    component.onInputChange({ target } as unknown as Event);
    expect(component.files().length).toBe(1);
    expect(target.value).toBe('');
  });

  // ── icons ─────────────────────────────────────────────────────────────────────

  it('getFileIcon maps a PDF to the pdf icon', () => {
    drop([makeFile('a.pdf', 'application/pdf', 10)]);
    expect(component.getFileIcon(component.files()[0])).toBe('picture_as_pdf');
  });
});
