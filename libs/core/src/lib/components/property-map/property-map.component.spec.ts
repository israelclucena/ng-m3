import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import {
  PropertyMapComponent,
  MOCK_MAP_MARKERS,
  type PropertyMapMarker,
} from './property-map.component';
import type { PropertyData } from '../property-card/property-card.component';

// ── Leaflet mock ──────────────────────────────────────────────────────────────
// jsdom can't drive a real Leaflet map, so we stub the module and assert that the
// component drives it correctly (map creation, marker add/remove, fit/setView).

jest.mock('leaflet', () => {
  const mapMock = {
    addTo: jest.fn(function (this: unknown) { return this; }),
    remove: jest.fn(),
    fitBounds: jest.fn(),
    setView: jest.fn(),
  };
  const store: { markers: Array<Record<string, jest.Mock>>; mapMock: typeof mapMock } = {
    markers: [],
    mapMock,
  };
  return {
    __store: store,
    map: jest.fn(() => mapMock),
    tileLayer: jest.fn(() => ({ addTo: jest.fn(() => mapMock) })),
    marker: jest.fn(() => {
      const m = {
        bindPopup: jest.fn(function (this: unknown) { return this; }),
        on: jest.fn(function (this: unknown) { return this; }),
        addTo: jest.fn(function (this: unknown) { return this; }),
        setIcon: jest.fn(),
        remove: jest.fn(),
      };
      store.markers.push(m);
      return m;
    }),
    divIcon: jest.fn(() => ({ _divIcon: true })),
    latLng: jest.fn((lat: number, lng: number) => ({ lat, lng })),
    latLngBounds: jest.fn((lls: unknown) => ({ _bounds: lls })),
  };
});

/** Typed accessor for the mock's capture store. */
function store(): { markers: Array<Record<string, jest.Mock>>; mapMock: Record<string, jest.Mock> } {
  return (L as unknown as { __store: { markers: Array<Record<string, jest.Mock>>; mapMock: Record<string, jest.Mock> } }).__store;
}

/** Build a property, overridable per test. */
function property(over: Partial<PropertyData> = {}): PropertyData {
  return {
    id: 'p1',
    title: 'T2 em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    badges: [],
    isFavourited: false,
    ...over,
  } as PropertyData;
}

/** Build a map marker around a property. */
function marker(over: Partial<PropertyData> = {}, lat = 38.72, lng = -9.14): PropertyMapMarker {
  return { lat, lng, property: property(over) };
}

describe('PropertyMapComponent', () => {
  let fixture: ComponentFixture<PropertyMapComponent>;
  let component: PropertyMapComponent;

  /** Call a method on the component without leaking `any`. */
  function call<T = unknown>(name: string, ...args: unknown[]): T {
    return (component as unknown as Record<string, (...a: unknown[]) => T>)[name](...args);
  }

  /**
   * Drain the microtask queue. The component lazy-loads Leaflet via a dynamic
   * `import('leaflet')` (added to fix the SSR prerender window crash), so map
   * creation happens on a later microtask — not synchronously inside
   * `detectChanges()`.
   */
  async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  }

  /**
   * Set the `markers` input, run change detection, and await the async Leaflet
   * lazy-load so the map (and any initial markers) exist before assertions.
   */
  async function ready(markers: PropertyMapMarker[]): Promise<void> {
    fixture.componentRef.setInput('markers', markers);
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();
    await flushMicrotasks();
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    store().markers.length = 0;

    await TestBed.configureTestingModule({
      imports: [PropertyMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyMapComponent);
    component = fixture.componentInstance;
  });

  // ── mock data export ────────────────────────────────────────────────────────────

  it('exports six well-formed mock markers', () => {
    expect(MOCK_MAP_MARKERS).toHaveLength(6);
    for (const m of MOCK_MAP_MARKERS) {
      expect(typeof m.lat).toBe('number');
      expect(typeof m.lng).toBe('number');
      expect(m.property.id).toBeTruthy();
    }
  });

  // ── map lifecycle ────────────────────────────────────────────────────────────────

  it('creates a Leaflet map and tile layer once the view is ready', async () => {
    await ready([]);
    expect(L.map).toHaveBeenCalledTimes(1);
    expect(L.tileLayer).toHaveBeenCalled();
  });

  it('renders one Leaflet marker per input marker', async () => {
    await ready([marker({ id: 'p1' }), marker({ id: 'p2' }, 38.73, -9.12)]);
    expect(L.marker).toHaveBeenCalledTimes(2);
  });

  it('adds no markers for an empty input', async () => {
    await ready([]);
    expect(L.marker).not.toHaveBeenCalled();
  });

  it('fits bounds when there is more than one marker', async () => {
    await ready([marker({ id: 'p1' }), marker({ id: 'p2' }, 38.73, -9.12)]);
    expect(store().mapMock['fitBounds']).toHaveBeenCalled();
  });

  it('centres on the single marker instead of fitting bounds', async () => {
    await ready([marker({ id: 'p1' })]);
    expect(store().mapMock['setView']).toHaveBeenCalled();
    expect(store().mapMock['fitBounds']).not.toHaveBeenCalled();
  });

  it('removes stale Leaflet markers no longer in the input', async () => {
    await ready([marker({ id: 'p1' }), marker({ id: 'p2' }, 38.73, -9.12)]);
    const first = store().markers[0];

    fixture.componentRef.setInput('markers', [marker({ id: 'p2' }, 38.73, -9.12)]);
    fixture.detectChanges();
    await flushMicrotasks();
    expect(first['remove']).toHaveBeenCalled();
  });

  it('tears the map down on destroy', async () => {
    await ready([]);
    fixture.destroy();
    expect(store().mapMock['remove']).toHaveBeenCalled();
  });

  // ── selection ────────────────────────────────────────────────────────────────────

  it('selects a marker and emits both outputs on click', () => {
    fixture.componentRef.setInput('markers', [marker({ id: 'p1' })]);
    fixture.detectChanges();

    const clicked: PropertyData[] = [];
    const selected: Array<PropertyMapMarker | null> = [];
    component.markerClick.subscribe((p) => clicked.push(p));
    component.selectionChange.subscribe((m) => selected.push(m));

    const m = marker({ id: 'p1' });
    call('_onMarkerClick', m);

    expect(component.selectedId()).toBe('p1');
    expect(clicked[0].id).toBe('p1');
    expect(selected[0]).toBe(m);
  });

  // ── popup html ─────────────────────────────────────────────────────────────────

  it('labels a zero-bedroom property as a studio in the popup', () => {
    const html = call<string>('_buildPopupHtml', property({ bedrooms: 0 }));
    expect(html).toContain('Estúdio');
  });

  it('labels a multi-bedroom property as Tn and shows its price', () => {
    const html = call<string>('_buildPopupHtml', property({ bedrooms: 3, priceMonthly: 2800 }));
    expect(html).toContain('T3');
    expect(html).toContain('2');
  });
});
