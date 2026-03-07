# Sprint 011 — Planning Doc

**Date:** 2026-03-07  
**Agent:** Night Shift (autonomous dev)  
**Status:** ✅ Completed

---

## What Was Built

### 1. PropertyDetail Component (`iu-property-detail`)

Full detail view for LisboaRent property listings.

**Features:**
- Image gallery with prev/next navigation, keyboard arrows, and thumbnail strip
- Key specs bar: beds, baths, area, floor, energy rating (color-coded A–E)
- Badge system (new, featured, available, rented, verified)
- Long-form description + amenities grid
- Property info table (furnished, pets allowed, elevator, year built, condo fee)
- Map placeholder (ready for Leaflet/Google Maps integration)
- Sticky contact sidebar: CTA buttons (message + schedule visit), phone, email
- Share panel (link, WhatsApp, email)
- Back button emits `closed` event

**Extended interface:** `PropertyDetail extends PropertyData` — all new fields are optional, zero breaking changes.

**Location:** `libs/core/src/lib/components/property-detail/`  
**Export:** `@israel-ui/core` → `PropertyDetailComponent`, `PropertyDetail`  
**Feature flag:** `PROPERTY_DETAIL_VIEW` (was already true since Sprint 010)

### 2. PropertyResourceService

Signal-based property data service using Angular 21's `resource()` API.

**Features:**
- `properties` resource: reactive listings, re-fetches when `typeFilter` changes
- `selectedProperty` resource: reactive detail, re-fetches when `selectedId` changes
- Mock data with simulated 250–400ms latency (realistic dev experience)
- `httpResource()` migration path documented inline — just swap the loader

**Location:** `libs/core/src/lib/services/property-resource.service.ts`  
**Export:** `@israel-ui/core` → `PropertyResourceService`, `MOCK_PROPERTIES`  
**Feature flag:** `PROPERTY_RESOURCE` (Sprint 011, true)

### 3. Features Page Integration

- Clicking a PropertyCard now opens the inline PropertyDetail view
- Back button returns to the listing grid
- When `PROPERTY_RESOURCE` is true, listings are loaded via `resource()` with loading/error states
- Fallback to `sampleProperties` if resource not loaded yet

---

## LisboaRent MVP — Component Status

| Component | Status | Feature Flag |
|-----------|--------|--------------|
| PropertyCard | ✅ Done | PROPERTY_LISTING |
| PropertyDetail | ✅ Done | PROPERTY_DETAIL_VIEW |
| PropertyResourceService | ✅ Done | PROPERTY_RESOURCE |
| PropertyListing page (MF) | 🔲 Pending | MODULE_FEDERATION_READY |
| PropertyFilter sidebar | 🔲 Pending | — |
| Map integration (Leaflet) | 🔲 Pending | — |
| Booking/Contact form | 🔲 Pending | — |
| Favourites persistence | 🔲 Pending | — |
| Real API integration | 🔲 Pending (httpResource ready) | — |

---

## Next Sprint Candidates (Sprint 012)

### HIGH PRIORITY
1. **PropertyFilter sidebar** — filter by type, price range, bedrooms, area  
   Integrates with `PropertyResourceService.filterByType()`
2. **PropertyListing page** — standalone page (`/properties`) with filter + grid  
   Uses remote-properties Module Federation remote
3. **Map integration** — Leaflet or Google Maps in PropertyDetail  
   Replace the map placeholder with real coordinates

### MEDIUM PRIORITY
4. **Favourites service** — persist favourites to localStorage with Signals  
   Cross-tab sync via `StorageEvent`
5. **Contact form** — modal with form fields, sends via email API  
   Reuse FormBuilderComponent
6. **httpResource migration** — when API endpoint is ready, swap `resource()` loader  
   The service is pre-wired; it's a one-line change per resource

### TECHNICAL DEBT
- Storybook: add `PropertyResourceService` story (mock provider)
- PropertyCard: add `effect()` to sync `isFavourited` input → internal signal
- Dashboard build: clean up unused `ListComponent`/`ListItemComponent` imports in `InvestmentWidgetComponent`

---

## Architecture Decisions

### Why `resource()` instead of `httpResource()`?
- `httpResource()` requires `HttpClient` provider in the call site
- The dashboard doesn't yet have a real API to hit
- `resource()` with a Promise-based loader is 100% equivalent in the Signal graph
- Migration is a single-line swap when the API is ready

### Why inline detail (not a route)?
- The properties route uses Module Federation (`remote-properties`) — routing to a detail page there requires the remote to be running
- Inline is simpler, faster to build, and good for the component showcase page
- When the MF remote is ready, `iu-property-detail` will be used there directly

### PropertyDetail as `@extend PropertyData`
- `PropertyDetail extends PropertyData` avoids modifying the existing interface
- All new fields are optional — zero breaking changes for existing PropertyCard usage
- Downcast via `as PropertyDetail` is safe since TypeScript handles the optional fields gracefully

---

## Notes

- **Brasil em 14 Mar:** Cameras Tapo C200 ×2 ainda pendentes no TODO (não urgente para o sprint)
- **TypeScript 6.0 RC:** Monitorar para upgrade em sprint dedicado
- **Angular 21.1:** `resource()` é estável; `httpResource()` continua experimental mas estável o suficiente
