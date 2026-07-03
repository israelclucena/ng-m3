import { TestBed } from '@angular/core/testing';
import { NotificationBellService } from './notification-bell.service';

describe('NotificationBellService', () => {
  let service: NotificationBellService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationBellService] });
    service = TestBed.inject(NotificationBellService);
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should be created with seeded notifications', () => {
    expect(service).toBeTruthy();
    expect(service.notifications().length).toBe(4);
  });

  it('unreadCount() counts the seeded unread notifications', () => {
    // Seed has n1 + n2 unread → 2
    expect(service.unreadCount()).toBe(2);
    expect(service.hasUnread()).toBe(true);
  });

  it('notifications() are sorted newest-first', () => {
    const times = service.notifications().map(n => new Date(n.timestamp).getTime());
    const sorted = [...times].sort((a, b) => b - a);
    expect(times).toEqual(sorted);
  });

  // ── markRead ────────────────────────────────────────────────────────────────

  it('markRead() marks a single notification read and decrements unread', () => {
    service.markRead('n1');
    expect(service.notifications().find(n => n.id === 'n1')?.read).toBe(true);
    expect(service.unreadCount()).toBe(1);
  });

  it('markRead() with an unknown id is a no-op', () => {
    service.markRead('ghost');
    expect(service.unreadCount()).toBe(2);
  });

  // ── markAllRead ───────────────────────────────────────────────────────────────

  it('markAllRead() clears all unread', () => {
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
    expect(service.hasUnread()).toBe(false);
    expect(service.notifications().every(n => n.read)).toBe(true);
  });

  // ── dismiss ──────────────────────────────────────────────────────────────────

  it('dismiss() removes a notification', () => {
    service.dismiss('n1');
    expect(service.notifications().find(n => n.id === 'n1')).toBeUndefined();
    expect(service.notifications().length).toBe(3);
  });

  it('dismiss() of an unread notification lowers the unread count', () => {
    service.dismiss('n2'); // n2 is unread
    expect(service.unreadCount()).toBe(1);
  });

  it('dismiss() with an unknown id leaves the list untouched', () => {
    service.dismiss('ghost');
    expect(service.notifications().length).toBe(4);
  });

  // ── push ─────────────────────────────────────────────────────────────────────

  it('push() prepends a new unread notification', () => {
    service.push('alert', 'Alerta', 'Algo aconteceu', '/somewhere');
    expect(service.notifications().length).toBe(5);
    expect(service.unreadCount()).toBe(3);
    const added = service.notifications().find(n => n.title === 'Alerta');
    expect(added?.category).toBe('alert');
    expect(added?.read).toBe(false);
    expect(added?.actionRoute).toBe('/somewhere');
  });

  it('push() generates a unique id and appears newest-first', () => {
    service.push('system', 'Primeiro', 'body');
    service.push('system', 'Segundo', 'body');
    const ids = service.notifications().map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Most recently pushed has the newest timestamp → first in the sorted list
    expect(service.notifications()[0].title).toBe('Segundo');
  });

  it('push() works without an actionRoute', () => {
    service.push('property', 'Sem rota', 'body');
    const added = service.notifications().find(n => n.title === 'Sem rota');
    expect(added?.actionRoute).toBeUndefined();
  });
});
