import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SearchResult {
  /** Unique id */
  id: string;
  /** Display label */
  label: string;
  /** Optional secondary text */
  subtitle?: string;
  /** Optional icon */
  icon?: string;
}

/**
 * Search — Autocomplete search component with debounce and result highlighting.
 *
 * Emits search queries after a configurable debounce. Results are passed in
 * and displayed as a dropdown with matching text highlighted.
 *
 * @example
 * ```html
 * <iu-search
 *   placeholder="Search users..."
 *   [results]="searchResults()"
 *   [loading]="isSearching()"
 *   (search)="onSearch($event)"
 *   (select)="onSelect($event)"
 * />
 * ```
 */
@Component({
  selector: 'iu-search',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-search" [class.iu-search--open]="showResults()">
      <div class="iu-search__field">
        <span class="material-symbols-outlined iu-search__icon">search</span>
        <input
          #searchInput
          type="text"
          class="iu-search__input"
          [placeholder]="placeholder()"
          [value]="query()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKeydown($event)"
        />
        @if (loading()) {
          <div class="iu-search__spinner"></div>
        }
        @if (query() && !loading()) {
          <button class="iu-search__clear" (mousedown)="clear($event)">
            <span class="material-symbols-outlined">close</span>
          </button>
        }
      </div>

      @if (showResults()) {
        <div class="iu-search__dropdown">
          @for (result of results(); track result.id; let i = $index) {
            <div
              class="iu-search__result"
              [class.iu-search__result--active]="activeIndex() === i"
              (mousedown)="selectResult(result)"
              (mouseenter)="activeIndex.set(i)"
            >
              @if (result.icon) {
                <span class="material-symbols-outlined iu-search__result-icon">{{ result.icon }}</span>
              }
              <div class="iu-search__result-text">
                <span class="iu-search__result-label" [innerHTML]="highlight(result.label)"></span>
                @if (result.subtitle) {
                  <span class="iu-search__result-subtitle">{{ result.subtitle }}</span>
                }
              </div>
            </div>
          } @empty {
            @if (query().length >= minChars()) {
              <div class="iu-search__no-results">No results found</div>
            }
          }
        </div>
      }
    </div>
  `,
  styleUrl: './search.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  /** Placeholder text */
  placeholder = input('Search...');
  /** Search results to display */
  results = input<SearchResult[]>([]);
  /** Whether search is loading */
  loading = input(false);
  /** Debounce time in ms */
  debounceMs = input(300);
  /** Minimum characters before searching */
  minChars = input(2);

  /** Emitted with the search query after debounce */
  search = output<string>();
  /** Emitted when a result is selected */
  select = output<SearchResult>();

  query = signal('');
  focused = signal(false);
  activeIndex = signal(-1);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  showResults = computed(() =>
    this.focused() && this.query().length >= this.minChars() && (this.results().length > 0 || !this.loading())
  );

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.activeIndex.set(-1);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (value.length >= this.minChars()) {
      this.debounceTimer = setTimeout(() => {
        this.search.emit(value);
      }, this.debounceMs());
    }
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    // Delay to allow click events on results
    setTimeout(() => this.focused.set(false), 200);
  }

  onKeydown(event: KeyboardEvent): void {
    const results = this.results();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.activeIndex();
        if (idx >= 0 && idx < results.length) {
          this.selectResult(results[idx]);
        }
        break;
      case 'Escape':
        this.focused.set(false);
        break;
    }
  }

  selectResult(result: SearchResult): void {
    this.query.set(result.label);
    this.focused.set(false);
    this.select.emit(result);
  }

  clear(event: Event): void {
    event.preventDefault();
    this.query.set('');
    this.activeIndex.set(-1);
    this.inputRef()?.nativeElement.focus();
  }

  /** Highlight matching text in result label */
  highlight(text: string): string {
    const q = this.query().trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="iu-search__highlight">$1</mark>');
  }
}
