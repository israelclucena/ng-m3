/**
 * Express server for Angular SSR — Sprint 023 (modernized)
 *
 * Serves the Angular app with zoneless SSR via AngularNodeAppEngine.
 * Static assets are served directly; all other requests go through
 * the Angular app engine for server-side rendering.
 *
 * Usage:
 *   node dist/apps/dashboard/server/server.mjs
 *
 * Environment variables:
 *   PORT — HTTP port (default: 4000)
 *
 * @see app.config.server.ts — Angular server-side providers
 * @see app.routes.server.ts — per-route render mode config
 */
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Paths ─────────────────────────────────────────────────────────────────
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

// ── Express app ───────────────────────────────────────────────────────────
const app = express();
const angularApp = new AngularNodeAppEngine();

// ── Static assets ─────────────────────────────────────────────────────────
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// ── All routes → Angular SSR ───────────────────────────────────────────────
// express 5 / path-to-regexp 8: use '/{*splat}' — bare '**' throws PathError.
app.use('/{*splat}', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// ── Start ──────────────────────────────────────────────────────────────────
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`[SSR] Node Express server listening on http://localhost:${port}`);
  });
}

// Request handler used by the Angular CLI (dev-server / build) or PM2.
export const reqHandler = createNodeRequestHandler(app);
