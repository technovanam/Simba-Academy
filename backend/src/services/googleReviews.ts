import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import {
  fetchGoogleBusinessProfileReviews,
  getGbpRateLimitHint,
  isBusinessProfileConfigured,
  isOAuthPendingRefreshToken,
  markGbpRateLimited,
} from "./googleBusinessProfile.js";
import {
  loadGoogleReviewsSnapshot,
  saveGoogleReviewsSnapshot,
  snapshotAgeMinutes,
  type GoogleReviewsSnapshot,
} from "./googleReviewsSnapshot.js";
import type {
  GoogleLocationSummary,
  GooglePlaceReview,
  GoogleReviewsFetchMode,
  GoogleReviewsResult,
} from "./googleReviewTypes.js";

export type { GoogleLocationSummary, GooglePlaceReview, GoogleReviewsResult };

interface CacheEntry {
  reviews: GooglePlaceReview[];
  locations: GoogleLocationSummary[];
  rating?: number;
  totalRatings?: number;
  placeName?: string;
  fetchedAt: number;
  fetchMode: GoogleReviewsFetchMode;
}

let cache: CacheEntry | null = null;

function normalizePlaceId(placeId: string): string {
  return placeId.replace(/^places\//, "").trim();
}

function parseConfiguredPlaceIds(): string[] {
  const fromList = (env.GOOGLE_PLACE_IDS ?? "")
    .split(",")
    .map((s) => normalizePlaceId(s))
    .filter(Boolean);
  if (fromList.length > 0) return [...new Set(fromList)];

  const single = normalizePlaceId(env.GOOGLE_PLACE_ID ?? "");
  return single ? [single] : [];
}

export function isGoogleReviewsConfigured(): boolean {
  return (
    isBusinessProfileConfigured() ||
    Boolean(
      env.GOOGLE_PLACES_API_KEY &&
        (parseConfiguredPlaceIds().length > 0 || env.GOOGLE_PLACES_SEARCH_QUERY.trim())
    )
  );
}

/** Discover all locations for your brand (e.g. every Simba Preschool branch). */
export async function searchGooglePlaces(
  textQuery: string,
  maxResultCount = 20
): Promise<{ id: string; name: string; address?: string }[]> {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new AppError("GOOGLE_PLACES_API_KEY is not set", 503);
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery, maxResultCount }),
  });

  const data = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new AppError(data.error?.message ?? `Place search failed (${res.status})`, 503);
  }

  let places = (data.places ?? []).map((p) => ({
    id: normalizePlaceId(p.id ?? ""),
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress,
  }));

  const filter = env.GOOGLE_PLACES_NAME_FILTER.trim().toLowerCase();
  if (filter) {
    places = places.filter(
      (p) =>
        p.name.toLowerCase().includes(filter) ||
        (p.address ?? "").toLowerCase().includes(filter)
    );
  }

  const seen = new Set<string>();
  return places.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/** @deprecated Use searchGooglePlaces */
export const searchGooglePlaceId = searchGooglePlaces;

interface PlaceDetailsResult {
  placeName: string;
  rating?: number;
  totalRatings?: number;
  reviews: GooglePlaceReview[];
}

/** Legacy Places Details often returns review text without the Enterprise field mask SKU. */
async function fetchLegacyPlaceReviews(placeId: string): Promise<PlaceDetailsResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
  url.searchParams.set("key", env.GOOGLE_PLACES_API_KEY);

  const res = await fetch(url.toString());
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    error_message?: string;
    result?: {
      name?: string;
      rating?: number;
      user_ratings_total?: number;
      reviews?: Array<{
        author_name?: string;
        rating?: number;
        text?: string;
        relative_time_description?: string;
        profile_photo_url?: string;
        time?: number;
      }>;
    };
  };

  if (body.status !== "OK" || !body.result) {
    if (body.status && body.status !== "ZERO_RESULTS") {
      console.warn(`[Google Reviews] Legacy API ${placeId}: ${body.error_message ?? body.status}`);
    }
    return null;
  }

  const placeName = body.result.name ?? "Google Location";
  const reviews: GooglePlaceReview[] = (body.result.reviews ?? [])
    .filter((r) => (r.text ?? "").trim().length > 0)
    .map((r, idx) => ({
      id: `google-legacy-${placeId}-${r.time ?? idx}`,
      name: r.author_name ?? "Google User",
      content: r.text!.trim(),
      rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 5))),
      source: "google" as const,
      relativeTime: r.relative_time_description,
      profilePhotoUrl: r.profile_photo_url,
      placeId,
      placeName,
    }));

  return {
    placeName,
    rating: body.result.rating,
    totalRatings: body.result.user_ratings_total,
    reviews,
  };
}

