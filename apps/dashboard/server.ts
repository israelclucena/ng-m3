/**
 * Express server for Angular SSR — Sprint 023
 *
 * Serves the Angular Universal app with SSR.
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
import 'zone.js/node';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// ── Paths ─────────────────────────────────────────────────────────────────
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

// ── Express app ───────────────────────────────────────────────────────────
const app = express();
const PORT = process.env['PORT'] || 4000;

const commonEngine = new CommonEngine();

// ── Static assets ─────────────────────────────────────────────────────────
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

// ── All routes → Angular SSR ───────────────────────────────────────────────
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then(html => res.send(html))
    .catch(err => next(err));
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SSR] Node Express server listening on http://localhost:${PORT}`);
});
