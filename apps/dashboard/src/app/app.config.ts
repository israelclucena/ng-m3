/**
 * Application configuration — Sprint 023: SSR Hydration + Error Handling
 *
 * Changes from Sprint 022:
 * - Added `provideClientHydration()` (HYDRATION_MODULE flag) — enables Angular
 *   hydration so SSR-rendered HTML is "adopted" by the client without a full
 *   re-render. Pair with withIncrementalHydration() for partial hydration.
 * - Added `provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor]))` —
 *   enables the Fetch-based HttpClient and registers the global HTTP error interceptor.
 * - Added `GlobalErrorHandler` as the Angular ErrorHandler override (ERROR_PAGES flag).
 * - PWA service worker retained from Sprint 020.
 */
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
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
