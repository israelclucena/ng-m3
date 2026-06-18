import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent, type FilterConfig, type FilterValues, type FilterDateRange } from './filter-bar.component';

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  const CONFIGS: FilterConfig[] = [
    { key: 'q', label: 'Pesquisa', type: 'text', placeholder: 'Procurar…' },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'archived', label: 'Arquivado' },
      ],
    },
    { key: 'period', label: 'Período', type: 'date-range' },
    { key: 'labels', label: 'Etiquetas', type: 'tags', maxTags: 3 },
  ];

  const setup = (filters: FilterConfig[] = CONFIGS) => {
    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
  };

  // Query helpers
  const fields = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.iu-filter-bar__field'));
  const textInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.iu-filter-bar__input');
  const selectEl = (): HTMLSelectElement =>
    fixture.nativeElement.querySelector('.iu-filter-bar__select');
  const dateInputs = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.iu-filter-bar__date-input'));
  const tagsInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.iu-filter-bar__tags-input');
  const chips = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.iu-filter-bar__chip'));
  const clearAllBtn = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.iu-filter-bar__clear-all');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
    }).compileComponents();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it('should render one field per filter config with its label', () => {
    setup();
    const labels = fields().map(f => f.querySelector('.iu-filter-bar__label')!.textContent!.trim());
    expect(labels).toEqual(['Pesquisa', 'Estado', 'Período', 'Etiquetas']);
  });

  it('should render the correct control per filter type', () => {
    setup();
    expect(textInput()).toBeTruthy();
    expect(selectEl()).toBeTruthy();
    expect(dateInputs().length).toBe(2);
    expect(tagsInput()).toBeTruthy();
  });

  it('should render select options including the placeholder All option', () => {
    setup();
    const options = Array.from(selectEl().querySelectorAll('option'));
    // placeholder + 2 configured options
    expect(options.length).toBe(3);
    expect(options[0].textContent!.trim()).toBe('All');
    expect(options[1].value).toBe('active');
  });

  it('should use the configured text placeholder', () => {
    setup();
    expect(textInput().placeholder).toBe('Procurar…');
  });

  // ── Initial state ────────────────────────────────────────────────────────

  it('should start with no active filters and no clear-all button', () => {
    setup();
    expect(component.hasActiveFilters()).toBe(false);
    expect(clearAllBtn()).toBeNull();
  });

  // ── Select filter ────────────────────────────────────────────────────────

  it('should emit filter values when a select changes', () => {
    setup();
    let emitted: FilterValues | undefined;
    component.filtersChange.subscribe(v => (emitted = v));

    selectEl().value = 'active';
    selectEl().dispatchEvent(new Event('change'));

    expect(emitted!['status']).toBe('active');
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should show the clear-all button once a filter is active', () => {
    setup();
    selectEl().value = 'archived';
    selectEl().dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(clearAllBtn()).toBeTruthy();
  });

  // ── Date-range filter ────────────────────────────────────────────────────

  it('should emit a FilterDateRange with start and end parts', () => {
    setup();
    let emitted: FilterValues | undefined;
    component.filtersChange.subscribe(v => (emitted = v));

    const [start, end] = dateInputs();
    start.value = '2026-01-01';
    start.dispatchEvent(new Event('change'));
    end.value = '2026-02-01';
    end.dispatchEvent(new Event('change'));

    const range = emitted!['period'] as FilterDateRange;
    expect(range.start).toBe('2026-01-01');
    expect(range.end).toBe('2026-02-01');
  });

  it('should null out a date part when cleared', () => {
    setup();
    const [start] = dateInputs();
    start.value = '2026-01-01';
    start.dispatchEvent(new Event('change'));
    start.value = '';
    start.dispatchEvent(new Event('change'));
    expect(component.getDateRange('period').start).toBeNull();
  });

  // ── Tags filter ──────────────────────────────────────────────────────────

  it('should add a tag on Enter and render it as a chip', () => {
    setup();
    const input = tagsInput();
    input.value = 'lisboa';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(component.getTagsValue('labels')).toEqual(['lisboa']);
    expect(chips().length).toBe(1);
  });

  it('should not add duplicate tags', () => {
    setup();
    component.onTagEnter('labels', { target: { value: 'porto' }, preventDefault: () => {} } as unknown as Event);
    component.onTagEnter('labels', { target: { value: 'porto' }, preventDefault: () => {} } as unknown as Event);
    expect(component.getTagsValue('labels')).toEqual(['porto']);
  });

  it('should not add empty/whitespace tags', () => {
    setup();
    component.onTagEnter('labels', { target: { value: '   ' }, preventDefault: () => {} } as unknown as Event);
    expect(component.getTagsValue('labels')).toEqual([]);
  });

  it('should remove a tag via removeTag', () => {
    setup();
    component.onTagEnter('labels', { target: { value: 'a' }, preventDefault: () => {} } as unknown as Event);
    component.onTagEnter('labels', { target: { value: 'b' }, preventDefault: () => {} } as unknown as Event);
    component.removeTag('labels', 'a');
    expect(component.getTagsValue('labels')).toEqual(['b']);
  });

  it('should report tags as full once maxTags reached and hide the input', () => {
    setup();
    for (const t of ['a', 'b', 'c']) {
      component.onTagEnter('labels', { target: { value: t }, preventDefault: () => {} } as unknown as Event);
    }
    fixture.detectChanges();
    expect(component.isTagsFull('labels', 3)).toBe(true);
    expect(tagsInput()).toBeNull();
  });

  it('should remove the last tag on backspace when the input is empty', () => {
    setup();
    component.onTagEnter('labels', { target: { value: 'x' }, preventDefault: () => {} } as unknown as Event);
    component.onTagEnter('labels', { target: { value: 'y' }, preventDefault: () => {} } as unknown as Event);
    component.onTagBackspace('labels', { target: { value: '' } } as unknown as Event);
    expect(component.getTagsValue('labels')).toEqual(['x']);
  });

  it('should not remove a tag on backspace when the input still has text', () => {
    setup();
    component.onTagEnter('labels', { target: { value: 'keep' }, preventDefault: () => {} } as unknown as Event);
    component.onTagBackspace('labels', { target: { value: 'typ' } } as unknown as Event);
    expect(component.getTagsValue('labels')).toEqual(['keep']);
  });

  // ── clearField / clearAll ─────────────────────────────────────────────────

  it('should reset a text field to empty string via clearField', () => {
    setup();
    component.onTextInput('q', { target: { value: 'hello' } } as unknown as Event);
    component.clearField('q');
    expect(component.getTextValue('q')).toBe('');
  });

  it('should reset a date-range field to nulls via clearField', () => {
    setup();
    const [start] = dateInputs();
    start.value = '2026-01-01';
    start.dispatchEvent(new Event('change'));
    component.clearField('period');
    expect(component.getDateRange('period')).toEqual({ start: null, end: null });
  });

  it('should reset a tags field to empty array via clearField', () => {
    setup();
    component.onTagEnter('labels', { target: { value: 'z' }, preventDefault: () => {} } as unknown as Event);
    component.clearField('labels');
    expect(component.getTagsValue('labels')).toEqual([]);
  });

  it('should ignore clearField for an unknown key', () => {
    setup();
    expect(() => component.clearField('nope')).not.toThrow();
  });

  it('should reset all filters and emit on clearAll', () => {
    setup();
    let emitted: FilterValues | undefined;
    selectEl().value = 'active';
    selectEl().dispatchEvent(new Event('change'));
    component.onTagEnter('labels', { target: { value: 'q' }, preventDefault: () => {} } as unknown as Event);

    component.filtersChange.subscribe(v => (emitted = v));
    component.clearAll();

    expect(component.hasActiveFilters()).toBe(false);
    expect(emitted!['status']).toBe('');
    expect(emitted!['labels']).toEqual([]);
    expect((emitted!['period'] as FilterDateRange)).toEqual({ start: null, end: null });
  });

  // ── hasActiveFilters edge cases ───────────────────────────────────────────

  it('should treat a date-range with only an end date as active', () => {
    setup();
    const [, end] = dateInputs();
    end.value = '2026-03-01';
    end.dispatchEvent(new Event('change'));
    expect(component.hasActiveFilters()).toBe(true);
  });

  // ── Accessors with missing keys ───────────────────────────────────────────

  it('should return safe defaults from accessors for unknown keys', () => {
    setup([]);
    expect(component.getTextValue('missing')).toBe('');
    expect(component.getTagsValue('missing')).toEqual([]);
    expect(component.getDateRange('missing')).toEqual({ start: null, end: null });
    expect(component.isTagsFull('missing')).toBe(false);
  });
});
