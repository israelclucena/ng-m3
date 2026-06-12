import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationCenterService } from '../../services/notification-center.service';
import type { CategoryFilter, ExtendedCategory } from '../../services/notification-center.service';
import type { AppNotification } from '../notification-bell/notification-bell.types';

describe('NotificationCenterComponent', () => {
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let component: NotificationCenterComponent;

  const categories: CategoryFilter[] = [
    { id: 'all',         label: 'Todas',      icon: 'notifications' },
    { id: 'message',     label: 'Mensagens',  icon: 'chat' },
    { id: 'booking',     label: 'Reservas',   icon: 'event' },
    { id: 'maintenance', label: 'Manutenção', icon: 'build' },
    { id: 'lease',       label: 'Contratos',  icon: 'description' },
    { id: 'payment',     label: 'Pagamentos', icon: 'payments' },
    { id: 'property',    label: 'Imóveis',    icon: 'home' },
    { id: 'alert',       label: 'Alertas',    icon: 'warning' },
    { id: 'system',      label: 'Sistema',    icon: 'info' },
  ];

  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

  const baseNotifications: AppNotification[] = [
    {
      id: 'n1',
      category: 'message',
      title: 'New message',
      body: 'You have a new chat message',
      timestamp: iso(30_000), // 30s ago -> "agora mesmo"
      read: false,
    },
    {
      id: 'n2',
      category: 'booking',
      title: 'Booking confirmed',
      body: 'Your booking was confirmed',
      timestamp: iso(5 * 60_000), // 5 min ago
      read: true,
    },
    {
      id: 'n3',
      category: 'alert',
      title: 'Urgent alert',
      body: 'Something needs your attention',
      timestamp: iso(3 * 60 * 60_000), // 3h ago
      read: false,
    },
  ];

  const stub = {
    isOpen: signal<boolean>(true),
    activeCategory: signal<ExtendedCategory>('all'),
    unreadCount: signal<number>(2),
    all: signal<AppNotification[]>(baseNotifications),
    filtered: signal<AppNotification[]>(baseNotifications),
    categoryCount: signal<Record<string, number>>({ all: 3, message: 1, booking: 1, alert: 1 }),
    unreadByCategory: signal<Record<string, number>>({ all: 2, message: 1, alert: 1 }),
    categories,
    toggle: jest.fn(),
    close: jest.fn(),
    open: jest.fn(),
    setCategory: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
    dismiss: jest.fn(),
  };

  beforeEach(async () => {
    stub.isOpen.set(true);
    stub.activeCategory.set('all');
    stub.unreadCount.set(2);
    stub.all.set(baseNotifications);
    stub.filtered.set(baseNotifications);
    stub.categoryCount.set({ all: 3, message: 1, booking: 1, alert: 1 });
    stub.unreadByCategory.set({ all: 2, message: 1, alert: 1 });
    stub.toggle.mockClear();
    stub.close.mockClear();
    stub.open.mockClear();
    stub.setCategory.mockClear();
    stub.markAllRead.mockClear();
    stub.markRead.mockClear();
    stub.dismiss.mockClear();

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        { provide: NotificationCenterService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Trigger button visibility ───────────────────────────────────────────

  it('renders the trigger button when not embedded', () => {
    const trigger = fixture.nativeElement.querySelector('.nc-trigger') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
  });

  it('hides the trigger button when embedded is true', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.nc-trigger');
    expect(trigger).toBeNull();
  });

  it('clicking the trigger button calls svc.toggle()', () => {
    const trigger = fixture.nativeElement.querySelector('.nc-trigger') as HTMLButtonElement;
    trigger.click();
    expect(stub.toggle).toHaveBeenCalledTimes(1);
  });

  it('trigger has --open class when svc.isOpen() is true', () => {
    const trigger = fixture.nativeElement.querySelector('.nc-trigger') as HTMLButtonElement;
    expect(trigger.classList.contains('nc-trigger--open')).toBe(true);
  });

  // ─── Badge counter ───────────────────────────────────────────────────────

  it('does not render the badge when unreadCount is 0', () => {
    stub.unreadCount.set(0);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.nc-badge');
    expect(badge).toBeNull();
  });

  it('renders the badge with the unread count when greater than 0', () => {
    stub.unreadCount.set(5);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.nc-badge') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('5');
  });

  it('renders the badge as "99+" when unread count exceeds 99', () => {
    stub.unreadCount.set(120);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.nc-badge') as HTMLElement;
    expect(badge.textContent).toContain('99+');
  });

  // ─── Drawer rendering ────────────────────────────────────────────────────

  it('renders the drawer when svc.isOpen() is true', () => {
    const drawer = fixture.nativeElement.querySelector('.nc-drawer');
    expect(drawer).toBeTruthy();
  });

  it('does not render the drawer when closed and not embedded', () => {
    stub.isOpen.set(false);
    fixture.detectChanges();
    const drawer = fixture.nativeElement.querySelector('.nc-drawer');
    expect(drawer).toBeNull();
  });

  it('renders the drawer when embedded even if closed', () => {
    stub.isOpen.set(false);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const drawer = fixture.nativeElement.querySelector('.nc-drawer') as HTMLElement;
    expect(drawer).toBeTruthy();
    expect(drawer.classList.contains('nc-drawer--embedded')).toBe(true);
  });

  it('renders the overlay when open and not embedded', () => {
    const overlay = fixture.nativeElement.querySelector('.nc-overlay');
    expect(overlay).toBeTruthy();
  });

  it('does not render the overlay when embedded', () => {
    stub.isOpen.set(false);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.nc-overlay');
    expect(overlay).toBeNull();
  });

  it('clicking the overlay calls svc.close()', () => {
    const overlay = fixture.nativeElement.querySelector('.nc-overlay') as HTMLElement;
    overlay.click();
    expect(stub.close).toHaveBeenCalledTimes(1);
  });

  // ─── Header ──────────────────────────────────────────────────────────────

  it('renders the subtitle with unread count when there are unread notifications', () => {
    const subtitle = fixture.nativeElement.querySelector('.nc-subtitle') as HTMLElement;
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('2 não lidas');
  });

  it('hides the subtitle when there are no unread notifications', () => {
    stub.unreadCount.set(0);
    fixture.detectChanges();
    const subtitle = fixture.nativeElement.querySelector('.nc-subtitle');
    expect(subtitle).toBeNull();
  });

  it('renders the close button in the header when not embedded', () => {
    const closeBtn = fixture.nativeElement.querySelector('.nc-close-btn') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
  });

  it('clicking the header close button calls svc.close()', () => {
    const closeBtn = fixture.nativeElement.querySelector('.nc-close-btn') as HTMLButtonElement;
    closeBtn.click();
    expect(stub.close).toHaveBeenCalledTimes(1);
  });

  it('hides the header close button when embedded', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('.nc-close-btn');
    expect(closeBtn).toBeNull();
  });

  // ─── Mark all read ───────────────────────────────────────────────────────

  it('renders the mark-all button when there are unread notifications', () => {
    const markAll = fixture.nativeElement.querySelector('.nc-btn--text') as HTMLButtonElement;
    expect(markAll).toBeTruthy();
    expect(markAll.textContent).toContain('Marcar todas');
  });

  it('hides the mark-all button when there are no unread notifications', () => {
    stub.unreadCount.set(0);
    fixture.detectChanges();
    const markAll = fixture.nativeElement.querySelector('.nc-btn--text');
    expect(markAll).toBeNull();
  });

  it('clicking the mark-all button calls svc.markAllRead()', () => {
    const markAll = fixture.nativeElement.querySelector('.nc-btn--text') as HTMLButtonElement;
    markAll.click();
    expect(stub.markAllRead).toHaveBeenCalledTimes(1);
  });

  // ─── Category tabs (visibleCategories computed) ──────────────────────────

  it('renders only "all" + categories with count > 0 as tabs', () => {
    // categoryCount: all/message/booking/alert -> 4 tabs
    const tabs = fixture.nativeElement.querySelectorAll('.nc-tab');
    expect(tabs.length).toBe(4);
    const labels = Array.from(tabs).map((t) => (t as HTMLElement).textContent?.trim());
    expect(labels.some((l) => l?.includes('Todas'))).toBe(true);
    expect(labels.some((l) => l?.includes('Mensagens'))).toBe(true);
    expect(labels.some((l) => l?.includes('Reservas'))).toBe(true);
    expect(labels.some((l) => l?.includes('Alertas'))).toBe(true);
  });

  it('only renders "all" tab when no categories have counts', () => {
    stub.categoryCount.set({ all: 0 });
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.nc-tab');
    expect(tabs.length).toBe(1);
    expect((tabs[0] as HTMLElement).textContent).toContain('Todas');
  });

  it('marks the active category tab with --active class', () => {
    stub.activeCategory.set('message');
    fixture.detectChanges();
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('.nc-tab')) as HTMLElement[];
    const messageTab = tabs.find((t) => t.textContent?.includes('Mensagens'))!;
    expect(messageTab.classList.contains('nc-tab--active')).toBe(true);
  });

  it('renders a tab badge with unread count for the category', () => {
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('.nc-tab')) as HTMLElement[];
    const messageTab = tabs.find((t) => t.textContent?.includes('Mensagens'))!;
    const badge = messageTab.querySelector('.nc-tab-badge') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('1');
  });

  it('does not render a tab badge when the category has no unread', () => {
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('.nc-tab')) as HTMLElement[];
    const bookingTab = tabs.find((t) => t.textContent?.includes('Reservas'))!;
    expect(bookingTab.querySelector('.nc-tab-badge')).toBeNull();
  });

  it('clicking a category tab calls svc.setCategory with the tab id', () => {
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('.nc-tab')) as HTMLButtonElement[];
    const messageTab = tabs.find((t) => t.textContent?.includes('Mensagens'))!;
    messageTab.click();
    expect(stub.setCategory).toHaveBeenCalledWith('message');
  });

  // ─── List rendering ──────────────────────────────────────────────────────

  it('renders one item per entry in svc.filtered()', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    expect(items.length).toBe(3);
  });

  it('renders item title, body and time', () => {
    const first = fixture.nativeElement.querySelector('.nc-item') as HTMLElement;
    expect((first.querySelector('.nc-item-title') as HTMLElement).textContent).toContain('New message');
    expect((first.querySelector('.nc-item-body') as HTMLElement).textContent).toContain('You have a new chat message');
    expect((first.querySelector('.nc-item-time') as HTMLElement).textContent).toContain('agora mesmo');
  });

  it('marks unread items with the --unread class', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    expect((items[0] as HTMLElement).classList.contains('nc-item--unread')).toBe(true); // n1 unread
    expect((items[1] as HTMLElement).classList.contains('nc-item--unread')).toBe(false); // n2 read
  });

  it('renders the unread dot only for unread items', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    expect((items[0] as HTMLElement).querySelector('.nc-unread-dot')).toBeTruthy();
    expect((items[1] as HTMLElement).querySelector('.nc-unread-dot')).toBeNull();
  });

  it('sets data-category on the item icon', () => {
    const first = fixture.nativeElement.querySelector('.nc-item') as HTMLElement;
    const icon = first.querySelector('.nc-item-icon') as HTMLElement;
    expect(icon.getAttribute('data-category')).toBe('message');
  });

  // ─── Item interactions ───────────────────────────────────────────────────

  it('clicking an unread item calls svc.markRead with its id', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    (items[0] as HTMLElement).click();
    expect(stub.markRead).toHaveBeenCalledWith('n1');
  });

  it('clicking a read item does not call svc.markRead', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    (items[1] as HTMLElement).click(); // n2 already read
    expect(stub.markRead).not.toHaveBeenCalled();
  });

  it('clicking the dismiss button calls svc.dismiss and stops propagation', () => {
    const items = fixture.nativeElement.querySelectorAll('.nc-item');
    const dismissBtn = (items[0] as HTMLElement).querySelector('.nc-dismiss-btn') as HTMLButtonElement;
    dismissBtn.click();
    expect(stub.dismiss).toHaveBeenCalledWith('n1');
    // stopPropagation -> the parent item click handler should not fire markRead
    expect(stub.markRead).not.toHaveBeenCalled();
  });

  it('dismiss handler calls stopPropagation on the event', () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.dismiss('n9', event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(stub.dismiss).toHaveBeenCalledWith('n9');
  });

  // ─── Empty state ─────────────────────────────────────────────────────────

  it('renders the empty state when filtered() is empty', () => {
    stub.filtered.set([]);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.nc-empty') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Sem notificações');
    expect(fixture.nativeElement.querySelectorAll('.nc-item').length).toBe(0);
  });

  it('appends category hint to empty state when a category is active', () => {
    stub.filtered.set([]);
    stub.activeCategory.set('message');
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.nc-empty') as HTMLElement;
    expect(empty.textContent).toContain('nesta categoria');
  });

  // ─── Footer ──────────────────────────────────────────────────────────────

  it('renders the footer total count from svc.all()', () => {
    const footer = fixture.nativeElement.querySelector('.nc-footer-text') as HTMLElement;
    expect(footer.textContent).toContain('3 notificações no total');
  });

  it('updates the footer total when svc.all() changes', () => {
    stub.all.set([baseNotifications[0]]);
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.nc-footer-text') as HTMLElement;
    expect(footer.textContent).toContain('1 notificações no total');
  });

  // ─── categoryIcon() mapping ──────────────────────────────────────────────

  it('categoryIcon() maps known categories to Material icons', () => {
    expect(component.categoryIcon('message')).toBe('chat');
    expect(component.categoryIcon('booking')).toBe('event');
    expect(component.categoryIcon('property')).toBe('home');
    expect(component.categoryIcon('system')).toBe('info');
    expect(component.categoryIcon('alert')).toBe('warning');
  });

  it('categoryIcon() falls back to "notifications" for unknown categories', () => {
    expect(component.categoryIcon('unknown' as any)).toBe('notifications');
  });

  // ─── unreadForCat() ──────────────────────────────────────────────────────

  it('unreadForCat() returns the all count for the "all" id', () => {
    expect(component.unreadForCat('all')).toBe(2);
  });

  it('unreadForCat() returns the per-category unread count', () => {
    expect(component.unreadForCat('message' as ExtendedCategory)).toBe(1);
  });

  it('unreadForCat() returns 0 for categories without unread', () => {
    expect(component.unreadForCat('booking' as ExtendedCategory)).toBe(0);
  });

  // ─── timeAgo() output ────────────────────────────────────────────────────

  it('timeAgo() returns "agora mesmo" for very recent timestamps', () => {
    expect(component.timeAgo(new Date(Date.now() - 10_000).toISOString())).toBe('agora mesmo');
  });

  it('timeAgo() returns minutes for sub-hour timestamps', () => {
    expect(component.timeAgo(new Date(Date.now() - 15 * 60_000).toISOString())).toBe('há 15 min');
  });

  it('timeAgo() returns hours for sub-day timestamps', () => {
    expect(component.timeAgo(new Date(Date.now() - 4 * 60 * 60_000).toISOString())).toBe('há 4h');
  });

  it('timeAgo() returns days (with plural) for sub-week timestamps', () => {
    expect(component.timeAgo(new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString())).toBe('há 2 dias');
  });

  it('timeAgo() uses singular "dia" for exactly one day', () => {
    expect(component.timeAgo(new Date(Date.now() - 25 * 60 * 60_000).toISOString())).toBe('há 1 dia');
  });

  // ─── visibleCategories computed ──────────────────────────────────────────

  it('visibleCategories() computed returns "all" plus categories with count > 0', () => {
    const visible = component.visibleCategories();
    const ids = visible.map((c) => c.id);
    expect(ids).toContain('all');
    expect(ids).toContain('message');
    expect(ids).toContain('booking');
    expect(ids).toContain('alert');
    expect(ids).not.toContain('system');
  });
});
