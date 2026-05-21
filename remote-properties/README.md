# remote-properties — Module Federation demo

This directory hosts the **remote-properties** micro-frontend, exposed to the
dashboard shell via [Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation).
The setup originates from Sprint 009 (March 2026).

**This is an architectural demo, not a production feature.** ng-m3 is a
portfolio repository — the remote is intentionally not deployed alongside the
shell. The wiring exists to demonstrate Native Federation with Angular 21 +
SSR, not to serve real micro-frontend traffic.

## Running the demo locally

The dashboard expects the remote at `http://localhost:4201/remoteEntry.json`.

In one terminal, serve the dashboard shell (default port 4200):

```bash
pnpm nx serve dashboard
```

In a second terminal, serve the remote on port 4201:

```bash
pnpm nx serve remote-properties
```

Then open `http://localhost:4200/properties` — the dashboard will load the
remote's routes (`./Routes` export) dynamically.

If the remote is **not** running, navigating to `/properties` falls back to
`FederationFallbackComponent` (see `apps/dashboard/src/app/pages/federation-fallback.component.ts`),
which displays a self-documenting placeholder instead of failing silently.

## What's exposed

`remote-properties/federation.config.js` exposes a single entry:

```js
exposes: {
  './Routes': './remote-properties/src/app/app.routes.ts',
},
```

These routes render the `PropertyCard` + LisboaRent property listing skeleton
introduced in Sprint 010. Content has not been extended since (LisboaRent
declared NO-GO 2026-05-10 — see `memory/parked-tracks.md` in the personal
repo).

## Production status

- ✅ Compile-time: dashboard builds fine without the remote being served.
- ❌ Runtime in production: the remote URL is hard-coded to `localhost:4201`
  and not configurable at runtime. To deploy the remote, you would need a
  hosting target plus a federation manifest loaded dynamically. That work is
  intentionally not done.

## See also

- `apps/dashboard/federation.config.js` — host configuration
- `apps/dashboard/src/main.ts` — `initFederation()` call before bootstrap
- `apps/dashboard/src/app/app.routes.ts` — `/properties` route with fallback
- `apps/dashboard/src/app/feature-flags.ts` — `MODULE_FEDERATION_READY` flag
