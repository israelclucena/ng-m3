/**
 * @fileoverview FileValidatorService — Sprint 034
 *
 * Pure signal-compatible file validators for DocumentUploadComponent.
 * No RxJS, no classes with state — pure functions.
 *
 * Feature flag: DOCUMENT_UPLOAD
 *
 * @example
 * ```ts
 * const errors = validateFile(file, {
 *   maxSizeBytes: 5 * 1024 * 1024, // 5 MB
 *   allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
 * });
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Options for file validation. */
export interface FileValidationOptions {
  /** Maximum file size in bytes. Default: 10 MB */
  maxSizeBytes?: number;
  /** Allowed MIME types. Empty = all allowed. */
  allowedTypes?: string[];
  /** Allowed file extensions (e.g. ['.pdf', '.jpg']). Empty = all allowed. */
  allowedExtensions?: string[];
}

/** Validation result for a single file. */
export interface FileValidationResult {
  /** True if file passes all validators. */
  valid: boolean;
  /** Error messages (empty if valid). */
  errors: string[];
}

/** A file with computed metadata, ready to display. */
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  type: string;
  extension: string;
  /** Relative blob URL for preview (revoke when done) */
  previewUrl?: string;
  validation: FileValidationResult;
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Format bytes to human-readable string.
 * @param bytes - Raw byte count
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extract file extension from filename (lowercase, with dot).
 * @param filename - File name
 */
export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

/**
 * Validate a single File against the given options.
 * @param file - The File to validate
 * @param options - Validation constraints
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const errors: string[] = [];
  const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  if (file.size > maxSizeBytes) {
    errors.push(`File too large (${formatFileSize(file.size)} / max ${formatFileSize(maxSizeBytes)})`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type || 'unknown'}`);
  }

  if (allowedExtensions.length > 0) {
    const ext = getExtension(file.name);
    if (!allowedExtensions.includes(ext)) {
      errors.push(`Invalid extension: ${ext || 'none'} (allowed: ${allowedExtensions.join(', ')})`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create an UploadFile record from a raw File.
 * @param file - The File object
 * @param options - Validation constraints to apply
 */
export function createUploadFile(
  file: File,
  options: FileValidationOptions = {}
): UploadFile {
  const isImage = file.type.startsWith('image/');
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    file,
    name: file.name,
    sizeBytes: file.size,
    sizeLabel: formatFileSize(file.size),
    type: file.type,
    extension: getExtension(file.name),
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    validation: validateFile(file, options),
  };
}

/**
 * Icon name (Material Symbols) for a file type/extension.
 * @param file - UploadFile record
 */
export function fileIcon(file: UploadFile): string {
  if (file.type === 'application/pdf') return 'picture_as_pdf';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'videocam';
  if (file.type.startsWith('audio/')) return 'audio_file';
  if (
    file.type.includes('word') ||
    file.extension === '.doc' ||
    file.extension === '.docx'
  ) return 'article';
  if (
    file.type.includes('excel') ||
    file.extension === '.xls' ||
    file.extension === '.xlsx'
  ) return 'table_chart';
  return 'attach_file';
}
