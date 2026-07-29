/**
 * Main entry point for Angular SSR server bundle — Sprint 023
 *
 * This file is the entry for the server-side render build.
 * It bootstraps the AppComponent with the merged server config.
 */
import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
