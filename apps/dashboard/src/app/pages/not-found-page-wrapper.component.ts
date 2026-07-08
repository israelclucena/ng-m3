/**
 * NotFoundPageWrapperComponent — dashboard route wrapper for 404
 *
 * Sprint 023 — Night Shift 2026-03-17
 * Feature flag: ERROR_PAGES
 *
 * Thin wrapper around `iu-not-found-page` so the component is routable
 * without touching the library component directly.
 */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NotFoundPageComponent } from '@israel-ui/core';

@Component({
  selector: 'app-not-found-page-wrapper',
  standalone: true,
  imports: [NotFoundPageComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<iu-not-found-page />`,
})
export class NotFoundPageWrapperComponent {}
