import { Injectable, resource, signal } from '@angular/core';
import { PropertyData } from '../components/property-card/property-card.component';

// ─── Mock data store ──────────────────────────────────────────────────────────
// In production: replace loaderFn with httpResource('/api/properties')
// Angular 21 httpResource example (when API is ready):
//   import { httpResource } from '@angular/common/http';
//   readonly properties = httpResource<PropertyData[]>('/api/properties');
//   readonly detail = httpResource<PropertyData>(() => `/api/properties/${this.selectedId()}`);

export const MOCK_PROPERTIES: PropertyData[] = [
  {
    id: 'p1',
    title: 'Apartamento T2 renovado em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    badges: ['available', 'verified'],
    availableFrom: '1 Abr 2026',
    isFavourited: false,
  },
  {
    id: 'p2',
    title: 'Penthouse com Terraço — Vista Tejo',
    location: 'Mouraria, Lisboa',
    priceMonthly: 3200,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 142,
    type: 'penthouse',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
    badges: ['featured', 'new'],
    availableFrom: '15 Mar 2026',
    isFavourited: false,
  },
  {
    id: 'p3',
    title: 'Estúdio moderno — Metro Intendente',
    location: 'Intendente, Lisboa',
    priceMonthly: 750,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 35,
    type: 'studio',
    badges: ['new'],
    availableFrom: '1 Mar 2026',
    isFavourited: false,
  },
  {
    id: 'p4',
    title: 'Casa T3 com jardim — Cascais',
    location: 'Cascais, Lisboa',
    priceMonthly: 2800,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 165,
    type: 'house',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop',
    badges: ['available', 'verified'],
    availableFrom: '1 Mai 2026',
    isFavourited: false,
  },
  {
    id: 'p5',
    title: 'Quarto em apartamento partilhado — Alfama',
    location: 'Alfama, Lisboa',
    priceMonthly: 480,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 18,
    type: 'room',
    badges: ['available'],
    availableFrom: '15 Mar 2026',
    isFavourited: false,
  },
  {
    id: 'p6',
    title: 'Moradia de Luxo com Piscina — Sintra',
    location: 'Sintra, Lisboa',
    priceMonthly: 5500,
    bedrooms: 5,
    bathrooms: 4,
    areaSqm: 380,
    type: 'villa',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
    badges: ['featured', 'verified'],
    availableFrom: '1 Jun 2026',
    isFavourited: false,
  },
];

// ─── Simulated async fetch ────────────────────────────────────────────────────

/** Simulates a network fetch with configurable delay */
function fetchProperties(filter?: Partial<PropertyData>): Promise<PropertyData[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      let results = [...MOCK_PROPERTIES];
      if (filter?.type) {
        results = results.filter(p => p.type === filter.type);
      }
      resolve(results);
    }, 400); // simulate 400ms network latency
  });
}

function fetchPropertyById(id: string | number): Promise<PropertyData | null> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_PROPERTIES.find(p => p.id === id) ?? null);
    }, 250);
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * PropertyResourceService — Signal-based property data service.
 *
 * Uses Angular's `resource()` API for reactive, Signal-driven data loading.
 * Designed to be swapped for `httpResource()` once the API is available:
 *
 * ```typescript
 * // Future API integration (swap mock for real endpoint):
 * import { httpResource } from '@angular/common/http';
 *
 * readonly properties = httpResource<PropertyData[]>(
 *   () => `/api/properties?type=${this.typeFilter()}`
 * );
 * readonly selectedProperty = httpResource<PropertyData>(
 *   () => this.selectedId() ? `/api/properties/${this.selectedId()}` : undefined
 * );
 * ```
 *
 * Feature flag: `PROPERTY_DETAIL_VIEW`
 *
 * @example
 * ```typescript
 * export class MyComponent {
 *   private svc = inject(PropertyResourceService);
 *   properties = this.svc.properties;
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PropertyResourceService {

  /** Currently selected property id (drives detail resource) */
  readonly selectedId = signal<string | number | null>(null);

  /** Active type filter (drives listings resource) */
  readonly typeFilter = signal<PropertyData['type'] | null>(null);

  /**
   * Reactive property listings resource.
   * Re-fetches automatically whenever `typeFilter` changes.
   *
   * httpResource equivalent (when API ready):
   * `httpResource<PropertyData[]>(() => '/api/properties?type=' + this.typeFilter())`
   */
  readonly properties = resource({
    params: () => ({ type: this.typeFilter() }),
    loader: ({ params }) =>
      fetchProperties(params.type ? { type: params.type } : undefined),
  });

  /**
   * Reactive property detail resource.
   * Re-fetches automatically when `selectedId` changes.
   * Returns undefined when no id is selected.
   *
   * httpResource equivalent (when API ready):
   * `httpResource<PropertyData>(() => this.selectedId() ? '/api/properties/' + this.selectedId() : undefined)`
   */
  readonly selectedProperty = resource({
    params: () => ({ id: this.selectedId() }),
    loader: ({ params }) =>
      params.id ? fetchPropertyById(params.id) : Promise.resolve(null),
  });

  /**
   * Select a property by id to load its detail.
   * @param id Property id, or null to deselect.
   */
  select(id: string | number | null): void {
    this.selectedId.set(id);
  }

  /**
   * Apply a type filter to the listings.
   * @param type Property type to filter by, or null to show all.
   */
  filterByType(type: PropertyData['type'] | null): void {
    this.typeFilter.set(type);
  }

  /** Reload listings (e.g., after a filter change or pull-to-refresh) */
  reload(): void {
    this.properties.reload();
  }
}
