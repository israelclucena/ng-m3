export const FeatureFlags = {
  // Sprint 003-006 (existing)
  DRAG_DROP_WIDGETS: true,
  ADVANCED_DATA_TABLE: true,
  THEME_SWITCHER: true,
  CHART_COMPONENTS: true,
  NOTIFICATION_SYSTEM: true,
  FORM_BUILDER: true,
  SEARCH_AUTOCOMPLETE: true,
  CARD_VARIANTS: true,
  EMPTY_STATES: true,
  AI_DASHBOARD: true,
  VOICE_COMMANDS: true,
  KEYBOARD_SHORTCUTS: true,
  EXPORT_SYSTEM: true,

  // Sprint 007 — Night Shift 2026-03-04 (activated 2026-03-05)
  AVATAR: true,
  TAG_INPUT: true,
  STEPPER: true,
  TIMELINE: true,
  DATE_PICKER: true,
  COLOR_PICKER: true,
  DATA_TABLE_V2: true,  // Sprint 008 — activated 2026-03-05 (tarde)
  WIDGET_SYSTEM: true,  // Sprint 008 — activated 2026-03-05 (tarde)

  // Sprint 009 — Night Shift 2026-03-05
  RESOURCE_DATA_TABLE: true,
  FILTER_BAR: true,
  MODULE_FEDERATION_READY: false,
} as const;
