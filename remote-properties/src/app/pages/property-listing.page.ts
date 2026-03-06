import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCardComponent, PropertyData, FilterBarComponent, FilterConfig, FilterValues } from '@israel-ui/core';

// ─── Mock data — replace with httpResource when API is ready ──────

const LISBOARENT_PROPERTIES: PropertyData[] = [
  {
    id: '1',
    title: 'Apartamento T2 renovado em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop',
    badges: ['available', 'verified'],
    availableFrom: '1 Abr 2026',
  },
  {
    id: '2',
    title: 'Penthouse com Terraço — Vista Tejo',
    location: 'Mouraria, Lisboa',
    priceMonthly: 3200,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 142,
    type: 'penthouse',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop',
    badges: ['featured', 'new'],
    availableFrom: '15 Mar 2026',
  },
  {
    id: '3',
    title: 'Estúdio moderno perto do metro',
    location: 'Intendente, Lisboa',
    priceMonthly: 750,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 35,
    type: 'studio',
    badges: ['new'],
    availableFrom: '1 Mar 2026',
  },
  {
    id: '4',
    title: 'T3 Alfama com vista castelo',
    location: 'Alfama, Lisboa',
    priceMonthly: 1900,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 110,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format&fit=crop',
    badges: ['featured'],
    availableFrom: '1 Abr 2026',
  },
  {
    id: '5',
    title: 'Quarto individual em apartamento partilhado',
    location: 'Campo de Ourique, Lisboa',
    priceMonthly: 480,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 18,
    type: 'room',
    badges: ['available'],
    availableFrom: '15 Mar 2026',
  },
  {
    id: '6',
    title: 'Moradia V4 com jardim — Cascais',
    location: 'Cascais',
    priceMonthly: 4500,
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 280,
    type: 'villa',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop',
    badges: ['verified'],
    availableFrom: '1 Mai 2026',
  },
  {
    id: '7',
    title: 'T1 no coração do Chiado',
    location: 'Chiado, Lisboa',
    priceMonthly: 1100,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 52,
    type: 'apartment',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format&fit=crop',
    badges: ['available', 'new'],
    availableFrom: '1 Abr 2026',
  },
  {
    id: '8',
    title: 'Studio equipado — Parque das Nações',
    location: 'Parque das Nações, Lisboa',
    priceMonthly: 900,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 42,
    type: 'studio',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop',
    badges: ['available'],
    availableFrom: '1 Mar 2026',
  },
];

