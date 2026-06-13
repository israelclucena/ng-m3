import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyFavouritesComponent } from './my-favourites.component';
import type { PropertyData } from '../property-card/property-card.component';

describe('MyFavouritesComponent', () => {
  let fixture: ComponentFixture<MyFavouritesComponent>;
  let component: MyFavouritesComponent;

  function makeProperty(overrides: Partial<PropertyData> = {}): PropertyData {
    return {
      id: 'p-1',
      title: 'T2 Bairro Alto, Lisboa',
      location: 'Bairro Alto, Lisboa',
      priceMonthly: 1200,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 75,
      type: 'apartment',
      imageUrl: 'https://example.com/p1.jpg',
      ...overrides,
    };
  }

  const cheapSmall = makeProperty({
    id: 'cheap',
    title: 'Estúdio barato',
    priceMonthly: 600,
    areaSqm: 30,
    type: 'studio',
  });
  const midMid = makeProperty({
    id: 'mid',
    title: 'Apartamento médio',
    priceMonthly: 1200,
    areaSqm: 75,
    type: 'apartment',
  });
  const expensiveBig = makeProperty({
    id: 'expensive',
    title: 'Moradia cara',
    priceMonthly: 3000,
    areaSqm: 200,
    type: 'house',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyFavouritesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyFavouritesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Create ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the container', () => {
    expect(fixture.nativeElement.querySelector('.iu-my-favourites')).toBeTruthy();
  });

  // ── Empty state ─────────────────────────────────────────────────────────
  it('shows the empty state when properties is empty (default)', () => {
    const empty = fixture.nativeElement.querySelector('.fav-empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Nenhum favorito ainda');
    expect(fixture.nativeElement.querySelector('.fav-grid')).toBeFalsy();
  });

  it('renders no cards when properties is empty', () => {
    expect(fixture.nativeElement.querySelectorAll('.fav-item').length).toBe(0);
  });

  // ── Grid rendering ──────────────────────────────────────────────────────
  it('renders one .fav-item per property', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid, expensiveBig]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.fav-item').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.fav-empty')).toBeFalsy();
  });

  it('renders the property title and location for each card', () => {
    fixture.componentRef.setInput('properties', [midMid]);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.fav-title') as HTMLElement;
    const location = fixture.nativeElement.querySelector('.fav-location') as HTMLElement;
    expect(title.textContent).toContain('Apartamento médio');
    expect(location.textContent).toContain('Bairro Alto, Lisboa');
  });

  it('renders the property image when imageUrl is set', () => {
    fixture.componentRef.setInput('properties', [makeProperty({ imageUrl: 'https://example.com/x.jpg' })]);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.fav-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/x.jpg');
    expect(fixture.nativeElement.querySelector('.fav-img-placeholder')).toBeFalsy();
  });

  it('renders a placeholder when imageUrl is missing', () => {
    fixture.componentRef.setInput('properties', [makeProperty({ imageUrl: undefined })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img.fav-img')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.fav-img-placeholder')).toBeTruthy();
  });

  // ── Header count ────────────────────────────────────────────────────────
  it('renders singular count text for one property', () => {
    fixture.componentRef.setInput('properties', [midMid]);
    fixture.detectChanges();
    const sub = fixture.nativeElement.querySelector('.header-sub') as HTMLElement;
    expect(sub.textContent).toContain('1 imóvel guardado');
  });

  it('renders plural count text for multiple properties', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid]);
    fixture.detectChanges();
    const sub = fixture.nativeElement.querySelector('.header-sub') as HTMLElement;
    expect(sub.textContent).toContain('2 imóvelis guardados');
  });

  // ── Sort control visibility ─────────────────────────────────────────────
  it('hides the sort control when there is one property or fewer', () => {
    fixture.componentRef.setInput('properties', [midMid]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select.sort-select')).toBeFalsy();
  });

  it('shows the sort control when there is more than one property', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select.sort-select')).toBeTruthy();
  });

  // ── sorted() computed ───────────────────────────────────────────────────
  it('sorted() preserves input order by default', () => {
    fixture.componentRef.setInput('properties', [expensiveBig, cheapSmall, midMid]);
    fixture.detectChanges();
    expect(component.sorted().map((p) => p.id)).toEqual(['expensive', 'cheap', 'mid']);
  });

  it('sorted() orders by price ascending after onSortChange to price-asc', () => {
    fixture.componentRef.setInput('properties', [expensiveBig, cheapSmall, midMid]);
    fixture.detectChanges();

    const sel = fixture.nativeElement.querySelector('select.sort-select') as HTMLSelectElement;
    sel.value = 'price-asc';
    sel.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.sortKey()).toBe('price-asc');
    expect(component.sorted().map((p) => p.id)).toEqual(['cheap', 'mid', 'expensive']);
  });

  it('sorted() orders by price descending after onSortChange to price-desc', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid, expensiveBig]);
    fixture.detectChanges();

    const sel = fixture.nativeElement.querySelector('select.sort-select') as HTMLSelectElement;
    sel.value = 'price-desc';
    sel.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.sorted().map((p) => p.id)).toEqual(['expensive', 'mid', 'cheap']);
  });

  it('sorted() orders by area descending after onSortChange to area', () => {
    fixture.componentRef.setInput('properties', [midMid, expensiveBig, cheapSmall]);
    fixture.detectChanges();

    const sel = fixture.nativeElement.querySelector('select.sort-select') as HTMLSelectElement;
    sel.value = 'area';
    sel.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.sorted().map((p) => p.id)).toEqual(['expensive', 'mid', 'cheap']);
  });

  it('sorted() does not mutate the original properties input array order', () => {
    const list = [expensiveBig, cheapSmall, midMid];
    fixture.componentRef.setInput('properties', list);
    fixture.detectChanges();
    component.sortKey.set('price-asc');
    fixture.detectChanges();
    expect(component.sorted().map((p) => p.id)).toEqual(['cheap', 'mid', 'expensive']);
    // original input array untouched
    expect(list.map((p) => p.id)).toEqual(['expensive', 'cheap', 'mid']);
  });

  it('re-renders cards in sorted order in the DOM', () => {
    fixture.componentRef.setInput('properties', [expensiveBig, cheapSmall, midMid]);
    fixture.detectChanges();
    component.sortKey.set('price-asc');
    fixture.detectChanges();
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.fav-title'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(titles).toEqual(['Estúdio barato', 'Apartamento médio', 'Moradia cara']);
  });

  // ── typeLabel() mapping ─────────────────────────────────────────────────
  it('typeLabel() maps known types to Portuguese labels', () => {
    expect(component.typeLabel('apartment')).toBe('Apartamento');
    expect(component.typeLabel('studio')).toBe('Estúdio');
    expect(component.typeLabel('house')).toBe('Moradia');
    expect(component.typeLabel('penthouse')).toBe('Penthouse');
    expect(component.typeLabel('villa')).toBe('Villa');
  });

  it('typeLabel() falls back to the raw type for unknown values', () => {
    expect(component.typeLabel('castle')).toBe('castle');
  });

  it('renders the type badge label in the card', () => {
    fixture.componentRef.setInput('properties', [makeProperty({ type: 'studio' })]);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.type-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Estúdio');
  });

  // ── remove output ───────────────────────────────────────────────────────
  it('clicking the remove button emits remove with the property', () => {
    fixture.componentRef.setInput('properties', [midMid]);
    fixture.detectChanges();
    const emit = jest.fn();
    component.remove.subscribe(emit);
    const btn = fixture.nativeElement.querySelector('.remove-btn') as HTMLButtonElement;
    btn.click();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(midMid);
  });

  it('emits remove for the correct property when multiple are rendered', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid, expensiveBig]);
    fixture.detectChanges();
    const emit = jest.fn();
    component.remove.subscribe(emit);
    const btns = fixture.nativeElement.querySelectorAll('.remove-btn');
    (btns[1] as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(midMid);
  });

  // ── viewDetail output ───────────────────────────────────────────────────
  it('clicking the view button emits viewDetail with the property', () => {
    fixture.componentRef.setInput('properties', [midMid]);
    fixture.detectChanges();
    const emit = jest.fn();
    component.viewDetail.subscribe(emit);
    const btn = fixture.nativeElement.querySelector('.view-btn') as HTMLButtonElement;
    btn.click();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(midMid);
  });

  it('emits viewDetail for the correct property when multiple are rendered', () => {
    fixture.componentRef.setInput('properties', [cheapSmall, midMid, expensiveBig]);
    fixture.detectChanges();
    const emit = jest.fn();
    component.viewDetail.subscribe(emit);
    const btns = fixture.nativeElement.querySelectorAll('.view-btn');
    (btns[2] as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(expensiveBig);
  });
});
