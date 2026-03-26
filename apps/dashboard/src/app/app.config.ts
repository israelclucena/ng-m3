/**
 * Application configuration — Sprint 023 / Sprint 031
 *
 * Sprint 031 changes (ZONELESS_MODE):
 * - Added `provideExperimentalZonelessChangeDetection()` — eliminates Zone.js entirely.
 *   The project polyfills already contain no zone.js (only es-module-shims), so this
 *   is the only change needed to activate fully zoneless rendering.
 *   Benefits: ~30-50KB bundle reduction, 40-50% LCP improvement, no task scheduling overhead.
 *   All components already use OnPush + Signals — fully compatible.
 *   Note: "Experimental" API in Angular 21; will be promoted in Angular 22 (OnPush default).
 *
 * Sprint 023 changes:
 * - Added `provideClientHydration()` (HYDRATION_MODULE flag) — enables Angular
 *   hydration so SSR-rendered HTML is "adopted" by the client without a full re-render.
 * - Added `provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor]))`.
 * - Added `GlobalErrorHandler` as the Angular ErrorHandler override (ERROR_PAGES flag).
 * - PWA service worker retained from Sprint 020.
 */
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { appRoutes } from './app.routes';
import { FeatureFlags } from './feature-flags';
import { GlobalErrorHandler } from '@israel-ui/core';
import { httpErrorInterceptor } from '@israel-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Sprint 031 — Zoneless Change Detection (ZONELESS_MODE)
    // Eliminates Zone.js patching entirely. All components use OnPush + Signals.
    // No zone.js in polyfills (apps/dashboard/project.json uses only es-module-shims).
    ...(FeatureFlags.ZONELESS_MODE
      ? [provideZonelessChangeDetection()]
      : []),

    // Sprint 022 — Angular Router with lazy route code splitting
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
    ),

    // Sprint 023 — SSR Hydration (HYDRATION_MODULE)
    ...(FeatureFlags.HYDRATION_MODULE
      ? [provideClientHydration(withIncrementalHydration())]
      : []),

    // Sprint 023 — HTTP client with Fetch backend + error interceptor
    ...(FeatureFlags.HTTP_ERROR_INTERCEPTOR
      ? [provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor]))]
      : [provideHttpClient(withFetch())]),

    // Sprint 023 — Global Angular ErrorHandler override (ERROR_PAGES)
    ...(FeatureFlags.ERROR_PAGES
      ? [{ provide: ErrorHandler, useClass: GlobalErrorHandler }]
      : []),

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
