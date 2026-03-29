/**
 * @fileoverview DocumentUploadComponent stories — Sprint 034
 *
 * CSF3 stories: Default + WithValidationError + MultipleFiles.
 * Feature flag: DOCUMENT_UPLOAD
 */
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { DocumentUploadComponent } from './document-upload.component';

const meta: Meta<DocumentUploadComponent> = {
  title: 'Sprint 034/DocumentUpload',
  component: DocumentUploadComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**\`iu-document-upload\`** — Drag-and-drop file upload with M3 styling.

Supports single/multiple file selection, MIME type + size validation,
image preview thumbnails, and configurable accepted extensions.

Pure Angular Signals — no RxJS.

Feature flag: \`DOCUMENT_UPLOAD\`
        `.trim(),
      },
    },
  },
  argTypes: {
    maxSizeMb: { control: { type: 'number', min: 1, max: 50 } },
    multiple: { control: 'boolean' },
    maxFiles: { control: { type: 'number', min: 0, max: 20 } },
  },
};

export default meta;
type Story = StoryObj<DocumentUploadComponent>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default — Single PDF/image upload for rental documents.
 */
export const Default: Story = {
  args: {
    label: 'Upload Rental Agreement',
    multiple: false,
    maxSizeMb: 5,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Single-file mode — accepts PDF and images up to 5 MB.',
      },
    },
  },
};

/**
 * WithValidationError — Shows what happens with rejected file types or oversized files.
 * Try uploading an .exe or very large file to trigger errors.
 */
export const WithValidationError: Story = {
  args: {
    label: 'Upload Identity Documents',
    multiple: false,
    maxSizeMb: 2,
    allowedTypes: ['application/pdf', 'image/jpeg'],
    allowedExtensions: ['.pdf', '.jpg'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Strict validation — 2 MB limit, PDF/JPEG only. Upload any other file type to see inline error state.',
      },
    },
  },
};

/**
 * MultipleFiles — Supports up to 10 files for bulk document upload.
 */
export const MultipleFiles: Story = {
  args: {
    label: 'Upload Supporting Documents',
    multiple: true,
    maxFiles: 10,
    maxSizeMb: 10,
    allowedTypes: [],
    allowedExtensions: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-file mode — up to 10 files, any type up to 10 MB each. Shows file list with remove + clear-all controls.',
      },
    },
  },
};
