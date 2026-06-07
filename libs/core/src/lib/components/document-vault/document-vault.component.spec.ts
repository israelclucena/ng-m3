import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DocumentVaultComponent } from './document-vault.component';
import {
  DocumentVaultService,
  VaultDocument,
  VaultDocumentCategory,
} from '../../services/document-vault.service';

describe('DocumentVaultComponent', () => {
  let fixture: ComponentFixture<DocumentVaultComponent>;
  let component: DocumentVaultComponent;
  let mockSvc: {
    documents: ReturnType<typeof signal<VaultDocument[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    activeCategory: ReturnType<typeof signal<VaultDocumentCategory | 'all'>>;
    filteredDocuments: ReturnType<typeof signal<VaultDocument[]>>;
    categoryCounts: ReturnType<typeof signal<Record<string, number>>>;
    totalStorageMb: ReturnType<typeof signal<number>>;
    setCategory: jest.Mock;
    deleteDocument: jest.Mock;
    loadForUser: jest.Mock;
    addDocument: jest.Mock;
    getByCategory: jest.Mock;
  };

  const sampleDocs: VaultDocument[] = [
    {
      id: 'd-1',
      ownerId: 'tenant-001',
      propertyId: 'prop-001',
      title: 'Lease Agreement',
      category: 'lease',
      fileType: 'pdf',
      sizeMb: 0.4,
      uploadedAt: '2026-01-01',
      url: '#',
      tags: ['active', 'signed'],
      description: '12-month fixed lease',
    },
    {
      id: 'd-2',
      ownerId: 'tenant-001',
      title: 'ID card',
      category: 'id',
      fileType: 'jpg',
      sizeMb: 0.8,
      uploadedAt: '2026-01-02',
      url: '#',
    },
  ];

  beforeEach(async () => {
    mockSvc = {
      documents: signal<VaultDocument[]>(sampleDocs),
      loading: signal(false),
      error: signal<string | null>(null),
      activeCategory: signal<VaultDocumentCategory | 'all'>('all'),
      filteredDocuments: signal<VaultDocument[]>(sampleDocs),
      categoryCounts: signal<Record<string, number>>({ all: 2, lease: 1, id: 1 }),
      totalStorageMb: signal(1.2),
      setCategory: jest.fn(),
      deleteDocument: jest.fn(),
      loadForUser: jest.fn(),
      addDocument: jest.fn(),
      getByCategory: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentVaultComponent],
      providers: [{ provide: DocumentVaultService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentVaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the full category list including "all"', () => {
    expect(component.categories).toEqual([
      'all', 'lease', 'receipt', 'photo', 'id', 'contract', 'inspection', 'other',
    ]);
  });

  it('does not call loadForUser when ownerId is not provided', () => {
    expect(mockSvc.loadForUser).not.toHaveBeenCalled();
  });

  it('calls loadForUser on init when ownerId is provided', () => {
    const f = TestBed.createComponent(DocumentVaultComponent);
    f.componentInstance.ownerId = 'tenant-001';
    f.detectChanges();
    expect(mockSvc.loadForUser).toHaveBeenCalledWith('tenant-001');
  });

  it('renders one nav button per category', () => {
    const navButtons = fixture.nativeElement.querySelectorAll('.dv-nav-item');
    expect(navButtons.length).toBe(component.categories.length);
  });

  it('marks the active category nav button with the active modifier', () => {
    const activeBtn = fixture.nativeElement.querySelector('.dv-nav-item--active') as HTMLElement;
    expect(activeBtn).toBeTruthy();
    expect(activeBtn.getAttribute('aria-current')).toBe('page');
    expect(activeBtn.textContent).toContain('All Documents');
  });

  it('updates the active button when activeCategory signal changes', () => {
    mockSvc.activeCategory.set('lease');
    fixture.detectChanges();
    const activeBtn = fixture.nativeElement.querySelector('.dv-nav-item--active') as HTMLElement;
    expect(activeBtn.textContent).toContain('Leases');
  });

  it('renders category counts when present in categoryCounts', () => {
    const counts = fixture.nativeElement.querySelectorAll('.dv-nav-count');
    // 'all' -> 2, 'lease' -> 1, 'id' -> 1
    expect(counts.length).toBe(3);
  });

  it('clicking a nav button calls svc.setCategory with that category', () => {
    const navButtons = fixture.nativeElement.querySelectorAll('.dv-nav-item');
    // index 1 = 'lease'
    (navButtons[1] as HTMLButtonElement).click();
    expect(mockSvc.setCategory).toHaveBeenCalledWith('lease');
  });

  it('renders the storage indicator with totalStorageMb', () => {
    const storage = fixture.nativeElement.querySelector('.dv-storage-info') as HTMLElement;
    expect(storage.textContent).toContain('1.2');
    expect(storage.textContent).toContain('100 MB');
  });

  it('sets storage bar width based on totalStorageMb percent', () => {
    mockSvc.totalStorageMb.set(25);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.dv-storage-fill') as HTMLElement;
    expect(fill.style.width).toBe('25%');
  });

  it('caps storage bar width at 100% when usage exceeds capacity', () => {
    mockSvc.totalStorageMb.set(250);
    fixture.detectChanges();
    const fill = fixture.nativeElement.querySelector('.dv-storage-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('renders the main title and document count', () => {
    const title = fixture.nativeElement.querySelector('.dv-main-title') as HTMLElement;
    const count = fixture.nativeElement.querySelector('.dv-doc-count') as HTMLElement;
    expect(title.textContent?.trim()).toBe('All Documents');
    expect(count.textContent?.trim()).toBe('2 documents');
  });

  it('uses singular "document" when only one is shown', () => {
    mockSvc.filteredDocuments.set([sampleDocs[0]]);
    fixture.detectChanges();
    const count = fixture.nativeElement.querySelector('.dv-doc-count') as HTMLElement;
    expect(count.textContent?.trim()).toBe('1 document');
  });

  it('renders a card per document with title, file type, and size', () => {
    const cards = fixture.nativeElement.querySelectorAll('.dv-doc-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Lease Agreement');
    expect(cards[0].textContent).toContain('PDF');
    expect(cards[0].textContent).toContain('0.4');
  });

  it('renders tags when document has them', () => {
    const firstCard = fixture.nativeElement.querySelectorAll('.dv-doc-card')[0];
    const tags = firstCard.querySelectorAll('.dv-tag');
    expect(tags.length).toBe(2);
    expect(tags[0].textContent?.trim()).toBe('active');
  });

  it('renders the description when provided', () => {
    const firstCard = fixture.nativeElement.querySelectorAll('.dv-doc-card')[0];
    const desc = firstCard.querySelector('.dv-doc-desc') as HTMLElement;
    expect(desc).toBeTruthy();
    expect(desc.textContent?.trim()).toBe('12-month fixed lease');
  });

  it('shows the loading state when svc.loading is true', () => {
    mockSvc.loading.set(true);
    fixture.detectChanges();
    const state = fixture.nativeElement.querySelector('.dv-state') as HTMLElement;
    expect(state).toBeTruthy();
    expect(state.textContent).toContain('Loading documents');
    expect(fixture.nativeElement.querySelector('.dv-list')).toBeNull();
  });

  it('shows the empty state when filteredDocuments is empty and not loading', () => {
    mockSvc.filteredDocuments.set([]);
    fixture.detectChanges();
    const state = fixture.nativeElement.querySelector('.dv-state') as HTMLElement;
    expect(state).toBeTruthy();
    expect(state.textContent).toContain('No documents in this category yet');
  });

  it('clicking the upload button logs the upload intent', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const uploadBtn = fixture.nativeElement.querySelector('.dv-upload-btn') as HTMLButtonElement;
    uploadBtn.click();
    expect(spy).toHaveBeenCalledWith('[DocumentVault] trigger upload flow');
    spy.mockRestore();
  });

  it('clicking the download action button logs the download for that doc', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const downloadBtn = fixture.nativeElement.querySelector(
      '.dv-doc-card .dv-action-btn:not(.dv-action-delete)',
    ) as HTMLButtonElement;
    downloadBtn.click();
    expect(spy).toHaveBeenCalledWith('[DocumentVault] download:', 'Lease Agreement', '#');
    spy.mockRestore();
  });

  it('clicking the delete action button calls svc.deleteDocument with the doc id', () => {
    const deleteBtn = fixture.nativeElement.querySelector(
      '.dv-doc-card .dv-action-delete',
    ) as HTMLButtonElement;
    deleteBtn.click();
    expect(mockSvc.deleteDocument).toHaveBeenCalledWith('d-1');
  });

  it('formats category labels: "all" -> All Documents, "id" -> Identity, others -> plural', () => {
    // 'all' already visible
    expect(fixture.nativeElement.textContent).toContain('All Documents');
    expect(fixture.nativeElement.textContent).toContain('Identity');
    expect(fixture.nativeElement.textContent).toContain('Leases');
    expect(fixture.nativeElement.textContent).toContain('Receipts');
  });

  it('falls back to "attach_file" icon for unknown file types', () => {
    mockSvc.filteredDocuments.set([
      { ...sampleDocs[0], fileType: 'xyz' },
    ]);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.dv-doc-icon') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('attach_file');
  });

  it('uses the correct icon for known file types (jpg -> image)', () => {
    mockSvc.filteredDocuments.set([sampleDocs[1]]);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.dv-doc-icon') as HTMLElement;
    expect(icon.textContent?.trim()).toBe('image');
  });
});
