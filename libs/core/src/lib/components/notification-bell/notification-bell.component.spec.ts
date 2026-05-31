import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationBellService } from './notification-bell.service';
import type { AppNotification } from './notification-bell.types';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let component: NotificationBellComponent;
  let service: NotificationBellService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NotificationBellComponent] }).compileComponents();
    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationBellService);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render bell button with badge when unread count > 0', () => {
    const badge = fixture.nativeElement.querySelector('.iu-notification-bell__badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe(String(service.unreadCount()));
  });

  it('should show "9+" when unread count exceeds 9', () => {
    for (let i = 0; i < 10; i++) {
      service.push('message', `T${i}`, `B${i}`);
    }
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.iu-notification-bell__badge');
    expect(badge.textContent.trim()).toBe('9+');
  });

  it('should toggle panel open state via togglePanel', () => {
    expect(component.open()).toBe(false);
    component.togglePanel(new Event('click'));
    expect(component.open()).toBe(true);
    component.togglePanel(new Event('click'));
    expect(component.open()).toBe(false);
  });

  it('should render panel when open() is true', () => {
    component.togglePanel(new Event('click'));
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.iu-notification-bell__panel');
    expect(panel).toBeTruthy();
    const title = fixture.nativeElement.querySelector('.iu-notification-bell__panel-title');
    expect(title?.textContent?.trim()).toBe('Notificações');
  });

  it('should close panel on document click', () => {
    component.togglePanel(new Event('click'));
    expect(component.open()).toBe(true);
    component.onDocumentClick();
    expect(component.open()).toBe(false);
  });

  it('should emit notificationClicked and mark as read on onNotifClick', () => {
    const spy = jest.fn();
    component.notificationClicked.subscribe(spy);
    const notif: AppNotification = service.notifications().find(n => !n.read)!;
    const markReadSpy = jest.spyOn(service, 'markRead');
    component.togglePanel(new Event('click'));
    component.onNotifClick(notif);
    expect(markReadSpy).toHaveBeenCalledWith(notif.id);
    expect(spy).toHaveBeenCalledWith(notif);
    expect(component.open()).toBe(false);
  });

  it('should dismiss notification and stop event propagation', () => {
    const dismissSpy = jest.spyOn(service, 'dismiss');
    const evt = new Event('click');
    const stopSpy = jest.spyOn(evt, 'stopPropagation');
    component.dismiss(evt, 'n1');
    expect(stopSpy).toHaveBeenCalled();
    expect(dismissSpy).toHaveBeenCalledWith('n1');
  });

  it('should call markAllRead via markAll', () => {
    const spy = jest.spyOn(service, 'markAllRead');
    component.markAll();
    expect(spy).toHaveBeenCalled();
  });

  it('should map category to icon and class correctly', () => {
    const base: AppNotification = {
      id: 'x', category: 'message', title: 't', body: 'b', timestamp: new Date().toISOString(), read: false,
    };
    expect(component.getCategoryIcon(base)).toBe('chat');
    expect(component.getCategoryClass(base)).toBe('iu-notif-item--message');
    expect(component.getCategoryIcon({ ...base, category: 'booking' })).toBe('event_available');
    expect(component.getCategoryClass({ ...base, category: 'alert' })).toBe('iu-notif-item--alert');
    expect(component.getCategoryIcon({ ...base, category: 'unknown' as never })).toBe('circle_notifications');
    expect(component.getCategoryClass({ ...base, category: 'unknown' as never })).toBe('');
  });

  it('should format time as "Agora mesmo" for recent and "Ontem" for ~30h ago', () => {
    const now = new Date().toISOString();
    expect(component.formatTime(now)).toBe('Agora mesmo');
    const thirtyHoursAgo = new Date(Date.now() - 30 * 3_600_000).toISOString();
    expect(component.formatTime(thirtyHoursAgo)).toBe('Ontem');
    const fiveHoursAgo = new Date(Date.now() - 5 * 3_600_000).toISOString();
    expect(component.formatTime(fiveHoursAgo)).toBe('há 5h');
  });

  it('should render empty state when notifications list is cleared', () => {
    const all = [...service.notifications()];
    all.forEach(n => service.dismiss(n.id));
    component.togglePanel(new Event('click'));
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.iu-notification-bell__empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('Sem notificações');
  });
});
