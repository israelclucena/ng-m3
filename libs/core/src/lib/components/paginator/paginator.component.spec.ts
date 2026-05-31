import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorComponent, type PaginatorPageEvent } from './paginator.component';

describe('PaginatorComponent', () => {
  let fixture: ComponentFixture<PaginatorComponent>;
  let component: PaginatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginatorComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('length', 27);
    fixture.componentRef.setInput('pageSize', 9);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render range label with default showInfo=true', () => {
    const info = fixture.nativeElement.querySelector('.iu-paginator__info');
    expect(info?.textContent?.trim()).toBe('1–9 de 27');
  });

  it('should hide range label when showInfo is false', () => {
    fixture.componentRef.setInput('showInfo', false);
    fixture.detectChanges();
    const info = fixture.nativeElement.querySelector('.iu-paginator__info');
    expect(info).toBeNull();
  });

  it('should render all page buttons without ellipsis for small page counts (≤6)', () => {
    fixture.componentRef.setInput('length', 27);
    fixture.componentRef.setInput('pageSize', 9);
    fixture.detectChanges();
    const ellipsis = fixture.nativeElement.querySelectorAll('.iu-paginator__ellipsis');
    expect(ellipsis.length).toBe(0);
    const pageBtns = fixture.nativeElement.querySelectorAll(
      '.iu-paginator__btn:not(.iu-paginator__btn--nav)',
    );
    expect(pageBtns.length).toBe(3);
  });

  it('should include ellipsis sentinel (-1) when page count exceeds 6', () => {
    fixture.componentRef.setInput('length', 200);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('pageIndex' as never, 10);
    fixture.detectChanges();
    const visible = (component as unknown as { visiblePages: () => number[] }).visiblePages();
    expect(visible).toContain(-1);
    const ellipsis = fixture.nativeElement.querySelectorAll('.iu-paginator__ellipsis');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('should mark current page button as active', () => {
    fixture.componentRef.setInput('pageIndex' as never, 1);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.iu-paginator__btn--active');
    expect(active?.textContent?.trim()).toBe('2');
  });

  it('should emit page event when clicking a page number', () => {
    const spy = jest.fn();
    component.page.subscribe(spy);
    const pageBtns = fixture.nativeElement.querySelectorAll(
      '.iu-paginator__btn:not(.iu-paginator__btn--nav)',
    ) as NodeListOf<HTMLButtonElement>;
    pageBtns[1].click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith<[PaginatorPageEvent]>({
      pageIndex: 1,
      previousPageIndex: 0,
      pageSize: 9,
      length: 27,
    });
  });

  it('should navigate via next and prev buttons', () => {
    const spy = jest.fn();
    component.page.subscribe(spy);
    const navBtns = fixture.nativeElement.querySelectorAll(
      '.iu-paginator__btn--nav',
    ) as NodeListOf<HTMLButtonElement>;
    navBtns[2].click();
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(1);
    navBtns[1].click();
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(0);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should jump to last and first pages via « and » buttons', () => {
    const navBtns = fixture.nativeElement.querySelectorAll(
      '.iu-paginator__btn--nav',
    ) as NodeListOf<HTMLButtonElement>;
    navBtns[3].click();
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(2);
    navBtns[0].click();
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(0);
  });

  it('should disable prev/first when on first page and next/last when on last', () => {
    const navBtns = () =>
      fixture.nativeElement.querySelectorAll('.iu-paginator__btn--nav') as NodeListOf<HTMLButtonElement>;
    expect(navBtns()[0].disabled).toBe(true);
    expect(navBtns()[1].disabled).toBe(true);
    fixture.componentRef.setInput('pageIndex' as never, 2);
    fixture.detectChanges();
    expect(navBtns()[2].disabled).toBe(true);
    expect(navBtns()[3].disabled).toBe(true);
  });

  it('should render page size selector and reset to page 0 on size change', () => {
    fixture.componentRef.setInput('pageIndex' as never, 2);
    fixture.detectChanges();
    const spy = jest.fn();
    component.page.subscribe(spy);
    const select = fixture.nativeElement.querySelector(
      '.iu-paginator__select',
    ) as HTMLSelectElement;
    expect(select).toBeTruthy();
    select.value = '12';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.pageIndex()).toBe(0);
    expect(spy).toHaveBeenCalledWith<[PaginatorPageEvent]>({
      pageIndex: 0,
      previousPageIndex: 2,
      pageSize: 12,
      length: 27,
    });
  });

  it('should hide size selector when pageSizeOptions has ≤1 entry', () => {
    fixture.componentRef.setInput('pageSizeOptions', [9]);
    fixture.detectChanges();
    const sizeSelect = fixture.nativeElement.querySelector('.iu-paginator__size-select');
    expect(sizeSelect).toBeNull();
  });
});
