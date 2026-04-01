import {
  Component, ChangeDetectionStrategy, Input, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DocumentVaultService,
} from '../../services/document-vault.service';
import type { VaultDocument, VaultDocumentCategory } from '../../services/document-vault.service';

const CATEGORY_ICONS: Record<string, string> = {
  all: 'folder',
  lease: 'description',
  receipt: 'receipt_long',
  photo: 'photo_library',
  id: 'badge',
  contract: 'gavel',
  inspection: 'fact_check',
  other: 'attach_file',
};

const FILE_ICONS: Record<string, string> = {
  pdf: 'picture_as_pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  zip: 'folder_zip',
  doc: 'article',
  docx: 'article',
};

/**
 * DocumentVaultComponent — centralised document manager for tenants and landlords.
 *
 * Renders a sidebar-nav vault with category filtering, document grid,
 * storage indicator, and upload/delete actions.
 *
 * @example
 * <iu-document-vault ownerId="tenant-001" />
 */
@Component({
  selector: 'iu-document-vault',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="dv-root">

      <!-- Sidebar -->
      <aside class="dv-sidebar">
        <div class="dv-sidebar-header">
          <span class="material-symbols-outlined">lock</span>
          <span>Document Vault</span>
        </div>

        <nav class="dv-nav" aria-label="Document categories">
          @for (cat of categories; track cat) {
            <button
              class="dv-nav-item"
              [class.dv-nav-item--active]="svc.activeCategory() === cat"
              (click)="svc.setCategory(cat)"
              [attr.aria-current]="svc.activeCategory() === cat ? 'page' : null"
            >
              <span class="material-symbols-outlined dv-nav-icon">{{ catIcon(cat) }}</span>
              <span class="dv-nav-label">{{ formatCat(cat) }}</span>
              @if (svc.categoryCounts()[cat]) {
                <span class="dv-nav-count">{{ svc.categoryCounts()[cat] }}</span>
              }
            </button>
          }
        </nav>

        <!-- Storage indicator -->
        <div class="dv-storage">
          <div class="dv-storage-label">Storage used</div>
          <div class="dv-storage-bar" role="progressbar" [attr.aria-valuenow]="storagePercent()">
            <div class="dv-storage-fill" [style.width.%]="storagePercent()"></div>
          </div>
          <div class="dv-storage-info">
            {{ svc.totalStorageMb() | number:'1.1-1' }} MB / 100 MB
          </div>
        </div>
      </aside>

      <!-- Main area -->
      <main class="dv-main">
        <div class="dv-main-header">
          <div>
            <h3 class="dv-main-title">{{ formatCat(svc.activeCategory()) }}</h3>
            <span class="dv-doc-count">{{ svc.filteredDocuments().length }} document{{ svc.filteredDocuments().length !== 1 ? 's' : '' }}</span>
          </div>
          <button class="dv-upload-btn" (click)="onUploadClick()">
            <span class="material-symbols-outlined">upload</span>
            Upload
          </button>
        </div>

        @if (svc.loading()) {
          <div class="dv-state">
            <span class="material-symbols-outlined dv-state-icon">hourglass_empty</span>
            <p>Loading documents…</p>
          </div>
        } @else if (svc.filteredDocuments().length === 0) {
          <div class="dv-state">
            <span class="material-symbols-outlined dv-state-icon">folder_open</span>
            <p>No documents in this category yet.</p>
            <button class="dv-upload-btn dv-upload-btn--outlined" (click)="onUploadClick()">
              <span class="material-symbols-outlined">upload</span>
              Upload your first document
            </button>
          </div>
        } @else {
          <div class="dv-list">
            @for (doc of svc.filteredDocuments(); track doc.id) {
              <div class="dv-doc-card">
                <div class="dv-doc-icon-wrap">
                  <span class="material-symbols-outlined dv-doc-icon">{{ fileIcon(doc.fileType) }}</span>
                  <span class="dv-file-type">{{ doc.fileType.toUpperCase() }}</span>
                </div>
                <div class="dv-doc-info">
                  <p class="dv-doc-title" [title]="doc.title">{{ doc.title }}</p>
                  <p class="dv-doc-meta">
                    <span>{{ doc.uploadedAt }}</span>
                    <span class="dv-meta-sep">·</span>
                    <span>{{ doc.sizeMb | number:'1.1-1' }} MB</span>
                    @if (doc.propertyId) {
                      <span class="dv-meta-sep">·</span>
                      <span>{{ doc.propertyId }}</span>
                    }
                  </p>
                  @if (doc.description) {
                    <p class="dv-doc-desc">{{ doc.description }}</p>
                  }
                  @if (doc.tags?.length) {
                    <div class="dv-tags">
                      @for (tag of doc.tags!; track tag) {
                        <span class="dv-tag">{{ tag }}</span>
                      }
                    </div>
                  }
                </div>
                <div class="dv-doc-actions">
                  <button class="dv-action-btn" title="Download" aria-label="Download {{ doc.title }}" (click)="onDownload(doc)">
                    <span class="material-symbols-outlined">download</span>
                  </button>
                  <button
                    class="dv-action-btn dv-action-delete"
                    title="Delete"
                    aria-label="Delete {{ doc.title }}"
                    (click)="onDelete(doc.id)"
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .dv-root {
      display: flex;
      min-height: 460px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 16px;
      overflow: hidden;
      font-family: var(--md-sys-typescale-body-medium-font, Roboto, sans-serif);
      background: var(--md-sys-color-surface);
    }

    /* Sidebar */
    .dv-sidebar {
      width: 210px;
      flex-shrink: 0;
      background: var(--md-sys-color-surface-container-low);
      border-right: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      flex-direction: column;
    }
    .dv-sidebar-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px;
      font-weight: 600; font-size: 14px;
      color: var(--md-sys-color-on-surface);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .dv-sidebar-header .material-symbols-outlined { color: var(--md-sys-color-primary); }
    .dv-nav { flex: 1; padding: 6px 0; overflow-y: auto; }
    .dv-nav-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 10px 16px;
      background: transparent; border: none; cursor: pointer;
      font-size: 13px; color: var(--md-sys-color-on-surface-variant);
      text-align: left; transition: background 0.15s;
    }
    .dv-nav-item:hover { background: var(--md-sys-color-surface-container); }
    .dv-nav-item--active {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-weight: 500;
    }
    .dv-nav-icon { font-size: 18px; }
    .dv-nav-label { flex: 1; }
    .dv-nav-count {
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface-variant);
      font-size: 11px; padding: 2px 7px; border-radius: 10px;
    }
    .dv-nav-item--active .dv-nav-count {
      background: var(--md-sys-color-on-secondary-container);
      color: var(--md-sys-color-secondary-container);
    }

    /* Storage */
    .dv-storage {
      padding: 12px 16px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .dv-storage-label { font-size: 11px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 6px; }
    .dv-storage-bar {
      height: 6px; background: var(--md-sys-color-surface-container-high);
      border-radius: 3px; overflow: hidden; margin-bottom: 4px;
    }
    .dv-storage-fill {
      height: 100%; background: var(--md-sys-color-primary);
      border-radius: 3px; transition: width 0.3s;
    }
    .dv-storage-info { font-size: 11px; color: var(--md-sys-color-on-surface-variant); }

    /* Main */
    .dv-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .dv-main-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      gap: 12px; flex-shrink: 0;
    }
    .dv-main-title { font-size: 16px; font-weight: 500; color: var(--md-sys-color-on-surface); margin: 0 0 2px; }
    .dv-doc-count { font-size: 12px; color: var(--md-sys-color-on-surface-variant); }
    .dv-upload-btn {
      display: flex; align-items: center; gap: 6px;
      background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
      border: none; border-radius: 20px; padding: 8px 18px;
      font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap;
      transition: opacity 0.15s;
    }
    .dv-upload-btn:hover { opacity: 0.9; }
    .dv-upload-btn--outlined {
      background: transparent;
      color: var(--md-sys-color-primary);
      border: 1px solid var(--md-sys-color-outline);
    }

    /* Empty / loading state */
    .dv-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 48px;
      color: var(--md-sys-color-on-surface-variant); font-size: 14px;
    }
    .dv-state-icon { font-size: 52px; }

    /* Document list */
    .dv-list {
      flex: 1; padding: 12px 16px;
      overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
    }
    .dv-doc-card {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 16px;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 12px; background: var(--md-sys-color-surface);
      transition: background 0.15s;
    }
    .dv-doc-card:hover { background: var(--md-sys-color-surface-container-low); }

    .dv-doc-icon-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      width: 48px; flex-shrink: 0;
    }
    .dv-doc-icon { font-size: 30px; color: var(--md-sys-color-primary); }
    .dv-file-type { font-size: 10px; font-weight: 600; color: var(--md-sys-color-on-surface-variant); }

    .dv-doc-info { flex: 1; min-width: 0; }
    .dv-doc-title {
      font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 3px;
    }
    .dv-doc-meta {
      font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin: 0 0 4px;
      display: flex; gap: 4px; flex-wrap: wrap;
    }
    .dv-meta-sep { opacity: 0.5; }
    .dv-doc-desc { font-size: 12px; color: var(--md-sys-color-on-surface-variant); font-style: italic; margin: 0 0 4px; }
    .dv-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .dv-tag {
      font-size: 11px; padding: 2px 8px;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface-variant); border-radius: 10px;
    }

    .dv-doc-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .dv-action-btn {
      background: transparent; border: none;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer; padding: 6px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .dv-action-btn:hover { background: var(--md-sys-color-surface-container-high); color: var(--md-sys-color-on-surface); }
    .dv-action-delete:hover { color: var(--md-sys-color-error); }
  `],
})
export class DocumentVaultComponent implements OnInit {
  protected readonly svc = inject(DocumentVaultService);

  readonly categories: (VaultDocumentCategory | 'all')[] = [
    'all', 'lease', 'receipt', 'photo', 'id', 'contract', 'inspection', 'other',
  ];

  /** Load documents for this owner id on init */
  @Input() ownerId?: string;

  ngOnInit(): void {
    if (this.ownerId) this.svc.loadForUser(this.ownerId);
  }

  protected catIcon(cat: string): string {
    return CATEGORY_ICONS[cat] ?? 'folder';
  }

  protected fileIcon(fileType: string): string {
    return FILE_ICONS[fileType?.toLowerCase()] ?? 'attach_file';
  }

  protected formatCat(cat: string): string {
    if (cat === 'all') return 'All Documents';
    if (cat === 'id') return 'Identity';
    return cat.charAt(0).toUpperCase() + cat.slice(1) + 's';
  }

  protected storagePercent(): number {
    return Math.min((this.svc.totalStorageMb() / 100) * 100, 100);
  }

  protected onUploadClick(): void {
    // In real app: open DocumentUploadComponent in an overlay/dialog
    console.log('[DocumentVault] trigger upload flow');
  }

  protected onDownload(doc: VaultDocument): void {
    console.log('[DocumentVault] download:', doc.title, doc.url);
  }

  protected onDelete(id: string): void {
    this.svc.deleteDocument(id);
  }
}
