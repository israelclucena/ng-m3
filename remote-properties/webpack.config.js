/**
 * Module Federation config — remote-properties
 *
 * This app exposes its routes so the shell (dashboard) can lazy-load them.
 * Requires the build executor to be @nx/angular:webpack-browser or similar
 * webpack-based executor.
 *
 * NOTE: Currently this is a skeleton. The project.json must be updated to use
 * a webpack executor before this config takes effect.
 * See: MODULE_FEDERATION_READY flag in apps/dashboard/src/app/feature-flags.ts
 */
const { withModuleFederation } = require('@nx/angular/module-federation');

module.exports = withModuleFederation({
  name: 'remoteProperties',
  exposes: {
    './Routes': 'remote-properties/src/app/app.routes.ts',
  },
});
