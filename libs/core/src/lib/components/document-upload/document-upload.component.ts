/**
 * @fileoverview DocumentUploadComponent — Sprint 034
 *
 * `iu-document-upload` — Drag-and-drop file upload with M3 styling.
 *
 * Supports single/multiple file selection, type + size validation,
 * image preview thumbnails, and configurable accepted extensions.
 *
 * Patterns:
 * - Angular Signals only (no RxJS)
 * - Standalone component
 * - Uses file-validators.ts utilities
 *
 * Feature flag: DOCUMENT_UPLOAD
 *
 * @example
 * ```html
 * <iu-document-upload
 *   label="Upload Documents"
 *   [multiple]="true"
 *   [maxSizeMb]="5"
 *   [allowedTypes]="['application/pdf', 'image/jpeg', 'image/png']"
 *   (filesChanged)="onFiles($event)" />
 * ```
 */
import {
  Component,
  input,
  output,
  signal,
  computed,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UploadFile,
  FileValidationOptions,
  createUploadFile,
  fileIcon,
} from '../../utils/file-validators';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * `iu-document-upload`
 *
 * M3-styled drag-and-drop file upload with validation, preview, and removal.
 *
 * Feature flag: DOCUMENT_UPLOAD
 */
@Component({
  selector: 'iu-document-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="du-wrapper">

      <!-- Label -->
      @if (label()) {
        <div class="du-label-row">
          <label class="du-label">{{ label() }}</label>
          @if (!multiple()) {
            <span class="du-hint">1 file max</span>
          } @else if (maxFiles() > 0) {
            <span class="du-hint">Up to {{ maxFiles() }} files</span>
          }
        </div>
      }

      <!-- Drop zone -->
      <div
        class="du-dropzone"
        [class.du-dropzone-over]="dragging()"
        [class.du-dropzone-error]="hasErrors()"
        [class.du-dropzone-disabled]="isAtLimit()"
        role="button"
        tabindex="0"
        [attr.aria-label]="dropzoneAriaLabel()"
        (click)="triggerInput()"
        (keydown.enter)="triggerInput()"
        (keydown.space)="triggerInput()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)">

        <span class="material-symbols-outlined du-drop-icon">
          {{ dragging() ? 'file_download' : 'cloud_upload' }}
        </span>
        <p class="du-drop-text">
          @if (isAtLimit()) {
            File limit reached
          } @else if (dragging()) {
            Drop to upload
          } @else {
            Drag &amp; drop files here, or <span class="du-browse">browse</span>
          }
        </p>
        @if (hintText()) {
          <p class="du-drop-hint">{{ hintText() }}</p>
        }

        <input
          #fileInput
          type="file"
          class="du-hidden-input"
          [multiple]="multiple()"
          [accept]="accept()"
          (change)="onInputChange($event)"
          aria-hidden="true" />
      </div>

      <!-- File list -->
      @if (files().length > 0) {
        <ul class="du-file-list" role="list">
          @for (f of files(); track f.id) {
            <li class="du-file-item" [class.du-file-invalid]="!f.validation.valid">

              <!-- Preview / icon -->
              <div class="du-file-thumb">
                @if (f.previewUrl) {
                  <img [src]="f.previewUrl" [alt]="f.name" class="du-thumb-img" />
                } @else {
                  <span class="material-symbols-outlined du-file-icon">{{ getFileIcon(f) }}</span>
                }
              </div>

              <!-- Info -->
              <div class="du-file-info">
                <span class="du-file-name" [title]="f.name">{{ f.name }}</span>
                <span class="du-file-size">{{ f.sizeLabel }}</span>
                @if (!f.validation.valid) {
                  <ul class="du-file-errors">
                    @for (err of f.validation.errors; track err) {
                      <li>{{ err }}</li>
                    }
                  </ul>
                }
              </div>

              <!-- Remove -->
              <button
                class="du-remove-btn"
                type="button"
                [attr.aria-label]="'Remove ' + f.name"
                (click)="removeFile(f.id)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </li>
          }
        </ul>

        <!-- Summary -->
        <div class="du-summary">
          <span class="du-summary-count">
            {{ validFiles().length }} / {{ files().length }} file{{ files().length !== 1 ? 's' : '' }} ready
          </span>
          @if (hasErrors()) {
            <span class="du-summary-error">{{ errorCount() }} with errors</span>
          }
          <button class="du-clear-btn" type="button" (click)="clearAll()">
            Clear all
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .du-wrapper { display: flex; flex-direction: column; gap: 12px; }
    .du-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .du-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .du-hint {
      font-size: 12px;
      color: var(--md-sys-color-outline, #79747e);
    }
    .du-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 32px 24px;
      border: 2px dashed var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 16px;
      background: var(--md-sys-color-surface-container-low, #f3eff4);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      position: relative;
      outline: none;
    }
    .du-dropzone:focus-visible {
      box-shadow: 0 0 0 3px var(--md-sys-color-primary-container, #eaddff);
      border-color: var(--md-sys-color-primary, #6750a4);
    }
    .du-dropzone:hover:not(.du-dropzone-disabled) {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-surface-container, #ece6f0);
    }
    .du-dropzone-over {
      border-color: var(--md-sys-color-primary, #6750a4);
      background: var(--md-sys-color-primary-container, #eaddff);
    }
    .du-dropzone-error {
      border-color: var(--md-sys-color-error, #b3261e);
    }
    .du-dropzone-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .du-drop-icon {
      font-size: 40px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .du-drop-text {
      margin: 0;
      font-size: 14px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      text-align: center;
    }
    .du-browse {
      color: var(--md-sys-color-primary, #6750a4);
      font-weight: 500;
      text-decoration: underline;
    }
    .du-drop-hint {
      margin: 0;
      font-size: 12px;
      color: var(--md-sys-color-outline, #79747e);
      text-align: center;
    }
    .du-hidden-input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .du-file-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .du-file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface, #fffbfe);
      border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      border-radius: 10px;
    }
    .du-file-invalid {
      border-color: var(--md-sys-color-error, #b3261e);
      background: var(--md-sys-color-error-container, #f9dedc);
    }
    .du-file-thumb {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--md-sys-color-surface-container, #ece6f0);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .du-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .du-file-icon {
      font-size: 22px;
      color: var(--md-sys-color-primary, #6750a4);
    }
    .du-file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .du-file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .du-file-size {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .du-file-errors {
      margin: 4px 0 0;
      padding-left: 16px;
      font-size: 12px;
      color: var(--md-sys-color-error, #b3261e);
    }
    .du-remove-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }
    .du-remove-btn:hover {
      background: var(--md-sys-color-surface-container, #ece6f0);
    }
    .du-remove-btn .material-symbols-outlined { font-size: 18px; }
    .du-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }
    .du-summary-count { color: var(--md-sys-color-on-surface-variant, #49454f); }
    .du-summary-error {
      color: var(--md-sys-color-error, #b3261e);
      font-weight: 500;
    }
    .du-clear-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--md-sys-color-primary, #6750a4);
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .du-clear-btn:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
    }
  `],
})
export class DocumentUploadComponent implements OnDestroy {
  // ─── Inputs ───────────────────────────────────────────────────────────────

  /** @input Label displayed above the drop zone */
  readonly label = input<string>('');
  /** @input Allow selecting multiple files */
  readonly multiple = input<boolean>(false);
  /** @input Maximum file size in MB (default 10) */
  readonly maxSizeMb = input<number>(10);
  /** @input Allowed MIME types (e.g. ['application/pdf', 'image/jpeg']) */
  readonly allowedTypes = input<string[]>([]);
  /** @input Allowed extensions (e.g. ['.pdf', '.jpg']) — shown as hint */
  readonly allowedExtensions = input<string[]>([]);
  /** @input Maximum number of files (0 = unlimited) */
  readonly maxFiles = input<number>(0);

  // ─── Outputs ──────────────────────────────────────────────────────────────

  /** @output Emits full UploadFile[] whenever the list changes */
  readonly filesChanged = output<UploadFile[]>();
  /** @output Emits only valid UploadFile[] */
  readonly validFilesChanged = output<UploadFile[]>();

  // ─── Internal state ───────────────────────────────────────────────────────

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly files = signal<UploadFile[]>([]);
  readonly dragging = signal(false);

  readonly validFiles = computed(() => this.files().filter(f => f.validation.valid));
  readonly hasErrors = computed(() => this.files().some(f => !f.validation.valid));
  readonly errorCount = computed(() => this.files().filter(f => !f.validation.valid).length);
  readonly isAtLimit = computed(() => {
    const max = this.maxFiles();
    return max > 0 && this.files().length >= max;
  });

  readonly hintText = computed(() => {
    const parts: string[] = [];
    if (this.maxSizeMb()) parts.push(`Max ${this.maxSizeMb()} MB`);
    const exts = this.allowedExtensions();
    if (exts.length > 0) parts.push(`Accepted: ${exts.join(', ')}`);
    else {
      const types = this.allowedTypes();
      if (types.length > 0) parts.push(`Accepted: ${types.map(t => t.split('/')[1]).join(', ')}`);
    }
    return parts.join(' · ');
  });

  readonly accept = computed(() => {
    const types = this.allowedTypes();
    const exts = this.allowedExtensions();
    return [...types, ...exts].join(',') || '*/*';
  });

  readonly dropzoneAriaLabel = computed(() =>
    this.isAtLimit()
      ? 'File upload limit reached'
      : `Upload zone. ${this.multiple() ? 'Multiple files' : 'Single file'}. Click or drag to upload.`
  );

  // ─── Drag handlers ────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAtLimit()) this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    if (this.isAtLimit()) return;
    const dt = event.dataTransfer;
    if (!dt) return;
    const rawFiles = Array.from(dt.files);
    this.addFiles(rawFiles);
  }

  // ─── Input handler ────────────────────────────────────────────────────────

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawFiles = input.files ? Array.from(input.files) : [];
    this.addFiles(rawFiles);
    input.value = '';
  }

  triggerInput(): void {
    if (this.isAtLimit()) return;
    this.fileInput()?.nativeElement.click();
  }

  // ─── File management ──────────────────────────────────────────────────────

  private addFiles(rawFiles: File[]): void {
    const options: FileValidationOptions = {
      maxSizeBytes: this.maxSizeMb() * 1024 * 1024,
      allowedTypes: this.allowedTypes(),
      allowedExtensions: this.allowedExtensions(),
    };

    const max = this.maxFiles();
    const existing = this.files().length;
    let toAdd = rawFiles;

    if (!this.multiple()) {
      toAdd = rawFiles.slice(0, 1);
      this.clearPreviews();
      this.files.set([]);
    } else if (max > 0) {
      const slots = max - existing;
      toAdd = rawFiles.slice(0, slots);
    }

    const uploads = toAdd.map(f => createUploadFile(f, options));
    this.files.update(prev => [...prev, ...uploads]);
    this.emit();
  }

  /** Remove a file by id. */
  removeFile(id: string): void {
    const f = this.files().find(f => f.id === id);
    if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
    this.files.update(prev => prev.filter(f => f.id !== id));
    this.emit();
  }

  /** Clear all files. */
  clearAll(): void {
    this.clearPreviews();
    this.files.set([]);
    this.emit();
  }

  /** Get Material icon name for a file. */
  getFileIcon(f: UploadFile): string {
    return fileIcon(f);
  }

  private clearPreviews(): void {
    this.files().forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
  }

  private emit(): void {
    const all = this.files();
    this.filesChanged.emit(all);
    this.validFilesChanged.emit(all.filter(f => f.validation.valid));
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }
}
