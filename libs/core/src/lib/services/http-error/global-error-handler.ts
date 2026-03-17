/**
 * GlobalErrorHandler — Angular ErrorHandler override
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: HTTP_ERROR_INTERCEPTOR
 *
 * Catches unhandled errors thrown inside the Angular zone.
 * Logs them and stores the last error in a signal for devtools.
 *
 * Register in app.config.ts:
 * ```ts
 * { provide: ErrorHandler, useClass: GlobalErrorHandler }
 * ```
 */
import { ErrorHandler, Injectable, signal } from '@angular/core';

export interface AppError {
  message: string;
  stack?: string;
  timestamp: Date;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /** Last unhandled application error. */
  readonly lastAppError = signal<AppError | null>(null);

  /** Total unhandled error count. */
  readonly appErrorCount = signal<number>(0);

  /** Handle an unhandled error thrown in the Angular zone. */
  handleError(error: unknown): void {
    const appError: AppError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
    };

    this.lastAppError.set(appError);
    this.appErrorCount.update(n => n + 1);

    // Always log to console for DevTools visibility
    console.error('[GlobalErrorHandler]', appError.message, error);
  }
}
