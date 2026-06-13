import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyCardComponent } from './property-card.component';
import type { PropertyData } from './property-card.component';

describe('PropertyCardComponent', () => {
  let fixture: ComponentFixture<PropertyCardComponent>;
  let component: PropertyCardComponent;

  const makeProperty = (
    overrides: Partial<PropertyData> = {},
  ): PropertyData => ({
    id: 'p-1',
    title: 'Apartamento T2 no Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1500,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 85,
    type: 'apartment',
    imageUrl: 'https://example.com/apt.jpg',
    badges: ['new', 'verified'],
    isFavourited: false,
    availableFrom: '1 de julho',
    ...overrides,
  });

  async function setup(
    property: PropertyData = makeProperty(),
  ): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PropertyCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('property', property);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  // ── Create ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Rendering: title / location / price ─────────────────────────────────
  it('renders the property title and location', () => {
    const title = fixture.nativeElement.querySelector(
      '.iu-property-card__title',
    ) as HTMLElement;
    const location = fixture.nativeElement.querySelector(
      '.iu-property-card__location',
    ) as HTMLElement;
    expect(title.textContent).toContain('Apartamento T2 no Príncipe Real');
    expect(location.textContent).toContain('Príncipe Real, Lisboa');
  });

  it('renders the formatted price with /mês unit', () => {
    const price = fixture.nativeElement.querySelector(
      '.iu-property-card__price',
    ) as HTMLElement;
    // pt-PT EUR formatting, no decimals — assert the digits are present
    expect(price.textContent).toContain('1');
    expect(price.textContent).toContain('500');
    expect(price.textContent).toContain('€');
    expect(price.textContent).toContain('/mês');
  });

  // ── Hero image / placeholder ────────────────────────────────────────────
  it('renders the hero image when imageUrl is set', () => {
    const img = fixture.nativeElement.querySelector(
      'img.iu-property-card__image',
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/apt.jpg');
    expect(
      fixture.nativeElement.querySelector(
        '.iu-property-card__image-placeholder',
      ),
    ).toBeFalsy();
  });

  it('renders a placeholder when no imageUrl is provided', async () => {
    await setup(makeProperty({ imageUrl: undefined }));
    expect(
      fixture.nativeElement.querySelector('img.iu-property-card__image'),
    ).toBeFalsy();
    expect(
      fixture.nativeElement.querySelector(
        '.iu-property-card__image-placeholder',
      ),
    ).toBeTruthy();
  });

  // ── isFeatured computed ─────────────────────────────────────────────────
  it('isFeatured is false when badges do not include "featured"', () => {
    expect(component.isFeatured()).toBe(false);
    const card = fixture.nativeElement.querySelector(
      '.iu-property-card',
    ) as HTMLElement;
    expect(card.classList.contains('iu-property-card--featured')).toBe(false);
  });

  it('isFeatured is true and applies modifier class when badges include "featured"', async () => {
    await setup(makeProperty({ badges: ['featured'] }));
    expect(component.isFeatured()).toBe(true);
    const card = fixture.nativeElement.querySelector(
      '.iu-property-card',
    ) as HTMLElement;
    expect(card.classList.contains('iu-property-card--featured')).toBe(true);
  });

  it('isFeatured is false when badges is undefined', async () => {
    await setup(makeProperty({ badges: undefined }));
    expect(component.isFeatured()).toBe(false);
  });

  // ── formattedPrice computed ─────────────────────────────────────────────
  it('formattedPrice formats as pt-PT EUR with no fraction digits', () => {
    expect(component.formattedPrice()).toBe(
      new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(1500),
    );
  });

  // ── visibleBadges computed ──────────────────────────────────────────────
  it('visibleBadges returns the badges and renders one chip per badge', () => {
    expect(component.visibleBadges()).toEqual(['new', 'verified']);
    const chips = fixture.nativeElement.querySelectorAll(
      '.iu-property-card__badge',
    );
    expect(chips.length).toBe(2);
  });

  it('visibleBadges caps the list at 3 badges', async () => {
    await setup(
      makeProperty({
        badges: ['new', 'featured', 'available', 'rented', 'verified'],
      }),
    );
    expect(component.visibleBadges().length).toBe(3);
    expect(component.visibleBadges()).toEqual(['new', 'featured', 'available']);
    const chips = fixture.nativeElement.querySelectorAll(
      '.iu-property-card__badge',
    );
    expect(chips.length).toBe(3);
  });

  it('renders no badge overlay when there are no badges', async () => {
    await setup(makeProperty({ badges: [] }));
    expect(component.visibleBadges()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('.iu-property-card__badges'),
    ).toBeFalsy();
  });

  it('applies a badge modifier class and translated label per badge', () => {
    const chips = fixture.nativeElement.querySelectorAll(
      '.iu-property-card__badge',
    );
    expect(
      (chips[0] as HTMLElement).classList.contains(
        'iu-property-card__badge--new',
      ),
    ).toBe(true);
    expect((chips[0] as HTMLElement).textContent).toContain('Novo');
    expect(
      (chips[1] as HTMLElement).classList.contains(
        'iu-property-card__badge--verified',
      ),
    ).toBe(true);
    expect((chips[1] as HTMLElement).textContent).toContain('Verificado');
  });

  // ── badgeLabel method ───────────────────────────────────────────────────
  it('badgeLabel maps each badge to its pt-PT label', () => {
    expect(component.badgeLabel('new')).toBe('Novo');
    expect(component.badgeLabel('featured')).toBe('Destaque');
    expect(component.badgeLabel('available')).toBe('Disponível');
    expect(component.badgeLabel('rented')).toBe('Arrendado');
    expect(component.badgeLabel('verified')).toBe('Verificado');
  });

  // ── typeLabel computed ──────────────────────────────────────────────────
  it('typeLabel maps the property type to its pt-PT label and renders it', () => {
    expect(component.typeLabel()).toBe('Apartamento');
    const chip = fixture.nativeElement.querySelector(
      '.iu-property-card__type',
    ) as HTMLElement;
    expect(chip.textContent).toContain('Apartamento');
  });

  it('typeLabel maps every known property type', async () => {
    const cases: Array<[PropertyData['type'], string]> = [
      ['apartment', 'Apartamento'],
      ['house', 'Casa'],
      ['studio', 'Estúdio'],
      ['room', 'Quarto'],
      ['villa', 'Moradia'],
      ['penthouse', 'Penthouse'],
    ];
    for (const [type, label] of cases) {
      await setup(makeProperty({ type }));
      expect(component.typeLabel()).toBe(label);
    }
  });

  // ── bedroomsLabel computed ──────────────────────────────────────────────
  it('bedroomsLabel returns "Estúdio" for 0 bedrooms', async () => {
    await setup(makeProperty({ bedrooms: 0 }));
    expect(component.bedroomsLabel()).toBe('Estúdio');
  });

  it('bedroomsLabel returns "T{n}" for n bedrooms', () => {
    expect(component.bedroomsLabel()).toBe('T2');
  });

  it('renders the bedrooms label in the specs row', () => {
    const specs = fixture.nativeElement.querySelector(
      '.iu-property-card__specs',
    ) as HTMLElement;
    expect(specs.textContent).toContain('T2');
  });

  // ── Specs conditional rendering ─────────────────────────────────────────
  it('renders bathrooms and area specs when present', () => {
    const specs = fixture.nativeElement.querySelector(
      '.iu-property-card__specs',
    ) as HTMLElement;
    expect(specs.textContent).toContain('1 WC');
    expect(specs.textContent).toContain('85 m²');
  });

  it('omits bathrooms and area specs when they are zero', async () => {
    await setup(makeProperty({ bathrooms: 0, areaSqm: 0 }));
    const specs = fixture.nativeElement.querySelector(
      '.iu-property-card__specs',
    ) as HTMLElement;
    expect(specs.textContent).not.toContain('WC');
    expect(specs.textContent).not.toContain('m²');
  });

  // ── availableFrom conditional ───────────────────────────────────────────
  it('renders the availability note when availableFrom is set', () => {
    const available = fixture.nativeElement.querySelector(
      '.iu-property-card__available',
    ) as HTMLElement;
    expect(available).toBeTruthy();
    expect(available.textContent).toContain('Disponível');
    expect(available.textContent).toContain('1 de julho');
  });

  it('omits the availability note when availableFrom is not set', async () => {
    await setup(makeProperty({ availableFrom: undefined }));
    expect(
      fixture.nativeElement.querySelector('.iu-property-card__available'),
    ).toBeFalsy();
  });

  // ── cardClick output ────────────────────────────────────────────────────
  it('onCardClick emits the property via cardClick', () => {
    const spy = jest.fn();
    component.cardClick.subscribe(spy);
    component.onCardClick();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual(component.property());
  });

  it('clicking the card body emits cardClick with the property', () => {
    const spy = jest.fn();
    component.cardClick.subscribe(spy);
    const card = fixture.nativeElement.querySelector(
      '.iu-property-card',
    ) as HTMLElement;
    card.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].id).toBe('p-1');
  });

  // ── favouriteToggle output ──────────────────────────────────────────────
  it('onFavClick toggles favourited and emits the property with isFavourited', () => {
    const spy = jest.fn();
    component.favouriteToggle.subscribe(spy);
    expect(component.favourited()).toBe(false);

    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.onFavClick(event);

    expect((event.stopPropagation as jest.Mock)).toHaveBeenCalledTimes(1);
    expect(component.favourited()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0][0] as {
      property: PropertyData;
      isFavourited: boolean;
    };
    expect(payload.isFavourited).toBe(true);
    expect(payload.property).toEqual(component.property());
  });

  it('onFavClick toggles back to false on a second call', () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.onFavClick(event);
    expect(component.favourited()).toBe(true);
    component.onFavClick(event);
    expect(component.favourited()).toBe(false);
  });

  it('clicking the favourite button emits favouriteToggle and does not emit cardClick', () => {
    const favSpy = jest.fn();
    const cardSpy = jest.fn();
    component.favouriteToggle.subscribe(favSpy);
    component.cardClick.subscribe(cardSpy);

    const favBtn = fixture.nativeElement.querySelector(
      '.iu-property-card__fav',
    ) as HTMLButtonElement;
    favBtn.click();
    fixture.detectChanges();

    expect(favSpy).toHaveBeenCalledTimes(1);
    // stopPropagation prevents the card click handler from firing
    expect(cardSpy).not.toHaveBeenCalled();
  });

  it('favourite button reflects active state and aria-pressed after toggle', () => {
    const favBtn = fixture.nativeElement.querySelector(
      '.iu-property-card__fav',
    ) as HTMLButtonElement;
    expect(favBtn.classList.contains('iu-property-card__fav--active')).toBe(
      false,
    );
    expect(favBtn.getAttribute('aria-pressed')).toBe('false');

    favBtn.click();
    fixture.detectChanges();

    expect(favBtn.classList.contains('iu-property-card__fav--active')).toBe(
      true,
    );
    expect(favBtn.getAttribute('aria-pressed')).toBe('true');
  });
});
