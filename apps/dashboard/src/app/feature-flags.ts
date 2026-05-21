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
  // MODULE_FEDERATION_READY is a dev-only architectural demo. The remote
  // (`remote-properties`) is intentionally not deployed in production; the
  // /properties route falls back to FederationFallbackComponent when the
  // remote is unreachable. See remote-properties/README.md.
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

  // Sprint 040 — Night Shift 2026-04-30
  YIELD_CALCULATOR: true,          // YieldCalculatorComponent — PT rental yield calculator (gross/net/payback) with Lisboa & Porto market presets
  MOVE_IN_CHECKLIST: true,         // MoveInChecklistService + MoveInChecklistComponent — tenant move-in checklist (utilities, admin, financial, logistics, inspection) with category progress

  // Sprint 041 — Night Shift 2026-05-01
  DEPOSIT_RETURN_ESTIMATOR: true,  // DepositReturnService + DepositReturnEstimatorComponent — PT caução return calculator (NRAU art. 13.º): itemised deductions by category + admin withholding %
  RENT_RECEIPT_GENERATOR: true,    // RentReceiptService + RentReceiptGeneratorComponent — PT rent receipt issuer with IRS Cat. F retention (default 25%) and printable AT-style layout
  COMMUNICATION_TEMPLATES: true,   // LandlordCommunicationTemplatesService — PT NRAU-aligned message presets (denúncia, aumento renda, recibo caução, obras, visita) with placeholders + legal references

  // Sprint 042 — Night Shift 2026-05-02
  COMMUNICATION_CENTER: true,      // CommunicationCenterStateService + CommunicationCenterComponent — UI consumer for templates: sidebar by category, placeholder editor, live preview, send/copy actions, history
  TAX_STATEMENT_GENERATOR: true,   // TaxStatementService + TaxStatementGeneratorComponent — IRS Cat. F annual statement helper (gross income / deductible expenses by category / net / effective rate) for Modelo 3 Anexo F
  INSURANCE_TRACKER: true,         // InsuranceTrackerService — landlord policy register (multirriscos / RC / conteúdo) with active/expiring-soon/expired computed buckets and renew action; service-only (UI in future sprint)

  // Sprint 043 — Night Shift 2026-05-03
  INSURANCE_TRACKER_UI: true,      // InsuranceTrackerComponent — UI consumer for InsuranceTrackerService: 3-tab (active/expiring/expired) policy cards + add-policy modal + renew/remove actions
  RENT_ESCALATION_CALCULATOR: true, // RentEscalationService + RentEscalationCalculatorComponent — PT NRAU art. 24.º annual rent update calculator with Portaria coefficients (2018-2026) and per-year override table
  IMI_CALCULATOR: true,            // IMICalculatorService + IMICalculatorComponent — PT IMI tax calculator: VPT × concelho rate (Lisboa/Porto/Cascais/etc.), agregado-familiar rebate, AT installment calendar (1/2/3×)

  // Sprint 044 — Night Shift 2026-05-04
  IRS_CAT_F_CALCULATOR: true,      // IRSCategoriaFService + IRSCategoriaFCalculatorComponent — PT IRS Cat. F (rendimentos prediais) calculator: 28% taxa autónoma vs englobamento (escalões 2026), recommendation + side-by-side comparison
  CREDITO_HABITACAO_SIMULATOR: true, // CreditoHabitacaoService + CreditoHabitacaoSimulatorComponent — PT mortgage simulator: Price formula, TAEG approx (Newton-Raphson), Euribor 3M/6M/12M or fixed-rate, LTV, partial amortization schedule (first 12 + last 12 months)
  ENERGY_CERTIFICATE_CHECKER: true, // EnergyCertificateService + EnergyCertificateCheckerComponent — PT Certificado Energético validator (ADENE classes A+/A/B/B-/C/D/E/F): expiry, savings vs class A, legal compliance per DL 118/2013 (250-3740€ fine for missing CE)

  // Sprint 045 — Dashboard consumer trilogy 2026-05-04/05
  PORTFOLIO_YIELD_OVERVIEW: true, // PortfolioYieldOverviewComponent — table consumer of PortfolioMockService: per-property gross & net yield (IMI + maintenance + IRS Cat.F retention), sortable columns, weighted aggregates, delta vs portfolio average
  PORTFOLIO_FISCAL_SUMMARY: true,  // PortfolioFiscalSummaryComponent — per-property IRS Cat. F aggregate over the whole portfolio: bruto/IMI/manutenção/dedutíveis/líquido + actual vs all-autónoma vs all-englobamento scenarios + recommendation
  PORTFOLIO_COMPLIANCE_MATRIX: true, // PortfolioComplianceMatrixComponent — property × dimension matrix (energy / insurance / lease) with ok/warning/expired cells, aggregate compliance %, prioritized action list (critical first)
  PORTFOLIO_ROUNDUP: true,         // PortfolioRoundupComponent — compact 3-card meta-consumer widget summarizing the Sprint 045 trilogy (yield + fiscal + compliance) with detail emitter for dashboard navigation

  // Sprint 046 — Wiring shift 2026-05-06
  FEATURES_PAGE_TOC: true,         // Features page sticky sidebar table-of-contents — flag-aware quick-jump nav for the 3061-line catalog
  DASHBOARD_PORTFOLIO_ROUNDUP_WIDGET: true, // PortfolioRoundupWidgetComponent — dashboard-page wrapper around PortfolioRoundupComponent with router navigation to /features#yield|fiscal|compliance

  // Sprint 047 — Night Shift 2026-05-07
  MAIS_VALIAS_IMOBILIARIAS_CALCULATOR: true, // MaisValiasImobiliariasService + MaisValiasImobiliariasCalculatorComponent — PT IRS Cat. G calculator: coef. desvalorização monetária (Portaria 314/2024), 50% tributável residente / 100% não-residente, taxa autónoma 28% vs englobamento progressivo

  // Sprint 048 — Night Shift 2026-05-08
  AIMI_CALCULATOR: true, // AIMIService + AIMICalculatorComponent — Adicional ao IMI: dedução €600k singular / €1.2M casal conjunto / 0 sociedades, escalões progressivos 0.7%/1.0%/1.5% (singulares e casais) ou taxa fixa 0.4% (sociedades), apenas urbano habitacional + terreno construção
  IMT_CALCULATOR: true,  // IMTService + IMTCalculatorComponent — Imposto Municipal sobre Transmissões Onerosas (compra): tabelas escalonadas 2026 HPP (isento até ~€101.917) vs outros fins (1% inicial), taxa fixa 5% rústicos, isenção jovens 1ª habitação até €316.772, IS 0.8% sempre devido

  // Sprint 049 — Night Shift 2026-05-09
  PORTFOLIO_TAX_LIFECYCLE_WIDGET: true, // PortfolioTaxLifecycleWidgetComponent — meta-consumer aggregating recurring annual tax (IMI + AIMI portfolio-wide + IRS Cat. F retention per regime) across the 8-property portfolio, plus optional projected events (sale → mais-valias residente / purchase → IMT + IS); closes the wiring gap left by Sprint 048's standalone calculators

  // Sprint 050 — Night Shift 2026-05-10
  MOVE_OUT_CHECKLIST: true,    // MoveOutChecklistService + MoveOutChecklistComponent — symmetric counterpart to MoveInChecklist (Sprint 040): contract denúncia (NRAU art. 1098.º — 30-120 day notice), utility termination, walk-through, deposit reclaim
  PROPERTY_INVENTORY: true,    // PropertyInventoryService + InventoryChecklistComponent — itemized inventory of recheio (15-item PT T2 seed), move-in/move-out condition delta with severity classification (unchanged/wear/damage/loss), suggested retention feeds DepositReturnEstimator; NRAU art. 5.º compliance

  // Sprint 051 — Night Shift 2026-05-11
  PORTFOLIO_LIFECYCLE_WIDGET: true, // PortfolioLifecycleWidgetComponent — operational counterpart to PortfolioTaxLifecycleWidget (Sprint 049): aggregates move-in / steady / move-out stage + inventory delta + suggested deduction across the 8-property portfolio; closes the triangle lifecycle × inventory × caução at portfolio scale

  // Sprint 052 — Night Shift 2026-05-12
  DASHBOARD_TAX_LIFECYCLE_WIDGET: true,         // PortfolioTaxLifecycleWidgetWrapperComponent — dashboard-page wrapper around PortfolioTaxLifecycleWidget (Sprint 049) with router navigation to /features#portfolio-tax-lifecycle
  DASHBOARD_LIFECYCLE_WIDGET: true,             // PortfolioLifecycleWidgetWrapperComponent — dashboard-page wrapper around PortfolioLifecycleWidget (Sprint 051) with router navigation to /features#portfolio-lifecycle
  PROPERTY_TRANSACTION_COST_CALCULATOR: true,   // PropertyTransactionCostService + PropertyTransactionCostCalculatorComponent — single-transaction meta-consumer combining IMT (buyer: HPP/outros + IS 0.8% + notário) and Mais-Valias Imobiliárias (seller: 50%/100% × 28%) to expose total transaction friction

  // Sprint 053 — Night Shift 2026-05-13 (catalog wiring de calculators standalone Sprints 047/048 + meta-consumer anual + rent-domain specs)
  DASHBOARD_MAIS_VALIAS_WIDGET: true, // MaisValiasWidgetComponent — dashboard wrapper around MaisValiasImobiliariasCalculatorComponent (Sprint 047) with router navigation to /features#mais-valias
  DASHBOARD_AIMI_WIDGET: true,        // AimiWidgetComponent — dashboard wrapper around AIMICalculatorComponent (Sprint 048) with router navigation to /features#aimi
  DASHBOARD_IMT_WIDGET: true,         // ImtWidgetComponent — dashboard wrapper around IMTCalculatorComponent (Sprint 048) with router navigation to /features#imt
  ANNUAL_TAX_BURDEN_AGGREGATOR: true, // AnnualPropertyTaxBurdenService + AnnualPropertyTaxBurdenComponent — meta-consumer cruzando IMI + AIMI + IRS Cat.F + Mais-Valias para um ano fiscal ao nível portfolio, com calendário de pagamentos (31/Mai, 31/Ago, 30/Nov IMI; 30/Set AIMI; Mar-Jun IRS)

  // Sprint 054 — Night Shift 2026-05-14 (fechar gaps de wiring + cobertura test lifecycle/aggregator)
  DASHBOARD_ANNUAL_BURDEN_WIDGET: true,        // AnnualTaxBurdenWidgetComponent — dashboard wrapper around AnnualPropertyTaxBurdenComponent (Sprint 053) with router navigation to /features#annual-tax-burden
  DASHBOARD_INSURANCE_TRACKER_WIDGET: true,    // InsuranceTrackerWidgetComponent — dashboard wrapper around InsuranceTrackerComponent (Sprint 043) with router navigation to /features#insurance-tracker; surfaces 3 buckets (active/expiring/expired) at-a-glance
  INSURANCE_TRACKER_CATALOG_WIRING: true,      // features-page section #insurance-tracker rendering <iu-insurance-tracker> (Sprint 043 standalone) — fecha o ponto de entrada faltante para a UI flag INSURANCE_TRACKER_UI desde Sprint 043
} as const;
