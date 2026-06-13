import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyComparisonComponent } from './property-comparison.component';
import type { PropertyData } from '../property-card/property-card.component';

describe('PropertyComparisonComponent', () => {
  let fixture: ComponentFixture<PropertyComparisonComponent>;
  let component: PropertyComparisonComponent;

  let idSeq = 0;
  const makeProperty = (overrides: Partial<PropertyData> = {}): PropertyData => ({
    id: `prop-${idSeq++}`,
    title: 'Apartamento T2 na Graça',
    location: 'Graça, Lisboa',
    priceMonthly: 1200,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 70,
    type: 'apartment',
    imageUrl: 'https://example.com/apt.jpg',
    availableFrom: '2026-07-01',
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyComparisonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Create ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the comparison container', () => {
    expect(fixture.nativeElement.querySelector('.iu-comparison')).toBeTruthy();
  });

  // ── Empty / insufficient state ──────────────────────────────────────────
  it('renders the empty state when properties is empty (default)', () => {
    const empty = fixture.nativeElement.querySelector('.iu-comparison__empty');
    expect(empty).toBeTruthy();
    expect((empty as HTMLElement).textContent).toContain(
      'Adicione pelo menos 2 imóveis',
    );
  });

  it('renders the empty state when only one property is provided', () => {
    fixture.componentRef.setInput('properties', [makeProperty()]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-comparison__empty')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.iu-comparison__header')).toBeFalsy();
  });

  it('does not render the empty state once two properties are provided', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.iu-comparison__empty')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.iu-comparison__header')).toBeTruthy();
  });

  // ── Column rendering ────────────────────────────────────────────────────
  it('renders one header property cell per property (plus the label cell)', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ title: 'A' }),
      makeProperty({ title: 'B' }),
      makeProperty({ title: 'C' }),
    ]);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll(
      '.iu-comparison__header-cell',
    );
    // 1 label cell + 3 property cells
    expect(cells.length).toBe(4);
  });

  it('renders the property title and location in each column', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ title: 'T2 Graça', location: 'Graça, Lisboa' }),
      makeProperty({ title: 'T1 Alfama', location: 'Alfama, Lisboa' }),
    ]);
    fixture.detectChanges();
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-comparison__title'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(titles).toContain('T2 Graça');
    expect(titles).toContain('T1 Alfama');

    const locations = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-comparison__location'),
    ).map((el) => (el as HTMLElement).textContent);
    expect(locations.some((t) => t?.includes('Graça, Lisboa'))).toBe(true);
    expect(locations.some((t) => t?.includes('Alfama, Lisboa'))).toBe(true);
  });

  it('renders the image when imageUrl is set', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ imageUrl: 'https://example.com/one.jpg' }),
      makeProperty({ imageUrl: 'https://example.com/two.jpg' }),
    ]);
    fixture.detectChanges();
    const imgs = fixture.nativeElement.querySelectorAll('img.iu-comparison__img');
    expect(imgs.length).toBe(2);
    expect((imgs[0] as HTMLImageElement).getAttribute('src')).toBe(
      'https://example.com/one.jpg',
    );
    expect(
      fixture.nativeElement.querySelector('.iu-comparison__img-placeholder'),
    ).toBeFalsy();
  });

  it('renders the type emoji placeholder when no imageUrl is provided', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ imageUrl: undefined, type: 'house' }),
      makeProperty({ imageUrl: undefined, type: 'villa' }),
    ]);
    fixture.detectChanges();
    const placeholders = fixture.nativeElement.querySelectorAll(
      '.iu-comparison__img-placeholder',
    );
    expect(placeholders.length).toBe(2);
    expect(fixture.nativeElement.querySelector('img.iu-comparison__img')).toBeFalsy();
    expect((placeholders[0] as HTMLElement).textContent?.trim()).toBe('🏠');
    expect((placeholders[1] as HTMLElement).textContent?.trim()).toBe('🏡');
  });

  // ── Comparison rows ─────────────────────────────────────────────────────
  it('renders one row per comparison metric (7 rows)', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.iu-comparison__row');
    expect(rows.length).toBe(7);
  });

  it('renders the row labels', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-comparison__row-label'),
    ).map((el) => (el as HTMLElement).textContent);
    expect(labels.some((t) => t?.includes('Preço / mês'))).toBe(true);
    expect(labels.some((t) => t?.includes('Área'))).toBe(true);
    expect(labels.some((t) => t?.includes('Quartos'))).toBe(true);
    expect(labels.some((t) => t?.includes('Casas de banho'))).toBe(true);
    expect(labels.some((t) => t?.includes('Tipo'))).toBe(true);
    expect(labels.some((t) => t?.includes('Disponível'))).toBe(true);
    expect(labels.some((t) => t?.includes('Preço / m²'))).toBe(true);
  });

  it('renders one value cell per property in each row', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty(),
      makeProperty(),
      makeProperty(),
    ]);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('.iu-comparison__cell');
    // 7 rows × 3 properties
    expect(cells.length).toBe(21);
  });

  it('renders the formatted value inside the cells', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ areaSqm: 70, bedrooms: 2 }),
      makeProperty({ areaSqm: 90, bedrooms: 3 }),
    ]);
    fixture.detectChanges();
    const cellTexts = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-comparison__cell'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(cellTexts).toContain('70 m²');
    expect(cellTexts).toContain('90 m²');
    expect(cellTexts).toContain('T2');
    expect(cellTexts).toContain('T3');
  });

  it('renders "Estúdio" for zero bedrooms', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ bedrooms: 0 }),
      makeProperty({ bedrooms: 2 }),
    ]);
    fixture.detectChanges();
    const cellTexts = Array.from(
      fixture.nativeElement.querySelectorAll('.iu-comparison__cell'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(cellTexts).toContain('Estúdio');
  });

  // ── Best-value highlighting ─────────────────────────────────────────────
  it('applies the --best class to the cheapest monthly price', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ priceMonthly: 1500, areaSqm: 70 }),
      makeProperty({ priceMonthly: 900, areaSqm: 70 }),
    ]);
    fixture.detectChanges();
    // First row = "Preço / mês" (highlight min)
    const firstRow = fixture.nativeElement.querySelectorAll('.iu-comparison__row')[0];
    const cells = firstRow.querySelectorAll('.iu-comparison__cell');
    expect(
      (cells[0] as HTMLElement).classList.contains('iu-comparison__cell--best'),
    ).toBe(false);
    expect(
      (cells[1] as HTMLElement).classList.contains('iu-comparison__cell--best'),
    ).toBe(true);
  });

  it('applies the --best class to the largest area', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ areaSqm: 60 }),
      makeProperty({ areaSqm: 120 }),
    ]);
    fixture.detectChanges();
    // Second row = "Área" (highlight max)
    const areaRow = fixture.nativeElement.querySelectorAll('.iu-comparison__row')[1];
    const cells = areaRow.querySelectorAll('.iu-comparison__cell');
    expect(
      (cells[0] as HTMLElement).classList.contains('iu-comparison__cell--best'),
    ).toBe(false);
    expect(
      (cells[1] as HTMLElement).classList.contains('iu-comparison__cell--best'),
    ).toBe(true);
  });

  it('does not highlight the "Tipo" row (no highlight rule)', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty({ type: 'apartment' }),
      makeProperty({ type: 'villa' }),
    ]);
    fixture.detectChanges();
    // Fifth row (index 4) = "Tipo"
    const tipoRow = fixture.nativeElement.querySelectorAll('.iu-comparison__row')[4];
    const cells = tipoRow.querySelectorAll('.iu-comparison__cell');
    cells.forEach((cell: Element) => {
      expect(
        (cell as HTMLElement).classList.contains('iu-comparison__cell--best'),
      ).toBe(false);
    });
  });

  it('isBestValue returns true for the min-price property and false otherwise', () => {
    const cheap = makeProperty({ priceMonthly: 800, areaSqm: 70 });
    const pricey = makeProperty({ priceMonthly: 1600, areaSqm: 70 });
    fixture.componentRef.setInput('properties', [pricey, cheap]);
    fixture.detectChanges();
    const priceRow = (component as any).rows[0]; // "Preço / mês", highlight min
    expect((component as any).isBestValue(priceRow, cheap)).toBe(true);
    expect((component as any).isBestValue(priceRow, pricey)).toBe(false);
  });

  it('isBestValue returns false for a row without a highlight rule', () => {
    const a = makeProperty();
    const b = makeProperty();
    fixture.componentRef.setInput('properties', [a, b]);
    fixture.detectChanges();
    const tipoRow = (component as any).rows[4]; // "Tipo", no highlight
    expect((component as any).isBestValue(tipoRow, a)).toBe(false);
  });

  // ── typeEmoji mapping ───────────────────────────────────────────────────
  it('typeEmoji maps known property types to emoji', () => {
    expect((component as any).typeEmoji('apartment')).toBe('🏢');
    expect((component as any).typeEmoji('house')).toBe('🏠');
    expect((component as any).typeEmoji('studio')).toBe('🛋️');
    expect((component as any).typeEmoji('room')).toBe('🚪');
    expect((component as any).typeEmoji('villa')).toBe('🏡');
    expect((component as any).typeEmoji('penthouse')).toBe('🌆');
  });

  it('typeEmoji falls back to the house emoji for an unknown type', () => {
    expect((component as any).typeEmoji('unknown' as PropertyData['type'])).toBe('🏠');
  });

  // ── gridColumns ─────────────────────────────────────────────────────────
  it('gridColumns reflects the number of properties', () => {
    fixture.componentRef.setInput('properties', [
      makeProperty(),
      makeProperty(),
      makeProperty(),
    ]);
    fixture.detectChanges();
    expect((component as any).gridColumns()).toBe('180px repeat(3, 1fr)');
  });

  // ── Remove buttons ──────────────────────────────────────────────────────
  it('does not render remove buttons when showRemove is false (default)', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.iu-comparison__remove-btn'),
    ).toBeFalsy();
  });

  it('renders one remove button per property when showRemove is true', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.componentRef.setInput('showRemove', true);
    fixture.detectChanges();
    const btns = fixture.nativeElement.querySelectorAll('.iu-comparison__remove-btn');
    expect(btns.length).toBe(2);
  });

  it('clicking a remove button emits removeProperty with the property id', () => {
    const a = makeProperty({ id: 'id-a' });
    const b = makeProperty({ id: 'id-b' });
    fixture.componentRef.setInput('properties', [a, b]);
    fixture.componentRef.setInput('showRemove', true);
    fixture.detectChanges();
    const emit = jest.fn();
    component.removeProperty.subscribe(emit);
    const btns = fixture.nativeElement.querySelectorAll('.iu-comparison__remove-btn');
    (btns[1] as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('id-b');
  });

  it('emits numeric ids unchanged from the remove button', () => {
    const a = makeProperty({ id: 101 });
    const b = makeProperty({ id: 202 });
    fixture.componentRef.setInput('properties', [a, b]);
    fixture.componentRef.setInput('showRemove', true);
    fixture.detectChanges();
    const emit = jest.fn();
    component.removeProperty.subscribe(emit);
    const btns = fixture.nativeElement.querySelectorAll('.iu-comparison__remove-btn');
    (btns[0] as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalledWith(101);
  });

  // ── Reactivity ──────────────────────────────────────────────────────────
  it('updates rendered columns when the properties input changes', () => {
    fixture.componentRef.setInput('properties', [makeProperty(), makeProperty()]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.iu-comparison__header-cell').length,
    ).toBe(3);

    fixture.componentRef.setInput('properties', [
      makeProperty(),
      makeProperty(),
      makeProperty(),
    ]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.iu-comparison__header-cell').length,
    ).toBe(4);
  });
});
