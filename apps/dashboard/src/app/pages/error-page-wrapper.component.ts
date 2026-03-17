/**
 * ErrorPageWrapperComponent — dashboard route wrapper for generic errors
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: ERROR_PAGES
 *
 * Reads optional query params `code` and `message` from the route,
 * forwarding them to `iu-error-page`. Navigation to this route:
 *   router.navigate(['/error'], { queryParams: { code: 500, message: 'Oops' } });
 */
import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ErrorPageComponent } from '@israel-ui/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-error-page-wrapper',
  standalone: true,
  imports: [ErrorPageComponent],
  template: `
    <iu-error-page
      [errorCode]="errorCode()"
      [message]="errorMessage()"
    />
  `,
})
export class ErrorPageWrapperComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(map(p => p)),
    { initialValue: null }
  );

  readonly errorCode = computed(() => {
    return Number(this.queryParams()?.get('code') ?? 500);
  });

  readonly errorMessage = computed(() => {
    return this.queryParams()?.get('message') ?? 'An unexpected error occurred.';
  });
}
