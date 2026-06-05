import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchComponent, SearchResult } from './search.component';

describe('SearchComponent', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let component: SearchComponent;

  const sampleResults: SearchResult[] = [
    { id: '1', label: 'Apple', subtitle: 'Fruit', icon: 'eco' },
    { id: '2', label: 'Banana', subtitle: 'Yellow fruit' },
    { id: '3', label: 'Cherry' },
  ];

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SearchComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create with expected defaults', () => {
    expect(component).toBeTruthy();
    expect(component.placeholder()).toBe('Search...');
    expect(component.results()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.debounceMs()).toBe(300);
    expect(component.minChars()).toBe(2);
    expect(component.query()).toBe('');
    expect(component.focused()).toBe(false);
    expect(component.activeIndex()).toBe(-1);
  });

  it('updates query signal on input event', () => {
    const input = fixture.nativeElement.querySelector('input.iu-search__input') as HTMLInputElement;
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    expect(component.query()).toBe('hello');
    expect(component.activeIndex()).toBe(-1);
  });

  it('debounces search emit by debounceMs', () => {
    const spy = jest.fn();
    component.search.subscribe(spy);
    const input = fixture.nativeElement.querySelector('input.iu-search__input') as HTMLInputElement;
    input.value = 'abc';
    input.dispatchEvent(new Event('input'));

    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(299);
    expect(spy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledWith('abc');
  });

  it('does not emit search when query length is below minChars', () => {
    const spy = jest.fn();
    component.search.subscribe(spy);
    const input = fixture.nativeElement.querySelector('input.iu-search__input') as HTMLInputElement;
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    jest.advanceTimersByTime(500);
    expect(spy).not.toHaveBeenCalled();
  });

  it('onFocus sets focused() to true immediately, onBlur delays unfocus by 200ms', () => {
    component.onFocus();
    expect(component.focused()).toBe(true);

    component.onBlur();
    expect(component.focused()).toBe(true);
    jest.advanceTimersByTime(199);
    expect(component.focused()).toBe(true);
    jest.advanceTimersByTime(1);
    expect(component.focused()).toBe(false);
  });

  it('ArrowDown advances activeIndex with upper bound at results.length - 1', () => {
    fixture.componentRef.setInput('results', sampleResults);
    fixture.detectChanges();

    const ev = (key: string) => new KeyboardEvent('keydown', { key });
    component.onKeydown(ev('ArrowDown'));
    expect(component.activeIndex()).toBe(0);
    component.onKeydown(ev('ArrowDown'));
    expect(component.activeIndex()).toBe(1);
    component.onKeydown(ev('ArrowDown'));
    expect(component.activeIndex()).toBe(2);
    // Bound — stays at last
    component.onKeydown(ev('ArrowDown'));
    expect(component.activeIndex()).toBe(2);
  });

  it('ArrowUp decrements activeIndex with lower bound at -1', () => {
    fixture.componentRef.setInput('results', sampleResults);
    fixture.detectChanges();
    component.activeIndex.set(1);

    const ev = (key: string) => new KeyboardEvent('keydown', { key });
    component.onKeydown(ev('ArrowUp'));
    expect(component.activeIndex()).toBe(0);
    component.onKeydown(ev('ArrowUp'));
    expect(component.activeIndex()).toBe(-1);
    // Bound — stays at -1
    component.onKeydown(ev('ArrowUp'));
    expect(component.activeIndex()).toBe(-1);
  });

  it('Enter selects active result and emits select', () => {
    fixture.componentRef.setInput('results', sampleResults);
    fixture.detectChanges();
    component.activeIndex.set(1);

    const spy = jest.fn();
    component.select.subscribe(spy);

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(spy).toHaveBeenCalledWith(sampleResults[1]);
    expect(component.query()).toBe('Banana');
    expect(component.focused()).toBe(false);
  });

  it('Escape sets focused() to false', () => {
    component.focused.set(true);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.focused()).toBe(false);
  });

  it('selectResult sets query to label, unfocuses, and emits select', () => {
    const spy = jest.fn();
    component.select.subscribe(spy);
    component.focused.set(true);

    component.selectResult(sampleResults[0]);
    expect(component.query()).toBe('Apple');
    expect(component.focused()).toBe(false);
    expect(spy).toHaveBeenCalledWith(sampleResults[0]);
  });

  it('clear resets query and activeIndex', () => {
    component.query.set('some text');
    component.activeIndex.set(2);
    const event = new Event('mousedown');
    const preventSpy = jest.spyOn(event, 'preventDefault');

    component.clear(event);
    expect(preventSpy).toHaveBeenCalled();
    expect(component.query()).toBe('');
    expect(component.activeIndex()).toBe(-1);
  });

  it('highlight wraps matching text with <mark> tag (case-insensitive)', () => {
    component.query.set('ana');
    const result = component.highlight('Banana');
    expect(result).toBe('B<mark class="iu-search__highlight">ana</mark>na');
  });

  it('highlight returns text unchanged when query is empty', () => {
    component.query.set('');
    expect(component.highlight('Anything')).toBe('Anything');
  });

  it('showResults() is true when focused, query >= minChars, and results present', () => {
    fixture.componentRef.setInput('results', sampleResults);
    fixture.detectChanges();
    component.focused.set(true);
    component.query.set('ap');
    expect(component.showResults()).toBe(true);

    // Not focused → hidden
    component.focused.set(false);
    expect(component.showResults()).toBe(false);

    // Focused but query too short → hidden
    component.focused.set(true);
    component.query.set('a');
    expect(component.showResults()).toBe(false);
  });

  it('showResults() is false when no results and loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('results', []);
    fixture.detectChanges();
    component.focused.set(true);
    component.query.set('abc');
    expect(component.showResults()).toBe(false);
  });

  it('renders "No results found" when query >= minChars and results empty', () => {
    component.focused.set(true);
    component.query.set('xyz');
    fixture.componentRef.setInput('results', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.iu-search__no-results') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent?.trim()).toBe('No results found');
  });

  it('renders result rows with active class on activeIndex match', () => {
    fixture.componentRef.setInput('results', sampleResults);
    fixture.detectChanges();
    component.focused.set(true);
    component.query.set('an');
    component.activeIndex.set(1);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.iu-search__result');
    expect(rows.length).toBe(3);
    expect((rows[1] as HTMLElement).className).toContain('iu-search__result--active');
    expect((rows[0] as HTMLElement).className).not.toContain('iu-search__result--active');
  });
});
