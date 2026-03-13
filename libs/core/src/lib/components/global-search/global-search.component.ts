import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertySearchService, PropertySuggestion } from './property-search.service';
import { PropertyType } from '../property-card/property-card.component';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Emitted when user selects a suggestion */
export interface GlobalSearchSelectEvent {
  /** Selected property suggestion */
  suggestion: PropertySuggestion;
}

/** Emitted when user submits a full search (Enter key or Search button) */
export interface GlobalSearchSubmitEvent {
  /** Current query string */
  query: string;
  /** Total matching count */
  count: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * GlobalSearch — LisboaRent AppBar-integrated property search.
 *
 * Expandable search bar that integrates with `PropertySearchService`.
 * Shows live suggestions (top 5) as a dropdown with property type icon,
 * price, and location. Supports keyboard navigation (↑↓ Enter Escape).
 *
 * Feature flag: `GLOBAL_SEARCH`
 *
 * @example
 * ```html
 * <iu-global-search
 *   placeholder="Pesquisar propriedades…"
 *   (select)="onPropertySelect($event)"
 *   (search)="onSearch($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-global-search',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="iu-global-search"
      [class.iu-global-search--expanded]="isExpanded()"
      [class.iu-global-search--has-results]="showSuggestions()"
    >
      <!-- Search field -->
      <div class="iu-global-search__field" (click)="expand()">
        <span class="material-symbols-outlined iu-global-search__icon">search</span>
        <input
          #searchInput
          class="iu-global-search__input"
          type="text"
          [placeholder]="placeholder()"
          [value]="query()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (keydown)="onKeydown($event)"
          autocomplete="off"
          aria-label="Pesquisar propriedades"
          aria-autocomplete="list"
          [attr.aria-expanded]="showSuggestions()"
        />
        @if (query()) {
          <button
            class="iu-global-search__clear"
            (click)="clear($event)"
            aria-label="Limpar pesquisa"
            type="button"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        }
        @if (isExpanded() && !query()) {
          <button
            class="iu-global-search__collapse"
            (click)="collapse($event)"
            aria-label="Fechar pesquisa"
            type="button"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        }
      </div>

      <!-- Suggestions dropdown -->
      @if (showSuggestions()) {
        <div class="iu-global-search__dropdown" role="listbox">
          <!-- Results -->
          @for (suggestion of suggestions(); track suggestion.id; let i = $index) {
            <button
              class="iu-global-search__suggestion"
              [class.iu-global-search__suggestion--active]="activeIndex() === i"
              role="option"
              [attr.aria-selected]="activeIndex() === i"
              (click)="selectSuggestion(suggestion)"
              (mouseenter)="activeIndex.set(i)"
              type="button"
            >
              <span class="iu-global-search__suggestion-icon material-symbols-outlined">
                {{ typeIcon(suggestion.type) }}
              </span>
              <div class="iu-global-search__suggestion-content">
                <span class="iu-global-search__suggestion-title">{{ suggestion.title }}</span>
                <span class="iu-global-search__suggestion-meta">
                  <span class="iu-global-search__suggestion-location">
                    <span class="material-symbols-outlined">location_on</span>
                    {{ suggestion.location }}
                  </span>
                  <span class="iu-global-search__suggestion-price">
                    {{ suggestion.priceMonthly | currency:'EUR':'symbol':'1.0-0' }}/mês
                  </span>
                </span>
              </div>
              <span class="iu-global-search__suggestion-beds">
                <span class="material-symbols-outlined">bed</span>
                {{ suggestion.bedrooms === 0 ? 'Studio' : suggestion.bedrooms + 'Q' }}
              </span>
            </button>
          }

          <!-- Footer with total count -->
          @if (totalCount() > 5) {
            <button
              class="iu-global-search__view-all"
              (click)="submitSearch()"
              type="button"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
              Ver todos os {{ totalCount() }} resultados para "{{ query() }}"
            </button>
          }

          <!-- Empty state -->
          @if (suggestions().length === 0) {
            <div class="iu-global-search__empty">
              <span class="material-symbols-outlined">search_off</span>
              <span>Nenhuma propriedade encontrada para "{{ query() }}"</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .iu-global-search {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 240px;
      transition: width 300ms var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    }

    .iu-global-search--expanded {
      width: 480px;
    }

    /* ── Field ── */
    .iu-global-search__field {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 12px;
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-radius: 20px;
      border: 1.5px solid transparent;
      cursor: text;
      transition: background 200ms, border-color 200ms, border-radius 200ms;
    }

    .iu-global-search--has-results .iu-global-search__field {
      border-radius: 20px 20px 0 0;
      border-color: var(--md-sys-color-outline, #79747e);
      border-bottom-color: transparent;
    }

    .iu-global-search__field:focus-within {
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
      border-color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-global-search--has-results .iu-global-search__field:focus-within {
      border-bottom-color: transparent;
    }

    .iu-global-search__icon {
      font-size: 20px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }

    .iu-global-search__input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-family: var(--md-sys-typescale-body-large-font, Roboto, sans-serif);
      font-size: 16px;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      min-width: 0;
    }

    .iu-global-search__input::placeholder {
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-global-search__clear,
    .iu-global-search__collapse {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      transition: background 150ms;
      flex-shrink: 0;
    }

    .iu-global-search__clear:hover,
    .iu-global-search__collapse:hover {
      background: var(--md-sys-color-surface-container, #f3edf7);
    }

    .iu-global-search__clear .material-symbols-outlined,
    .iu-global-search__collapse .material-symbols-outlined {
      font-size: 18px;
    }

    /* ── Dropdown ── */
    .iu-global-search__dropdown {
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      border: 1.5px solid var(--md-sys-color-outline, #79747e);
      border-top: none;
      border-radius: 0 0 16px 16px;
      overflow: hidden;
      box-shadow: var(--md-sys-elevation-2,
        0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15));
      z-index: 1000;
    }

    /* ── Suggestions ── */
    .iu-global-search__suggestion {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background 100ms;
    }

    .iu-global-search__suggestion:hover,
    .iu-global-search__suggestion--active {
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
    }

    .iu-global-search__suggestion-icon {
      font-size: 20px;
      color: var(--md-sys-color-primary, #6750a4);
      flex-shrink: 0;
    }

    .iu-global-search__suggestion-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .iu-global-search__suggestion-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .iu-global-search__suggestion-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .iu-global-search__suggestion-location {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .iu-global-search__suggestion-location .material-symbols-outlined {
      font-size: 14px;
    }

    .iu-global-search__suggestion-price {
      font-size: 12px;
      font-weight: 600;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .iu-global-search__suggestion-beds {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      flex-shrink: 0;
    }

    .iu-global-search__suggestion-beds .material-symbols-outlined {
      font-size: 14px;
    }

    /* ── View all ── */
    .iu-global-search__view-all {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      border-top: 1px solid var(--md-sys-color-surface-variant, #e7e0ec);
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--md-sys-color-primary, #6750a4);
      text-align: left;
      transition: background 100ms;
    }

    .iu-global-search__view-all:hover {
      background: var(--md-sys-color-surface-container-highest, #e6e0e9);
    }

    .iu-global-search__view-all .material-symbols-outlined {
      font-size: 18px;
    }

    /* ── Empty state ── */
    .iu-global-search__empty {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 13px;
    }

    .iu-global-search__empty .material-symbols-outlined {
      font-size: 20px;
    }
  `],
})
export class GlobalSearchComponent implements OnDestroy {
  private readonly searchService = inject(PropertySearchService);
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private _outsideClickHandler: (() => void) | null = null;