async function fetchSinglePlaceReviews(placeId: string): Promise<PlaceDetailsResult> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
    },
  });

  const body = (await res.json().catch(() => ({}))) as {
    displayName?: { text?: string };
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{
      name?: string;
      rating?: number;
      text?: { text?: string };
      relativePublishTimeDescription?: string;
      authorAttribution?: { displayName?: string; photoUri?: string };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    const legacy = await fetchLegacyPlaceReviews(placeId);
    if (legacy) return legacy;
    const msg = body.error?.message ?? `HTTP ${res.status}`;
    throw new AppError(`Place ${placeId}: ${msg}`, 503);
  }

  const placeName = body.displayName?.text ?? "Google Location";

  let reviews: GooglePlaceReview[] = (body.reviews ?? [])
    .filter((r) => (r.text?.text ?? "").trim().length > 0)
    .map((r, idx) => ({
      id: `google-${placeId}-${r.name ?? idx}`,
      name: r.authorAttribution?.displayName ?? "Google User",
      content: r.text!.text!.trim(),
      rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 5))),
      source: "google" as const,
      relativeTime: r.relativePublishTimeDescription,
      profilePhotoUrl: r.authorAttribution?.photoUri,
      placeId,
      placeName,
    }));

  if (reviews.length === 0) {
    const legacy = await fetchLegacyPlaceReviews(placeId);
    if (legacy && legacy.reviews.length > 0) {
      console.log(`[Google Reviews] ${placeName}: loaded ${legacy.reviews.length} reviews via legacy Places API`);
      return legacy;
    }
  }

  if (reviews.length === 0 && (body.userRatingCount ?? 0) > 0) {
    console.warn(
      `[Google Reviews] ${placeName} (${placeId}): ${body.userRatingCount} ratings on Google but no review text. ` +
        "Connect Google Business (OAuth) for all written feedback, or enable Places API (New) Enterprise SKU."
    );
  }

  return {
    placeName,
    rating: body.rating,
    totalRatings: body.userRatingCount,
    reviews,
  };
}

async function resolveAllPlaceIds(): Promise<string[]> {
  const explicit = parseConfiguredPlaceIds();
  if (explicit.length > 0) return explicit;

  const query = env.GOOGLE_PLACES_SEARCH_QUERY.trim();
  if (!query) return [];

  const discovered = await searchGooglePlaces(query, env.GOOGLE_PLACES_SEARCH_MAX);
  return discovered.map((p) => p.id);
}

async function fetchFromPlacesApi(): Promise<GoogleReviewsResult> {
  const placeIds = await resolveAllPlaceIds();
  if (placeIds.length === 0) {
    return { reviews: [], locations: [], configured: true, fetchMode: "places" };
  }

  const allReviews: GooglePlaceReview[] = [];
  const locations: GoogleLocationSummary[] = [];
  let totalRatings = 0;
  let weightedRatingSum = 0;
  let ratingWeight = 0;

  for (const placeId of placeIds) {
    try {
      const details = await fetchSinglePlaceReviews(placeId);
      allReviews.push(...details.reviews);
      locations.push({
        placeId,
        placeName: details.placeName,
        rating: details.rating,
        totalRatings: details.totalRatings,
        reviewsReturned: details.reviews.length,
      });

      if (details.totalRatings != null && details.totalRatings > 0) {
        totalRatings += details.totalRatings;
        if (details.rating != null) {
          weightedRatingSum += details.rating * details.totalRatings;
          ratingWeight += details.totalRatings;
        }
      }
    } catch (err) {
      console.error(`[Google Reviews] Skipped ${placeId}:`, err);
      locations.push({
        placeId,
        placeName: placeId,
        reviewsReturned: 0,
      });
    }
  }

  const aggregateRating =
    ratingWeight > 0 ? Math.round((weightedRatingSum / ratingWeight) * 10) / 10 : undefined;

  const placeName =
    locations.length === 1
      ? locations[0]!.placeName
      : `Simba Preschool (${locations.length} locations)`;

  return {
    reviews: allReviews,
    locations,
    rating: aggregateRating,
    totalRatings: totalRatings || undefined,
    placeName,
    configured: true,
    fetchMode: "places",
  };
}

