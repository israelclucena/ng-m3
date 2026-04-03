import { Injectable, signal, computed } from '@angular/core';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationCategory =
  | 'rent_payments'
  | 'maintenance'
  | 'lease_events'
  | 'viewings'
  | 'applications'
  | 'documents'
  | 'security'
  | 'marketing';

export interface NotificationPreference {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: string;
  channels: Record<NotificationChannel, boolean>;
  urgency: 'critical' | 'high' | 'normal' | 'low';
}

const DEFAULT_PREFS: NotificationPreference[] = [
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
    category: 'lease_events',
    label: 'Lease Events',
    description: 'Renewals, expirations, and signing completions',
    icon: '📋',
    urgency: 'high',
    channels: { email: true, sms: true, push: true, in_app: true },
  },
  {
    category: 'viewings',
    label: 'Property Viewings',
    description: 'New viewing requests and schedule updates',
    icon: '🏠',
    urgency: 'normal',
    channels: { email: true, sms: false, push: true, in_app: true },
  },
  {
    category: 'applications',
    label: 'Tenant Applications',
    description: 'New applications and application status changes',
    icon: '📝',
    urgency: 'normal',
    channels: { email: true, sms: false, push: true, in_app: true },
  },
  {
    category: 'documents',
    label: 'Documents',
    description: 'New uploads, expiries, and signature requests',
    icon: '📁',
    urgency: 'normal',
    channels: { email: true, sms: false, push: false, in_app: true },
  },
  {
    category: 'security',
    label: 'Security Alerts',
    description: 'Login attempts, device changes, and suspicious activity',
    icon: '🔒',
    urgency: 'critical',
    channels: { email: true, sms: true, push: true, in_app: true },
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

/** NotificationPreferencesService — manage per-category, per-channel notification preferences. */
@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private _prefs = signal<NotificationPreference[]>(DEFAULT_PREFS);
  private _saved = signal(true);

  readonly prefs = this._prefs.asReadonly();
  readonly saved = this._saved.asReadonly();

  readonly channelSummary = computed(() => {
    const prefs = this._prefs();
    const channels: NotificationChannel[] = ['email', 'sms', 'push', 'in_app'];
    return channels.map(ch => ({
      channel: ch,
      enabled: prefs.filter(p => p.channels[ch]).length,
      total: prefs.length,
    }));
  });

  /**
   * Toggle a specific channel for a category.
   * @param category - notification category
   * @param channel - notification channel
   */
  toggleChannel(category: NotificationCategory, channel: NotificationChannel): void {
    this._prefs.update(prefs =>
      prefs.map(p =>
        p.category === category
          ? { ...p, channels: { ...p.channels, [channel]: !p.channels[channel] } }
          : p
      )
    );
    this._saved.set(false);
  }

  /**
   * Enable/disable all channels for a category.
   * @param category - notification category
   * @param enabled - true to enable all
   */
  setAllChannels(category: NotificationCategory, enabled: boolean): void {
    this._prefs.update(prefs =>
      prefs.map(p =>
        p.category === category
          ? {
              ...p,
              channels: {
                email: enabled, sms: enabled, push: enabled, in_app: enabled,
              },
            }
          : p
      )
    );
    this._saved.set(false);
  }

  /**
   * Enable/disable a channel across ALL categories.
   * @param channel - notification channel
   * @param enabled - true to enable
   */
  setChannelGlobal(channel: NotificationChannel, enabled: boolean): void {
    this._prefs.update(prefs =>
      prefs.map(p => ({
        ...p,
        channels: { ...p.channels, [channel]: enabled },
      }))
    );
    this._saved.set(false);
  }

  /** Persist changes (mock). */
  save(): void {
    this._saved.set(true);
  }

  /** Urgency colour for a category. */
  urgencyColor(urgency: 'critical' | 'high' | 'normal' | 'low'): string {
    return { critical: '#D32F2F', high: '#E65100', normal: '#1976D2', low: '#757575' }[urgency];
  }

  /** Channel display name. */
  channelLabel(ch: NotificationChannel): string {
    return { email: 'Email', sms: 'SMS', push: 'Push', in_app: 'In-App' }[ch];
  }

  /** Channel icon. */
  channelIcon(ch: NotificationChannel): string {
    return { email: '📧', sms: '📱', push: '🔔', in_app: '🖥️' }[ch];
  }
}
