/**
 * Dashboard shell routes — Module Federation (Native Federation / esbuild)
 *
 * The `properties` route lazy-loads the remote-properties micro-frontend
 * via Native Federation (@angular-architects/native-federation).
 *
 * Requires:
 *  1. `MODULE_FEDERATION_READY` flag set to `true` in feature-flags.ts ✅
 *  2. remote-properties app running at http://localhost:4201
 *  3. Both apps using @angular-architects/native-federation:build executor ✅
 *
 * @see feature-flags.ts
 * @see apps/dashboard/federation.config.js
 * @see remote-properties/federation.config.js
 */
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./app.component').then(m => m.AppComponent),
  },
  {
    /**
     * Module Federation — remote-properties micro-frontend.
     * Lazy-loads Routes exposed by the remote at http://localhost:4201.
     */
    path: 'properties',
    loadChildren: () =>
      loadRemoteModule('remoteProperties', './Routes').then(m => m.appRoutes),
  },
];
