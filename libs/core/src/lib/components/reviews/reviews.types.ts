/** Star rating value (1–5) */
export type StarRating = 1 | 2 | 3 | 4 | 5;

/**
 * A single property review left by a tenant.
 */
export interface PropertyReview {
  /** Unique review id */
  id: string;
  /** Reviewer display name */
  authorName: string;
  /** Optional avatar URL */
  authorAvatarUrl?: string;
  /** Star rating (1–5) */
  rating: StarRating;
  /** Review text body */
  body: string;
  /** ISO date string of review submission */
  date: string;
  /** Whether the landlord has replied */
  landlordReply?: string;
  /** Whether review is verified (tenant confirmed booking) */
  verified?: boolean;
}

/**
 * Aggregated rating summary for a property.
 */
export interface RatingSummary {
  /** Average star rating */
  average: number;
  /** Total number of reviews */
  total: number;
  /** Count per star level */
  breakdown: Record<StarRating, number>;
}
