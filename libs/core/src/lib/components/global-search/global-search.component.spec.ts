import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalSearchComponent } from './global-search.component';
import { PropertySearchService } from './property-search.service';

/** Build a fake `KeyboardEvent`-like object capturing preventDefault. */
function keyEvent(key: string): KeyboardEvent {
  return {
    key,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { blur: jest.fn() },
  } as unknown as KeyboardEvent;
}

describe('GlobalSearchComponent', () => {
  let fixture: ComponentFixture<GlobalSearchComponent>;
  let component: GlobalSearchComponent;
  let search: PropertySearchService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalSearchComponent);
    component = fixture.componentInstance;
    search = TestBed.inject(PropertySearchService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it('starts collapsed with the dropdown hidden', () => {
    expect(component.isExpanded()).toBe(false);
    expect(component.showDropdown()).toBe(false);
    expect(component.activeIndex()).toBe(-1);
  });

  it('exposes the full corpus through the search service before any query', () => {
    // Debounced query initialises to '' synchronously → all 10 properties match.
    expect(component.totalCount()).toBe(10);
    expect(component.suggestions().length).toBe(5); // top-5 dropdown slice
  });

  it('placeholder defaults to the Portuguese prompt', () => {
    expect(component.placeholder()).toContain('Pesquisar');
  });

  // ── expand / collapse / clear ───────────────────────────────────────────────

  it('expand() opens the bar', () => {
    component.expand();
    expect(component.isExpanded()).toBe(true);
  });

  it('collapse() closes the bar, hides the dropdown and clears filters', () => {
    component.expand();
    component.showDropdown.set(true);
    search.setQuery('Cascais');

    component.collapse(keyEvent('x'));

    expect(component.isExpanded()).toBe(false);
    expect(component.showDropdown()).toBe(false);
    expect(search.filters().query).toBe('');
  });

  it('clear() resets the query and hides the dropdown', () => {
    search.setQuery('Belém');
    component.showDropdown.set(true);
    component.activeIndex.set(2);

    component.clear(keyEvent('x'));

    expect(search.filters().query).toBe('');
    expect(component.showDropdown()).toBe(false);
    expect(component.activeIndex()).toBe(-1);
  });

  // ── input / focus ───────────────────────────────────────────────────────────

  it('onInput updates the query, opens the dropdown and resets the active index', () => {
    component.activeIndex.set(3);
    component.onInput({ target: { value: 'Sintra' } } as unknown as Event);

    expect(search.filters().query).toBe('Sintra');
    expect(component.showDropdown()).toBe(true);
    expect(component.activeIndex()).toBe(-1);
  });

  it('onFocus expands and opens the dropdown when a query is present', () => {
    search.setQuery('Lisboa');
    component.onFocus();
    expect(component.isExpanded()).toBe(true);
    expect(component.showDropdown()).toBe(true);
  });

  it('showSuggestions requires both an open dropdown and a non-empty query', () => {
    expect(component.showSuggestions()).toBe(false);
    component.showDropdown.set(true);
    expect(component.showSuggestions()).toBe(false); // query still empty
    search.setQuery('Chiado');
    expect(component.showSuggestions()).toBe(true);
  });

  // ── keyboard navigation ─────────────────────────────────────────────────────

  it('ArrowDown advances the active index, clamped to the suggestion count', () => {
    component.onKeydown(keyEvent('ArrowDown'));
    expect(component.activeIndex()).toBe(0);
    // Drive past the end → clamps at suggestions().length - 1 (5 suggestions → 4).
    for (let i = 0; i < 10; i++) component.onKeydown(keyEvent('ArrowDown'));
    expect(component.activeIndex()).toBe(component.suggestions().length - 1);
  });

  it('ArrowUp decrements the active index, clamped at -1', () => {
    component.activeIndex.set(2);
    component.onKeydown(keyEvent('ArrowUp'));
    expect(component.activeIndex()).toBe(1);
    for (let i = 0; i < 5; i++) component.onKeydown(keyEvent('ArrowUp'));
    expect(component.activeIndex()).toBe(-1);
  });

  it('Enter on a highlighted suggestion emits select', () => {
    const selected: unknown[] = [];
    component.select.subscribe((e) => selected.push(e));
    component.activeIndex.set(0);

    component.onKeydown(keyEvent('Enter'));

    expect(selected.length).toBe(1);
  });

  it('Enter with no highlight submits a full search', () => {
    let submitted: { query: string; count: number } | undefined;
    component.search.subscribe((e) => (submitted = e));
    component.activeIndex.set(-1);

    component.onKeydown(keyEvent('Enter'));

    expect(submitted).toBeDefined();
    expect(submitted!.count).toBe(component.totalCount());
  });

  it('Escape closes the dropdown and the bar', () => {
    component.showDropdown.set(true);
    component.isExpanded.set(true);
    component.onKeydown(keyEvent('Escape'));
    expect(component.showDropdown()).toBe(false);
    expect(component.isExpanded()).toBe(false);
  });

  // ── selection / submission ─────────────────────────────────────────────────

  it('selectSuggestion sets the query, hides the dropdown and emits select', () => {
    const suggestion = component.suggestions()[0];
    let emitted: { suggestion: typeof suggestion } | undefined;
    component.select.subscribe((e) => (emitted = e));

    component.selectSuggestion(suggestion);

    expect(search.filters().query).toBe(suggestion.title);
    expect(component.showDropdown()).toBe(false);
    expect(emitted?.suggestion).toBe(suggestion);
  });

  it('submitSearch emits the current query and count', () => {
    search.setQuery('Lisboa');
    let emitted: { query: string; count: number } | undefined;
    component.search.subscribe((e) => (emitted = e));

    component.submitSearch();

    expect(component.showDropdown()).toBe(false);
    expect(emitted?.query).toBe('Lisboa');
    expect(emitted?.count).toBe(component.totalCount());
  });

  // ── icon mapping ────────────────────────────────────────────────────────────

  it('maps each property type to a Material symbol, with a fallback', () => {
    expect(component.typeIcon('apartment')).toBe('apartment');
    expect(component.typeIcon('house')).toBe('house');
    expect(component.typeIcon('studio')).toBe('meeting_room');
    expect(component.typeIcon('room')).toBe('bed');
    expect(component.typeIcon('villa')).toBe('villa');
    expect(component.typeIcon('penthouse')).toBe('domain');
    expect(component.typeIcon('unknown' as never)).toBe('home');
  });

  // ── debounced filtering ──────────────────────────────────────────────────────

  it('reflects a debounced query in the suggestion list', () => {
    jest.useFakeTimers();
    search.setQuery('Cascais');
    fixture.detectChanges();        // flush the debounce effect → schedules timer
    jest.advanceTimersByTime(350);  // fire the 300ms debounce
    fixture.detectChanges();

    const titles = component.suggestions().map((s) => s.title);
    expect(titles).toContain('Moradia T3 com jardim em Cascais');
    expect(
      component
        .suggestions()
        .every((s) => /cascais/i.test(s.title) || /cascais/i.test(s.location)),
    ).toBe(true);
  });

  // ── teardown ────────────────────────────────────────────────────────────────

  it('cleans up on destroy without throwing', () => {
    component.expand();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
