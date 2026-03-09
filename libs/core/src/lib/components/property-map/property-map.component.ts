import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import type { PropertyData } from '../property-card/property-card.component';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A property pin rendered on the map.
 */
export interface PropertyMapMarker {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
  /** Associated property data */
  property: PropertyData;
}

/**
 * Map centre configuration.
 */
export interface MapCenter {
  lat: number;
  lng: number;
  zoom?: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** Default centre: Lisboa city centre */
const LISBON_CENTER: MapCenter = { lat: 38.7223, lng: -9.1393, zoom: 12 };

/** M3 primary colour for custom marker */
const MARKER_COLOR = '#6750A4';
const MARKER_SELECTED_COLOR = '#B5264D';

// ─── Icon factory ─────────────────────────────────────────────────────────────

function createMarkerIcon(color: string, price: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div class="iu-map-pin" style="--pin-color: ${color}">
        <span class="iu-map-pin__price">€${price >= 1000 ? (price / 1000).toFixed(1) + 'k' : price}</span>
        <svg class="iu-map-pin__arrow" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 6 L0 0 L10 0 Z"/>
        </svg>
      </div>`,
    iconSize: [72, 36],
    iconAnchor: [36, 36],
    popupAnchor: [0, -40],
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PropertyMap — Interactive Leaflet map for LisboaRent property listings.
 *
 * Uses OpenStreetMap tiles (no API key required). Renders price-bubble markers
 * with M3 colour tokens. Supports marker click selection and optional filtering.
 *
 * Feature flag: `PROPERTY_MAP`
 *
 * @example
 * ```html
 * <iu-property-map
 *   [markers]="mapMarkers"
 *   [center]="{ lat: 38.72, lng: -9.14, zoom: 13 }"
 *   (markerClick)="onPropertySelect($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-property-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .iu-property-map {
      position: relative;
      width: 100%;
      height: 480px;
      border-radius: var(--md-sys-shape-corner-large, 16px);
      overflow: hidden;
      border: 1px solid var(--md-sys-color-outline-variant, #CAC4D0);
    }

    .iu-property-map__container {
      width: 100%;
      height: 100%;
    }

    .iu-property-map__empty {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      font-family: var(--md-sys-typescale-body-large-font, Roboto, sans-serif);
      background: var(--md-sys-color-surface-variant, #E7E0EC);
      pointer-events: none;
    }

    .iu-property-map__empty-icon {
      font-size: 48px;
      opacity: .5;
    }

    .iu-property-map__count-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 1000;
      background: var(--md-sys-color-primary-container, #EADDFF);
      color: var(--md-sys-color-on-primary-container, #21005D);
      border-radius: var(--md-sys-shape-corner-full, 50px);
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--md-sys-typescale-label-medium-font, Roboto, sans-serif);
      box-shadow: var(--md-sys-elevation-level1, 0 1px 2px rgba(0,0,0,.3));
    }

    /* ── Marker pin ── */
    .iu-map-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,.35));
      transition: transform 150ms cubic-bezier(.2,0,0,1);
    }

    .iu-map-pin:hover { transform: scale(1.08); }

    .iu-map-pin__price {
      background: var(--pin-color, #6750A4);
      color: #fff;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      font-family: Roboto, sans-serif;
      white-space: nowrap;
      line-height: 1;
    }

    .iu-map-pin__arrow {
      width: 10px;
      height: 6px;
      fill: var(--pin-color, #6750A4);
      margin-top: -1px;
    }

    /* ── Popup ── */
    .leaflet-popup-content-wrapper {
      border-radius: var(--md-sys-shape-corner-medium, 12px) !important;
      box-shadow: var(--md-sys-elevation-level2, 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15)) !important;
      padding: 0 !important;
      overflow: hidden;
    }

    .leaflet-popup-content {
      margin: 0 !important;
      width: auto !important;
    }

    .iu-map-popup {
      width: 220px;
      padding: 12px;
      font-family: Roboto, sans-serif;
    }

    .iu-map-popup__img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 8px;
      background: var(--md-sys-color-surface-variant, #E7E0EC);
      display: block;
    }

    .iu-map-popup__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1C1B1F);
      margin: 0 0 4px;
      line-height: 1.3;
    }

    .iu-map-popup__location {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
      margin: 0 0 8px;
    }

    .iu-map-popup__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .iu-map-popup__price {
      font-size: 15px;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750A4);
    }

    .iu-map-popup__meta {
      font-size: 10px;
      color: var(--md-sys-color-on-surface-variant, #49454F);
    }
  `],
  template: `
    <div class="iu-property-map" [style.height]="height()">
      <!-- Map container -->
      <div #mapContainer class="iu-property-map__container"></div>

      <!-- Count badge -->
      @if (markers().length > 0) {
        <div class="iu-property-map__count-badge">
          {{ markers().length }} {{ markers().length === 1 ? 'imóvel' : 'imóveis' }}
        </div>
      }

      <!-- Empty state overlay -->
      @if (markers().length === 0) {
        <div class="iu-property-map__empty">
          <span class="iu-property-map__empty-icon">🗺️</span>
          <span>Nenhum imóvel para mostrar</span>
        </div>
      }
    </div>
  `,
})
export class PropertyMapComponent implements OnDestroy {

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** Property markers to render on the map */
  readonly markers = input<PropertyMapMarker[]>([]);

  /** Map centre and zoom level */
  readonly center = input<MapCenter>(LISBON_CENTER);

  /** Map height (CSS value) */
  readonly height = input<string>('480px');

  /** Whether to auto-fit bounds to show all markers */
  readonly fitBounds = input<boolean>(true);

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when a marker is clicked */
  readonly markerClick = output<PropertyData>();

  /** Emitted when the selected marker changes */
  readonly selectionChange = output<PropertyMapMarker | null>();

  // ── Internal state ──────────────────────────────────────────────────────────

  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private map: L.Map | null = null;
  private leafletMarkers = new Map<string | number, L.Marker>();
  readonly selectedId = signal<string | number | null>(null);

  constructor() {
    // Initialize map after view is ready
    effect(() => {
      const container = this.mapContainer();
      if (container && !this.map) {
        this._initMap(container.nativeElement);
      }
    });

    // Sync markers whenever input changes
    effect(() => {
      const markers = this.markers();
      if (this.map) {
        this._syncMarkers(markers);
      }
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private _initMap(el: HTMLDivElement): void {
    const c = this.center();
    this.map = L.map(el, {
      center: [c.lat, c.lng],
      zoom: c.zoom ?? 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Render initial markers if already provided
    const markers = this.markers();
    if (markers.length > 0) {
      this._syncMarkers(markers);
    }
  }

  private _syncMarkers(markers: PropertyMapMarker[]): void {
    if (!this.map) return;

    // Remove stale markers
    const incomingIds = new Set(markers.map(m => m.property.id));
    for (const [id, marker] of this.leafletMarkers) {
      if (!incomingIds.has(id)) {
        marker.remove();
        this.leafletMarkers.delete(id);
      }
    }

    // Add / update markers
    const latLngs: L.LatLng[] = [];
    for (const m of markers) {
      const ll = L.latLng(m.lat, m.lng);
      latLngs.push(ll);

      if (!this.leafletMarkers.has(m.property.id)) {
        const isSelected = this.selectedId() === m.property.id;
        const icon = createMarkerIcon(
          isSelected ? MARKER_SELECTED_COLOR : MARKER_COLOR,
          m.property.priceMonthly,
        );
        const leafletMarker = L.marker(ll, { icon })
          .bindPopup(this._buildPopupHtml(m.property), { maxWidth: 240 })
          .on('click', () => this._onMarkerClick(m));

        leafletMarker.addTo(this.map!);
        this.leafletMarkers.set(m.property.id, leafletMarker);
      }
    }

    // Auto-fit bounds
    if (this.fitBounds() && latLngs.length > 1) {
      this.map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
    } else if (latLngs.length === 1) {
      this.map.setView(latLngs[0], 14);
    }
  }

  private _onMarkerClick(m: PropertyMapMarker): void {
    this.selectedId.set(m.property.id);
    this.markerClick.emit(m.property);
    this.selectionChange.emit(m);

    // Update icon colours
    for (const [id, leafletMarker] of this.leafletMarkers) {
      const marker = this.markers().find(mk => mk.property.id === id);
      if (marker) {
        const isSelected = id === m.property.id;
        leafletMarker.setIcon(createMarkerIcon(
          isSelected ? MARKER_SELECTED_COLOR : MARKER_COLOR,
          marker.property.priceMonthly,
        ));
      }
    }
  }

  private _buildPopupHtml(p: PropertyData): string {
    const bedroomText = p.bedrooms === 0 ? 'Estúdio' : `T${p.bedrooms}`;
    const imgHtml = p.imageUrl
      ? `<img class="iu-map-popup__img" src="${p.imageUrl}" alt="${p.title}" loading="lazy" />`
      : '';
    return `
      <div class="iu-map-popup">
        ${imgHtml}
        <p class="iu-map-popup__title">${p.title}</p>
        <p class="iu-map-popup__location">📍 ${p.location}</p>
        <div class="iu-map-popup__footer">
          <span class="iu-map-popup__price">€${p.priceMonthly.toLocaleString('pt-PT')}/mês</span>
          <span class="iu-map-popup__meta">${bedroomText} · ${p.areaSqm}m²</span>
        </div>
      </div>`;
  }
}

// ─── Re-export mock data with coordinates ─────────────────────────────────────

/**
 * Mock property map markers for Lisboa (used in stories & dashboard demo).
 * Coordinates are approximate district centroids.
 */
export const MOCK_MAP_MARKERS: PropertyMapMarker[] = [
  { lat: 38.7160, lng: -9.1490, property: { id: 'p1', title: 'Apartamento T2 renovado em Príncipe Real', location: 'Príncipe Real, Lisboa', priceMonthly: 1450, bedrooms: 2, bathrooms: 1, areaSqm: 78, type: 'apartment', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop', badges: ['available', 'verified'], availableFrom: '1 Abr 2026', isFavourited: false } },
  { lat: 38.7159, lng: -9.1312, property: { id: 'p2', title: 'Penthouse com Terraço — Vista Tejo', location: 'Mouraria, Lisboa', priceMonthly: 3200, bedrooms: 3, bathrooms: 2, areaSqm: 142, type: 'penthouse', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&auto=format&fit=crop', badges: ['featured', 'new'], availableFrom: '15 Mar 2026', isFavourited: false } },
  { lat: 38.7208, lng: -9.1355, property: { id: 'p3', title: 'Estúdio moderno — Metro Intendente', location: 'Intendente, Lisboa', priceMonthly: 750, bedrooms: 0, bathrooms: 1, areaSqm: 35, type: 'studio', badges: ['new'], availableFrom: '1 Mar 2026', isFavourited: false } },
  { lat: 38.6979, lng: -9.4215, property: { id: 'p4', title: 'Casa T3 com jardim — Cascais', location: 'Cascais, Lisboa', priceMonthly: 2800, bedrooms: 3, bathrooms: 2, areaSqm: 165, type: 'house', imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&auto=format&fit=crop', badges: ['available', 'verified'], availableFrom: '1 Mai 2026', isFavourited: false } },
  { lat: 38.7110, lng: -9.1283, property: { id: 'p5', title: 'Quarto em apartamento partilhado — Alfama', location: 'Alfama, Lisboa', priceMonthly: 480, bedrooms: 1, bathrooms: 1, areaSqm: 18, type: 'room', badges: ['available'], availableFrom: '15 Mar 2026', isFavourited: false } },
  { lat: 38.7978, lng: -9.3888, property: { id: 'p6', title: 'Moradia de Luxo com Piscina — Sintra', location: 'Sintra, Lisboa', priceMonthly: 5500, bedrooms: 5, bathrooms: 4, areaSqm: 380, type: 'villa', imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&auto=format&fit=crop', badges: ['featured', 'verified'], availableFrom: '1 Jun 2026', isFavourited: false } },
];
