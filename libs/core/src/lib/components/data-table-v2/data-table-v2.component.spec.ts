import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DataTableV2Component,
  type DataTableV2Column,
  type DataTableV2BulkAction,
} from './data-table-v2.component';

interface Row extends Record<string, unknown> {
  id: number;
  name: string;
  city: string;
}

const COLUMNS: DataTableV2Column<Row>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'city', label: 'City', sortable: true },
];

const ROWS: Row[] = [
  { id: 1, name: 'Charlie', city: 'Lisboa' },
  { id: 2, name: 'Alice', city: 'Porto' },
  { id: 3, name: 'Bob', city: 'Faro' },
];

describe('DataTableV2Component', () => {
  let fixture: ComponentFixture<DataTableV2Component<Row>>;
  let component: DataTableV2Component<Row>;

  const rows = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.iu-dtv2__tr:not(.iu-dtv2__tr--detail)'));
  const filterInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.iu-dtv2__filter-input');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableV2Component],
    }).compileComponents();

    fixture = TestBed.createComponent<DataTableV2Component<Row>>(DataTableV2Component);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', ROWS);
    fixture.componentRef.setInput('rowId', 'id');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one row per data item', () => {
    expect(rows().length).toBe(ROWS.length);
  });

  // ── Filtering ────────────────────────────────────────────────────────────

  it('should filter rows case-insensitively across all columns', () => {
    component.filterQuery.set('porto');
    fixture.detectChanges();
    expect(component.filteredData().length).toBe(1);
    expect(component.filteredData()[0].name).toBe('Alice');
  });

  it('should match against any column value', () => {
    component.filterQuery.set('bob');
    expect(component.filteredData().map(r => r.id)).toEqual([3]);
  });

  it('should reset currentPage when filtering via the input', () => {
    component.currentPage.set(2);
    filterInput().value = 'a';
    filterInput().dispatchEvent(new Event('input'));
    expect(component.filterQuery()).toBe('a');
    expect(component.currentPage()).toBe(0);
  });

  it('should clear the filter', () => {
    component.filterQuery.set('porto');
    component.clearFilter();
    expect(component.filterQuery()).toBe('');
    expect(component.filteredData().length).toBe(ROWS.length);
  });

  // ── Sorting ──────────────────────────────────────────────────────────────

  it('should cycle sort tri-state: asc → desc → none', () => {
    component.cycleSort('name');
    expect(component.sortCol()).toBe('name');
    expect(component.sortDir()).toBe('asc');
    expect(component.filteredData().map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);

    component.cycleSort('name');
    expect(component.sortDir()).toBe('desc');
    expect(component.filteredData().map(r => r.name)).toEqual(['Charlie', 'Bob', 'Alice']);

    component.cycleSort('name');
    expect(component.sortCol()).toBeNull();
    expect(component.sortDir()).toBeNull();
    // back to insertion order
    expect(component.filteredData().map(r => r.id)).toEqual([1, 2, 3]);
  });

  it('should switch sort column and reset to asc', () => {
    component.cycleSort('name');
    component.cycleSort('city');
    expect(component.sortCol()).toBe('city');
    expect(component.sortDir()).toBe('asc');
  });

  it('should report sort icon and aria label per column state', () => {
    expect(component.getSortIcon('name')).toBe('unfold_more');
    expect(component.getSortAriaLabel('name')).toBe('none');
    component.cycleSort('name');
    expect(component.getSortIcon('name')).toBe('arrow_upward');
    expect(component.getSortAriaLabel('name')).toBe('ascending');
    component.cycleSort('name');
    expect(component.getSortIcon('name')).toBe('arrow_downward');
    expect(component.getSortAriaLabel('name')).toBe('descending');
  });

  // ── Pagination ───────────────────────────────────────────────────────────

  it('should compute total pages from page size', () => {
    fixture.componentRef.setInput('pageSize', 2);
    expect(component.totalPages()).toBe(2);
    expect(component.pagedData().length).toBe(2);
  });

  it('should slice paged data by current page', () => {
    fixture.componentRef.setInput('pageSize', 2);
    component.goToPage(1);
    expect(component.pagedData().map(r => r.id)).toEqual([3]);
  });

  it('should clamp goToPage within bounds', () => {
    fixture.componentRef.setInput('pageSize', 2);
    component.goToPage(99);
    expect(component.currentPage()).toBe(1);
    component.goToPage(-5);
    expect(component.currentPage()).toBe(0);
  });

  it('should compute pageStart and pageEnd', () => {
    fixture.componentRef.setInput('pageSize', 2);
    expect(component.pageStart()).toBe(1);
    expect(component.pageEnd()).toBe(2);
    component.goToPage(1);
    expect(component.pageStart()).toBe(3);
    expect(component.pageEnd()).toBe(3);
  });

  it('should return all rows when pageSize is 0', () => {
    fixture.componentRef.setInput('pageSize', 0);
    expect(component.totalPages()).toBe(1);
    expect(component.pagedData().length).toBe(ROWS.length);
  });

  // ── Selection (multi) ──────────────────────────────────────────────────────

  it('should toggle a single row in multi mode', () => {
    const spy = jest.fn();
    component.selectionChange.subscribe(spy);
    component.toggleRow(ROWS[0]);
    expect(component.isSelected(ROWS[0])).toBe(true);
    expect(component.hasSelection()).toBe(true);
    expect(spy).toHaveBeenCalledWith({ selected: [ROWS[0]], mode: 'multi' });
    component.toggleRow(ROWS[0]);
    expect(component.isSelected(ROWS[0])).toBe(false);
  });

  it('should select / deselect all paged rows', () => {
    component.toggleAll();
    expect(component.isAllSelected()).toBe(true);
    expect(component.selectedKeys().size).toBe(ROWS.length);
    component.toggleAll();
    expect(component.isAllSelected()).toBe(false);
    expect(component.selectedKeys().size).toBe(0);
  });

  it('should report indeterminate when some but not all selected', () => {
    component.toggleRow(ROWS[0]);
    expect(component.isIndeterminate()).toBe(true);
    component.toggleRow(ROWS[1]);
    component.toggleRow(ROWS[2]);
    expect(component.isIndeterminate()).toBe(false);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should clear selection and emit empty', () => {
    const spy = jest.fn();
    component.toggleRow(ROWS[0]);
    component.selectionChange.subscribe(spy);
    component.clearSelection();
    expect(component.selectedKeys().size).toBe(0);
    expect(spy).toHaveBeenCalledWith({ selected: [], mode: 'multi' });
  });

  // ── Selection (single) ─────────────────────────────────────────────────────

  it('should select a single row exclusively in single mode', () => {
    fixture.componentRef.setInput('selectionMode', 'single');
    const spy = jest.fn();
    component.selectionChange.subscribe(spy);
    component.onRowClick(ROWS[0]);
    expect(component.isSelected(ROWS[0])).toBe(true);
    component.onRowClick(ROWS[1]);
    expect(component.isSelected(ROWS[0])).toBe(false);
    expect(component.isSelected(ROWS[1])).toBe(true);
    expect(spy).toHaveBeenLastCalledWith({ selected: [ROWS[1]], mode: 'single' });
  });

  it('should toggle the same row off in single mode', () => {
    fixture.componentRef.setInput('selectionMode', 'single');
    component.onRowClick(ROWS[0]);
    component.onRowClick(ROWS[0]);
    expect(component.isSelected(ROWS[0])).toBe(false);
  });

  it('should ignore row clicks when selection is none', () => {
    fixture.componentRef.setInput('selectionMode', 'none');
    component.onRowClick(ROWS[0]);
    expect(component.hasSelection()).toBe(false);
  });

  // ── Expand ─────────────────────────────────────────────────────────────────

  it('should toggle row expansion and emit', () => {
    const spy = jest.fn();
    component.rowExpand.subscribe(spy);
    component.toggleExpand(ROWS[0]);
    expect(component.isExpanded(ROWS[0])).toBe(true);
    expect(spy).toHaveBeenCalledWith({ row: ROWS[0], expanded: true });
    component.toggleExpand(ROWS[0]);
    expect(component.isExpanded(ROWS[0])).toBe(false);
    expect(spy).toHaveBeenLastCalledWith({ row: ROWS[0], expanded: false });
  });

  // ── Bulk actions ───────────────────────────────────────────────────────────

  it('should emit a bulk action with current selection', () => {
    const actions: DataTableV2BulkAction[] = [{ id: 'del', label: 'Delete', variant: 'danger' }];
    fixture.componentRef.setInput('bulkActions', actions);
    component.toggleRow(ROWS[0]);
    const spy = jest.fn();
    component.bulkAction.subscribe(spy);
    component.onBulkActionClick('del');
    expect(spy).toHaveBeenCalledWith({ actionId: 'del', selected: [ROWS[0]] });
  });

  // ── colSpan ──────────────────────────────────────────────────────────────

  it('should compute colSpan including checkbox and expand columns', () => {
    expect(component.colSpan()).toBe(COLUMNS.length + 1); // multi mode adds checkbox
    fixture.componentRef.setInput('expandable', true);
    expect(component.colSpan()).toBe(COLUMNS.length + 2);
    fixture.componentRef.setInput('selectionMode', 'none');
    expect(component.colSpan()).toBe(COLUMNS.length + 1);
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('should render empty state when filter matches nothing', () => {
    component.filterQuery.set('zzz-no-match');
    fixture.detectChanges();
    expect(component.pagedData().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.iu-dtv2__empty')).toBeTruthy();
  });
});
