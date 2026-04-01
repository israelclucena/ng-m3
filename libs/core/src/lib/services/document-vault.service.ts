import { Injectable, signal, computed } from '@angular/core';

/** Document category for vault organisation */
export type VaultDocumentCategory =
  | 'lease'
  | 'receipt'
  | 'photo'
  | 'id'
  | 'contract'
  | 'inspection'
  | 'other';

/** A single document stored in the vault */
export interface VaultDocument {
  id: string;
  ownerId: string;
  propertyId?: string;
  title: string;
  category: VaultDocumentCategory;
  /** File extension without dot: 'pdf', 'jpg', 'zip', etc. */
  fileType: string;
  sizeMb: number;
  /** ISO date uploaded */
  uploadedAt: string;
  /** Download / preview URL */
  url: string;
  tags?: string[];
  description?: string;
}

/** Payload to add a document to the vault */
export interface AddDocumentPayload {
  ownerId: string;
  propertyId?: string;
  title: string;
  category: VaultDocumentCategory;
  fileType: string;
  sizeMb: number;
  url: string;
  tags?: string[];
  description?: string;
}

/**
 * DocumentVaultService — centralised document repository for tenants and landlords.
 *
 * Documents are categorised (lease, receipt, photo, id, contract, inspection, other)
 * and can be filtered by category. Provides computed storage totals and category counts.
 */
@Injectable({ providedIn: 'root' })
export class DocumentVaultService {
  readonly documents = signal<VaultDocument[]>(this._seed());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Currently active category filter */
  readonly activeCategory = signal<VaultDocumentCategory | 'all'>('all');

  /** Documents filtered by active category */
  readonly filteredDocuments = computed(() => {
    const cat = this.activeCategory();
    return cat === 'all'
      ? this.documents()
      : this.documents().filter(d => d.category === cat);
  });

  /** Per-category document counts (includes 'all' key) */
  readonly categoryCounts = computed(() => {
    const counts: Record<string, number> = { all: this.documents().length };
    for (const d of this.documents()) {
      counts[d.category] = (counts[d.category] ?? 0) + 1;
    }
    return counts;
  });

  /** Total storage used across all vault documents in MB */
  readonly totalStorageMb = computed(() =>
    this.documents().reduce((sum, d) => sum + d.sizeMb, 0)
  );

  /**
   * Set the active category filter.
   * @param category Category to show, or 'all'
   */
  setCategory(category: VaultDocumentCategory | 'all'): void {
    this.activeCategory.set(category);
  }

  /**
   * Add a document to the vault.
   * @param payload Document metadata and file info
   * @returns The newly created VaultDocument
   */
  addDocument(payload: AddDocumentPayload): VaultDocument {
    const doc: VaultDocument = {
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      ...payload,
    };
    this.documents.update(list => [doc, ...list]);
    return doc;
  }

  /**
   * Remove a document from the vault.
   * @param id Document id to delete
   */
  deleteDocument(id: string): void {
    this.documents.update(list => list.filter(d => d.id !== id));
  }

  /**
   * Get all documents in a specific category (synchronous).
   * @param category Category to filter by
   */
  getByCategory(category: VaultDocumentCategory): VaultDocument[] {
    return this.documents().filter(d => d.category === category);
  }

  /**
   * Load documents for a specific owner (tenant or landlord).
   * @param ownerId The user's id
   */
  loadForUser(ownerId: string): void {
    this.loading.set(true);
    setTimeout(() => {
      this.documents.set(this._seed().filter(d => d.ownerId === ownerId));
      this.loading.set(false);
    }, 300);
  }

  private _seed(): VaultDocument[] {
    return [
      {
        id: 'vault-001',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'Lease Agreement — Baixa-Chiado 2026',
        category: 'lease',
        fileType: 'pdf',
        sizeMb: 0.4,
        uploadedAt: '2026-01-01',
        url: '#',
        tags: ['active', 'signed'],
        description: '12-month fixed lease, signed by both parties',
      },
      {
        id: 'vault-002',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'January 2026 — Rent Receipt',
        category: 'receipt',
        fileType: 'pdf',
        sizeMb: 0.1,
        uploadedAt: '2026-01-03',
        url: '#',
        tags: ['january', '2026'],
      },
      {
        id: 'vault-003',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'February 2026 — Rent Receipt',
        category: 'receipt',
        fileType: 'pdf',
        sizeMb: 0.1,
        uploadedAt: '2026-02-04',
        url: '#',
        tags: ['february', '2026'],
      },
      {
        id: 'vault-004',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'March 2026 — Rent Receipt',
        category: 'receipt',
        fileType: 'pdf',
        sizeMb: 0.1,
        uploadedAt: '2026-03-05',
        url: '#',
        tags: ['march', '2026'],
      },
      {
        id: 'vault-005',
        ownerId: 'tenant-001',
        title: 'National ID (Cartão de Cidadão)',
        category: 'id',
        fileType: 'jpg',
        sizeMb: 0.8,
        uploadedAt: '2026-01-01',
        url: '#',
        tags: ['kyc'],
      },
      {
        id: 'vault-006',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'Move-in Inspection Report',
        category: 'inspection',
        fileType: 'pdf',
        sizeMb: 0.3,
        uploadedAt: '2026-01-01',
        url: '#',
        tags: ['move-in', 'signed'],
      },
      {
        id: 'vault-007',
        ownerId: 'tenant-001',
        propertyId: 'prop-001',
        title: 'Property Photos — Move-in Condition',
        category: 'photo',
        fileType: 'zip',
        sizeMb: 12.4,
        uploadedAt: '2026-01-01',
        url: '#',
        tags: ['move-in'],
      },
      {
        id: 'vault-008',
        ownerId: 'landlord-001',
        propertyId: 'prop-001',
        title: 'Energy Certificate — Baixa-Chiado',
        category: 'contract',
        fileType: 'pdf',
        sizeMb: 0.2,
        uploadedAt: '2025-12-01',
        url: '#',
        tags: ['regulatory', 'B+'],
      },
      {
        id: 'vault-009',
        ownerId: 'landlord-001',
        propertyId: 'prop-002',
        title: 'Lease Agreement — Alfama Studio 2026',
        category: 'lease',
        fileType: 'pdf',
        sizeMb: 0.4,
        uploadedAt: '2026-01-15',
        url: '#',
        tags: ['active', 'signed'],
      },
    ];
  }
}
