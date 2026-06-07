import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageListingsComponent, LandlordListing } from './manage-listings.component';

function makeListing(over: Partial<LandlordListing> = {}): LandlordListing {
  return {
    id: 'L1',
    title: 'Apartamento T2 no Príncipe Real',
    location: 'Príncipe Real, Lisboa',
    priceMonthly: 1500,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 85,
    type: 'apartment' as LandlordListing['type'],
    status: 'active',
    inquiries: 5,
    visits: 2,
    listedDate: '2026-05-01',
    ...over,
  };
}

describe('ManageListingsComponent', () => {
  let fixture: ComponentFixture<ManageListingsComponent>;
  let component: ManageListingsComponent;

  const sample: LandlordListing[] = [
    makeListing({ id: 'A', title: 'Casa Activa 1', status: 'active', priceMonthly: 1000, inquiries: 3, visits: 1 }),
    makeListing({ id: 'B', title: 'Casa Activa 2', status: 'active', priceMonthly: 2000, inquiries: 4, visits: 2 }),
    makeListing({ id: 'C', title: 'Casa Pausada', status: 'paused', priceMonthly: 1200, inquiries: 1, visits: 0 }),
    makeListing({ id: 'D', title: 'Casa Arrendada', status: 'rented', priceMonthly: 1800, inquiries: 0, visits: 0 }),
    makeListing({ id: 'E', title: 'Rascunho', status: 'draft', priceMonthly: 900, inquiries: 0, visits: 0 }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageListingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to empty listings, activeStatus="all" and renders the empty state', () => {
    expect(component.listings()).toEqual([]);
    expect(component.activeStatus()).toBe('all');
    const empty = fixture.nativeElement.querySelector('.ml-empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Ainda não tem imóveis listados');
  });

  it('renders the header title and singular count when listings is empty', () => {
    const sub = fixture.nativeElement.querySelector('.header-sub') as HTMLElement;
    expect(sub.textContent).toContain('0 anúncios no total');
    expect(sub.textContent).toContain('0 activos');
  });

  it('uses singular form when there is exactly one listing / one active', () => {
    fixture.componentRef.setInput('listings', [makeListing({ id: 'X', status: 'active' })]);
    fixture.detectChanges();
    const sub = fixture.nativeElement.querySelector('.header-sub') as HTMLElement;
    expect(sub.textContent).toContain('1 anúncio no total');
    expect(sub.textContent).toContain('1 activo');
  });

  it('filtered() returns all listings when activeStatus is "all"', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    expect(component.filtered().length).toBe(sample.length);
  });

  it('filtered() narrows by status when activeStatus changes', () => {
    fixture.componentRef.setInput('listings', sample);
    component.activeStatus.set('active');
    fixture.detectChanges();
    expect(component.filtered().length).toBe(2);
    expect(component.filtered().every(l => l.status === 'active')).toBe(true);
  });

  it('clicking a status tab updates activeStatus and adds the "active" class', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.status-tab') as NodeListOf<HTMLButtonElement>;
    // tabs: all, active, paused, rented, draft
    tabs[2].click();
    fixture.detectChanges();
    expect(component.activeStatus()).toBe('paused');
    expect(tabs[2].classList.contains('active')).toBe(true);
    expect(tabs[0].classList.contains('active')).toBe(false);
  });

  it('renders one badge per status tab with the right count', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.status-tab .tab-badge') as NodeListOf<HTMLElement>;
    expect(badges.length).toBe(5);
    // order: all, active, paused, rented, draft
    expect(badges[0].textContent?.trim()).toBe('5');
    expect(badges[1].textContent?.trim()).toBe('2');
    expect(badges[2].textContent?.trim()).toBe('1');
    expect(badges[3].textContent?.trim()).toBe('1');
    expect(badges[4].textContent?.trim()).toBe('1');
  });

  it('countForStatus("all") returns total, otherwise returns matching count', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    expect(component.countForStatus('all')).toBe(5);
    expect(component.countForStatus('active')).toBe(2);
    expect(component.countForStatus('paused')).toBe(1);
    expect(component.countForStatus('rented')).toBe(1);
    expect(component.countForStatus('draft')).toBe(1);
    expect(component.countForStatus('nope')).toBe(0);
  });

  it('activeCount() counts only listings with status="active"', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    expect(component.activeCount()).toBe(2);
  });

  it('totalInquiries() sums inquiries across all listings', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    expect(component.totalInquiries()).toBe(8);
  });

  it('totalVisits() sums visits across all listings', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    expect(component.totalVisits()).toBe(3);
  });

  it('totalRevenue() sums priceMonthly of active + rented only', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    // active: 1000 + 2000 = 3000, rented: 1800 → 4800
    expect(component.totalRevenue()).toBe(4800);
  });

  it('occupancyRate() returns 0 when there are no listings', () => {
    expect(component.occupancyRate()).toBe(0);
  });

  it('occupancyRate() returns rounded percentage of rented listings', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    // 1 rented of 5 → 20
    expect(component.occupancyRate()).toBe(20);
  });

  it('statusLabel() maps each known status, falling back to raw value', () => {
    expect(component.statusLabel('active')).toBe('Activo');
    expect(component.statusLabel('paused')).toBe('Pausado');
    expect(component.statusLabel('rented')).toBe('Arrendado');
    expect(component.statusLabel('draft')).toBe('Rascunho');
    expect(component.statusLabel('unknown')).toBe('unknown');
  });

  it('renders one table row per filtered listing', () => {
    fixture.componentRef.setInput('listings', sample);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.listing-row');
    expect(rows.length).toBe(5);
    component.activeStatus.set('active');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.listing-row').length).toBe(2);
  });

  it('shows the "sem imóveis nesta categoria" message when filter has no matches', () => {
    fixture.componentRef.setInput('listings', [makeListing({ status: 'active' })]);
    component.activeStatus.set('paused');
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.ml-empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Sem imóveis nesta categoria');
    // and the CTA to add first should NOT show
    expect(empty.querySelector('.btn-primary')).toBeNull();
  });

  it('emits addNew when the header "Novo Imóvel" button is clicked', () => {
    const spy = jest.fn();
    component.addNew.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.header-actions .btn-primary') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits addNew when the empty-state "Adicionar primeiro imóvel" CTA is clicked', () => {
    const spy = jest.fn();
    component.addNew.subscribe(spy);
    const cta = fixture.nativeElement.querySelector('.ml-empty .btn-primary') as HTMLButtonElement;
    expect(cta).toBeTruthy();
    cta.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits edit with the listing when the edit action is clicked', () => {
    const listing = makeListing({ id: 'E1', status: 'active' });
    fixture.componentRef.setInput('listings', [listing]);
    fixture.detectChanges();
    const spy = jest.fn();
    component.edit.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.action-btn.edit') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith(listing);
  });

  it('renders pause button only for active listings and emits pause on click', () => {
    const active = makeListing({ id: 'A1', status: 'active' });
    fixture.componentRef.setInput('listings', [active]);
    fixture.detectChanges();
    const pauseBtn = fixture.nativeElement.querySelector('.action-btn.pause') as HTMLButtonElement;
    expect(pauseBtn).toBeTruthy();
    const spy = jest.fn();
    component.pause.subscribe(spy);
    pauseBtn.click();
    expect(spy).toHaveBeenCalledWith(active);
  });

  it('does NOT render the pause button for non-active listings', () => {
    fixture.componentRef.setInput('listings', [makeListing({ status: 'paused' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.action-btn.pause')).toBeNull();
  });

  it('renders activate button for paused listings and emits activate on click', () => {
    const paused = makeListing({ id: 'P1', status: 'paused' });
    fixture.componentRef.setInput('listings', [paused]);
    fixture.detectChanges();
    const actBtn = fixture.nativeElement.querySelector('.action-btn.activate') as HTMLButtonElement;
    expect(actBtn).toBeTruthy();
    const spy = jest.fn();
    component.activate.subscribe(spy);
    actBtn.click();
    expect(spy).toHaveBeenCalledWith(paused);
  });

  it('renders activate button for draft listings', () => {
    fixture.componentRef.setInput('listings', [makeListing({ status: 'draft' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.action-btn.activate')).toBeTruthy();
  });

  it('does NOT render activate button for rented listings', () => {
    fixture.componentRef.setInput('listings', [makeListing({ status: 'rented' })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.action-btn.activate')).toBeNull();
  });

  it('emits delete with the listing when the delete action is clicked', () => {
    const listing = makeListing({ id: 'D1' });
    fixture.componentRef.setInput('listings', [listing]);
    fixture.detectChanges();
    const spy = jest.fn();
    component.delete.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('.action-btn.del') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledWith(listing);
  });

  it('renders the property thumb as <img> when imageUrl is set', () => {
    fixture.componentRef.setInput('listings', [makeListing({ imageUrl: 'http://x/img.png', title: 'TitleX' })]);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.prop-thumb img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('http://x/img.png');
    expect(img.getAttribute('alt')).toBe('TitleX');
  });

  it('renders the fallback icon when imageUrl is missing', () => {
    fixture.componentRef.setInput('listings', [makeListing({ imageUrl: undefined })]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.prop-thumb img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.prop-thumb .material-symbols-outlined')).toBeTruthy();
  });

  it('renders "Studio" when bedrooms is 0, otherwise "<n> qtos"', () => {
    fixture.componentRef.setInput('listings', [
      makeListing({ id: 'S', bedrooms: 0 }),
      makeListing({ id: 'T2', bedrooms: 2 }),
    ]);
    fixture.detectChanges();
    const metas = fixture.nativeElement.querySelectorAll('.prop-meta') as NodeListOf<HTMLElement>;
    expect(metas[0].textContent).toContain('Studio');
    expect(metas[1].textContent).toContain('2 qtos');
  });

  it('renders the status chip label and class for each listing', () => {
    fixture.componentRef.setInput('listings', [makeListing({ status: 'rented' })]);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.status-chip') as HTMLElement;
    expect(chip.classList.contains('chip-rented')).toBe(true);
    expect(chip.textContent).toContain('Arrendado');
  });
});
