/**
 * @file notification-bell.types.ts
 * Types for the NotificationBell component (Sprint 018).
 */

/** Category of a notification for icon/colour theming. */
export type NotificationCategory =
  | 'message'    // New chat message
  | 'booking'    // Booking request or status change
  | 'property'   // Property update
  | 'system'     // System info
  | 'alert';     // Urgent / warning

/** A single notification item. */
export interface AppNotification {
  /** Unique notification id. */
  id: string;
  /** Notification category (drives icon and colour). */
  category: NotificationCategory;
  /** Short title. */
  title: string;
  /** Longer body text. */
  body: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Whether the user has seen/opened this notification. */
  read: boolean;
  /** Optional action route (e.g. '/messages/thread-1'). */
  actionRoute?: string;
}
