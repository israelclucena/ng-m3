/**
 * Server-side route configuration — Sprint 023
 *
 * Defines SSR rendering strategy per route:
 * - Static shell routes → RenderMode.Prerender (build-time HTML generation)
 * - Dynamic routes      → RenderMode.Server    (request-time SSR)
 * - Fallback            → RenderMode.Client     (CSR for everything else)
 *
 * Module Federation remote at /properties is CSR-only (cross-origin remote).
 *
 * @see app.routes.ts — client-side route definitions
 * @see app.config.server.ts — server config consuming these routes
 */
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Static prerendered pages (generated at build time) ────────────────────
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'components',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'features',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'settings',
    renderMode: RenderMode.Prerender,
  },

  // ── Dynamic routes with path params → SSR per request ────────────────────
  {
    path: 'components/:componentId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'features/:sectionId',
    renderMode: RenderMode.Server,
  },

  // ── Module Federation remote — CSR only (remote entry is cross-origin) ───
  {
    path: 'properties',
    renderMode: RenderMode.Client,
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