function snapshotToResult(snapshot: GoogleReviewsSnapshot): GoogleReviewsResult {
  const { syncedAt: _s, ...result } = snapshot;
  return result;
}

/** Read last synced reviews from disk — no Google API calls. */
export function getStoredGoogleReviews(): GoogleReviewsResult | null {
  const snapshot = loadGoogleReviewsSnapshot();
  return snapshot ? snapshotToResult(snapshot) : null;
}

export type GoogleReviewsLoadMeta = {
  fromSnapshot?: boolean;
  syncedAt?: string;
  syncBlocked?: string;
  /** true only when a new snapshot was written from Google this request */
  synced?: boolean;
  /** ISO timestamp when live data was fetched from Google this request */
  fetchedAt?: string;
};

function applyCache(result: GoogleReviewsResult): GoogleReviewsResult {
  cache = {
    reviews: result.reviews,
    locations: result.locations,
    rating: result.rating,
    totalRatings: result.totalRatings,
    placeName: result.placeName,
    fetchedAt: Date.now(),
    fetchMode: result.fetchMode,
  };
  return result;
}

function fallbackFromSnapshot(
  snapshot: GoogleReviewsSnapshot | null,
  meta?: GoogleReviewsLoadMeta,
  blockHint?: string
): GoogleReviewsResult | null {
  if (!snapshot) return null;
  if (meta) {
    meta.fromSnapshot = true;
    meta.syncedAt = snapshot.syncedAt;
    if (blockHint) meta.syncBlocked = blockHint;
  }
  return snapshotToResult(snapshot);
}

async function pullLiveGoogleReviews(meta?: GoogleReviewsLoadMeta): Promise<GoogleReviewsResult> {
  const snapshot = loadGoogleReviewsSnapshot();
  let result: GoogleReviewsResult;

  if (isBusinessProfileConfigured()) {
    try {
      const gbp = await fetchGoogleBusinessProfileReviews();
      result = { ...gbp, configured: true };
      const saved = saveGoogleReviewsSnapshot(result);
      if (meta) {
        meta.synced = true;
        meta.syncedAt = saved.syncedAt;
        meta.fromSnapshot = false;
        meta.fetchedAt = new Date().toISOString();
      }
      console.log(`[Google Reviews] Live fetch: ${result.reviews.length} review(s) with feedback`);
      return applyCache(result);
    } catch (err) {
      console.error("[Google Business Profile] live fetch failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/quota|rate|429/i.test(msg)) {
        markGbpRateLimited();
      }
      const blockHint = getGbpRateLimitHint() ?? msg;
      const placesFallback = await fetchFromPlacesApi().catch(() => null);
      if (placesFallback && placesFallback.reviews.length > 0) {
        result = placesFallback;
        saveGoogleReviewsSnapshot(result);
        if (meta) {
          meta.synced = true;
          meta.fromSnapshot = false;
          meta.fetchedAt = new Date().toISOString();
        }
        return applyCache(result);
      }
      const fromDisk = fallbackFromSnapshot(snapshot, meta, blockHint);
      if (fromDisk) return fromDisk;
      if (meta) {
        meta.synced = false;
        meta.syncBlocked = blockHint;
      }
      return applyCache({
        reviews: [],
        locations: [],
        configured: true,
        fetchMode: "business_profile",
      });
    }
  }

  try {
    result = await fetchFromPlacesApi();
    if (result.reviews.length > 0) {
      const saved = saveGoogleReviewsSnapshot(result);
      if (meta) {
        meta.synced = true;
        meta.syncedAt = saved.syncedAt;
        meta.fromSnapshot = false;
        meta.fetchedAt = new Date().toISOString();
      }
    } else if (meta) {
      meta.fetchedAt = new Date().toISOString();
      meta.fromSnapshot = false;
    }
    return applyCache(result);
  } catch (err) {
    console.error("[Google Places] live fetch failed:", err);
    const fromDisk = fallbackFromSnapshot(snapshot, meta, err instanceof Error ? err.message : String(err));
    if (fromDisk) return fromDisk;
    return applyCache({
      reviews: [],
      locations: [],
      configured: true,
      fetchMode: "places",
    });
  }
}

