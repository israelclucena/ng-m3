import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent, DataTableColumn } from './data-table.component';

interface Row {
  id: number;
  name: string;
  age: number;
  email: string;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Row>>;
  let component: DataTableComponent<Row>;

  const sampleColumns: DataTableColumn<Row>[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true, align: 'end' },
    { key: 'email', label: 'Email' },
  ];

  const sampleData: Row[] = [
    { id: 1, name: 'Alice', age: 30, email: 'alice@example.com' },
    { id: 2, name: 'Bob', age: 25, email: 'bob@example.com' },
    { id: 3, name: 'Carol', age: 35, email: 'carol@example.com' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent<DataTableComponent<Row>>(DataTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', sampleColumns);
    fixture.componentRef.setInput('data', sampleData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one header cell per column with the correct label', () => {
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    expect(headers.length).toBe(sampleColumns.length);
    expect(headers[0].textContent).toContain('ID');
    expect(headers[1].textContent).toContain('Name');
    expect(headers[3].textContent).toContain('Email');
  });

  it('marks sortable columns with the sortable modifier class', () => {
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    expect(headers[0].classList.contains('iu-data-table__header--sortable')).toBe(true);
    expect(headers[3].classList.contains('iu-data-table__header--sortable')).toBe(false);
  });

  it('renders a sort icon only on sortable columns', () => {
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    expect(headers[0].querySelector('.iu-data-table__sort-icon')).toBeTruthy();
    expect(headers[3].querySelector('.iu-data-table__sort-icon')).toBeNull();
  });

  it('applies column width and alignment styles to headers', () => {
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    expect((headers[0] as HTMLElement).style.width).toBe('80px');
    expect((headers[2] as HTMLElement).style.textAlign).toBe('end');
    expect((headers[1] as HTMLElement).style.width).toBe('auto');
  });

  it('renders one row per data item', () => {
    const rows = fixture.nativeElement.querySelectorAll('.iu-data-table__row');
    expect(rows.length).toBe(sampleData.length);
  });

  it('renders cell values using getCellValue', () => {
    const firstRow = fixture.nativeElement.querySelectorAll('.iu-data-table__row')[0];
    const cells = firstRow.querySelectorAll('.iu-data-table__cell');
    expect(cells[0].textContent).toContain('1');
    expect(cells[1].textContent).toContain('Alice');
    expect(cells[3].textContent).toContain('alice@example.com');
  });

  it('does not render the toolbar when filterable is false', () => {
    const toolbar = fixture.nativeElement.querySelector('.iu-data-table__toolbar');
    expect(toolbar).toBeNull();
  });

  it('renders the toolbar with placeholder when filterable is true', () => {
    fixture.componentRef.setInput('filterable', true);
    fixture.componentRef.setInput('filterPlaceholder', 'Find user...');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.iu-data-table__search-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Find user...');
  });

  it('emits rowClick when a row is clicked', () => {
    const spy = jest.fn();
    component.rowClick.subscribe(spy);
    const row = fixture.nativeElement.querySelector('.iu-data-table__row') as HTMLElement;
    row.click();
    expect(spy).toHaveBeenCalledWith(sampleData[0]);
  });

  it('does not toggle sort when clicking a non-sortable header', () => {
    const emitSpy = jest.fn();
    component.sortChange.subscribe(emitSpy);
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    (headers[3] as HTMLElement).click();
    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.sortState().direction).toBe('none');
  });

  it('toggleSort cycles asc → desc → none on the same column', () => {
    component.toggleSort('name');
    expect(component.sortState()).toEqual({ column: 'name', direction: 'asc' });
    component.toggleSort('name');
    expect(component.sortState()).toEqual({ column: 'name', direction: 'desc' });
    component.toggleSort('name');
    expect(component.sortState()).toEqual({ column: 'name', direction: 'none' });
  });

  it('toggleSort resets to asc when a different column is clicked', () => {
    component.toggleSort('name');
    component.toggleSort('age');
    expect(component.sortState()).toEqual({ column: 'age', direction: 'asc' });
  });

  it('emits sortChange and resets currentPage on toggleSort', () => {
    const spy = jest.fn();
    component.sortChange.subscribe(spy);
    component.currentPage.set(2);
    component.toggleSort('name');
    expect(spy).toHaveBeenCalledWith({ column: 'name', direction: 'asc' });
    expect(component.currentPage()).toBe(0);
  });

  it('sorts data ascending numerically', () => {
    component.toggleSort('age');
    expect(component.sortedData().map(r => r.age)).toEqual([25, 30, 35]);
  });

  it('sorts data descending numerically', () => {
    component.toggleSort('age');
    component.toggleSort('age');
    expect(component.sortedData().map(r => r.age)).toEqual([35, 30, 25]);
  });

  it('sorts data alphabetically using localeCompare for strings', () => {
    component.toggleSort('name');
    expect(component.sortedData().map(r => r.name)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('returns unsorted data when sort direction is none', () => {
    expect(component.sortedData().map(r => r.id)).toEqual([1, 2, 3]);
  });

  it('getSortIcon returns unfold_more when column is not sorted', () => {
    expect(component.getSortIcon('name')).toBe('unfold_more');
  });

  it('getSortIcon returns arrow_upward/arrow_downward based on direction', () => {
    component.toggleSort('name');
    expect(component.getSortIcon('name')).toBe('arrow_upward');
    component.toggleSort('name');
    expect(component.getSortIcon('name')).toBe('arrow_downward');
  });

  it('marks header with sorted modifier when its column is active', () => {
    component.toggleSort('name');
    fixture.detectChanges();
    const headers = fixture.nativeElement.querySelectorAll('.iu-data-table__header');
    expect(headers[1].classList.contains('iu-data-table__header--sorted')).toBe(true);
    expect(headers[0].classList.contains('iu-data-table__header--sorted')).toBe(false);
  });

  it('filters rows by text matching any column (case-insensitive)', () => {
    component.filterText.set('ALICE');
    expect(component.filteredData()).toEqual([sampleData[0]]);
  });

  it('returns all rows when filter text is empty/whitespace', () => {
    component.filterText.set('   ');
    expect(component.filteredData().length).toBe(3);
  });

  it('onFilterInput updates filterText and resets currentPage', () => {
    component.currentPage.set(2);
    const event = { target: { value: 'bob' } } as unknown as Event;
    component.onFilterInput(event);
    expect(component.filterText()).toBe('bob');
    expect(component.currentPage()).toBe(0);
  });

  it('shows the clear button only when filter text is non-empty', () => {
    fixture.componentRef.setInput('filterable', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-data-table__clear')).toBeNull();
    component.filterText.set('alice');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-data-table__clear')).toBeTruthy();
  });

  it('clearFilter empties filterText and resets currentPage', () => {
    component.filterText.set('alice');
    component.currentPage.set(1);
    component.clearFilter();
    expect(component.filterText()).toBe('');
    expect(component.currentPage()).toBe(0);
  });

  it('clicking the clear button triggers clearFilter', () => {
    fixture.componentRef.setInput('filterable', true);
    component.filterText.set('alice');
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.iu-data-table__clear') as HTMLButtonElement;
    clearBtn.click();
    expect(component.filterText()).toBe('');
  });

  it('renders the empty state row when there are no rows', () => {
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('emptyMessage', 'Nothing here');
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.iu-data-table__empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Nothing here');
    expect(empty.getAttribute('colspan')).toBe(String(sampleColumns.length));
  });

  it('uses col.format when provided for cell rendering', () => {
    const colsWithFormat: DataTableColumn<Row>[] = [
      { key: 'name', label: 'Name', format: (v) => `**${v}**` },
    ];
    fixture.componentRef.setInput('columns', colsWithFormat);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('.iu-data-table__cell') as HTMLElement;
    expect(cell.textContent).toContain('**Alice**');
  });

  it('getCellValue returns empty string for nullish values', () => {
    const col: DataTableColumn<Row> = { key: 'name', label: 'Name' };
    expect(component.getCellValue({ name: null } as any, col)).toBe('');
    expect(component.getCellValue({ name: undefined } as any, col)).toBe('');
  });

  it('renders pagination controls when paginated and data exists', () => {
    const pagination = fixture.nativeElement.querySelector('.iu-data-table__pagination');
    expect(pagination).toBeTruthy();
    const buttons = pagination.querySelectorAll('.iu-data-table__page-btn');
    expect(buttons.length).toBe(4);
  });

  it('does not render pagination controls when paginated is false', () => {
    fixture.componentRef.setInput('paginated', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-data-table__pagination')).toBeNull();
  });

  it('paginatedData returns full sorted data when not paginated', () => {
    fixture.componentRef.setInput('paginated', false);
    fixture.detectChanges();
    expect(component.paginatedData().length).toBe(3);
  });

  it('paginatedData slices according to pageSize and currentPage', () => {
    const many: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      age: 20 + i,
      email: `u${i}@example.com`,
    }));
    fixture.componentRef.setInput('data', many);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
    expect(component.paginatedData().length).toBe(10);
    expect(component.paginatedData()[0].id).toBe(0);
    component.currentPage.set(1);
    expect(component.paginatedData()[0].id).toBe(10);
    component.currentPage.set(2);
    expect(component.paginatedData().length).toBe(5);
  });

  it('totalPages computes correctly and is at least 1', () => {
    expect(component.totalPages()).toBe(1);
    const many: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `U${i}`,
      age: i,
      email: '',
    }));
    fixture.componentRef.setInput('data', many);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
    expect(component.totalPages()).toBe(3);
  });

  it('paginationInfo renders "0 results" for empty data', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(component.paginationInfo()).toBe('0 results');
  });

  it('paginationInfo renders the visible range', () => {
    expect(component.paginationInfo()).toBe('1–3 of 3');
  });

  it('goToPage clamps page index and emits pageChange', () => {
    const spy = jest.fn();
    component.pageChange.subscribe(spy);
    component.goToPage(-5);
    expect(component.currentPage()).toBe(0);
    component.goToPage(99);
    expect(component.currentPage()).toBe(component.totalPages() - 1);
    expect(spy).toHaveBeenCalled();
    const last = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(last).toEqual({
      pageIndex: component.totalPages() - 1,
      pageSize: 10,
      length: 3,
    });
  });

  it('first/prev pagination buttons are disabled on page 0', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.iu-data-table__page-btn');
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('next/last pagination buttons are disabled on the last page', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.iu-data-table__page-btn');
    expect((buttons[2] as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[3] as HTMLButtonElement).disabled).toBe(true);
  });

  it('clicking next page button advances currentPage', () => {
    const many: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `U${i}`,
      age: i,
      email: '',
    }));
    fixture.componentRef.setInput('data', many);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.iu-data-table__page-btn');
    (buttons[2] as HTMLButtonElement).click();
    expect(component.currentPage()).toBe(1);
  });

  it('sort orders nullish values to the end', () => {
    fixture.componentRef.setInput('data', [
      { id: 1, name: 'A', age: 10, email: '' },
      { id: 2, name: 'B', age: null as any, email: '' },
      { id: 3, name: 'C', age: 5, email: '' },
    ]);
    fixture.detectChanges();
    component.toggleSort('age');
    const ages = component.sortedData().map(r => r.age);
    expect(ages[ages.length - 1]).toBeNull();
  });
});
