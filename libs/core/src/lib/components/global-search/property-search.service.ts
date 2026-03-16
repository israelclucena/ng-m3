import { Injectable, computed, signal } from '@angular/core';
import { PropertyData, PropertyType } from '../property-card/property-card.component';
import { debouncedSignal } from '../../utils/signal-debounce';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Filter criteria for property search */
export interface PropertySearchFilters {
  /** Free-text location query (neighbourhood, city, district) */
  query: string;
  /** Minimum monthly price in EUR (null = no limit) */
  priceMin: number | null;
  /** Maximum monthly price in EUR (null = no limit) */
  priceMax: number | null;
  /** Required bedrooms count (null = any) */
  bedrooms: number | null;
  /** Property type filter (null = any) */
  propertyType: PropertyType | null;
}

/** A lightweight search suggestion (subset of PropertyData) */
export interface PropertySuggestion {
  /** Property id */
  id: string | number;
  /** Display title */
  title: string;
  /** Location string */
  location: string;
  /** Monthly price in EUR */
  priceMonthly: number;
  /** Bedrooms count */
  bedrooms: number;
  /** Property type */
  type: PropertyType;
  /** Hero image URL (optional) */
  imageUrl?: string;
}

/** Search state shape */
export interface PropertySearchState {
  filters: PropertySearchFilters;
  results: PropertySuggestion[];
  isLoading: boolean;
  totalCount: number;
  hasActiveFilters: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROPERTIES: PropertySuggestion[] = [
  { id: '1', title: 'Luminoso T2 no Príncipe Real', location: 'Príncipe Real, Lisboa', priceMonthly: 1800, bedrooms: 2, type: 'apartment' },
  { id: '2', title: 'Estúdio moderno em Alfama', location: 'Alfama, Lisboa', priceMonthly: 900, bedrooms: 0, type: 'studio' },
  { id: '3', title: 'Moradia T3 com jardim em Cascais', location: 'Cascais', priceMonthly: 2500, bedrooms: 3, type: 'house' },
  { id: '4', title: 'Quarto mobilado na Mouraria', location: 'Mouraria, Lisboa', priceMonthly: 550, bedrooms: 1, type: 'room' },
  { id: '5', title: 'Penthouse T4 em Belém', location: 'Belém, Lisboa', priceMonthly: 4200, bedrooms: 4, type: 'penthouse' },
  { id: '6', title: 'Apartamento T1 no Bairro Alto', location: 'Bairro Alto, Lisboa', priceMonthly: 1200, bedrooms: 1, type: 'apartment' },
  { id: '7', title: 'T2 com terraço no Chiado', location: 'Chiado, Lisboa', priceMonthly: 2100, bedrooms: 2, type: 'apartment' },
  { id: '8', title: 'Casa T4 em Sintra', location: 'Sintra', priceMonthly: 2200, bedrooms: 4, type: 'house' },
  { id: '9', title: 'Studio executivo em Santos', location: 'Santos, Lisboa', priceMonthly: 1050, bedrooms: 0, type: 'studio' },
  { id: '10', title: 'Quarto premium no Intendente', location: 'Intendente, Lisboa', priceMonthly: 650, bedrooms: 1, type: 'room' },
];

const DEFAULT_FILTERS: PropertySearchFilters = {
  query: '',
  priceMin: null,
  priceMax: null,
  bedrooms: null,
  propertyType: null,
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * PropertySearchService — Signal-based property search for LisboaRent.
 *
 * Manages search filters and computes filtered results reactively using
 * Angular Signals (no RxJS). Designed to be injected into GlobalSearchComponent
 * and wired into any filter surface (FilterBar, sidebar, AppBar).
 *
 * Feature flag: `GLOBAL_SEARCH`
 *
 * @example
 * ```ts
 * const search = inject(PropertySearchService);
 * search.setQuery('Príncipe Real');
 * const results = search.results(); // computed signal
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PropertySearchService {
  // ─── Private state ──────────────────────────────────────────────────────────

  private readonly _filters = signal<PropertySearchFilters>({ ...DEFAULT_FILTERS });
  private readonly _isLoading = signal(false);
  private readonly _allProperties = signal<PropertySuggestion[]>(MOCK_PROPERTIES);

  /**
   * Debounced version of the text query (300 ms).
   * Derived signals (`results`, `suggestions`) read from this instead of the
   * raw `_filters().query` — prevents excessive re-computation on every keystroke.
   *
   * Sprint-022: signal debounce utility (@see utils/signal-debounce.ts)
   */
  private readonly _rawQuery = computed(() => this._filters().query);
  readonly debouncedQuery = debouncedSignal(this._rawQuery, 300);

  // ─── Public signals ─────────────────────────────────────────────────────────

  /** Current filter state (raw — including un-debounced query for UI binding) */
  readonly filters = this._filters.asReadonly();

  /** Loading state */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Filtered results — computed from the debounced query + other filters.
   * Text search waits 300 ms after the last keystroke before re-filtering;
   * structural filters (price, bedrooms, type) apply immediately.
   */
  readonly results = computed<PropertySuggestion[]>(() => {
    // Use debounced query for text filtering
    const dq = this.debouncedQuery().toLowerCase().trim();
    const f = this._filters();
    const all = this._allProperties();

    return all.filter(p => {
      if (dq && !p.title.toLowerCase().includes(dq) && !p.location.toLowerCase().includes(dq)) {
        return false;
      }
      if (f.priceMin !== null && p.priceMonthly < f.priceMin) return false;
      if (f.priceMax !== null && p.priceMonthly > f.priceMax) return false;
      if (f.bedrooms !== null && p.bedrooms !== f.bedrooms) return false;
      if (f.propertyType !== null && p.type !== f.propertyType) return false;
      return true;
    });
  });

  /** Quick suggestions — top 5 debounced results for the AppBar dropdown */
  readonly suggestions = computed<PropertySuggestion[]>(() =>
    this.results().slice(0, 5)
  );

  /** Total count of matching properties */
  readonly totalCount = computed(() => this.results().length);

  /** Whether any filter is active */
  readonly hasActiveFilters = computed(() => {
    const f = this._filters();
    return (
      f.query !== '' ||
      f.priceMin !== null ||
      f.priceMax !== null ||
      f.bedrooms !== null ||
      f.propertyType !== null
    );
  });

  // ─── Mutators ───────────────────────────────────────────────────────────────

  /**
   * Set the free-text location/title query.
   * @param query Search string
   */
  setQuery(query: string): void {
    this._filters.update(f => ({ ...f, query }));
  }

  /**
   * Set the price range filter.
   * @param min Minimum monthly price in EUR (null to remove)
   * @param max Maximum monthly price in EUR (null to remove)
   */
  setPriceRange(min: number | null, max: number | null): void {
    this._filters.update(f => ({ ...f, priceMin: min, priceMax: max }));
  }

  /**
   * Set the bedrooms filter.
   * @param count Number of bedrooms (null to remove filter)
   */
  setBedrooms(count: number | null): void {
    this._filters.update(f => ({ ...f, bedrooms: count }));
  }

  /**
   * Set the property type filter.
   * @param type Property type (null to remove filter)
   */
  setPropertyType(type: PropertyType | null): void {
    this._filters.update(f => ({ ...f, propertyType: type }));
  }

  /**
   * Apply multiple filters at once.
   * @param partial Partial filter object to merge
   */
  applyFilters(partial: Partial<PropertySearchFilters>): void {
    this._filters.update(f => ({ ...f, ...partial }));
  }

  /** Reset all filters to defaults */
  clearFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
  }

  /**
   * Load properties from external data source.
   * Replaces internal mock data with real property records.
   * @param properties Array of PropertyData to use as the search corpus
   */
  loadProperties(properties: PropertyData[]): void {
    const suggestions: PropertySuggestion[] = properties.map(p => ({
      id: p.id,
      title: p.title,
      location: p.location,
      priceMonthly: p.priceMonthly,
      bedrooms: p.bedrooms,
      type: p.type,
      imageUrl: p.imageUrl,
    }));
    this._allProperties.set(suggestions);
  }
}
