/**
 * HttpErrorService — Centralised HTTP error handler
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: HTTP_ERROR_INTERCEPTOR
 *
 * Exposes a signal-based error stream. Components can read
 * `lastError()` to react to the most recent HTTP failure.
 * Integrates with NotificationService when available.
 *
 * @example
 * const errorSvc = inject(HttpErrorService);
 * effect(() => { if (errorSvc.lastError()) console.warn(errorSvc.lastError()); });
 */
import { Injectable, signal, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

export interface HttpErrorInfo {
  status: number;
  message: string;
  url: string | null;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  private readonly router = inject(Router);

  /** Signal holding the most recent HTTP error, or null if none. */
  readonly lastError = signal<HttpErrorInfo | null>(null);

  /** Count of unhandled errors in this session. */
  readonly errorCount = signal<number>(0);

  /**
   * Process an HttpErrorResponse: update signals and trigger side-effects.
   * @param error - The HTTP error response to handle.
   */
  handleHttpError(error: HttpErrorResponse): void {
    const info: HttpErrorInfo = {
      status: error.status,
      message: this.#resolveMessage(error),
      url: error.url,
      timestamp: new Date(),
    };

    this.lastError.set(info);
    this.errorCount.update(n => n + 1);

    this.#sideEffects(info);
  }

  /** Clear the last error. */
  clearError(): void {
    this.lastError.set(null);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  #resolveMessage(error: HttpErrorResponse): string {
    if (error.error?.message) return error.error.message;
    switch (error.status) {
      case 0:    return 'Network error — check your connection.';
      case 400:  return 'Bad request. Please check your input.';
      case 401:  return 'Session expired. Please log in again.';
      case 403:  return 'You don\'t have permission to do this.';
      case 404:  return 'The requested resource was not found.';
      case 409:  return 'Conflict — the resource may already exist.';
      case 422:  return 'Validation error. Please check your input.';
      case 429:  return 'Too many requests. Please slow down.';
      case 500:  return 'Server error. Please try again later.';
      case 503:  return 'Service unavailable. Please try again shortly.';
      default:   return `Unexpected error (${error.status}).`;
    }
  }

  #sideEffects(info: HttpErrorInfo): void {
    if (info.status === 401) {
      // Redirect to login if not already there
      if (!this.router.url.includes('/auth')) {
        this.router.navigate(['/auth/login']);
      }
    }
    if (info.status >= 500) {
      console.error('[HttpErrorService] Server error:', info);
    }
  }
}
