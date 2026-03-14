import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { FeatureFlags } from './feature-flags';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Sprint 020 — PWA / Service Worker
    // Only registered in production and when PWA_MODULE flag is enabled.
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
