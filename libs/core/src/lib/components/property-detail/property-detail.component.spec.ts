import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyDetailComponent, type PropertyDetail } from './property-detail.component';
import type { PropertyData } from '../property-card/property-card.component';

/** Build a PropertyDetail fixture, overridable per test. */
function property(over: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: 'p1',
    title: 'T2 em Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1450,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 78,
    type: 'apartment',
    imageUrl: 'https://img/main.jpg',
    badges: [],
    ...over,
  } as PropertyDetail;
}

describe('PropertyDetailComponent', () => {
  let fixture: ComponentFixture<PropertyDetailComponent>;
  let component: PropertyDetailComponent;

  function setup(p: PropertyData = property()): void {
    fixture.componentRef.setInput('property', p);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyDetailComponent);
    component = fixture.componentInstance;
  });

  // ── defaults ───────────────────────────────────────────────────────────────────

  it('defaults to not favourited and the first image active', () => {
    setup();
    expect(component.favourited()).toBe(false);
    expect(component.activeIndex()).toBe(0);
  });

  // ── images ───────────────────────────────────────────────────────────────────

  it('combines imageUrl and extra images into the gallery', () => {
    setup(property({ imageUrl: 'main.jpg', images: ['a.jpg', 'b.jpg'] }));
    expect(component.allImages()).toEqual(['main.jpg', 'a.jpg', 'b.jpg']);
    expect(component.activeImage()).toBe('main.jpg');
  });

  it('returns an empty gallery and null active image when no images', () => {
    setup(property({ imageUrl: undefined, images: undefined }));
    expect(component.allImages()).toEqual([]);
    expect(component.activeImage()).toBeNull();
  });

  it('navigates images with next/prev and clamps at the edges', () => {
    setup(property({ imageUrl: '0.jpg', images: ['1.jpg', '2.jpg'] }));
    expect(component.activeIndex()).toBe(0);

    component.prevImage();
    expect(component.activeIndex()).toBe(0); // clamped at start

    component.nextImage();
    component.nextImage();
    expect(component.activeIndex()).toBe(2);

    component.nextImage();
    expect(component.activeIndex()).toBe(2); // clamped at end

    component.setImage(1);
    expect(component.activeImage()).toBe('1.jpg');
  });

  // ── formatting ───────────────────────────────────────────────────────────────

  it('formats the monthly price in EUR', () => {
    setup(property({ priceMonthly: 1450 }));
    const formatted = component.formattedPrice();
    expect(formatted).toContain('450');
    expect(formatted).toMatch(/€|EUR/);
  });

  it('formats the condo fee when present and returns empty string otherwise', () => {
    setup(property({ condoFee: 80 }));
    expect(component.formattedCondoFee()).toMatch(/80/);

    setup(property({ condoFee: undefined }));
    expect(component.formattedCondoFee()).toBe('');
  });

  // ── labels ───────────────────────────────────────────────────────────────────

  it('maps the property type to a Portuguese label', () => {
    setup(property({ type: 'studio' }));
    expect(component.typeLabel()).toBe('Estúdio');
    setup(property({ type: 'villa' }));
    expect(component.typeLabel()).toBe('Moradia');
  });

  it('labels bedrooms as "Estúdio" for 0 and "T{n}" otherwise', () => {
    setup(property({ bedrooms: 0 }));
    expect(component.bedroomsLabel()).toBe('Estúdio');
    setup(property({ bedrooms: 3 }));
    expect(component.bedroomsLabel()).toBe('T3');
  });

  it('caps visible badges at four', () => {
    setup(property({ badges: ['new', 'featured', 'available', 'verified', 'rented'] }));
    expect(component.visibleBadges().length).toBe(4);
  });

  it('maps badge keys to Portuguese labels', () => {
    setup();
    expect(component.badgeLabel('new')).toBe('Novo');
    expect(component.badgeLabel('verified')).toBe('Verificado');
  });

  // ── outputs ──────────────────────────────────────────────────────────────────

  it('onClose emits the closed output', () => {
    setup();
    let closed = 0;
    component.closed.subscribe(() => closed++);
    component.onClose();
    expect(closed).toBe(1);
  });

  it('toggles favourite and emits the new state', () => {
    setup();
    const events: { property: PropertyData; isFavourited: boolean }[] = [];
    component.favouriteToggle.subscribe((e) => events.push(e));

    component.onFavClick();
    expect(component.favourited()).toBe(true);
    expect(events[0].isFavourited).toBe(true);

    component.onFavClick();
    expect(component.favourited()).toBe(false);
    expect(events[1].isFavourited).toBe(false);
  });

  it('emits contact, schedule and share with the property', () => {
    setup();
    let contact: PropertyData | null = null;
    let schedule: PropertyData | null = null;
    let share: PropertyData | null = null;
    component.contactClick.subscribe((p) => (contact = p));
    component.scheduleClick.subscribe((p) => (schedule = p));
    component.shareClick.subscribe((p) => (share = p));

    component.onContact();
    component.onSchedule();
    component.onShare();

    expect(contact!.id).toBe('p1');
    expect(schedule!.id).toBe('p1');
    expect(share!.id).toBe('p1');
  });
});