  // ─── Inputs ─────────────────────────────────────────────────────────────────

  /** Input placeholder text */
  readonly placeholder = input('Pesquisar propriedades…');

  // ─── Outputs ────────────────────────────────────────────────────────────────

  /** Emitted when the user selects a suggestion from the dropdown */
  readonly select = output<GlobalSearchSelectEvent>();

  /** Emitted when the user submits a full search (Enter / view-all button) */
  readonly search = output<GlobalSearchSubmitEvent>();

  // ─── Internal state ─────────────────────────────────────────────────────────

  readonly isExpanded = signal(false);
  readonly showDropdown = signal(false);
  readonly activeIndex = signal(-1);

  // ─── Derived ────────────────────────────────────────────────────────────────

  readonly query = computed(() => this.searchService.filters().query);
  readonly suggestions = this.searchService.suggestions;
  readonly totalCount = this.searchService.totalCount;

  readonly showSuggestions = computed(() =>
    this.showDropdown() && this.query().length > 0
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  expand(): void {
    this.isExpanded.set(true);
    setTimeout(() => this.searchInputRef()?.nativeElement.focus(), 50);
    this._listenOutsideClick();
  }

  collapse(event: Event): void {
    event.stopPropagation();
    this.isExpanded.set(false);
    this.showDropdown.set(false);
    this.searchService.clearFilters();
    this._removeOutsideClick();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.searchService.setQuery('');
    this.showDropdown.set(false);
    this.activeIndex.set(-1);
    this.searchInputRef()?.nativeElement.focus();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchService.setQuery(value);
    this.showDropdown.set(true);
    this.activeIndex.set(-1);
  }

  onFocus(): void {
    this.isExpanded.set(true);
    if (this.query()) {
      this.showDropdown.set(true);
    }
    this._listenOutsideClick();
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.suggestions();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.activeIndex();
        if (idx >= 0 && items[idx]) {
          this.selectSuggestion(items[idx]);
        } else {
          this.submitSearch();
        }
        break;
      case 'Escape':
        this.showDropdown.set(false);
        this.isExpanded.set(false);
        this.searchService.clearFilters();
        (event.target as HTMLInputElement).blur();
        break;
    }
  }

  selectSuggestion(suggestion: PropertySuggestion): void {
    this.searchService.setQuery(suggestion.title);
    this.showDropdown.set(false);
    this.select.emit({ suggestion });
  }

  submitSearch(): void {
    this.showDropdown.set(false);
    this.search.emit({
      query: this.query(),
      count: this.totalCount(),
    });
  }

  /** Returns a Material Symbol icon name for each property type */
  typeIcon(type: PropertyType): string {
    const icons: Record<PropertyType, string> = {
      apartment: 'apartment',
      house: 'house',
      studio: 'meeting_room',
      room: 'bed',
      villa: 'villa',
      penthouse: 'domain',
    };
    return icons[type] ?? 'home';
  }

  private _listenOutsideClick(): void {
    if (this._outsideClickHandler) return;
    this._outsideClickHandler = () => {
      this.showDropdown.set(false);
      this.isExpanded.set(false);
      this._removeOutsideClick();
    };
    setTimeout(() => {
      document.addEventListener('click', this._outsideClickHandler!, { once: true });
    }, 0);
  }

  private _removeOutsideClick(): void {
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  }

  ngOnDestroy(): void {
    this._removeOutsideClick();
  }
}
