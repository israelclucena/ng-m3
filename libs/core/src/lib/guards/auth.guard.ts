import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * authGuard — Functional route guard that redirects unauthenticated users.
 *
 * Feature flag: `AUTH_GUARDS`
 *
 * @example
 * ```ts
 * // In app routes:
 * { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent }
 * ```
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Redirect to login with the attempted URL as a query param
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: _state.url },
  });
};

/**
 * guestGuard — Redirects authenticated users away from auth pages.
 *
 * Feature flag: `AUTH_GUARDS`
 *
 * @example
 * ```ts
 * { path: 'login', canActivate: [guestGuard], component: LoginPageComponent }
 * ```
 */
export const guestGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
