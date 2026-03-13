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
  MODULE_FEDERATION_READY: true,

  // Sprint 010 — Night Shift 2026-03-06
  PROPERTY_LISTING: true,
  PROPERTY_DETAIL_VIEW: true,

  // Sprint 011 — Night Shift 2026-03-07
  PROPERTY_RESOURCE: true,

  // Sprint 012 — Night Shift 2026-03-08
  PROPERTY_FILTER_SIDEBAR: true,
  FAVOURITES_SERVICE: true,

  // Sprint 013 — Night Shift 2026-03-09
  PROPERTY_MAP: true,
  PROPERTY_COMPARISON: true,
  PAGINATOR: true,

  // Sprint 014 — Night Shift 2026-03-10
  PROPERTY_BOOKING: true,
  PROPERTY_INQUIRY_FORM: true,

  // Sprint 015 — Night Shift 2026-03-10
  AUTH_MODULE: true,
  AUTH_GUARDS: true,

  // Sprint 016 — Night Shift 2026-03-11
  USER_PROFILE: true,
  MY_BOOKINGS: true,
  MY_FAVOURITES: true,

  // Sprint 017 — Night Shift 2026-03-11
  LANDLORD_MODULE: true,
  ADD_PROPERTY: true,
  MANAGE_LISTINGS: true,

  // Sprint 018 — Night Shift 2026-03-12 (activated 2026-03-13)
  MESSAGING_MODULE: true,
  NOTIFICATION_BELL: true,
} as const;
