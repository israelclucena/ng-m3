import { TestBed } from '@angular/core/testing';
import {
  NotificationPreferencesService,
  type NotificationCategory,
  type NotificationChannel,
} from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  const createService = (): NotificationPreferencesService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(NotificationPreferencesService);
  };

  it('initialises with 8 default categories', () => {
    const svc = createService();
    expect(svc.prefs().length).toBe(8);
    const categories = svc.prefs().map(p => p.category).sort();
    expect(categories).toEqual([
      'applications',
      'documents',
      'lease_events',
      'maintenance',
      'marketing',
      'rent_payments',
      'security',
      'viewings',
    ]);
  });

  it('starts in saved=true state', () => {
    const svc = createService();
    expect(svc.saved()).toBe(true);
  });

  it('rent_payments and security default to all-channel enabled (critical urgency)', () => {
    const svc = createService();
    const rent = svc.prefs().find(p => p.category === 'rent_payments')!;
    const sec = svc.prefs().find(p => p.category === 'security')!;
    expect(rent.urgency).toBe('critical');
    expect(sec.urgency).toBe('critical');
    expect(rent.channels).toEqual({ email: true, sms: true, push: true, in_app: true });
    expect(sec.channels).toEqual({ email: true, sms: true, push: true, in_app: true });
  });

  it('marketing defaults to in_app only (low urgency)', () => {
    const svc = createService();
    const mkt = svc.prefs().find(p => p.category === 'marketing')!;
    expect(mkt.urgency).toBe('low');
    expect(mkt.channels).toEqual({ email: false, sms: false, push: false, in_app: true });
  });

  it('toggleChannel flips a single channel and marks dirty', () => {
    const svc = createService();
    svc.toggleChannel('rent_payments', 'sms');
    const rent = svc.prefs().find(p => p.category === 'rent_payments')!;
    expect(rent.channels.sms).toBe(false);
    expect(rent.channels.email).toBe(true); // unaffected
    expect(svc.saved()).toBe(false);
  });

  it('toggleChannel does not affect other categories', () => {
    const svc = createService();
    svc.toggleChannel('rent_payments', 'sms');
    const sec = svc.prefs().find(p => p.category === 'security')!;
    expect(sec.channels.sms).toBe(true);
  });

  it('toggleChannel is reversible (toggle twice → original state)', () => {
    const svc = createService();
    svc.toggleChannel('viewings', 'sms');
    svc.toggleChannel('viewings', 'sms');
    const v = svc.prefs().find(p => p.category === 'viewings')!;
    expect(v.channels.sms).toBe(false); // default was false
  });

  it('setAllChannels(category, false) disables every channel for a category', () => {
    const svc = createService();
    svc.setAllChannels('rent_payments', false);
    const rent = svc.prefs().find(p => p.category === 'rent_payments')!;
    expect(rent.channels).toEqual({ email: false, sms: false, push: false, in_app: false });
    expect(svc.saved()).toBe(false);
  });

  it('setAllChannels(category, true) enables every channel for a category', () => {
    const svc = createService();
    svc.setAllChannels('marketing', true);
    const mkt = svc.prefs().find(p => p.category === 'marketing')!;
    expect(mkt.channels).toEqual({ email: true, sms: true, push: true, in_app: true });
  });

  it('setAllChannels only affects the named category', () => {
    const svc = createService();
    const before = svc.prefs().find(p => p.category === 'viewings')!.channels;
    svc.setAllChannels('rent_payments', false);
    const after = svc.prefs().find(p => p.category === 'viewings')!.channels;
    expect(after).toEqual(before);
  });

  it('setChannelGlobal(ch, false) disables a channel across all categories', () => {
    const svc = createService();
    svc.setChannelGlobal('email', false);
    for (const p of svc.prefs()) {
      expect(p.channels.email).toBe(false);
    }
    expect(svc.saved()).toBe(false);
  });

  it('setChannelGlobal(ch, true) enables a channel across all categories', () => {
    const svc = createService();
    svc.setChannelGlobal('sms', true);
    for (const p of svc.prefs()) {
      expect(p.channels.sms).toBe(true);
    }
  });

  it('setChannelGlobal does not touch other channels', () => {
    const svc = createService();
    svc.setChannelGlobal('sms', false);
    // email defaults preserved
    const rent = svc.prefs().find(p => p.category === 'rent_payments')!;
    expect(rent.channels.email).toBe(true);
    expect(rent.channels.in_app).toBe(true);
  });

  it('save() flips saved back to true without mutating preferences', () => {
    const svc = createService();
    svc.toggleChannel('rent_payments', 'sms');
    const prefsAfterEdit = svc.prefs();
    svc.save();
    expect(svc.saved()).toBe(true);
    expect(svc.prefs()).toBe(prefsAfterEdit);
  });

  it('channelSummary reports enabled/total per channel from defaults', () => {
    const svc = createService();
    const summary = svc.channelSummary();
    const total = svc.prefs().length;

    expect(summary.length).toBe(4);
    for (const row of summary) {
      expect(row.total).toBe(total);
    }
    // Spot-check: email defaults true on 7/8 categories (marketing is the only false)
    const email = summary.find(s => s.channel === 'email')!;
    expect(email.enabled).toBe(7);
    // in_app default true on all 8
    const inApp = summary.find(s => s.channel === 'in_app')!;
    expect(inApp.enabled).toBe(8);
  });

  it('channelSummary reacts to setChannelGlobal', () => {
    const svc = createService();
    svc.setChannelGlobal('email', false);
    const email = svc.channelSummary().find(s => s.channel === 'email')!;
    expect(email.enabled).toBe(0);
  });

  it('channelSummary reacts to setAllChannels', () => {
    const svc = createService();
    svc.setAllChannels('marketing', true);
    const email = svc.channelSummary().find(s => s.channel === 'email')!;
    // marketing email went false→true, so enabled goes 7 → 8
    expect(email.enabled).toBe(8);
  });

  it('urgencyColor returns hex codes for all 4 urgency levels', () => {
    const svc = createService();
    expect(svc.urgencyColor('critical')).toBe('#D32F2F');
    expect(svc.urgencyColor('high')).toBe('#E65100');
    expect(svc.urgencyColor('normal')).toBe('#1976D2');
    expect(svc.urgencyColor('low')).toBe('#757575');
  });

  it('channelLabel returns human-friendly name for each channel', () => {
    const svc = createService();
    const labels: Record<NotificationChannel, string> = {
      email: 'Email',
      sms: 'SMS',
      push: 'Push',
      in_app: 'In-App',
    };
    for (const [ch, expected] of Object.entries(labels) as [NotificationChannel, string][]) {
      expect(svc.channelLabel(ch)).toBe(expected);
    }
  });

  it('channelIcon returns an emoji for each channel', () => {
    const svc = createService();
    for (const ch of ['email', 'sms', 'push', 'in_app'] as NotificationChannel[]) {
      const icon = svc.channelIcon(ch);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    }
  });

  it('does not mutate the original DEFAULT_PREFS object between instances', () => {
    const a = createService();
    a.setChannelGlobal('email', false);

    const b = createService();
    // New instance must start from clean defaults again, not the mutated state
    const bRent = b.prefs().find(p => p.category === 'rent_payments')!;
    expect(bRent.channels.email).toBe(true);
  });

  it('toggleChannel handles every category × channel combination without throwing', () => {
    const svc = createService();
    const cats: NotificationCategory[] = [
      'rent_payments', 'maintenance', 'lease_events', 'viewings',
      'applications', 'documents', 'security', 'marketing',
    ];
    const chans: NotificationChannel[] = ['email', 'sms', 'push', 'in_app'];
    for (const c of cats) {
      for (const ch of chans) {
        expect(() => svc.toggleChannel(c, ch)).not.toThrow();
      }
    }
    expect(svc.prefs().length).toBe(8);
  });
});
