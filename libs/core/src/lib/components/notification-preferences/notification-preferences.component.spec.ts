import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationPreferencesComponent } from './notification-preferences.component';
import { NotificationPreferencesService } from '../../services/notification-preferences.service';
import type {
  NotificationChannel,
  NotificationCategory,
  NotificationPreference,
} from '../../services/notification-preferences.service';

describe('NotificationPreferencesComponent', () => {
  let fixture: ComponentFixture<NotificationPreferencesComponent>;
  let component: NotificationPreferencesComponent;

  const basePrefs: NotificationPreference[] = [
    {
      category: 'rent_payments',
      label: 'Rent Payments',
      description: 'Received, overdue, and payment plan updates',
      icon: '💶',
      urgency: 'critical',
      channels: { email: true, sms: true, push: true, in_app: true },
    },
    {
      category: 'maintenance',
      label: 'Maintenance Requests',
      description: 'New requests, status changes, and completions',
      icon: '🔧',
      urgency: 'high',
      channels: { email: true, sms: false, push: true, in_app: true },
    },
    {
      category: 'marketing',
      label: 'Tips & Updates',
      description: 'Platform tips, feature announcements, and newsletters',
      icon: '💡',
      urgency: 'low',
      channels: { email: false, sms: false, push: false, in_app: true },
    },
  ];

  const baseSummary = [
    { channel: 'email' as NotificationChannel, enabled: 2, total: 3 },
    { channel: 'sms' as NotificationChannel, enabled: 1, total: 3 },
    { channel: 'push' as NotificationChannel, enabled: 2, total: 3 },
    { channel: 'in_app' as NotificationChannel, enabled: 3, total: 3 },
  ];

  const stub = {
    prefs: signal<NotificationPreference[]>(basePrefs),
    saved: signal<boolean>(true),
    channelSummary: signal(baseSummary),
    toggleChannel: jest.fn(),
    setAllChannels: jest.fn(),
    setChannelGlobal: jest.fn(),
    save: jest.fn(function (this: void) {
      stub.saved.set(true);
    }),
    urgencyColor: jest.fn(function (this: void, urgency: 'critical' | 'high' | 'normal' | 'low'): string {
      return { critical: '#D32F2F', high: '#E65100', normal: '#1976D2', low: '#757575' }[urgency];
    }),
    channelLabel: jest.fn(function (this: void, ch: NotificationChannel): string {
      return { email: 'Email', sms: 'SMS', push: 'Push', in_app: 'In-App' }[ch];
    }),
    channelIcon: jest.fn(function (this: void, ch: NotificationChannel): string {
      return { email: '📧', sms: '📱', push: '🔔', in_app: '🖥️' }[ch];
    }),
  };

  beforeEach(async () => {
    stub.prefs.set(basePrefs);
    stub.saved.set(true);
    stub.channelSummary.set(baseSummary);
    stub.toggleChannel.mockClear();
    stub.setAllChannels.mockClear();
    stub.setChannelGlobal.mockClear();
    stub.save.mockClear();
    stub.urgencyColor.mockClear();
    stub.channelLabel.mockClear();
    stub.channelIcon.mockClear();

    await TestBed.configureTestingModule({
      imports: [NotificationPreferencesComponent],
      providers: [
        { provide: NotificationPreferencesService, useValue: stub as any },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the four notification channels in order', () => {
    expect(component.channels).toEqual(['email', 'sms', 'push', 'in_app']);
  });

  it('renders the title and subtitle', () => {
    const title = fixture.nativeElement.querySelector('.np-title') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.np-subtitle') as HTMLElement;
    expect(title.textContent).toContain('Notification Preferences');
    expect(subtitle.textContent).toContain('Choose how and when you receive notifications');
  });

  it('save button shows "Saved" label and is disabled when svc.saved() is true', () => {
    const btn = fixture.nativeElement.querySelector('.np-save-btn') as HTMLButtonElement;
    expect(btn.textContent).toContain('Saved');
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('saved')).toBe(true);
  });

  it('save button shows "Save Changes" label and is enabled when svc.saved() is false', () => {
    stub.saved.set(false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.np-save-btn') as HTMLButtonElement;
    expect(btn.textContent).toContain('Save Changes');
    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains('saved')).toBe(false);
  });

  it('clicking the save button calls svc.save()', () => {
    stub.saved.set(false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.np-save-btn') as HTMLButtonElement;
    btn.click();
    expect(stub.save).toHaveBeenCalledTimes(1);
  });

  it('renders one channel summary card per entry in channelSummary()', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    expect(cards.length).toBe(4);
  });

  it('channel summary card shows icon, label and enabled/total count', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    const first = cards[0] as HTMLElement;
    expect((first.querySelector('.np-ch-icon') as HTMLElement).textContent).toContain('📧');
    expect((first.querySelector('.np-ch-name') as HTMLElement).textContent).toContain('Email');
    expect((first.querySelector('.np-ch-count') as HTMLElement).textContent).toContain('2/3 categories');
  });

  it('toggle-all button reads "Enable all" when not all channels enabled', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    const first = cards[0] as HTMLElement;
    const toggleAll = first.querySelector('.np-toggle-all') as HTMLButtonElement;
    expect(toggleAll.textContent).toContain('Enable all');
    expect(toggleAll.getAttribute('title')).toBe('Enable all');
  });

  it('toggle-all button reads "Disable all" when channel is fully enabled', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    const inAppCard = cards[3] as HTMLElement;
    const toggleAll = inAppCard.querySelector('.np-toggle-all') as HTMLButtonElement;
    expect(toggleAll.textContent).toContain('Disable all');
    expect(toggleAll.getAttribute('title')).toBe('Disable all');
  });

  it('clicking toggle-all on a partially enabled channel calls setChannelGlobal(channel, true)', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    const emailCard = cards[0] as HTMLElement;
    const toggleAll = emailCard.querySelector('.np-toggle-all') as HTMLButtonElement;
    toggleAll.click();
    expect(stub.setChannelGlobal).toHaveBeenCalledWith('email', true);
  });

  it('clicking toggle-all on a fully enabled channel calls setChannelGlobal(channel, false)', () => {
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    const inAppCard = cards[3] as HTMLElement;
    const toggleAll = inAppCard.querySelector('.np-toggle-all') as HTMLButtonElement;
    toggleAll.click();
    expect(stub.setChannelGlobal).toHaveBeenCalledWith('in_app', false);
  });

  it('renders the table column header with one column per channel', () => {
    const header = fixture.nativeElement.querySelector('.np-table-header') as HTMLElement;
    expect(header).toBeTruthy();
    expect((header.querySelector('.np-col-category') as HTMLElement).textContent).toContain('Category');
    const channelCols = header.querySelectorAll('.np-col-channel');
    expect(channelCols.length).toBe(4);
    expect((channelCols[0] as HTMLElement).textContent).toContain('Email');
    expect((channelCols[1] as HTMLElement).textContent).toContain('SMS');
    expect((channelCols[2] as HTMLElement).textContent).toContain('Push');
    expect((channelCols[3] as HTMLElement).textContent).toContain('In-App');
  });

  it('renders one row per entry in svc.prefs()', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    expect(rows.length).toBe(3);
  });

  it('row shows preference icon, label, urgency and description', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const first = rows[0] as HTMLElement;
    expect((first.querySelector('.np-pref-icon') as HTMLElement).textContent).toContain('💶');
    const label = first.querySelector('.np-pref-label') as HTMLElement;
    expect(label.textContent).toContain('Rent Payments');
    expect(label.textContent).toContain('critical');
    expect((first.querySelector('.np-pref-desc') as HTMLElement).textContent).toContain('Received, overdue, and payment plan updates');
  });

  it('urgency badge colour comes from svc.urgencyColor(pref.urgency)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const first = rows[0] as HTMLElement;
    const urgency = first.querySelector('.np-urgency') as HTMLElement;
    expect(urgency.style.color).toBeTruthy();
    expect(stub.urgencyColor).toHaveBeenCalledWith('critical');
    expect(stub.urgencyColor).toHaveBeenCalledWith('high');
    expect(stub.urgencyColor).toHaveBeenCalledWith('low');
  });

  it('renders one toggle per channel per preference row', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const first = rows[0] as HTMLElement;
    const toggles = first.querySelectorAll('.np-toggle');
    expect(toggles.length).toBe(4);
  });

  it('toggle has "on" class when channel is enabled for that preference', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const first = rows[0] as HTMLElement;
    const toggles = first.querySelectorAll('.np-toggle');
    expect((toggles[0] as HTMLElement).classList.contains('on')).toBe(true);
    expect((toggles[1] as HTMLElement).classList.contains('on')).toBe(true);
    expect((toggles[2] as HTMLElement).classList.contains('on')).toBe(true);
    expect((toggles[3] as HTMLElement).classList.contains('on')).toBe(true);
  });

  it('toggle lacks "on" class when channel is disabled for that preference', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const maintenanceRow = rows[1] as HTMLElement;
    const toggles = maintenanceRow.querySelectorAll('.np-toggle');
    expect((toggles[1] as HTMLElement).classList.contains('on')).toBe(false);
  });

  it('clicking a row toggle calls svc.toggleChannel(category, channel)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const maintenanceRow = rows[1] as HTMLElement;
    const toggles = maintenanceRow.querySelectorAll('.np-toggle');
    (toggles[1] as HTMLButtonElement).click();
    expect(stub.toggleChannel).toHaveBeenCalledWith('maintenance', 'sms');
  });

  it('toggle aria-label uses "Disable" verb when currently enabled', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const first = rows[0] as HTMLElement;
    const toggles = first.querySelectorAll('.np-toggle');
    expect((toggles[0] as HTMLElement).getAttribute('aria-label')).toBe('Disable Email for Rent Payments');
  });

  it('toggle aria-label uses "Enable" verb when currently disabled', () => {
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    const maintenanceRow = rows[1] as HTMLElement;
    const toggles = maintenanceRow.querySelectorAll('.np-toggle');
    expect((toggles[1] as HTMLElement).getAttribute('aria-label')).toBe('Enable SMS for Maintenance Requests');
  });

  it('renders no rows when svc.prefs() is empty', () => {
    stub.prefs.set([]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    expect(rows.length).toBe(0);
  });

  it('renders no channel summary cards when channelSummary() is empty', () => {
    stub.channelSummary.set([]);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.np-ch-card');
    expect(cards.length).toBe(0);
  });

  it('updates rendered rows when svc.prefs() changes', () => {
    stub.prefs.set([basePrefs[0]]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.np-row');
    expect(rows.length).toBe(1);
    expect((rows[0].querySelector('.np-pref-label') as HTMLElement).textContent).toContain('Rent Payments');
  });
});
