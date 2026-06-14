import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingStatsCardComponent } from './listing-stats-card.component';
import type { ListingStats } from './landlord-analytics.types';

describe('ListingStatsCardComponent', () => {
  let fixture: ComponentFixture<ListingStatsCardComponent>;
  let component: ListingStatsCardComponent;

  const makeStats = (overrides: Partial<ListingStats> = {}): ListingStats => ({
    propertyId: 'p1',
    propertyTitle: 'Apartamento T2 na Graça',
    propertyAddress: 'Rua da Voz do Operário 12, Lisboa',
    status: 'occupied',
    monthlyRent: 1200,
    currency: 'EUR',
    occupancyRate: 92,
    totalViews: 1543,
    totalInquiries: 21,
    activeBookings: 3,
    lastActivity: '2026-06-01',
    rating: 4.6,
    reviewCount: 18,
    ...overrides,
  });

  async function setup(stats: ListingStats = makeStats()): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ListingStatsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListingStatsCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stats', stats);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Header ──────────────────────────────────────────────────────────────────
  it('renders the property title and address', () => {
    const title = fixture.nativeElement.querySelector(
      '.iu-ls-card__title',
    ) as HTMLElement;
    const address = fixture.nativeElement.querySelector(
      '.iu-ls-card__address',
    ) as HTMLElement;
    expect(title.textContent).toContain('Apartamento T2 na Graça');
    expect(address.textContent).toContain('Rua da Voz do Operário 12, Lisboa');
  });

  it('applies the status modifier class to the root', () => {
    const card = fixture.nativeElement.querySelector(
      '.iu-ls-card',
    ) as HTMLElement;
    expect(card.classList.contains('iu-ls-card--occupied')).toBe(true);
  });

  // ── Status computeds ────────────────────────────────────────────────────────
  it('statusIcon / statusLabel reflect the occupied status', () => {
    expect(component.statusIcon()).toBe('home');
    expect(component.statusLabel()).toBe('Ocupado');
  });

  it('statusIcon / statusLabel reflect the vacant status', async () => {
    await setup(makeStats({ status: 'vacant' }));
    expect(component.statusIcon()).toBe('home_work');
    expect(component.statusLabel()).toBe('Disponível');
    expect(
      (fixture.nativeElement.querySelector('.iu-ls-card') as HTMLElement)
        .classList.contains('iu-ls-card--vacant'),
    ).toBe(true);
  });

  it('statusIcon / statusLabel reflect the pending status', async () => {
    await setup(makeStats({ status: 'pending' }));
    expect(component.statusIcon()).toBe('hourglass_top');
    expect(component.statusLabel()).toBe('Pendente');
  });

  it('statusIcon / statusLabel reflect the maintenance status', async () => {
    await setup(makeStats({ status: 'maintenance' }));
    expect(component.statusIcon()).toBe('construction');
    expect(component.statusLabel()).toBe('Manutenção');
  });

  it('renders the status label in the badge', () => {
    const badge = fixture.nativeElement.querySelector(
      '.iu-ls-card__status-badge',
    ) as HTMLElement;
    expect(badge.textContent).toContain('Ocupado');
  });

  // ── Highlights ──────────────────────────────────────────────────────────────
  it('renders the occupancy rate highlight', () => {
    const highlights = fixture.nativeElement.querySelectorAll(
      '.iu-ls-card__highlight-value',
    );
    // [0] rent, [1] occupancy
    expect((highlights[1] as HTMLElement).textContent).toContain('92%');
  });

  it('sets the occupancy bar fill width to the occupancy rate', () => {
    const fill = fixture.nativeElement.querySelector(
      '.iu-ls-card__occ-fill',
    ) as HTMLElement;
    expect(fill.style.width).toBe('92%');
  });

  // ── Stats grid ──────────────────────────────────────────────────────────────
  it('renders the rating stat when rating is defined', () => {
    const stats = fixture.nativeElement.querySelectorAll('.iu-ls-card__stat');
    // views, inquiries, bookings, rating
    expect(stats.length).toBe(4);
  });

  it('hides the rating stat when rating is undefined', async () => {
    await setup(makeStats({ rating: undefined }));
    const stats = fixture.nativeElement.querySelectorAll('.iu-ls-card__stat');
    expect(stats.length).toBe(3);
  });

  it('renders the inquiry and booking counts', () => {
    const values = fixture.nativeElement.querySelectorAll(
      '.iu-ls-card__stat-value',
    );
    const text = Array.from(values).map((v) => (v as HTMLElement).textContent);
    expect(text.some((t) => t?.includes('21'))).toBe(true);
    expect(text.some((t) => t?.includes('3'))).toBe(true);
  });

  // ── Last activity ───────────────────────────────────────────────────────────
  it('renders the last activity row when present', () => {
    expect(
      fixture.nativeElement.querySelector('.iu-ls-card__activity'),
    ).toBeTruthy();
  });

  it('hides the last activity row when absent', async () => {
    await setup(makeStats({ lastActivity: undefined }));
    expect(
      fixture.nativeElement.querySelector('.iu-ls-card__activity'),
    ).toBeFalsy();
  });

  // ── Outputs ─────────────────────────────────────────────────────────────────
  it('emits viewDetails with the property id when "Ver anúncio" is clicked', () => {
    const spy = jest.fn();
    component.viewDetails.subscribe(spy);
    const btn = fixture.nativeElement.querySelector(
      '.iu-ls-card__btn--secondary',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('p1');
  });

  it('emits editListing with the property id when "Editar" is clicked', () => {
    const spy = jest.fn();
    component.editListing.subscribe(spy);
    const btn = fixture.nativeElement.querySelector(
      '.iu-ls-card__btn--primary',
    ) as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('p1');
  });
});
