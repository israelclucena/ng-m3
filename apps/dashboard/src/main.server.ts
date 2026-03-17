/**
 * Main entry point for Angular SSR server bundle — Sprint 023
 *
 * This file is the entry for the server-side render build.
 * It bootstraps the AppComponent with the merged server config.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
