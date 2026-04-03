import {
  Component, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationPreferencesService } from '../../services/notification-preferences.service';
import type { NotificationChannel, NotificationCategory } from '../../services/notification-preferences.service';

/**
 * NotificationPreferencesComponent — user notification settings panel.
 *
 * Shows per-category, per-channel toggles (email/SMS/push/in-app) with urgency labels,
 * global channel kill-switches, and a save button. Fully signal-driven.
 *
 * @example
 * <iu-notification-preferences />
 */
@Component({
  selector: 'iu-notification-preferences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="np-root">

      <!-- Header -->
      <div class="np-header">
        <div>
          <h2 class="np-title">Notification Preferences</h2>
          <p class="np-subtitle">Choose how and when you receive notifications</p>
        </div>
        <button
          class="np-save-btn"
          [class.saved]="svc.saved()"
          (click)="svc.save()"
          [disabled]="svc.saved()"
        >
          {{ svc.saved() ? '✓ Saved' : 'Save Changes' }}
        </button>
      </div>

      <!-- Channel Summary -->
      <div class="np-channel-summary">
        @for (ch of svc.channelSummary(); track ch.channel) {
          <div class="np-ch-card">
            <div class="np-ch-icon">{{ svc.channelIcon(ch.channel) }}</div>
            <div class="np-ch-info">
              <div class="np-ch-name">{{ svc.channelLabel(ch.channel) }}</div>
              <div class="np-ch-count">{{ ch.enabled }}/{{ ch.total }} categories</div>
            </div>
            <div class="np-ch-global-toggle">
              <button
                class="np-toggle-all"
                (click)="svc.setChannelGlobal(ch.channel, ch.enabled < ch.total)"
                [title]="ch.enabled < ch.total ? 'Enable all' : 'Disable all'"
              >{{ ch.enabled < ch.total ? 'Enable all' : 'Disable all' }}</button>
            </div>
          </div>
        }
      </div>

      <!-- Preference Rows -->
      <div class="np-table">
        <!-- Column Headers -->
        <div class="np-table-header">
          <div class="np-col-category">Category</div>
          @for (ch of channels; track ch) {
            <div class="np-col-channel">
              <span>{{ svc.channelIcon(ch) }}</span>
              <span>{{ svc.channelLabel(ch) }}</span>
            </div>
          }
        </div>

        @for (pref of svc.prefs(); track pref.category) {
          <div class="np-row">
            <div class="np-row-category">
              <span class="np-pref-icon">{{ pref.icon }}</span>
              <div>
                <div class="np-pref-label">
                  {{ pref.label }}
                  <span
                    class="np-urgency"
                    [style.color]="svc.urgencyColor(pref.urgency)"
                  >{{ pref.urgency }}</span>
                </div>
                <div class="np-pref-desc">{{ pref.description }}</div>
              </div>
            </div>
            @for (ch of channels; track ch) {
              <div class="np-col-toggle">
                <button
                  class="np-toggle"
                  [class.on]="pref.channels[ch]"
                  (click)="svc.toggleChannel(pref.category, ch)"
                  [attr.aria-label]="(pref.channels[ch] ? 'Disable' : 'Enable') + ' ' + svc.channelLabel(ch) + ' for ' + pref.label"
                >
                  <span class="np-toggle-thumb"></span>
                </button>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .np-root {
      padding: 24px;
      font-family: var(--md-sys-typescale-body-large-font, sans-serif);
      background: var(--md-sys-color-background, #fafafa);
      min-height: 100vh;
    }

    /* Header */
    .np-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .np-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      margin: 0 0 4px;
    }
    .np-subtitle {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin: 0;
    }
    .np-save-btn {
      padding: 10px 20px;
      border-radius: 20px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      transition: all 0.2s;
    }
    .np-save-btn.saved {
      background: var(--md-sys-color-surface-container-highest, #ece6f0);
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: default;
    }
    .np-save-btn:disabled { opacity: 0.7; }

    /* Channel Summary */
    .np-channel-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .np-ch-card {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .np-ch-icon { font-size: 24px; }
    .np-ch-info { flex: 1; }
    .np-ch-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }
    .np-ch-count {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .np-toggle-all {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 10px;
      border: 1px solid var(--md-sys-color-outline, #cac4d0);
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      cursor: pointer;
      white-space: nowrap;
    }
    .np-toggle-all:hover {
      background: var(--md-sys-color-primary-container, #eaddff);
    }

    /* Table */
    .np-table {
      background: var(--md-sys-color-surface-container, #fff);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,.12));
    }
    .np-table-header {
      display: grid;
      grid-template-columns: 1fr repeat(4, 100px);
      gap: 0;
      background: var(--md-sys-color-surface-container-high, #ece6f0);
      padding: 12px 20px;
    }
    .np-col-category {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }
    .np-col-channel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-weight: 600;
      text-align: center;
    }

    /* Rows */
    .np-row {
      display: grid;
      grid-template-columns: 1fr repeat(4, 100px);
      gap: 0;
      padding: 16px 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
      align-items: center;
    }
    .np-row:last-child { border-bottom: none; }
    .np-row:hover { background: var(--md-sys-color-surface-container-low, #f7f2fa); }
    .np-row-category {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .np-pref-icon { font-size: 22px; line-height: 1.2; flex-shrink: 0; }
    .np-pref-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .np-urgency {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .np-pref-desc {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      margin-top: 2px;
    }
    .np-col-toggle {
      display: flex;
      justify-content: center;
    }

    /* Toggle Switch */
    .np-toggle {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      border: none;
      background: var(--md-sys-color-surface-container-highest, #ece6f0);
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      padding: 0;
    }
    .np-toggle.on {
      background: var(--md-sys-color-primary, #6750a4);
    }
    .np-toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: left 0.2s, transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .np-toggle.on .np-toggle-thumb { left: 23px; }

    @media (max-width: 900px) {
      .np-channel-summary { grid-template-columns: repeat(2, 1fr); }
      .np-table-header,
      .np-row {
        grid-template-columns: 1fr repeat(4, 70px);
      }
    }
    @media (max-width: 600px) {
      .np-channel-summary { grid-template-columns: 1fr; }
      .np-table { overflow-x: auto; }
      .np-table-header,
      .np-row {
        grid-template-columns: 180px repeat(4, 64px);
        min-width: 440px;
      }
    }
  `],
})
export class NotificationPreferencesComponent {
  readonly svc = inject(NotificationPreferencesService);
  readonly channels: NotificationChannel[] = ['email', 'sms', 'push', 'in_app'];
}