/**
 * Default: serve saved snapshot (no Google API calls — avoids quota errors).
 * force=true or GOOGLE_REVIEWS_LIVE_FETCH=true: call Google (use sparingly).
 */
export async function fetchGooglePlaceReviews(
  force = false,
  meta?: GoogleReviewsLoadMeta
): Promise<GoogleReviewsResult> {
  if (!isGoogleReviewsConfigured()) {
    return { reviews: [], locations: [], configured: false, fetchMode: "none" };
  }

  if (isOAuthPendingRefreshToken()) {
    return { reviews: [], locations: [], configured: true, fetchMode: "oauth_pending" };
  }

  const snapshot = loadGoogleReviewsSnapshot();
  const shouldCallGoogle = force || env.GOOGLE_REVIEWS_LIVE_FETCH;

  if (!shouldCallGoogle) {
    const fromDisk = fallbackFromSnapshot(snapshot, meta);
    if (fromDisk) return fromDisk;
    return { reviews: [], locations: [], configured: true, fetchMode: "business_profile" };
  }

  const rateHint = getGbpRateLimitHint();
  if (rateHint) {
    const fromDisk = fallbackFromSnapshot(snapshot, meta, rateHint);
    if (fromDisk) return fromDisk;
    if (meta) meta.syncBlocked = rateHint;
    return { reviews: [], locations: [], configured: true, fetchMode: "business_profile" };
  }

  if (force && snapshot && env.GOOGLE_REVIEWS_SYNC_COOLDOWN_MINUTES > 0) {
    const ageMin = snapshotAgeMinutes(snapshot);
    const cooldown = env.GOOGLE_REVIEWS_SYNC_COOLDOWN_MINUTES;
    if (ageMin < cooldown) {
      if (meta) {
        meta.syncBlocked = `Last sync was ${ageMin} minute(s) ago. Wait ${cooldown - ageMin} more minute(s), then click Refresh now.`;
      }
      const fromDisk = fallbackFromSnapshot(snapshot, meta);
      if (fromDisk) return fromDisk;
    }
  }

  if (!force && env.GOOGLE_REVIEWS_CACHE_MINUTES > 0) {
    const ttlMs = env.GOOGLE_REVIEWS_CACHE_MINUTES * 60 * 1000;
    if (cache && Date.now() - cache.fetchedAt < ttlMs) {
      if (meta) meta.fetchedAt = new Date(cache.fetchedAt).toISOString();
      return {
        reviews: cache.reviews,
        locations: cache.locations,
        rating: cache.rating,
        totalRatings: cache.totalRatings,
        placeName: cache.placeName,
        configured: true,
        fetchMode: cache.fetchMode,
      };
    }
  }

  return pullLiveGoogleReviews(meta);
}

/** Pull reviews from configured Places API locations (for DB sync fallback). */
export async function fetchConfiguredPlacesReviews(): Promise<GooglePlaceReview[]> {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new AppError("GOOGLE_PLACES_API_KEY is not set", 503);
  }
  const result = await fetchFromPlacesApi();
  return result.reviews;
}
