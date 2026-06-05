import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import {
  ResourceDataTableComponent,
  ResourceRef,
} from './resource-data-table.component';
import { DataTableV2Column } from '../data-table-v2/data-table-v2.component';

interface Row {
  id: string;
  name: string;
  age: number;
  [key: string]: unknown;
}

/**
 * Build a fake ResourceRef<T[]> backed by signals so tests can toggle
 * loading / error / value states between assertions.
 */
function makeResource<T>(initial: {
  loading?: boolean;
  error?: unknown;
  value?: T[] | undefined;
}) {
  const loading = signal<boolean>(initial.loading ?? false);
  const error = signal<unknown>(initial.error ?? undefined);
  const value = signal<T[] | undefined>(initial.value);
  const ref: ResourceRef<T[]> = {
    isLoading: () => loading(),
    error: () => error(),
    value: () => value(),
  };
  return { ref, loading, error, value };
}

const COLUMNS: DataTableV2Column<Row>[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age', align: 'right' },
];

describe('ResourceDataTableComponent', () => {
  let fixture: ComponentFixture<ResourceDataTableComponent<Row>>;
  let component: ResourceDataTableComponent<Row>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDataTableComponent],
    }).compileComponents();
    fixture = TestBed.createComponent<ResourceDataTableComponent<Row>>(
      ResourceDataTableComponent as never,
    );
    component = fixture.componentInstance;
  });

  it('should create', () => {
    const { ref } = makeResource<Row>({ value: [] });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('has expected input defaults (bulkActions=[], pageSize=10)', () => {
    const { ref } = makeResource<Row>({ value: [] });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.bulkActions()).toEqual([]);
    expect(component.pageSize()).toBe(10);
  });

  it('renders loading skeleton wrapper when isLoading() is true', () => {
    const { ref } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector(
      '.iu-rdt__loading',
    ) as HTMLElement;
    expect(loading).toBeTruthy();
    expect(loading.getAttribute('role')).toBe('status');
    expect(loading.getAttribute('aria-label')).toBe('Loading data…');
  });

  it('renders M3 progress track + indicator while loading', () => {
    const { ref } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.iu-rdt__progress-track'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.iu-rdt__progress-indicator'),
    ).toBeTruthy();
  });

  it('renders skeleton rows count = min(pageSize, 5) while loading', () => {
    const { ref } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pageSize', 3);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll(
      '.iu-rdt__skeleton-row',
    );
    expect(rows.length).toBe(3);
    expect(component.skeletonRows()).toEqual([0, 1, 2]);
  });

  it('caps skeleton rows at 5 when pageSize > 5', () => {
    const { ref } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('pageSize', 50);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll(
      '.iu-rdt__skeleton-row',
    );
    expect(rows.length).toBe(5);
    expect(component.skeletonRows().length).toBe(5);
  });

  it('does not render the data table while loading', () => {
    const { ref } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('iu-data-table-v2'),
    ).toBeNull();
  });

  it('renders error block with role=alert when error() is set', () => {
    const { ref } = makeResource<Row>({ error: new Error('boom') });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const errEl = fixture.nativeElement.querySelector(
      '.iu-rdt__error',
    ) as HTMLElement;
    expect(errEl).toBeTruthy();
    expect(errEl.getAttribute('role')).toBe('alert');
    expect(
      fixture.nativeElement.querySelector('.iu-rdt__error-title')?.textContent
        ?.trim(),
    ).toBe('Failed to load data');
  });

  it('errorMessage() uses Error.message when error is an Error instance', () => {
    const { ref } = makeResource<Row>({ error: new Error('Network down') });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Network down');
    const msg = fixture.nativeElement.querySelector(
      '.iu-rdt__error-message',
    ) as HTMLElement;
    expect(msg.textContent?.trim()).toBe('Network down');
  });

  it('errorMessage() uses the string directly when error is a string', () => {
    const { ref } = makeResource<Row>({ error: 'Timeout' });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Timeout');
  });

  it('errorMessage() falls back to generic copy for unknown error shapes', () => {
    const { ref } = makeResource<Row>({ error: { weird: true } });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.errorMessage()).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });

  it('errorMessage() returns empty string when there is no error', () => {
    const { ref } = makeResource<Row>({ value: [] });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('');
  });

  it('renders iu-data-table-v2 when data is resolved (success state)', () => {
    const data: Row[] = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 },
    ];
    const { ref } = makeResource<Row>({ value: data });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector(
      'iu-data-table-v2',
    ) as HTMLElement;
    expect(table).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-rdt__loading')).toBeNull();
    expect(fixture.nativeElement.querySelector('.iu-rdt__error')).toBeNull();
  });

  it('rows() computed returns the resource value when present', () => {
    const data: Row[] = [{ id: '1', name: 'Alice', age: 30 }];
    const { ref } = makeResource<Row>({ value: data });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.rows()).toEqual(data);
  });

  it('rows() computed returns empty array when value is undefined', () => {
    const { ref } = makeResource<Row>({ value: undefined });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(component.rows()).toEqual([]);
  });

  it('renders data table (empty state) when value is an empty array', () => {
    const { ref } = makeResource<Row>({ value: [] });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('iu-data-table-v2'),
    ).toBeTruthy();
    expect(component.rows()).toEqual([]);
  });

  it('propagates columns(), bulkActions(), and pageSize() to inner data table', () => {
    const { ref } = makeResource<Row>({ value: [] });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('bulkActions', [
      { id: 'delete', label: 'Delete', variant: 'danger' },
    ]);
    fixture.componentRef.setInput('pageSize', 25);
    fixture.detectChanges();
    const tableDe = fixture.debugElement.query(By.css('iu-data-table-v2'));
    expect(tableDe).toBeTruthy();
    const inst = tableDe.componentInstance as {
      columns: () => DataTableV2Column<Row>[];
      bulkActions: () => unknown[];
      pageSize: () => number;
    };
    expect(inst.columns()).toEqual(COLUMNS);
    expect(inst.bulkActions().length).toBe(1);
    expect(inst.pageSize()).toBe(25);
  });

  it('reacts to loading→success transition (skeleton replaced by table)', () => {
    const { ref, loading, value } = makeResource<Row>({ loading: true });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rdt__loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iu-data-table-v2')).toBeNull();

    loading.set(false);
    value.set([{ id: '1', name: 'Alice', age: 30 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rdt__loading')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('iu-data-table-v2'),
    ).toBeTruthy();
  });

  it('loading state takes precedence over error state', () => {
    const { ref } = makeResource<Row>({
      loading: true,
      error: new Error('hidden while loading'),
    });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rdt__loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-rdt__error')).toBeNull();
  });

  it('error state takes precedence over success rendering (no data table when error)', () => {
    const { ref } = makeResource<Row>({
      error: new Error('failed'),
      value: [{ id: '1', name: 'Alice', age: 30 }],
    });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-rdt__error')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('iu-data-table-v2'),
    ).toBeNull();
  });

  it('renders an error icon span with aria-hidden=true', () => {
    const { ref } = makeResource<Row>({ error: new Error('nope') });
    fixture.componentRef.setInput('dataResource', ref);
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector(
      '.iu-rdt__error-icon',
    ) as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.textContent?.trim()).toBe('error_outline');
  });
});
