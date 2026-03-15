/**
 * @file admin-panel.types.ts
 * @description Types for the iu-admin-panel moderation component (Sprint 021).
 */

/** Status of an incoming tenant inquiry */
export type InquiryStatus = 'new' | 'replied' | 'archived';

/** A message from a prospective tenant to a landlord */
export interface AdminInquiry {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantAvatarInitials?: string;
  propertyTitle: string;
  propertyId: string;
  message: string;
  receivedAt: string;    // ISO date string
  status: InquiryStatus;
  unread: boolean;
}

/** Status of a landlord-managed booking */
export type AdminBookingStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';

/** A booking record visible in the admin panel */
export interface AdminBooking {
  id: string;
  tenantName: string;
  tenantEmail: string;
  propertyTitle: string;
  propertyId: string;
  bookingType: 'visit' | 'rental';
  requestedDate: string;   // ISO date
  durationMonths?: number; // rental only
  monthlyRent?: number;
  currency?: string;
  status: AdminBookingStatus;
  submittedAt: string;     // ISO date
  notes?: string;
}

/** Moderation decision on a review */
export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected';

/** A review record for moderation */
export interface AdminReview {
  id: string;
  authorName: string;
  propertyTitle: string;
  propertyId: string;
  rating: number;          // 1–5
  body: string;
  submittedAt: string;
  status: ReviewModerationStatus;
  flagged: boolean;
  landlordReplied: boolean;
}

/** Status of a managed property */
export type AdminPropertyStatus = 'active' | 'paused' | 'pending_review' | 'rejected';

/** Lightweight property row in the admin properties tab */
export interface AdminProperty {
  id: string;
  title: string;
  location: string;
  landlordName: string;
  landlordEmail: string;
  monthlyRent: number;
  currency: string;
  status: AdminPropertyStatus;
  listedAt: string;
  inquiryCount: number;
  bookingCount: number;
  viewCount: number;
}

/** Active tab key for the admin panel */
export type AdminPanelTab = 'inquiries' | 'bookings' | 'reviews' | 'properties';

/** Events emitted by the admin panel */
export interface AdminInquiryActionEvent {
  inquiry: AdminInquiry;
  action: 'reply' | 'archive' | 'mark_read';
}

export interface AdminBookingActionEvent {
  booking: AdminBooking;
  action: 'approve' | 'reject' | 'cancel';
}

export interface AdminReviewActionEvent {
  review: AdminReview;
  action: 'approve' | 'reject' | 'flag';
}

export interface AdminPropertyActionEvent {
  property: AdminProperty;
  action: 'activate' | 'pause' | 'approve' | 'reject';
}
