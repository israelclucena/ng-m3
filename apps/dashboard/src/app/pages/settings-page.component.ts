import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import { CardComponent, SwitchComponent, DividerComponent } from '@israel-ui/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CardComponent, SwitchComponent, DividerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="settings-page">
      <h2 class="section-title">Settings</h2>

      <iu-card variant="outlined" title="Appearance">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Dark Theme</span>
            <span class="setting-desc">Toggle between light and dark mode</span>
          </div>
          <iu-switch [checked]="darkMode()" (change)="darkModeToggle.emit()"></iu-switch>
        </div>
      </iu-card>

      <iu-card variant="outlined" title="Notifications">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Push Notifications</span>
            <span class="setting-desc">Receive alerts for important events</span>
          </div>
          <iu-switch [checked]="true"></iu-switch>
        </div>
        <iu-divider></iu-divider>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Email Digest</span>
            <span class="setting-desc">Weekly summary of your activity</span>
          </div>
          <iu-switch></iu-switch>
        </div>
      </iu-card>

      <iu-card variant="outlined" title="About">
        <div class="about-info">
          <p><strong>Israel UI</strong> — Design System</p>
          <p class="version">v0.1.0 · Built with Angular + Material 3</p>
        </div>
      </iu-card>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      max-width: 640px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }
    .setting-info { display: flex; flex-direction: column; gap: 2px; }
    .setting-label {
      font-size: 16px;
      color: var(--md-sys-color-on-surface);
    }
    .setting-desc {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
    .about-info { padding: 12px 0; }
    .about-info p { margin-bottom: 4px; }
    .version {
      font-size: 13px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `],
})
export class SettingsPageComponent {
  darkMode = input<boolean>(false);
  darkModeToggle = output<void>();
}
