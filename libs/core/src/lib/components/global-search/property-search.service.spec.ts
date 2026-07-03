import { TestBed } from '@angular/core/testing';
import { PropertySearchService } from './property-search.service';
import { PropertyData } from '../property-card/property-card.component';

describe('PropertySearchService', () => {
  let service: PropertySearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PropertySearchService] });
    service = TestBed.inject(PropertySearchService);
  });

  /**
   * Flush the debounce effect + fire the 300ms timer so the debounced query
   * settles. The service debounces the text query via `debouncedSignal`, whose
   * `effect` needs `TestBed.tick()` to run (zoneless) and a fake-timer advance
   * to fire the scheduled setTimeout.
   */
  const settleQuery = () => {
    TestBed.tick(); // run the debounce effect → schedules the timer
    jest.advanceTimersByTime(350); // fire the 300ms debounce
    TestBed.tick(); // propagate the debounced signal write
  };

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with default (empty) filters and no active filters', () => {
    const f = service.filters();
    expect(f.query).toBe('');
    expect(f.priceMin).toBeNull();
    expect(f.priceMax).toBeNull();
    expect(f.bedrooms).toBeNull();
    expect(f.propertyType).toBeNull();
    expect(service.hasActiveFilters()).toBe(false);
  });

  it('returns all mock properties when no filter is applied', () => {
    expect(service.results().length).toBe(10);
    expect(service.totalCount()).toBe(10);
  });

  it('isLoading starts false', () => {
    expect(service.isLoading()).toBe(false);
  });

  // ── Structural filters (apply immediately, no debounce) ─────────────────────

  it('setPriceRange() filters by min price', () => {
    service.setPriceRange(2000, null);
    expect(service.results().every(p => p.priceMonthly >= 2000)).toBe(true);
    expect(service.hasActiveFilters()).toBe(true);
  });

  it('setPriceRange() filters by max price', () => {
    service.setPriceRange(null, 1000);
    expect(service.results().every(p => p.priceMonthly <= 1000)).toBe(true);
  });

  it('setPriceRange() filters by a min+max band', () => {
    service.setPriceRange(1000, 2000);
    expect(
      service.results().every(p => p.priceMonthly >= 1000 && p.priceMonthly <= 2000),
    ).toBe(true);
  });

  it('setBedrooms() filters by exact bedroom count', () => {
    service.setBedrooms(4);
    expect(service.results().every(p => p.bedrooms === 4)).toBe(true);
    expect(service.results().length).toBeGreaterThan(0);
  });

  it('setPropertyType() filters by type', () => {
    service.setPropertyType('studio');
    expect(service.results().every(p => p.type === 'studio')).toBe(true);
  });

  it('applyFilters() merges multiple criteria at once', () => {
    service.applyFilters({ priceMax: 1200, propertyType: 'room' });
    const f = service.filters();
    expect(f.priceMax).toBe(1200);
    expect(f.propertyType).toBe('room');
    expect(service.results().every(p => p.type === 'room' && p.priceMonthly <= 1200)).toBe(
      true,
    );
  });

  it('clearFilters() resets everything to defaults', () => {
    service.setPriceRange(1000, 2000);
    service.setBedrooms(2);
    expect(service.hasActiveFilters()).toBe(true);
    service.clearFilters();
    expect(service.hasActiveFilters()).toBe(false);
    expect(service.results().length).toBe(10);
  });

  // ── Debounced text query ────────────────────────────────────────────────────

  it('setQuery() filters results after the debounce settles', () => {
    jest.useFakeTimers();
    try {
      service.setQuery('Cascais');
      settleQuery();
      const titles = service.results().map(p => p.title);
      expect(titles).toContain('Moradia T3 com jardim em Cascais');
      expect(
        service.results().every(p => /cascais/i.test(p.title) || /cascais/i.test(p.location)),
      ).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('setQuery() matches on location as well as title', () => {
    jest.useFakeTimers();
    try {
      service.setQuery('Alfama');
      settleQuery();
      expect(service.results().length).toBeGreaterThan(0);
      expect(
        service.results().every(p => /alfama/i.test(p.title) || /alfama/i.test(p.location)),
      ).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('query is reflected in hasActiveFilters immediately (raw query)', () => {
    service.setQuery('Lisboa');
    expect(service.hasActiveFilters()).toBe(true);
  });

  // ── suggestions ──────────────────────────────────────────────────────────────

  it('suggestions() returns at most the top 5 results', () => {
    expect(service.suggestions().length).toBe(5);
  });

  it('suggestions() shrinks when filters narrow the result set', () => {
    service.setPropertyType('house');
    expect(service.suggestions().length).toBe(service.results().length);
    expect(service.suggestions().length).toBeLessThanOrEqual(5);
  });

  // ── loadProperties ───────────────────────────────────────────────────────────

  it('loadProperties() replaces the search corpus', () => {
    const custom: PropertyData[] = [
      {
        id: 'x1',
        title: 'Loft único no Porto',
        location: 'Porto',
        priceMonthly: 999,
        bedrooms: 1,
        type: 'apartment',
      } as PropertyData,
    ];
    service.loadProperties(custom);
    expect(service.results().length).toBe(1);
    expect(service.results()[0].title).toBe('Loft único no Porto');
  });

  it('loadProperties() maps PropertyData fields into suggestions', () => {
    const custom: PropertyData[] = [
      {
        id: 'x2',
        title: 'Casa test',
        location: 'Braga',
        priceMonthly: 1500,
        bedrooms: 3,
        type: 'house',
        imageUrl: 'http://img/x2.jpg',
      } as PropertyData,
    ];
    service.loadProperties(custom);
    const s = service.results()[0];
    expect(s.id).toBe('x2');
    expect(s.bedrooms).toBe(3);
    expect(s.imageUrl).toBe('http://img/x2.jpg');
  });
});
