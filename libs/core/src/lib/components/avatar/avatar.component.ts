import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'rounded' | 'square';

/**
 * Avatar — Displays a user avatar with image, initials fallback, and icon fallback.
 *
 * Supports single and stacked (group) modes. Uses M3 color tokens for initials.
 *
 * @example
 * ```html
 * <!-- Image avatar -->
 * <iu-avatar src="https://..." name="Israel Lucena" size="md" />
 *
 * <!-- Initials fallback -->
 * <iu-avatar name="Israel Lucena" size="lg" />
 *
 * <!-- Group stack -->
 * <iu-avatar-group [avatars]="users" [max]="4" />
 * ```
 */
@Component({
  selector: 'iu-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="iu-avatar"
      [class]="avatarClasses()"
      [style.background-color]="!src() ? colorFromName() : null"
      [title]="name()"
      [attr.aria-label]="name()"
      role="img"
    >
      @if (src() && !imgError()) {
        <img
          [src]="src()"
          [alt]="name()"
          class="iu-avatar__img"
          (error)="onImgError()"
        />
      } @else if (initials()) {
        <span class="iu-avatar__initials">{{ initials() }}</span>
      } @else {
        <span class="material-symbols-outlined iu-avatar__icon">person</span>
      }

      @if (online() !== undefined) {
        <span
          class="iu-avatar__status"
          [class.iu-avatar__status--online]="online()"
          [class.iu-avatar__status--offline]="!online()"
        ></span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    .iu-avatar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      font-family: var(--md-sys-typescale-label-medium-font, system-ui);
      font-weight: 500;
      color: var(--md-sys-color-on-primary, #fff);
      background: var(--md-sys-color-primary, #6750a4);
      user-select: none;

      &--xs  { width: 24px; height: 24px; font-size: 10px; }
      &--sm  { width: 32px; height: 32px; font-size: 12px; }
      &--md  { width: 40px; height: 40px; font-size: 14px; }
      &--lg  { width: 56px; height: 56px; font-size: 18px; }
      &--xl  { width: 72px; height: 72px; font-size: 24px; }

      &--circle  { border-radius: 50%; }
      &--rounded { border-radius: 12px; }
      &--square  { border-radius: 4px; }
    }

    .iu-avatar__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .iu-avatar__initials {
      line-height: 1;
      letter-spacing: 0.02em;
    }

    .iu-avatar__icon {
      font-size: 60%;
      opacity: 0.9;
    }

    .iu-avatar__status {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 22%;
      height: 22%;
      min-width: 6px;
      min-height: 6px;
      border-radius: 50%;
      border: 2px solid var(--md-sys-color-surface, #fff);

      &--online  { background: #4caf50; }
      &--offline { background: var(--md-sys-color-outline-variant, #ccc); }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** Image URL */
  src = input<string>('');
  /** Full name — used for initials and aria-label */
  name = input<string>('');
  /** Size variant */
  size = input<AvatarSize>('md');
  /** Shape variant */
  shape = input<AvatarShape>('circle');
  /** Online status indicator (undefined = hidden) */
  online = input<boolean | undefined>(undefined);

  /** @internal image load error state */
  readonly imgError = signal(false);

  /** Computed initials (max 2 chars) from name */
  readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '';
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  /** Computed CSS classes */
  readonly avatarClasses = computed(() =>
    `iu-avatar--${this.size()} iu-avatar--${this.shape()}`
  );

  /** Deterministic color from name (M3-palette-inspired) */
  readonly colorFromName = computed(() => {
    const palette = [
      '#6750a4', '#7965af', '#8b7ebb', '#958da5',
      '#006874', '#4a9c9c', '#006e1c', '#386a20',
      '#9c4146', '#c0282d', '#8c4a2f', '#984061',
    ];
    if (!this.name()) return palette[0];
    const hash = [...this.name()].reduce((a, c) => a + c.charCodeAt(0), 0);
    return palette[hash % palette.length];
  });

  /** @internal handle image load error */
  onImgError(): void {
    this.imgError.set(true);
  }
}

// ─── Avatar Group ──────────────────────────────────────────────────────────

export interface AvatarGroupItem {
  name: string;
  src?: string;
  online?: boolean;
}

/**
 * AvatarGroup — Stacked avatars with overflow badge.
 *
 * @example
 * ```html
 * <iu-avatar-group [avatars]="users" [max]="4" size="sm" />
 * ```
 */
@Component({
  selector: 'iu-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="iu-avatar-group" [attr.aria-label]="groupLabel()">
      @for (avatar of visibleAvatars(); track avatar.name; let i = $index) {
        <div class="iu-avatar-group__item" [style.z-index]="visibleAvatars().length - i">
          <iu-avatar
            [src]="avatar.src || ''"
            [name]="avatar.name"
            [size]="size()"
            [online]="avatar.online"
          />
        </div>
      }
      @if (overflow() > 0) {
        <div
          class="iu-avatar-group__item iu-avatar-group__overflow"
          [class]="overflowClasses()"
          [style.z-index]="0"
        >+{{ overflow() }}</div>
      }
    </div>
  `,
  styles: [`
    .iu-avatar-group {
      display: flex;
      flex-direction: row-reverse;
      width: fit-content;

      &__item {
        margin-left: -8px;
        position: relative;

        iu-avatar {
          box-shadow: 0 0 0 2px var(--md-sys-color-surface, #fff);
          border-radius: 50%;
        }
      }

      &__overflow {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--md-sys-color-secondary-container, #e8def8);
        color: var(--md-sys-color-on-secondary-container, #1d192b);
        font-weight: 500;
        font-size: 12px;
        box-shadow: 0 0 0 2px var(--md-sys-color-surface, #fff);

        &--xs  { width: 24px; height: 24px; font-size: 10px; }
        &--sm  { width: 32px; height: 32px; font-size: 11px; }
        &--md  { width: 40px; height: 40px; font-size: 12px; }
        &--lg  { width: 56px; height: 56px; font-size: 16px; }
        &--xl  { width: 72px; height: 72px; font-size: 20px; }
      }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarGroupComponent {
  /** List of avatars to display */
  avatars = input<AvatarGroupItem[]>([]);
  /** Maximum visible before overflow badge */
  max = input<number>(4);
  /** Size applied to all avatars */
  size = input<AvatarSize>('md');

  readonly visibleAvatars = computed(() => this.avatars().slice(0, this.max()));
  readonly overflow = computed(() => Math.max(0, this.avatars().length - this.max()));
  readonly overflowClasses = computed(() => `iu-avatar-group__overflow--${this.size()}`);
  readonly groupLabel = computed(() =>
    `${this.avatars().length} member${this.avatars().length !== 1 ? 's' : ''}`
  );
}
