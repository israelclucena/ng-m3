/**
 * Application configuration — Sprint 022: Angular Router + Lazy Routing
 *
 * Changes:
 * - Added `provideRouter(appRoutes)` with `withComponentInputBinding()`
 *   so route params (`:componentId`, `:sectionId`) are bound as `@Input()` signals.
 * - Added `withViewTransitions()` for M3-style page transitions (CSS-based).
 * - PWA service worker retained from Sprint 020.
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { appRoutes } from './app.routes';
import { FeatureFlags } from './feature-flags';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Sprint 022 — Angular Router with lazy route code splitting
    provideRouter(
      appRoutes,
      // Binds route params/query params as @Input() on routed components
      withComponentInputBinding(),
      // CSS View Transitions API for smooth page changes
      withViewTransitions(),
    ),

    // Sprint 020 — PWA / Service Worker
    ...(FeatureFlags.PWA_MODULE
      ? [
          provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
          }),
        ]
      : []),
  ],
};
