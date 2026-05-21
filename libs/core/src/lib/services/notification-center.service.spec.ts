import { TestBed } from '@angular/core/testing';
import { NotificationCenterService, type ExtendedCategory } from './notification-center.service';
import { NotificationBellService } from '../components/notification-bell/notification-bell.service';

describe('NotificationCenterService', () => {
  let service: NotificationCenterService;
  let bellSvc: NotificationBellService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationCenterService);
    bellSvc = TestBed.inject(NotificationBellService);
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  it('starts with the "all" filter active and drawer closed', () => {
    expect(service.activeCategory()).toBe('all');
    expect(service.isOpen()).toBe(false);
  });

  it('exposes the full categories filter list', () => {
    expect(service.categories.length).toBe(9);
    const ids = service.categories.map(c => c.id);
    expect(ids).toContain('all');
    expect(ids).toContain('maintenance');
    expect(ids).toContain('lease');
    expect(ids).toContain('payment');
  });

  it('every category filter has a label and icon', () => {
    for (const c of service.categories) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
    }
  });

  // ─── Aggregated reads ────────────────────────────────────────────────────

  it('all mirrors NotificationBellService.notifications()', () => {
    expect(service.all().length).toBe(bellSvc.notifications().length);
    expect(service.all()[0]).toBe(bellSvc.notifications()[0]);
  });

  it('unreadCount mirrors NotificationBellService.unreadCount()', () => {
    expect(service.unreadCount()).toBe(bellSvc.unreadCount());
  });

  it('all updates reactively when bell service pushes', () => {
    const before = service.all().length;
    bellSvc.push('alert', 'Test', 'Body');
    expect(service.all().length).toBe(before + 1);
    expect(service.unreadCount()).toBe(bellSvc.unreadCount());
  });

  // ─── Filtering ───────────────────────────────────────────────────────────

  it('filtered returns the full list when activeCategory is "all"', () => {
    expect(service.filtered().length).toBe(service.all().length);
  });

  it('setCategory updates activeCategory signal', () => {
    service.setCategory('message');
    expect(service.activeCategory()).toBe('message');
  });

  it('filtered narrows to base category when set', () => {
    service.setCategory('message');
    const filtered = service.filtered();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(n => n.category === 'message')).toBe(true);
  });

  it('filtered maps "maintenance" extended category to "alert" base', () => {
    bellSvc.push('alert', 'Maint', 'Body');
    service.setCategory('maintenance');
    const filtered = service.filtered();
    expect(filtered.every(n => n.category === 'alert')).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('filtered maps "lease" extended category to "alert" base', () => {
    bellSvc.push('alert', 'Lease', 'Body');
    service.setCategory('lease');
    expect(service.filtered().every(n => n.category === 'alert')).toBe(true);
  });

  it('filtered maps "payment" extended category to "booking" base', () => {
    service.setCategory('payment');
    expect(service.filtered().every(n => n.category === 'booking')).toBe(true);
  });

  it('filtered returns empty array when no notifications match the filter', () => {
    // Seed has no 'system' notifications? Check — seed n4 IS system. So pick something safer.
    // Dismiss every system notification, then filter by system.
    for (const n of [...bellSvc.notifications()]) {
      if (n.category === 'system') bellSvc.dismiss(n.id);
    }
    service.setCategory('system');
    expect(service.filtered().length).toBe(0);
  });

  // ─── Counts ──────────────────────────────────────────────────────────────

  it('categoryCount has "all" key matching total length', () => {
    expect(service.categoryCount()['all']).toBe(service.all().length);
  });

  it('categoryCount tallies each base category', () => {
    const counts = service.categoryCount();
    // Sum of per-category counts (excluding "all") equals total
    const sum = Object.entries(counts)
      .filter(([k]) => k !== 'all')
      .reduce((acc, [, v]) => acc + v, 0);
    expect(sum).toBe(service.all().length);
  });

  it('unreadByCategory tallies only unread notifications', () => {
    const counts = service.unreadByCategory();
    const sum = Object.entries(counts)
      .filter(([k]) => k !== 'all')
      .reduce((acc, [, v]) => acc + v, 0);
    expect(sum).toBe(service.unreadCount());
    expect(counts['all']).toBe(service.unreadCount());
  });

  it('categoryCount and unreadByCategory react to push', () => {
    const beforeAll = service.categoryCount()['all'];
    const beforeUnread = service.unreadByCategory()['all'];
    bellSvc.push('property', 'Test', 'Body');
    expect(service.categoryCount()['all']).toBe(beforeAll + 1);
    expect(service.unreadByCategory()['all']).toBe(beforeUnread + 1);
  });

  // ─── Drawer state ────────────────────────────────────────────────────────

  it('open() sets isOpen to true', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('toggle() flips isOpen', () => {
    expect(service.isOpen()).toBe(false);
    service.toggle();
    expect(service.isOpen()).toBe(true);
    service.toggle();
    expect(service.isOpen()).toBe(false);
  });

  // ─── Action delegation ───────────────────────────────────────────────────

  it('markRead delegates to bell service', () => {
    const firstUnread = bellSvc.notifications().find(n => !n.read)!;
    const before = service.unreadCount();
    service.markRead(firstUnread.id);
    expect(service.unreadCount()).toBe(before - 1);
    expect(bellSvc.notifications().find(n => n.id === firstUnread.id)?.read).toBe(true);
  });

  it('markAllRead delegates to bell service and zeros unread count', () => {
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
    expect(bellSvc.notifications().every(n => n.read)).toBe(true);
  });

  it('dismiss delegates to bell service and removes the notification', () => {
    const target = bellSvc.notifications()[0];
    const before = service.all().length;
    service.dismiss(target.id);
    expect(service.all().length).toBe(before - 1);
    expect(service.all().find(n => n.id === target.id)).toBeUndefined();
  });

  // ─── Extended type coverage ──────────────────────────────────────────────

  it('accepts every defined ExtendedCategory in setCategory without throwing', () => {
    const cats: ExtendedCategory[] = [
      'all', 'message', 'booking', 'property', 'system',
      'alert', 'maintenance', 'lease', 'payment',
    ];
    for (const c of cats) {
      expect(() => service.setCategory(c)).not.toThrow();
      expect(service.activeCategory()).toBe(c);
    }
  });
});