// ─── Filter configs ────────────────────────────────────────────────

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    type: 'text',
    label: 'Pesquisar',
    placeholder: 'Localização, título…',
  },
  {
    key: 'type',
    type: 'select',
    label: 'Tipo',
    placeholder: 'Todos os tipos',
    options: [
      { value: 'apartment', label: 'Apartamento' },
      { value: 'house',     label: 'Casa' },
      { value: 'studio',    label: 'Estúdio' },
      { value: 'room',      label: 'Quarto' },
      { value: 'villa',     label: 'Moradia' },
      { value: 'penthouse', label: 'Penthouse' },
    ],
  },
  {
    key: 'bedrooms',
    type: 'select',
    label: 'Quartos',
    placeholder: 'Qualquer',
    options: [
      { value: '0', label: 'Estúdio' },
      { value: '1', label: 'T1' },
      { value: '2', label: 'T2' },
      { value: '3', label: 'T3' },
      { value: '4', label: 'T4+' },
    ],
  },
  {
    key: 'maxPrice',
    type: 'select',
    label: 'Preço máximo',
    placeholder: 'Sem limite',
    options: [
      { value: '500',  label: 'até 500€' },
      { value: '800',  label: 'até 800€' },
      { value: '1200', label: 'até 1.200€' },
      { value: '2000', label: 'até 2.000€' },
      { value: '3500', label: 'até 3.500€' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────

/**
 * PropertyListingPage — LisboaRent property search and listing page.
 *
 * Uses FilterBar for search/filter controls and renders PropertyCard in a
 * responsive grid. Ready to swap mock data for httpResource when API lands.
 *
 * Feature flag: PROPERTY_LISTING
 */
@Component({
  selector: 'app-property-listing',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent, FilterBarComponent],
  template: `
    <div class="lrp-listing">
      <!-- Header -->
      <header class="lrp-listing__header">
        <h1 class="lrp-listing__headline">
          <span class="material-symbols-outlined">apartment</span>
          Arrendamentos em Lisboa
        </h1>
        <p class="lrp-listing__sub">
          {{ filteredCount() }} propriedades encontradas
          @if (activeFilterCount() > 0) {
            <button class="lrp-listing__clear" (click)="clearFilters()">
              Limpar filtros ({{ activeFilterCount() }})
            </button>
          }
        </p>
      </header>

      <!-- Filter bar -->
      <div class="lrp-listing__filters">
        <iu-filter-bar
          [filters]="filterConfigs"
          (filtersChange)="onFiltersChange($event)"
        />
      </div>

      <!-- Grid -->
      <div class="lrp-listing__grid">
        @for (prop of filteredProperties(); track prop.id) {
          <iu-property-card
            [property]="prop"
            (cardClick)="onCardClick($event)"
            (favouriteToggle)="onFavourite($event)"
          />
        } @empty {
          <div class="lrp-listing__empty">
            <span class="material-symbols-outlined">search_off</span>
            <p>Nenhuma propriedade encontrada com estes filtros.</p>
            <button class="lrp-listing__clear" (click)="clearFilters()">Limpar filtros</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .lrp-listing {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .lrp-listing__header {
      margin-bottom: 20px;
    }

    .lrp-listing__headline {
      font-size: 24px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 6px;

      .material-symbols-outlined { font-size: 28px; color: var(--md-sys-color-primary, #6750a4); }
    }

    .lrp-listing__sub {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lrp-listing__clear {
      background: none;
      border: none;
      color: var(--md-sys-color-primary, #6750a4);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 0;
      text-decoration: underline;
    }

    /* ── Filters ── */
    .lrp-listing__filters {
      margin-bottom: 24px;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 12px;
      padding: 16px;
    }

    /* ── Grid ── */
    .lrp-listing__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* ── Empty ── */
    .lrp-listing__empty {
      grid-column: 1 / -1;
      padding: 64px 24px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #49454f);

      .material-symbols-outlined {
        font-size: 56px;
        display: block;
        margin-bottom: 12px;
        opacity: 0.4;
      }

      p { margin: 0 0 16px; font-size: 15px; }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyListingPage {

  readonly filterConfigs = FILTER_CONFIGS;

  private readonly filterValues = signal<FilterValues>({});

  readonly filteredProperties = computed(() => {
    const filters = this.filterValues();
    return LISBOARENT_PROPERTIES.filter(p => {
      const search = (filters['search'] as string | undefined) ?? '';
      if (search) {
        const haystack = `${p.title} ${p.location}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }

      const type = (filters['type'] as string | undefined) ?? '';
      if (type && p.type !== type) return false;

      const beds = (filters['bedrooms'] as string | undefined) ?? '';
      if (beds) {
        const bedsNum = parseInt(beds, 10);
        if (bedsNum >= 4) {
          if (p.bedrooms < 4) return false;
        } else {
          if (p.bedrooms !== bedsNum) return false;
        }
      }

      const maxPrice = (filters['maxPrice'] as string | undefined) ?? '';
      if (maxPrice && p.priceMonthly > parseInt(maxPrice, 10)) return false;

      return true;
    });
  });

  readonly filteredCount = computed(() => this.filteredProperties().length);

  readonly activeFilterCount = computed(() =>
    Object.values(this.filterValues()).filter(v => v !== '' && v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length
  );

  onFiltersChange(values: FilterValues): void {
    this.filterValues.set(values);
  }

  clearFilters(): void {
    this.filterValues.set({});
  }

  onCardClick(property: PropertyData): void {
    console.log('[LisboaRent] Property clicked:', property.id, property.title);
    // TODO: navigate to property detail when PROPERTY_DETAIL_VIEW is implemented
  }

  onFavourite(event: { property: PropertyData; isFavourited: boolean }): void {
    console.log('[LisboaRent] Favourite toggled:', event.property.id, event.isFavourited);
    // TODO: persist to user favourites via API
  }
}
