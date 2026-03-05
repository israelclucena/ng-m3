/**
 * Dashboard shell routes — Module Federation skeleton
 *
 * The `properties` route lazy-loads the remote-properties micro-frontend
 * via Module Federation. This requires:
 *
 *  1. `MODULE_FEDERATION_READY` flag set to `true` in feature-flags.ts
 *  2. remote-properties app running at http://localhost:4201
 *  3. Both apps using a webpack-based build executor (@nx/angular:webpack-browser)
 *
 * Until MODULE_FEDERATION_READY is enabled, this file is a skeleton only.
 *
 * @see feature-flags.ts
 * @see remote-properties/webpack.config.js
 */
import { Routes } from '@angular/router';

/**
 * Dynamically loads the Module Federation helper.
 * Using a dynamic import to avoid compile errors when MF is not yet wired.
 */
async function loadRemotePropertiesRoutes(): Promise<Routes> {
  try {
    // Requires @nx/angular/module-federation or @angular-architects/module-federation
    const { loadRemoteModule } = await import('@nx/angular/mf');
    const m = await loadRemoteModule({
      remoteName: 'remoteProperties',
      exposedModule: './Routes',
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (m as any).appRoutes ?? [];
  } catch {
    console.warn('[ModuleFederation] remote-properties not available — skipping route.');
    return [];
  }
}

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
    /** Module Federation: properties micro-frontend */
    path: 'properties',
    loadChildren: loadRemotePropertiesRoutes,
  },
];
