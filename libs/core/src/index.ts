export * from './lib/core/core';

// Material Web components (side-effect imports)
import './lib/material/material-web';

// ── israel-ui components ──

// Sprint 001
export * from './lib/components/button/button.component';
export * from './lib/components/input/input.component';
export * from './lib/components/card/card.component';
export * from './lib/components/dialog/dialog.component';
export * from './lib/components/chip/chip.component';
export * from './lib/components/divider/divider.component';

// Sprint 002 — Selection
export * from './lib/components/checkbox/checkbox.component';
export * from './lib/components/radio/radio.component';
export * from './lib/components/switch/switch.component';

// Sprint 002 — Actions
export * from './lib/components/icon-button/icon-button.component';
export * from './lib/components/fab/fab.component';

// Sprint 002 — Feedback
export * from './lib/components/progress/progress.component';

// Sprint 002 — Navigation & Data
export * from './lib/components/select/select.component';
export * from './lib/components/menu/menu.component';
export * from './lib/components/list/list.component';
export * from './lib/components/list/list-item.component';
export * from './lib/components/tabs/tabs.component';
export * from './lib/components/slider/slider.component';

// Sprint 002 — Utilities
export * from './lib/components/elevation/elevation.component';
export * from './lib/components/ripple/ripple.component';
export * from './lib/components/focus-ring/focus-ring.component';

// Sprint 002 — Wave 3: Navigation & Structure
export * from './lib/components/top-app-bar/top-app-bar.component';
export * from './lib/components/nav-rail/nav-rail.component';
export * from './lib/components/badge/badge.component';
export * from './lib/components/snackbar/snackbar.component';
export * from './lib/components/snackbar/snackbar.service';

// Sprint 002 — Wave 4: Tooltip, Bottom Sheet, Navigation Drawer
export * from './lib/components/tooltip/tooltip.directive';
export * from './lib/components/bottom-sheet/bottom-sheet.component';
export * from './lib/components/nav-drawer/nav-drawer.component';

// Tokens
export * from './lib/tokens/theme.tokens';

// Sprint 003 — Card Variants
export * from './lib/components/card-variants/stat-card.component';
export * from './lib/components/card-variants/profile-card.component';
export * from './lib/components/card-variants/action-card.component';

// Sprint 003 — Notification System
export * from './lib/components/notification/notification.service';
export * from './lib/components/notification/notification-container.component';

// Sprint 003 — Theme Service
export * from './lib/services/theme.service';

// Sprint 004 — Data Table
export * from './lib/components/data-table/data-table.component';

// Sprint 004 — Search Autocomplete
export * from './lib/components/search/search.component';

// Sprint 004 — Empty State
export * from './lib/components/empty-state/empty-state.component';

// Sprint 004 — Keyboard Shortcuts
export * from './lib/components/keyboard-shortcuts/keyboard-shortcut.service';
export * from './lib/components/keyboard-shortcuts/shortcut-help-overlay.component';

// Sprint 005 — Chart Components (pure SVG, no external deps)
export * from './lib/components/charts/index';
export * from './lib/components/export/export.service';
export * from './lib/components/export/export-toolbar.component';
export * from './lib/components/voice/voice-command.service';
export * from './lib/components/voice/voice-widget.component';

// Sprint 006 — Form Builder
export * from './lib/components/form-builder/form-field.model';
export * from './lib/components/form-builder/form-builder.component';

// Sprint 007 — Night Shift 2026-03-04
export * from './lib/components/avatar/avatar.component';
export * from './lib/components/tag-input/tag-input.component';
export * from './lib/components/stepper/stepper.component';
export * from './lib/components/timeline/timeline.component';
export * from './lib/components/date-picker/date-picker.component';
export * from './lib/components/color-picker/color-picker.component';

// Sprint 008 — Night Shift 2026-03-05
export * from './lib/components/data-table-v2/data-table-v2.component';
export * from './lib/components/widget-container/widget-container.component';

// Sprint 009 — Night Shift 2026-03-05
export * from './lib/components/resource-data-table/resource-data-table.component';
export * from './lib/components/filter-bar/filter-bar.component';

// Sprint 010 — Night Shift 2026-03-06
export * from './lib/components/property-card/property-card.component';

// Sprint 011 — Night Shift 2026-03-07
export * from './lib/components/property-detail/property-detail.component';
export * from './lib/services/property-resource.service';
