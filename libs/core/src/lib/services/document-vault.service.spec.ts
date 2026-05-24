import { TestBed } from '@angular/core/testing';
import {
  DocumentVaultService,
  type AddDocumentPayload,
  type VaultDocumentCategory,
} from './document-vault.service';

function payload(
  overrides: Partial<AddDocumentPayload> = {},
): AddDocumentPayload {
  return {
    ownerId: 'tenant-001',
    propertyId: 'prop-001',
    title: 'Test document',
    category: 'other',
    fileType: 'pdf',
    sizeMb: 1.0,
    url: '#',
    ...overrides,
  };
}

describe('DocumentVaultService', () => {
  let service: DocumentVaultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentVaultService);
  });

  it('seeds with 9 mock documents spanning multiple categories', () => {
    const docs = service.documents();
    expect(docs.length).toBe(9);
    const cats = new Set(docs.map(d => d.category));
    for (const c of ['lease', 'receipt', 'id', 'inspection', 'photo', 'contract'] as VaultDocumentCategory[]) {
      expect(cats.has(c)).toBe(true);
    }
  });

  it('initial loading=false, error=null and activeCategory="all"', () => {
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.activeCategory()).toBe('all');
  });

  it('filteredDocuments returns the full list when category is "all"', () => {
    expect(service.filteredDocuments().length).toBe(service.documents().length);
  });

  it('setCategory narrows filteredDocuments to that category only', () => {
    service.setCategory('receipt');
    expect(service.activeCategory()).toBe('receipt');
    expect(service.filteredDocuments().every(d => d.category === 'receipt')).toBe(true);
    expect(service.filteredDocuments().length).toBe(3);
  });

  it('setCategory back to "all" restores the full list', () => {
    service.setCategory('receipt');
    expect(service.filteredDocuments().length).toBe(3);
    service.setCategory('all');
    expect(service.filteredDocuments().length).toBe(service.documents().length);
  });

  it('categoryCounts includes "all" and per-category tallies from seed', () => {
    const counts = service.categoryCounts();
    expect(counts['all']).toBe(9);
    expect(counts['receipt']).toBe(3);
    expect(counts['lease']).toBe(2);
    expect(counts['id']).toBe(1);
    expect(counts['photo']).toBe(1);
    expect(counts['inspection']).toBe(1);
    expect(counts['contract']).toBe(1);
  });

  it('totalStorageMb sums sizeMb across every seeded document', () => {
    const expected = service.documents().reduce((s, d) => s + d.sizeMb, 0);
    expect(service.totalStorageMb()).toBeCloseTo(expected, 5);
    // Sanity: 0.4 + 0.1*3 + 0.8 + 0.3 + 12.4 + 0.2 + 0.4 = 14.8
    expect(service.totalStorageMb()).toBeCloseTo(14.8, 5);
  });

  it('addDocument prepends a doc with generated id and ISO date', () => {
    const before = service.documents().length;
    const doc = service.addDocument(payload({ title: 'New Lease', category: 'lease', sizeMb: 0.5 }));
    const after = service.documents();
    expect(after.length).toBe(before + 1);
    expect(after[0]).toBe(doc);
    expect(doc.id).toMatch(/^doc-\d+/);
    expect(doc.title).toBe('New Lease');
    expect(doc.category).toBe('lease');
    expect(doc.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDocument updates totalStorageMb and categoryCounts reactively', () => {
    const beforeStorage = service.totalStorageMb();
    const beforeReceiptCount = service.categoryCounts()['receipt'];
    service.addDocument(payload({ category: 'receipt', sizeMb: 0.25 }));
    expect(service.totalStorageMb()).toBeCloseTo(beforeStorage + 0.25, 5);
    expect(service.categoryCounts()['receipt']).toBe(beforeReceiptCount + 1);
    expect(service.categoryCounts()['all']).toBe(10);
  });

  it('deleteDocument removes the matching id and updates counts', () => {
    service.deleteDocument('vault-001');
    expect(service.documents().some(d => d.id === 'vault-001')).toBe(false);
    expect(service.documents().length).toBe(8);
    expect(service.categoryCounts()['lease']).toBe(1);
  });

  it('deleteDocument with unknown id leaves the list intact', () => {
    const before = service.documents();
    service.deleteDocument('does-not-exist');
    expect(service.documents()).toEqual(before);
  });

  it('getByCategory returns a synchronous slice for that category', () => {
    const receipts = service.getByCategory('receipt');
    expect(receipts.length).toBe(3);
    expect(receipts.every(d => d.category === 'receipt')).toBe(true);
  });

  it('getByCategory returns empty array for a category with no docs', () => {
    expect(service.getByCategory('other')).toEqual([]);
  });

  it('loadForUser flips loading and filters seed by ownerId after 300ms', () => {
    jest.useFakeTimers();
    try {
      service.loadForUser('landlord-001');
      expect(service.loading()).toBe(true);
      jest.advanceTimersByTime(300);
      expect(service.loading()).toBe(false);
      expect(service.documents().every(d => d.ownerId === 'landlord-001')).toBe(true);
      expect(service.documents().length).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('loadForUser with unknown ownerId yields an empty list after flush', () => {
    jest.useFakeTimers();
    try {
      service.loadForUser('ghost-user');
      jest.advanceTimersByTime(300);
      expect(service.documents()).toEqual([]);
      expect(service.totalStorageMb()).toBe(0);
      expect(service.categoryCounts()['all']).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('filteredDocuments recomputes when documents change after a delete', () => {
    service.setCategory('lease');
    expect(service.filteredDocuments().length).toBe(2);
    const firstLease = service.filteredDocuments()[0];
    service.deleteDocument(firstLease.id);
    expect(service.filteredDocuments().length).toBe(1);
  });
});
