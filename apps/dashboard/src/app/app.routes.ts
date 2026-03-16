/**
 * Dashboard shell routes — Sprint 022: Route-Level Code Splitting
 *
 * All page routes use `loadComponent` for lazy loading. Angular esbuild
 * automatically creates separate JS chunks for each lazy route, reducing
 * the initial bundle size and improving Time-to-Interactive.
 *
 * Route structure:
 *   /              → redirect to /dashboard
 *   /dashboard     → DashboardPageComponent    (widgets + stat cards)
 *   /components    → ComponentsPageComponent   (component catalog)
 *   /features      → FeaturesPageComponent     (feature demos)
 *   /settings      → SettingsPageComponent     (theme, preferences)
 *
 * Module Federation (remote-properties) retained at /properties.
 *
 * @see app.config.ts  — provideRouter registration
 * @see feature-flags.ts — LAZY_ROUTING flag (Sprint 022)
 */
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const appRoutes: Routes = [
  // ── Default redirect ──────────────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },

  // ── Dashboard page ─────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard-page.component').then(m => m.DashboardPageComponent),
    title: 'Dashboard — Israel UI',
  },

  // ── Component Catalog ──────────────────────────────────────────────────────
  {
    path: 'components',
    loadComponent: () =>
      import('./pages/components-page.component').then(m => m.ComponentsPageComponent),
    title: 'Components — Israel UI',
  },
  // Deep-link to a specific component (e.g. /components/button)
  {
    path: 'components/:componentId',
    loadComponent: () =>
      import('./pages/components-page.component').then(m => m.ComponentsPageComponent),
    title: 'Components — Israel UI',
  },

  // ── Features page ──────────────────────────────────────────────────────────
  {
    path: 'features',
    loadComponent: () =>
      import('./pages/features-page.component').then(m => m.FeaturesPageComponent),
    title: 'Features — Israel UI',
  },
  // Deep-link to a feature section (e.g. /features/charts)
  {
    path: 'features/:sectionId',
    loadComponent: () =>
      import('./pages/features-page.component').then(m => m.FeaturesPageComponent),
    title: 'Features — Israel UI',
  },

  // ── Settings page ──────────────────────────────────────────────────────────
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page.component').then(m => m.SettingsPageComponent),
    title: 'Settings — Israel UI',
  },

  // ── Module Federation — remote-properties micro-frontend ──────────────────
  {
    path: 'properties',
    loadChildren: () =>
      loadRemoteModule('remoteProperties', './Routes').then(m => m.appRoutes),
  },

  // ── Fallback ───────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
