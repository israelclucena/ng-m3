import { Injectable, computed, signal } from '@angular/core';

// ─── Models ──────────────────────────────────────────────────────────────────

/**
 * Authenticated user profile.
 * Feature flag: `AUTH_MODULE`
 */
export interface AuthUser {
  /** Unique user identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Optional avatar URL */
  avatarUrl?: string;
  /** User role */
  role: 'tenant' | 'landlord' | 'admin';
}

/**
 * Login credentials payload.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data payload.
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'tenant' | 'landlord';
}

/**
 * Result of an auth operation.
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * AuthService — Signal-based authentication state management.
 *
 * Simulates async login/register/logout with mock delay.
 * In production, replace `_mockLogin` / `_mockRegister` with real HTTP calls.
 *
 * Feature flag: `AUTH_MODULE`
 *
 * @example
 * ```ts
 * const auth = inject(AuthService);
 * if (auth.isAuthenticated()) { ... }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── Private state ─────────────────────────────────────────────────────────

  private readonly _user = signal<AuthUser | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ── Public computed ───────────────────────────────────────────────────────

  /** The currently authenticated user, or null if not logged in. */
  readonly user = this._user.asReadonly();

  /** True while an auth operation is in progress. */
  readonly loading = this._loading.asReadonly();

  /** Last auth error message, or null. */
  readonly authError = this._error.asReadonly();

  /** True if a user is authenticated. */
  readonly isAuthenticated = computed(() => this._user() !== null);

  /** Current user's display name, or empty string. */
  readonly displayName = computed(() => this._user()?.name ?? '');

  /** Current user's initials for avatar fallback. */
  readonly initials = computed(() => {
    const name = this._user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });

  // ── Methods ───────────────────────────────────────────────────────────────

  /**
   * Authenticate with email + password.
   * Simulates network delay; replace with real HTTP in production.
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this._mockDelay(800);

      // Mock validation — accept any well-formed credentials
      if (!credentials.email || !credentials.password) {
        const msg = 'Email e password são obrigatórios';
        this._error.set(msg);
        return { success: false, error: msg };
      }
      if (credentials.password.length < 6) {
        const msg = 'Password incorrecta';
        this._error.set(msg);
        return { success: false, error: msg };
      }

      const user: AuthUser = {
        id: `user_${Date.now()}`,
        name: this._nameFromEmail(credentials.email),
        email: credentials.email,
        role: 'tenant',
        avatarUrl: undefined,
      };

      this._user.set(user);
      return { success: true };
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Register a new account.
   * Simulates network delay; replace with real HTTP in production.
   */
  async register(data: RegisterData): Promise<AuthResult> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this._mockDelay(1000);

      if (!data.name || !data.email || !data.password) {
        const msg = 'Todos os campos são obrigatórios';
        this._error.set(msg);
        return { success: false, error: msg };
      }
      if (data.password.length < 8) {
        const msg = 'A password deve ter pelo menos 8 caracteres';
        this._error.set(msg);
        return { success: false, error: msg };
      }

      const user: AuthUser = {
        id: `user_${Date.now()}`,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        role: data.role,
        avatarUrl: undefined,
      };

      this._user.set(user);
      return { success: true };
    } finally {
      this._loading.set(false);
    }
  }

  /** Clear current session and return to unauthenticated state. */
  logout(): void {
    this._user.set(null);
    this._error.set(null);
  }

  /** Clear the current error message. */
  clearError(): void {
    this._error.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _mockDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _nameFromEmail(email: string): string {
    const local = email.split('@')[0];
    return local
      .split(/[._-]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
