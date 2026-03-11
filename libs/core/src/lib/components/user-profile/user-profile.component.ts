import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthUser } from '../../services/auth.service';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * Aggregated stats shown on the profile card.
 * Feature flag: `USER_PROFILE`
 */
export interface UserProfileStats {
  /** Total bookings (visits + inquiries) */
  bookings: number;
  /** Number of saved/favourited properties */
  favourites: number;
  /** Number of owned listings (landlords only) */
  listings?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `iu-user-profile` — M3 user profile card.
 *
 * Displays avatar (image or initials fallback), name, email, role badge,
 * optional stats row, and edit / logout action buttons.
 *
 * Feature flag: `USER_PROFILE`
 *
 * @example
 * ```html
 * <iu-user-profile
 *   [user]="currentUser()"
 *   [stats]="{ bookings: 3, favourites: 7 }"
 *   [editable]="true"
 *   (editProfile)="openEditModal()"
 *   (logout)="auth.logout()"
 * />
 * ```
 */
@Component({
  selector: 'iu-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="iu-user-profile" [class.compact]="compact()">

      <!-- ── Avatar ── -->
      <div class="avatar-wrap">
        @if (user().avatarUrl) {
          <img class="avatar-img" [src]="user().avatarUrl" [alt]="user().name" />
        } @else {
          <div class="avatar-initials" [attr.aria-label]="user().name">
            {{ initials() }}
          </div>
        }
        @if (editable()) {
          <button class="avatar-edit-btn" (click)="editAvatar.emit()" aria-label="Alterar foto de perfil">
            <span class="material-symbols-outlined">photo_camera</span>
          </button>
        }
      </div>

      <!-- ── Info ── -->
      <div class="profile-body">
        <div class="profile-info">
          <h2 class="profile-name">{{ user().name }}</h2>
          <p class="profile-email">{{ user().email }}</p>
          <span class="role-badge" [class]="'role-' + user().role">
            <span class="material-symbols-outlined role-icon">{{ roleIcon() }}</span>
            {{ roleLabel() }}
          </span>
        </div>

        <!-- ── Stats ── -->
        @if (stats()) {
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{{ stats()!.bookings }}</span>
              <span class="stat-label">Reservas</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <span class="stat-value">{{ stats()!.favourites }}</span>
              <span class="stat-label">Favoritos</span>
            </div>
            @if (stats()!.listings !== undefined) {
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-value">{{ stats()!.listings }}</span>
                <span class="stat-label">Imóveis</span>
              </div>
            }
          </div>
        }

        <!-- ── Actions ── -->
        @if (editable()) {
          <div class="profile-actions">
            <button class="btn-filled" (click)="editProfile.emit()">
              <span class="material-symbols-outlined">edit</span>
              Editar Perfil
            </button>
            <button class="btn-text danger" (click)="logout.emit()">
              <span class="material-symbols-outlined">logout</span>
              Sair
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .iu-user-profile {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      background: var(--md-sys-color-surface-container-low, #f7f2fa);
      border-radius: 24px;
      padding: 28px;
      font-family: 'Roboto', sans-serif;
    }

    /* Compact = horizontal, no stat dividers */
    .iu-user-profile.compact {
      padding: 16px 20px;
      gap: 16px;
      align-items: center;
    }

    /* ── Avatar ── */
    .avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-img,
    .avatar-initials {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
    }

    .compact .avatar-img,
    .compact .avatar-initials {
      width: 56px;
      height: 56px;
      font-size: 1.2rem;
    }

    .avatar-initials {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--md-sys-color-primary-container, #eaddff);
      color: var(--md-sys-color-on-primary-container, #21005d);
      font-size: 2rem;
      font-weight: 700;
    }

    .avatar-edit-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid var(--md-sys-color-surface, #fffbfe);
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .avatar-edit-btn:hover {
      background: var(--md-sys-color-secondary, #625b71);
      color: #fff;
    }

    .avatar-edit-btn .material-symbols-outlined { font-size: 16px; }

    /* ── Body ── */
    .profile-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Info ── */
    .profile-name {
      margin: 0 0 4px;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .compact .profile-name {
      font-size: 1.1rem;
      margin: 0 0 2px;
    }

    .profile-email {
      margin: 0 0 10px;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .role-icon { font-size: 14px; }

    .role-tenant {
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
    }

    .role-landlord {
      background: var(--md-sys-color-tertiary-container, #ffd8e4);
      color: var(--md-sys-color-on-tertiary-container, #31111d);
    }

    .role-admin {
      background: var(--md-sys-color-error-container, #f9dedc);
      color: var(--md-sys-color-on-error-container, #410e0b);
    }

    /* ── Stats ── */
    .profile-stats {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--md-sys-color-surface, #fffbfe);
      border-radius: 16px;
      padding: 14px 20px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--md-sys-color-primary, #6750a4);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      white-space: nowrap;
    }

    .stat-divider {
      width: 1px;
      height: 36px;
      background: var(--md-sys-color-outline-variant, #cac4d0);
    }

    /* ── Actions ── */
    .profile-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-filled {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 100px;
      border: none;
      background: var(--md-sys-color-primary, #6750a4);
      color: var(--md-sys-color-on-primary, #fff);
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-filled:hover { opacity: 0.9; }
    .btn-filled .material-symbols-outlined { font-size: 18px; }

    .btn-text {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 100px;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-text:hover { background: var(--md-sys-color-surface-container, #ece6f0); }
    .btn-text.danger { color: var(--md-sys-color-error, #b3261e); }
    .btn-text .material-symbols-outlined { font-size: 18px; }
  `],
})
export class UserProfileComponent {
  /** Authenticated user data (required). */
  readonly user = input.required<AuthUser>();

  /** Profile statistics row. */
  readonly stats = input<UserProfileStats | null>(null);

  /** Show edit avatar / edit profile / logout buttons. */
  readonly editable = input<boolean>(true);

  /** Compact horizontal layout (no stats). */
  readonly compact = input<boolean>(false);

  /** Emits when user clicks "Editar Perfil". */
  readonly editProfile = output<void>();

  /** Emits when user clicks the avatar camera button. */
  readonly editAvatar = output<void>();

  /** Emits when user clicks "Sair". */
  readonly logout = output<void>();

  readonly initials = computed(() => {
    const name = this.user().name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });

  readonly roleLabel = computed(() => {
    const map: Record<string, string> = {
      tenant: 'Inquilino',
      landlord: 'Proprietário',
      admin: 'Administrador',
    };
    return map[this.user().role] ?? 'Utilizador';
  });

  readonly roleIcon = computed(() => {
    const map: Record<string, string> = {
      tenant: 'person',
      landlord: 'home',
      admin: 'admin_panel_settings',
    };
    return map[this.user().role] ?? 'person';
  });
}
