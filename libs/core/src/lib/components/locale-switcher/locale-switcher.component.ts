/**
 * `iu-locale-switcher`
 *
 * Compact locale toggle between PT-PT and EN-GB.
 * Integrates with I18nService (Angular Signals, no RxJS).
 *
 * @example
 * ```html
 * <iu-locale-switcher />
 * ```
 */
import {
  Component, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { I18nService, SupportedLocale } from '../../services/i18n.service';

@Component({
  selector: 'iu-locale-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="locale-switcher" role="group" aria-label="Language selector">
      @for (opt of locales; track opt.code) {
        <button
          class="locale-btn"
          [class.locale-btn--active]="i18n.locale() === opt.code"
          [attr.aria-pressed]="i18n.locale() === opt.code"
          [attr.lang]="opt.htmlLang"
          (click)="switch(opt.code)"
          [title]="opt.label"
        >
          <span class="flag">{{ opt.flag }}</span>
          <span class="code">{{ opt.shortCode }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .locale-switcher {
      display: flex;
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 100px;
      overflow: hidden;
      background: var(--md-sys-color-surface-container);
    }
    .locale-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      transition: all .15s;
    }
    .locale-btn:hover { background: var(--md-sys-color-surface-container-high); }
    .locale-btn--active {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
    .locale-btn--active:hover { background: var(--md-sys-color-primary); }
    .flag { font-size: 1em; }
    .code { font-weight: 600; }
  `],
})
export class LocaleSwitcherComponent {
  readonly i18n = inject(I18nService);

  readonly locales: { code: SupportedLocale; label: string; flag: string; shortCode: string; htmlLang: string }[] = [
    { code: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹', shortCode: 'PT', htmlLang: 'pt' },
    { code: 'en-GB', label: 'English (UK)',          flag: '🇬🇧', shortCode: 'EN', htmlLang: 'en' },
  ];

  switch(code: SupportedLocale): void {
    this.i18n.setLocale(code);
  }
}
