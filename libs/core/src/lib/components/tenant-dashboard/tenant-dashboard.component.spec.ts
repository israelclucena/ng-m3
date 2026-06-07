import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TenantDashboardComponent } from './tenant-dashboard.component';
import {
  TenantDashboardService,
  TenantDashboard,
  TenantKPIs,
  TenantPayment,
  TenantBooking,
  TenantFavouriteProperty,
  TenantSpendingPoint,
} from '../../services/tenant-dashboard.service';

describe('TenantDashboardComponent', () => {
  let fixture: ComponentFixture<TenantDashboardComponent>;
  let component: TenantDashboardComponent;

  const kpis: TenantKPIs = {
    totalPaidTtm: 13750,
    avgMonthlySpend: 1250,
    activeBookings: 1,
    completedRentals: 2,
    savedFavourites: 4,
    peakMonth: 'Set 2025',
    currency: 'EUR',
  };

  const payments: TenantPayment[] = [
    {
      id: 'pay-1',
      invoiceRef: 'INV-2026-0100',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Alecrim 45',
      paidAt: '2026-03-01',
      amount: 1250,
      status: 'pending',
      monthLabel: 'Mar 2026',
    },
    {
      id: 'pay-2',
      invoiceRef: 'INV-2026-0099',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Alecrim 45',
      paidAt: '2026-02-01',
      amount: 1250,
      status: 'paid',
      monthLabel: 'Fev 2026',
    },
    {
      id: 'pay-3',
      invoiceRef: 'INV-2026-0098',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Alecrim 45',
      paidAt: '2026-01-01',
      amount: 1250,
      status: 'overdue',
      monthLabel: 'Jan 2026',
    },
  ];

  const bookings: TenantBooking[] = [
    {
      id: 'bk-001',
      propertyTitle: 'Apartamento T2 — Bairro Alto',
      propertyAddress: 'Rua do Alecrim 45, 1200-018 Lisboa',
      startDate: '2025-04-01',
      endDate: '2026-09-30',
      monthlyRent: 1250,
      status: 'active',
    },
    {
      id: 'bk-002',
      propertyTitle: 'Studio Moderno — Príncipe Real',
      propertyAddress: 'Rua Dom Pedro V 78, 1250-095 Lisboa',
      startDate: '2026-10-01',
      endDate: '2027-09-30',
      monthlyRent: 1100,
      status: 'upcoming',
      daysUntilStart: 187,
    },
  ];

  const favourites: TenantFavouriteProperty[] = [
    {
      id: 'fav-1',
      title: 'Studio em Alfama',
      address: 'Beco do Espírito Santo 8',
      neighbourhood: 'Alfama',
      monthlyRent: 950,
      savedAt: '2026-03-15',
      available: true,
      rating: 4.3,
    },
    {
      id: 'fav-2',
      title: 'T1 com Vista Rio',
      address: 'Rua Nova do Carvalho 12',
      neighbourhood: 'Cais do Sodré',
      monthlyRent: 1350,
      savedAt: '2026-03-10',
      available: false,
    },
  ];

  const spendingHistory: TenantSpendingPoint[] = [
    { month: 'Abr', rent: 1200, fees: 60, total: 1260 },
    { month: 'Mai', rent: 1200, fees: 60, total: 1260 },
    { month: 'Set', rent: 1250, fees: 60, total: 1310 },
  ];

  const dashboard: TenantDashboard = {
    kpis,
    payments,
    bookings,
    favourites,
    spendingHistory,
    lastUpdated: '2026-03-15T00:00:00.000Z',
  };

  let mockSvc: {
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    dashboard: ReturnType<typeof signal<TenantDashboard | null>>;
    kpis: ReturnType<typeof signal<TenantKPIs | null>>;
    payments: ReturnType<typeof signal<TenantPayment[]>>;
    bookings: ReturnType<typeof signal<TenantBooking[]>>;
    favourites: ReturnType<typeof signal<TenantFavouriteProperty[]>>;
    spendingHistory: ReturnType<typeof signal<TenantSpendingPoint[]>>;
    paidCount: ReturnType<typeof signal<number>>;
    totalPaidTtm: ReturnType<typeof signal<number>>;
    activeRental: ReturnType<typeof signal<TenantBooking | null>>;
    nextBooking: ReturnType<typeof signal<TenantBooking | null>>;
    formatAmount: jest.Mock;
    load: jest.Mock;
  };

  beforeEach(async () => {
    mockSvc = {
      isLoading: signal<boolean>(false),
      error: signal<string | null>(null),
      dashboard: signal<TenantDashboard | null>(dashboard),
      kpis: signal<TenantKPIs | null>(kpis),
      payments: signal<TenantPayment[]>(payments),
      bookings: signal<TenantBooking[]>(bookings),
      favourites: signal<TenantFavouriteProperty[]>(favourites),
      spendingHistory: signal<TenantSpendingPoint[]>(spendingHistory),
      paidCount: signal<number>(1),
      totalPaidTtm: signal<number>(1250),
      activeRental: signal<TenantBooking | null>(bookings[0]),
      nextBooking: signal<TenantBooking | null>(bookings[1]),
      formatAmount: jest.fn((n: number) => `${n} EUR`),
      load: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TenantDashboardComponent],
      providers: [{ provide: TenantDashboardService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected service as svc', () => {
    expect(component.svc).toBe(mockSvc as unknown as TenantDashboardService);
  });

  it('calls svc.load on init via the tenantId effect', () => {
    expect(mockSvc.load).toHaveBeenCalled();
  });

  it('re-triggers svc.load when the tenantId input changes', async () => {
    mockSvc.load.mockClear();
    fixture.componentRef.setInput('tenantId', 'tenant-42');
    fixture.detectChanges();
    expect(mockSvc.load).toHaveBeenCalledWith('tenant-42');
  });

  it('does NOT call svc.load when autoLoad is false', async () => {
    mockSvc.load.mockClear();
    fixture.componentRef.setInput('autoLoad', false);
    fixture.componentRef.setInput('tenantId', 'tenant-99');
    fixture.detectChanges();
    expect(mockSvc.load).not.toHaveBeenCalled();
  });

  it('refresh() calls svc.load with the current tenantId', () => {
    fixture.componentRef.setInput('tenantId', 'tenant-7');
    fixture.detectChanges();
    mockSvc.load.mockClear();
    component.refresh();
    expect(mockSvc.load).toHaveBeenCalledWith('tenant-7');
  });

  it('renders the header title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.td-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.td-subtitle') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Tenant Dashboard');
    expect(subtitle.textContent).toContain('trailing 12 months');
  });

  it('shows the loading state and disables refresh while isLoading is true', () => {
    mockSvc.isLoading.set(true);
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector('.td-loading');
    const refreshBtn = fixture.nativeElement.querySelector('.td-refresh-btn') as HTMLButtonElement;
    expect(loading).toBeTruthy();
    expect(refreshBtn.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.spinning')).toBeTruthy();
  });

  it('hides loading and enables refresh when isLoading is false', () => {
    mockSvc.isLoading.set(false);
    fixture.detectChanges();
    const refreshBtn = fixture.nativeElement.querySelector('.td-refresh-btn') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('.td-loading')).toBeNull();
    expect(refreshBtn.disabled).toBe(false);
  });

  it('renders the error block with retry button when error is set', () => {
    mockSvc.error.set('Network exploded');
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('.td-error') as HTMLElement;
    expect(err).toBeTruthy();
    expect(err.textContent).toContain('Network exploded');
    expect(err.querySelector('.td-error-retry')).toBeTruthy();
  });

  it('clicking the error retry button calls refresh()', () => {
    mockSvc.error.set('boom');
    fixture.detectChanges();
    const spy = jest.spyOn(component, 'refresh');
    const retry = fixture.nativeElement.querySelector('.td-error-retry') as HTMLButtonElement;
    retry.click();
    expect(spy).toHaveBeenCalled();
  });

  it('clicking the header refresh button calls refresh()', () => {
    const spy = jest.spyOn(component, 'refresh');
    const btn = fixture.nativeElement.querySelector('.td-refresh-btn') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('renders four KPI cards with values from svc.kpis', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-kpi-card');
    expect(cards.length).toBe(4);
    const values = Array.from(cards).map((c: any) =>
      (c.querySelector('.td-kpi-value') as HTMLElement).textContent?.trim(),
    );
    expect(values).toEqual([
      '13750 EUR',
      '1250 EUR',
      String(kpis.activeBookings),
      String(kpis.savedFavourites),
    ]);
  });

  it('renders peak month sub-label on the favourites KPI card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-kpi-card');
    const lastSub = cards[3].querySelector('.td-kpi-sub') as HTMLElement;
    expect(lastSub.textContent).toContain('Set 2025');
  });

  it('does NOT render KPI grid when kpis signal is null', () => {
    mockSvc.kpis.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.td-kpi-grid')).toBeNull();
  });

  it('hides all content when dashboard signal is null', () => {
    mockSvc.dashboard.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.td-kpi-grid')).toBeNull();
    expect(fixture.nativeElement.querySelector('.td-card')).toBeNull();
  });

  it('renders the active rental banner when activeRental is present', () => {
    const banner = fixture.nativeElement.querySelector('.td-active-rental') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Apartamento T2');
  });

  it('hides the active rental banner when activeRental is null', () => {
    mockSvc.activeRental.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.td-active-rental')).toBeNull();
  });

  it('renders the upcoming booking card when nextBooking is present', () => {
    const card = fixture.nativeElement.querySelector('.td-upcoming-card') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Studio Moderno');
    expect(card.textContent).toContain('187 days to go');
  });

  it('hides the upcoming booking card when nextBooking is null', () => {
    mockSvc.nextBooking.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.td-upcoming-card')).toBeNull();
  });

  it('renders one chart column per spending point with rent + fees bars', () => {
    const cols = fixture.nativeElement.querySelectorAll('.td-chart-col');
    expect(cols.length).toBe(spendingHistory.length);
    const firstBars = cols[0].querySelectorAll('.td-bar');
    expect(firstBars.length).toBe(2);
    expect(firstBars[0].classList.contains('td-bar-fees')).toBe(true);
    expect(firstBars[1].classList.contains('td-bar-rent')).toBe(true);
  });

  it('binds chart bar heights via barHeight() against maxSpend()', () => {
    const cols = fixture.nativeElement.querySelectorAll('.td-chart-col');
    // Last point has the highest total (1310), so its rent bar should be tallest.
    const lastRentBar = cols[cols.length - 1].querySelector('.td-bar-rent') as HTMLElement;
    expect(lastRentBar.style.height).toMatch(/%$/);
    // Title attribute exposes the formatted amount via formatAmount.
    expect(lastRentBar.getAttribute('title')).toContain('Rent: 1250 EUR');
  });

  it('maxSpend() returns 1 when spendingHistory is empty', () => {
    mockSvc.spendingHistory.set([]);
    fixture.detectChanges();
    expect(component.maxSpend()).toBe(1);
  });

  it('maxSpend() returns the largest total across points', () => {
    expect(component.maxSpend()).toBe(1310);
  });

  it('barHeight() returns 0 when max is 0', () => {
    expect(component.barHeight(100, 0)).toBe(0);
  });

  it('barHeight() returns 4 (floor) for tiny non-zero ratios', () => {
    expect(component.barHeight(1, 1000)).toBe(4);
  });

  it('barHeight() scales proportionally up to 90', () => {
    expect(component.barHeight(1000, 1000)).toBe(90);
    expect(component.barHeight(500, 1000)).toBe(45);
  });

  it('renders a row per payment plus the header row', () => {
    const headerRow = fixture.nativeElement.querySelector('.td-payment-header-row');
    const rows = fixture.nativeElement.querySelectorAll('.td-payment-row');
    expect(headerRow).toBeTruthy();
    expect(rows.length).toBe(payments.length);
    expect(rows[0].textContent).toContain('INV-2026-0100');
    expect(rows[0].textContent).toContain('Mar 2026');
  });

  it('renders payment status class per row (paid/pending/overdue)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.td-payment-row');
    expect(rows[0].querySelector('.td-status-pending')).toBeTruthy();
    expect(rows[1].querySelector('.td-status-paid')).toBeTruthy();
    expect(rows[2].querySelector('.td-status-overdue')).toBeTruthy();
  });

  it('shows the paid-count badge in the payment history header', () => {
    const badge = fixture.nativeElement.querySelector('.td-payment-count') as HTMLElement;
    expect(badge.textContent).toContain('1 paid');
  });

  it('renders a favourite card per entry from svc.favourites()', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-fav-card');
    expect(cards.length).toBe(favourites.length);
    expect(cards[0].textContent).toContain('Studio em Alfama');
    expect(cards[0].textContent).toContain('Alfama');
  });

  it('flags unavailable favourites with class + badge', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-fav-card');
    expect(cards[0].classList.contains('td-fav-unavailable')).toBe(false);
    expect(cards[1].classList.contains('td-fav-unavailable')).toBe(true);
    expect(cards[1].querySelector('.td-fav-unavailable-badge')).toBeTruthy();
    expect(cards[0].querySelector('.td-fav-unavailable-badge')).toBeNull();
  });

  it('renders the rating only when present on the favourite', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-fav-card');
    // fav-1 has rating 4.3
    expect(cards[0].querySelector('.td-fav-rating')).toBeTruthy();
    // fav-2 has no rating
    expect(cards[1].querySelector('.td-fav-rating')).toBeNull();
  });

  it('formats favourite rent via svc.formatAmount', () => {
    const cards = fixture.nativeElement.querySelectorAll('.td-fav-card');
    const rent = cards[0].querySelector('.td-fav-rent') as HTMLElement;
    expect(mockSvc.formatAmount).toHaveBeenCalledWith(950);
    expect(rent.textContent).toContain('950 EUR');
  });
});
