# Sprint 002 — Planning Document

**Date:** 2026-03-10
**Status:** Completed (retrospective planning)
**Goal:** Expand base component library with selection controls, navigation, and utilities.

---

## Objectives

1. Selection controls: Checkbox, Radio, Switch
2. Action components: IconButton, FAB (Floating Action Button)
3. Feedback: Progress (linear + circular)
4. Navigation & Data: Select, Menu, List/ListItem, Tabs, Slider
5. Utilities: Elevation, Ripple, FocusRing
6. Navigation & Structure (Wave 3): TopAppBar, NavRail, Badge, Snackbar
7. Overlay & Navigation (Wave 4): Tooltip, BottomSheet, NavDrawer

---

## Deliverables

| # | Component | Selector | Status |
|---|-----------|----------|--------|
| 1 | Checkbox | `iu-checkbox` | ✅ Done |
| 2 | Radio | `iu-radio` | ✅ Done |
| 3 | Switch | `iu-switch` | ✅ Done |
| 4 | Icon Button | `iu-icon-button` | ✅ Done |
| 5 | FAB | `iu-fab` | ✅ Done |
| 6 | Progress | `iu-progress` | ✅ Done |
| 7 | Select | `iu-select` | ✅ Done |
| 8 | Menu | `iu-menu` | ✅ Done |
| 9 | List / ListItem | `iu-list`, `iu-list-item` | ✅ Done |
| 10 | Tabs | `iu-tabs` | ✅ Done |
| 11 | Slider | `iu-slider` | ✅ Done |
| 12 | Elevation | `iu-elevation` | ✅ Done |
| 13 | Ripple | `iu-ripple` | ✅ Done |
| 14 | FocusRing | `iu-focus-ring` | ✅ Done |
| 15 | TopAppBar | `iu-top-app-bar` | ✅ Done |
| 16 | NavRail | `iu-nav-rail` | ✅ Done |
| 17 | Badge | `iu-badge` | ✅ Done |
| 18 | Snackbar | `iu-snackbar` | ✅ Done |
| 19 | Tooltip | `[iuTooltip]` directive | ✅ Done |
| 20 | BottomSheet | `iu-bottom-sheet` | ✅ Done |
| 21 | NavDrawer | `iu-nav-drawer` | ✅ Done |

---

## Design Principles Applied

- **M3 tokens throughout**: all components use `--md-sys-*` CSS custom properties
- **Standalone components**: no NgModule dependencies
- **Angular Signals**: internal state via `signal()` and `computed()`
- **ViewEncapsulation.None**: styles applied globally for host styling flexibility
- **ChangeDetectionStrategy.OnPush**: performance-optimised by default
- **JSDoc on all public inputs/outputs**
- **CSF3 stories**: Default + 2 variants minimum per component

---

## Publishing Notes (as of 2026-03-10)

The package `@israelclucena/core@1.0.0` is registered in `package.json` and configured for GitHub Packages:

```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
}
```

**npm publish dry-run** validated on 2026-03-10:
- Package: `@israelclucena/core@1.0.0`
- Size: 377.1 kB (packed), 2.4 MB (unpacked)
- Files: 6 (README, FESM bundle, types, package.json)
- Target: `https://npm.pkg.github.com`

To publish for real:
```bash
# 1. Login to GitHub Packages
npm login --registry=https://npm.pkg.github.com

# 2. Build in publishable mode
npx nx run core:build-publishable

# 3. Publish
cd dist/libs/core && npm publish --ignore-scripts
```

Note: `--ignore-scripts` bypasses the `ng-packagr-lite` full-compilation guard.
For a proper partial-compilation build, switch the build executor to `@nx/angular:package`.

---

## Next Sprints After 002

→ Sprint 003: Card Variants, Notification System, Theme Service
→ Sprint 004: DataTable, Search Autocomplete, Empty State, Keyboard Shortcuts
→ Sprint 005: Chart Components (LineChart, BarChart, DonutChart), Export, Voice
→ Sprint 006: FormBuilder dynamic forms
→ Sprint 007: Avatar, TagInput, Stepper, Timeline, DatePicker, ColorPicker
→ Sprint 008: DataTableV2, WidgetContainer/WidgetGrid
→ Sprint 009: ResourceDataTable, FilterBar, ModuleFederation scaffold
→ Sprint 010-013: LisboaRent property listing, detail, filter, map, comparison, paginator
→ Sprint 014: PropertyBooking modal
→ Sprint 015: Auth Module (AuthService, AuthLogin, AuthRegister, guards)
