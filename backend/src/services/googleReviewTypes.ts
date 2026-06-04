export interface GooglePlaceReview {
  id: string;
  name: string;
  content: string;
  rating: number;
  source: "google";
  relativeTime?: string;
  profilePhotoUrl?: string;
  placeId: string;
  placeName: string;
}

export interface GoogleLocationSummary {
  placeId: string;
  placeName: string;
  rating?: number;
  totalRatings?: number;
  reviewsReturned: number;
}

export type GoogleReviewsFetchMode =
  | "business_profile"
  | "places"
  | "oauth_pending"
  | "none";

export interface GoogleReviewsResult {
  reviews: GooglePlaceReview[];
  locations: GoogleLocationSummary[];
  rating?: number;
  totalRatings?: number;
  placeName?: string;
  configured: boolean;
  fetchMode: GoogleReviewsFetchMode;
}
