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

  // Sprint 019 — Night Shift 2026-03-13
  GLOBAL_SEARCH: true,
  REVIEWS_MODULE: true,

  // Sprint 020 — Night Shift 2026-03-14
  PAYMENT_MODULE: true,
  LANDLORD_ANALYTICS: true,
  PWA_MODULE: true,

  // Sprint 021 — Night Shift 2026-03-15
  ADMIN_PANEL: true,
  I18N_PT: true,

  // Sprint 022 — Night Shift 2026-03-16
  LAZY_ROUTING: true,        // Angular Router with route-level code splitting
  SIGNAL_DEBOUNCE: true,     // debouncedSignal() utility in PropertySearchService + FilterBar
  NPM_PUBLISH_READY: true,   // @israel-ui/core published to npm

  // Sprint 023 — Night Shift 2026-03-17
  SSR_MODULE: true,           // @angular/ssr — server.ts + main.server.ts + app.config.server.ts
  HYDRATION_MODULE: true,     // provideClientHydration() + withIncrementalHydration()
  ERROR_PAGES: true,          // NotFoundPageComponent + ErrorPageComponent (404, 500)
  HTTP_ERROR_INTERCEPTOR: true, // HttpErrorInterceptor + HttpErrorService + GlobalErrorHandler

  // Sprint 024 — Night Shift 2026-03-18
  WEB_VITALS: true,           // WebVitalsService + WebVitalsWidget — CWV monitoring with signals
  SIGNAL_FORMS: true,         // createSignalForm() utility + validators (required, email, etc.)
  E2E_SMOKE: true,            // Playwright smoke tests setup (e2e/ directory)

  // Sprint 025 — Night Shift 2026-03-19
  SIGNAL_FORM_BOOKING: true,  // PropertyBookingComponent migrated to createSignalForm() — signals-only form
  E2E_USER_FLOWS: true,       // Playwright user flow tests: auth, property search, booking, mobile, perf

  // Sprint 026 — Night Shift 2026-03-20
  SIGNAL_FORM_AUTH: true,     // AuthLoginComponent + AuthRegisterComponent migrated to createSignalForm()
  CI_ENHANCED: true,          // Enhanced CI pipeline: lint + E2E + npm audit + parallel jobs
  TS59_COMPAT: true,          // TypeScript 5.9.3 compat: moduleResolution bundler + signal-form InferFormValues fix

  // Sprint 027 — Night Shift 2026-03-22
  STORYBOOK_PATCH_1031: true,    // Storybook upgraded from 10.3.0 to 10.3.1
  RESOURCE_API: true,            // createHttpResource() — signal-based async data fetching utility
  AVAILABILITY_CALENDAR: true,   // PropertyAvailabilityComponent — signal-based booking calendar

  // Sprint 028 — Night Shift 2026-03-23
  BOOKING_CONFIRMATION_FLOW: true, // BookingCheckoutComponent — multi-step checkout (review → payment → confirmation)
  AVAILABILITY_REALTIME: true,     // AvailabilityResourceService — signal-driven real-time availability polling

  // Sprint 029 — Night Shift 2026-03-24
  STORYBOOK_PATCH_1033: true,      // Storybook upgraded from 10.3.1 to 10.3.3
  TS60_COMPAT: true,               // TS 6.0.2 — Angular 21.2 peer deps: >=5.9 <6.1 — ACTIVATED sprint-032
  PAYMENT_GATEWAY: true,           // PaymentService mock Stripe gateway + PaymentGatewayDemoComponent

  // Sprint 030 — Night Shift 2026-03-25
  PAYMENT_RECEIPT: true,           // InvoiceService + PaymentReceiptComponent — post-payment receipt with printable M3 layout
  LANDLORD_REVENUE: true,          // RevenueAnalyticsService + LandlordRevenueComponent — MRR, ARR, bar chart, top properties
  SIGNAL_FORM_UNIONS: true,        // oneOf() validator + createSelectField() — generic union type support for signal forms

  // Sprint 031 — Night Shift 2026-03-26
  RESOURCE_SNAPSHOT: true,         // ResourceSnapshot<T> + resourceFromSnapshots() — flicker-free resource state preservation
  ZONELESS_MODE: true,             // provideExperimentalZonelessChangeDetection() — eliminates Zone.js, ~30-50KB bundle savings, 40-50% LCP improvement
  TEMPLATE_ARROW_FNS: true,        // Angular 21.2 arrow functions in templates — ACTIVATED sprint-032 (Angular 21.2.6 installed)

  // Sprint 033 — Night Shift 2026-03-28
  TENANT_DASHBOARD: true,          // TenantDashboardService + TenantDashboardComponent — renter analytics: KPIs, spending chart, payment history, favourites
  STORYBOOK_PATCH_1040: true,      // Storybook upgraded from 10.3.3 to 10.4.0-alpha.5 — angularChangeDetection feature flag enabled

  // Sprint 034 — Night Shift 2026-03-29
  MAINTENANCE_MODULE: true,        // MaintenanceRequestService + MaintenanceRequestFormComponent + MaintenanceRequestListComponent — tenant/landlord maintenance workflow
  DOCUMENT_UPLOAD: true,           // DocumentUploadComponent — drag-and-drop M3 file upload with MIME/size/ext validation + image previews
  SIGNAL_FORM_V2: true,            // signal-form v2 additions: getError(), debouncedSignal(), reloadValidation(), createDebouncedField()

  // Sprint 035 — Night Shift 2026-03-30
  LEASE_MODULE: true,              // LeaseAgreementService + LeaseAgreementFormComponent — landlord creates leases, draft→active lifecycle
  LEASE_VIEWER: true,              // LeaseAgreementViewerComponent — full lease viewer with dual-signature CTA
  TENANT_APPLICATION: true,        // TenantApplicationService + TenantApplicationFormComponent — multi-step rental application (5 steps, NIF validation, references)
  APPLICATION_REVIEW: true,        // ApplicationStatusComponent — landlord review panel: approve/reject/under-review with income ratio
  MAINTENANCE_NOTIFICATIONS: true, // MaintenanceNotificationHandler — status transitions push in-app notifications via NotificationBellService

  // Sprint 036 — Night Shift 2026-03-31
  E_SIGNATURE_MODULE: true,        // SignaturePadComponent + SignatureStateService + LeaseSigningFlowComponent — dual-signature lease signing flow
  APPLICATION_PIPELINE: true,      // ApplicationPipelineService + ApplicationKanbanComponent — Kanban board for application pipeline (4 columns)
  NOTIFICATION_CENTER: true,       // NotificationCenterService + NotificationCenterComponent — full notification center drawer with category filtering

  // Sprint 037 — Night Shift 2026-04-01
  RENT_PAYMENT_PORTAL: true,       // RentPaymentPortalService + RentPaymentPortalComponent — tenant rent payment schedule, KPIs, pay-now CTA, overdue alerts
  PROPERTY_INSPECTION: true,       // PropertyInspectionService + PropertyInspectionComponent — move-in/out/routine inspection with room conditions + dual-signature
  DOCUMENT_VAULT: true,            // DocumentVaultService + DocumentVaultComponent — categorised document repository with sidebar nav, storage meter, upload/delete

  // Sprint 038 — Night Shift 2026-04-02 (activated 2026-04-03)
  VIEWING_SCHEDULER: true,         // ViewingSchedulerService + ViewingSchedulerComponent — property viewing appointment manager (landlord + tenant)
  LEASE_RENEWAL: true,             // LeaseRenewalService + LeaseRenewalComponent — lease renewal workflow with urgency, offers, tenant responses
  RENT_ARREARS: true,              // RentArrearsService + RentArrearsComponent — landlord arrears dashboard: reminders, payment plans, legal escalation

  // Sprint 039 — Night Shift 2026-04-03 (activated 2026-04-30 sprint-040)
  UTILITY_BILLS: true,             // UtilityBillsService + UtilityBillsComponent — utility bill tracker (electricity, water, gas, internet) with mark-paid, dispute, split-cost
  PORTFOLIO_OVERVIEW: true,        // PortfolioOverviewService + PortfolioOverviewComponent — landlord portfolio KPIs: MRR, occupancy rate, MRR trend chart, property cards
  NOTIFICATION_PREFERENCES: true,  // NotificationPreferencesService + NotificationPreferencesComponent — per-category, per-channel notification settings panel
} as const;
