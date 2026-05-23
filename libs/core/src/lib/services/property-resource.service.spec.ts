import { TestBed } from '@angular/core/testing';
import { MOCK_PROPERTIES, PropertyResourceService } from './property-resource.service';

describe('PropertyResourceService', () => {
  let service: PropertyResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyResourceService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('starts with no selection and no type filter', () => {
    expect(service.selectedId()).toBeNull();
    expect(service.typeFilter()).toBeNull();
  });

  it('exposes a properties resource with reactive status', () => {
    expect(service.properties).toBeDefined();
    expect(['idle', 'loading', 'reloading']).toContain(service.properties.status());
  });

  it('exposes a selectedProperty resource', () => {
    expect(service.selectedProperty).toBeDefined();
    expect(typeof service.selectedProperty.reload).toBe('function');
  });

  it('select(id) updates selectedId signal', () => {
    service.select('p2');
    expect(service.selectedId()).toBe('p2');
  });

  it('select(numeric id) is accepted by the signal', () => {
    service.select(42);
    expect(service.selectedId()).toBe(42);
  });

  it('select(null) clears the selection', () => {
    service.select('p2');
    service.select(null);
    expect(service.selectedId()).toBeNull();
  });

  it('filterByType(type) updates typeFilter signal', () => {
    service.filterByType('apartment');
    expect(service.typeFilter()).toBe('apartment');
  });

  it('filterByType(null) clears the filter', () => {
    service.filterByType('villa');
    service.filterByType(null);
    expect(service.typeFilter()).toBeNull();
  });

  it('reload() invokes the underlying properties resource reload', () => {
    const spy = jest.spyOn(service.properties, 'reload');
    service.reload();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('MOCK_PROPERTIES contains the expected 6 seed properties', () => {
    expect(MOCK_PROPERTIES).toHaveLength(6);
    expect(MOCK_PROPERTIES.map(p => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  });

  it('MOCK_PROPERTIES covers all property types', () => {
    const types = new Set(MOCK_PROPERTIES.map(p => p.type));
    expect(types).toContain('apartment');
    expect(types).toContain('penthouse');
    expect(types).toContain('studio');
    expect(types).toContain('house');
    expect(types).toContain('room');
    expect(types).toContain('villa');
  });

  it('MOCK_PROPERTIES entries all start as not favourited', () => {
    expect(MOCK_PROPERTIES.every(p => p.isFavourited === false)).toBe(true);
  });

  it('MOCK_PROPERTIES entries have positive monthly prices', () => {
    expect(MOCK_PROPERTIES.every(p => p.priceMonthly > 0)).toBe(true);
  });

  it('properties resource loads MOCK_PROPERTIES (no filter) within delay', async () => {
    // Wait past the 400ms mock fetch delay
    await new Promise(r => setTimeout(r, 500));
    expect(service.properties.value()).toHaveLength(6);
    expect(service.properties.status()).toBe('resolved');
  });

  it('changing typeFilter re-fetches the properties resource', async () => {
    await new Promise(r => setTimeout(r, 500));
    expect(service.properties.value()).toHaveLength(6);

    service.filterByType('studio');
    await new Promise(r => setTimeout(r, 500));
    const filtered = service.properties.value() ?? [];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].type).toBe('studio');
  });

  it('selectedProperty resource resolves to null when no id selected', async () => {
    await new Promise(r => setTimeout(r, 350));
    expect(service.selectedProperty.value()).toBeNull();
  });

  it('selecting a known id resolves selectedProperty to the matching record', async () => {
    service.select('p2');
    await new Promise(r => setTimeout(r, 350));
    const detail = service.selectedProperty.value();
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('p2');
    expect(detail?.title).toContain('Penthouse');
  });

  it('selecting an unknown id resolves selectedProperty to null', async () => {
    service.select('does-not-exist');
    await new Promise(r => setTimeout(r, 350));
    expect(service.selectedProperty.value()).toBeNull();
  });
});
