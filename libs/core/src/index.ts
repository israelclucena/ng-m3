export * from './lib/core/core';

// NOTE: Material Web side-effect imports moved to individual component files
// for proper tree-shaking. Each component imports only what it needs.
// See: libs/core/src/lib/material/material-web.ts (kept for reference / Storybook)

// ── israel-ui utilities ──

// Sprint 022 — Signal debounce utilities
export * from './lib/utils/signal-debounce';

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

// Sprint 012 — Night Shift 2026-03-08
export * from './lib/components/property-filter/property-filter.component';
export * from './lib/services/favourites.service';

// Sprint 013 — Night Shift 2026-03-09
export * from './lib/components/property-map/property-map.component';
export * from './lib/components/property-comparison/property-comparison.component';
export * from './lib/components/paginator/paginator.component';

// Sprint 014 — Night Shift 2026-03-10
export * from './lib/components/property-booking/property-booking.component';

// Sprint 015 — Night Shift 2026-03-10
export * from './lib/services/auth.service';
export * from './lib/components/auth-login/auth-login.component';
export * from './lib/components/auth-register/auth-register.component';
export * from './lib/guards/auth.guard';

// Sprint 016 — Night Shift 2026-03-11
export * from './lib/components/user-profile/user-profile.component';
export * from './lib/components/my-bookings/my-bookings.component';
export * from './lib/components/my-favourites/my-favourites.component';

// Sprint 017 — Night Shift 2026-03-11
export * from './lib/components/add-property/add-property.component';
export * from './lib/components/manage-listings/manage-listings.component';

// Sprint 018 — Night Shift 2026-03-12
export * from './lib/components/messaging/messaging.types';
export * from './lib/components/messaging/messaging.service';
export * from './lib/components/messaging/message-thread.component';
export * from './lib/components/messaging/message-list.component';
export * from './lib/components/notification-bell/notification-bell.types';
export * from './lib/components/notification-bell/notification-bell.service';
export * from './lib/components/notification-bell/notification-bell.component';

// Sprint 019 — Night Shift 2026-03-13
export * from './lib/components/global-search/property-search.service';
export * from './lib/components/global-search/global-search.component';
export * from './lib/components/reviews/reviews.types';
export * from './lib/components/reviews/rating-display.component';
export * from './lib/components/reviews/review-card.component';
export * from './lib/components/reviews/property-reviews.component';

// Sprint 020 — Night Shift 2026-03-14
export * from './lib/components/payment/payment.types';
export * from './lib/components/payment/payment-summary-card.component';
export * from './lib/components/payment/booking-confirmation.component';
export * from './lib/components/landlord-analytics/landlord-analytics.types';
export * from './lib/components/landlord-analytics/occupancy-chart.component';
export * from './lib/components/landlord-analytics/revenue-widget.component';
export * from './lib/components/landlord-analytics/listing-stats-card.component';

// Sprint 021 — Night Shift 2026-03-15
export * from './lib/components/admin-panel/admin-panel.types';
export * from './lib/components/admin-panel/admin-panel.component';
export * from './lib/services/i18n.service';
export * from './lib/components/locale-switcher/locale-switcher.component';

// Sprint 023 — Night Shift 2026-03-17
export * from './lib/components/error-pages/not-found-page.component';
export * from './lib/components/error-pages/error-page.component';
export * from './lib/services/http-error/http-error.service';
export * from './lib/services/http-error/http-error.interceptor';
export * from './lib/services/http-error/global-error-handler';

// Sprint 024 — Night Shift 2026-03-18
export * from './lib/services/web-vitals.service';
export * from './lib/components/web-vitals/web-vitals-widget.component';
export * from './lib/utils/signal-form';

// Sprint 027 — Night Shift 2026-03-22
export * from './lib/services/resource.service';
export { PropertyAvailabilityComponent } from './lib/components/property-availability/property-availability.component';

// Sprint 028 — Night Shift 2026-03-23
export * from './lib/services/availability-resource.service';
export * from './lib/components/booking-checkout/booking-checkout.component';

// Sprint 029 — Night Shift 2026-03-24
export { PaymentService } from './lib/services/payment.service';
export type { PaymentIntent, PaymentResult, ProcessPaymentOptions, PaymentStatus } from './lib/services/payment.service';
export { PaymentGatewayDemoComponent } from './lib/components/payment/payment-gateway-demo.component';

// Sprint 030 — Night Shift 2026-03-25
export { InvoiceService } from './lib/services/invoice.service';
export type { Invoice, InvoiceLineItem } from './lib/services/invoice.service';
export { PaymentReceiptComponent } from './lib/components/payment/payment-receipt.component';
export { RevenueAnalyticsService } from './lib/services/revenue-analytics.service';
export type { MonthlyRevenue, PropertyRevenueSummary, RevenueKPIs, LandlordAnalytics } from './lib/services/revenue-analytics.service';
export { LandlordRevenueComponent } from './lib/components/landlord-analytics/landlord-revenue.component';
export { oneOf, createSelectField } from './lib/utils/signal-form';
export type { UnionOption, SignalUnionFieldConfig, SignalUnionField } from './lib/utils/signal-form';

// Sprint 033 — Night Shift 2026-03-28
export { TenantDashboardService } from './lib/services/tenant-dashboard.service';
export type { TenantDashboard, TenantKPIs, TenantPayment, TenantBooking, TenantFavouriteProperty, TenantSpendingPoint } from './lib/services/tenant-dashboard.service';
export { TenantDashboardComponent } from './lib/components/tenant-dashboard/tenant-dashboard.component';

// Sprint 034 — Night Shift 2026-03-29
export { MaintenanceRequestService } from './lib/services/maintenance-request.service';
export type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory, CreateMaintenanceRequestPayload, UpdateMaintenanceStatusPayload } from './lib/services/maintenance-request.service';
export { MaintenanceRequestFormComponent } from './lib/components/maintenance-request/maintenance-request-form.component';
export { MaintenanceRequestListComponent } from './lib/components/maintenance-request/maintenance-request-list.component';
export { DocumentUploadComponent } from './lib/components/document-upload/document-upload.component';
export type { UploadFile, FileValidationOptions, FileValidationResult } from './lib/utils/file-validators';
export { validateFile, createUploadFile, formatFileSize, getExtension, fileIcon } from './lib/utils/file-validators';
export { getError, debouncedSignal, reloadValidation, createDebouncedField } from './lib/utils/signal-form';

// Sprint 035 — Night Shift 2026-03-30
export { LeaseAgreementService } from './lib/services/lease-agreement.service';
export type { LeaseAgreement, LeaseStatus, LeaseType, LeaseDocument, CreateLeasePayload } from './lib/services/lease-agreement.service';
export { LeaseAgreementFormComponent } from './lib/components/lease-agreement/lease-agreement-form.component';
export { LeaseAgreementViewerComponent } from './lib/components/lease-agreement/lease-agreement-viewer.component';
export { TenantApplicationService } from './lib/services/tenant-application.service';
export type { TenantApplication, ApplicationStatus, EmploymentType, TenantReference, CreateApplicationPayload } from './lib/services/tenant-application.service';
export { TenantApplicationFormComponent } from './lib/components/tenant-application/tenant-application-form.component';
export { ApplicationStatusComponent } from './lib/components/tenant-application/application-status.component';
export { MaintenanceNotificationHandler } from './lib/services/maintenance-notification.handler';
