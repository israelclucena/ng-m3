/**
 * Server-side application configuration — Sprint 023
 *
 * Merges the browser appConfig with server-specific providers.
 * provideServerRendering(withRoutes()) enables Angular Universal SSR
 * and configures per-route render modes (Prerender / Server / Client).
 *
 * @see app.config.ts — browser config (merged here)
 * @see app.routes.server.ts — per-route render mode config
 * @see feature-flags.ts — SSR_MODULE, HYDRATION_MODULE flags
 */
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
