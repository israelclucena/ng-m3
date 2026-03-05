/**
 * Dashboard shell routes — Module Federation skeleton
 *
 * The `properties` route will lazy-load the remote-properties micro-frontend
 * via Module Federation once MODULE_FEDERATION_READY is enabled.
 *
 * Full activation requires:
 *  1. `MODULE_FEDERATION_READY` flag set to `true` in feature-flags.ts
 *  2. remote-properties app running at http://localhost:4201
 *  3. Both apps using a webpack-based build executor (@nx/angular:webpack-browser)
 *  4. `@angular-architects/module-federation` installed and configured
 *
 * @see feature-flags.ts
 * @see remote-properties/webpack.config.js
 */
import { Routes } from '@angular/router';
import { Component } from '@angular/core';

/** Placeholder component shown while MF is not yet active */
@Component({
  standalone: true,
  template: `
    <div style="padding:48px;text-align:center;font-family:Roboto,sans-serif;">
      <span style="font-size:48px;display:block;margin-bottom:16px">🏗️</span>
      <h2>Properties (Module Federation)</h2>
      <p style="color:#49454f">Remote module not yet available.<br>
        Enable <code>MODULE_FEDERATION_READY</code> flag and start the remote app.</p>
    </div>
  `,
})
class MfPlaceholderComponent {}

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
     *
     * TODO: Replace MfPlaceholderComponent with:
     * ```ts
     * loadChildren: () => loadRemoteModule({
     *   remoteName: 'remoteProperties',
     *   exposedModule: './Routes',
     *   remoteEntry: 'http://localhost:4201/remoteEntry.js',
     * }).then(m => m.appRoutes)
     * ```
     * Once MODULE_FEDERATION_READY = true and the webpack executor is configured.
     */
    path: 'properties',
    component: MfPlaceholderComponent,
  },
];
