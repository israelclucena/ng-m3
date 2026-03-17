/**
 * ErrorPageComponent — Generic 500 / server error page
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: ERROR_PAGES
 *
 * Accepts an optional `errorCode` and `errorMessage` input.
 * Shows a user-friendly error UI with retry and home actions.
 * Standalone, signal-based, no RxJS.
 */
import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'iu-error-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-page">
      <div class="error-page__icon" aria-hidden="true">⚠️</div>
      <h1 class="error-page__code">{{ errorCode() }}</h1>
      <h2 class="error-page__title">{{ title() }}</h2>
      <p class="error-page__message">{{ message() }}</p>
      <div class="error-page__actions">
        <button
          class="error-page__btn error-page__btn--primary"
          (click)="retry()"
          type="button"
        >
          Try Again
        </button>
        <button
          class="error-page__btn error-page__btn--secondary"
          (click)="goHome()"
          type="button"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: var(--md-sys-color-surface, #fef7ff);
    }

    .error-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 480px;
      padding: 48px 24px;
      text-align: center;
    }

    .error-page__icon {
      font-size: 72px;
      line-height: 1;
    }

    .error-page__code {
      font-family: var(--md-sys-typescale-display-large-font, 'Roboto', sans-serif);
      font-size: 96px;
      font-weight: 700;
      line-height: 1;
      margin: 0;
      color: var(--md-sys-color-error, #b3261e);
    }

    .error-page__title {
      font-family: var(--md-sys-typescale-headline-large-font, 'Roboto', sans-serif);
      font-size: 28px;
      font-weight: 600;
      margin: 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .error-page__message {
      font-family: var(--md-sys-typescale-body-large-font, 'Roboto', sans-serif);
      font-size: 16px;
      margin: 0;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      line-height: 1.5;
    }

    .error-page__actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 8px;
    }

    .error-page__btn {
      padding: 10px 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: box-shadow 0.2s ease;

      &--primary {
        background-color: var(--md-sys-color-error, #b3261e);
        color: var(--md-sys-color-on-error, #ffffff);

        &:hover {
          box-shadow: 0 1px 3px rgba(179, 38, 30, 0.4);
        }
      }

      &--secondary {
        background-color: transparent;
        color: var(--md-sys-color-primary, #6750a4);
        border: 1px solid var(--md-sys-color-outline, #79747e);

        &:hover {
          background-color: var(--md-sys-color-primary-container, #eaddff);
        }
      }
    }
  `],
})
export class ErrorPageComponent {
  /** HTTP error code to display (e.g. 500). */
  readonly errorCode = input<number | string>(500);

  /** Title shown below the error code. */
  readonly title = input<string>('Something went wrong');

  /** Descriptive error message for the user. */
  readonly message = input<string>(
    'An unexpected error occurred. Our team has been notified. Please try again.'
  );

  private readonly router = inject(Router);

  /** Reload the current page to retry. */
  retry(): void {
    window.location.reload();
  }

  /** Navigate to the dashboard home. */
  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
