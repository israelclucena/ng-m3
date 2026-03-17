/**
 * HttpErrorInterceptor — Global HTTP error handler
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: HTTP_ERROR_INTERCEPTOR
 *
 * Intercepts HTTP errors and emits them to HttpErrorService.
 * 401 → redirects to login (if auth is present).
 * 403 → emits permission-denied notification.
 * 404 → emits not-found notification.
 * 500+ → emits server-error notification.
 *
 * NOTE: HttpInterceptorFn is inherently Observable-based (Angular framework constraint).
 * RxJS operators `catchError`/`throwError` are used ONLY here — mandatory for the
 * interceptor contract. All application logic is pushed to HttpErrorService (signals).
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { HttpErrorService } from './http-error.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(HttpErrorService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        errorService.handleHttpError(error);
      }
      return throwError(() => error);
    }),
  );
};
