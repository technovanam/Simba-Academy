import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import type { GoogleLocationSummary, GooglePlaceReview } from "./googleReviewTypes.js";
import {
  getPersistedGbpAccountId,
  getPersistedRateLimitUntilMs,
  persistGbpAccountId,
  persistGbpRateLimitUntil,
} from "./googleBusinessProfileState.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function isBusinessProfileConfigured(): boolean {
  return Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID &&
      env.GOOGLE_OAUTH_CLIENT_SECRET &&
      env.GOOGLE_BUSINESS_REFRESH_TOKEN
  );
}

/** OAuth client is set but Connect Google Business was not finished yet. */
export function isOAuthPendingRefreshToken(): boolean {
  return Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID.trim() &&
      env.GOOGLE_OAUTH_CLIENT_SECRET.trim() &&
      !env.GOOGLE_BUSINESS_REFRESH_TOKEN.trim()
  );
}

export async function getBusinessAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_BUSINESS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new AppError(
      `Google Business OAuth failed: ${data.error_description ?? data.error ?? res.status}. Re-run npm run google:connect-business.`,
      503
    );
  }
  return data.access_token;
}

export function buildGoogleBusinessAuthUrl(): string {
  const redirect = env.GOOGLE_OAUTH_REDIRECT_URI;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirect,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleBusinessCode(code: string): Promise<{
  refreshToken: string;
  accessToken: string;
}> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.refresh_token) {
    throw new AppError(
      data.error_description ?? data.error ?? "OAuth code exchange failed. Use a fresh authorization link.",
      400
    );
  }

  return {
    refreshToken: data.refresh_token,
    accessToken: data.access_token ?? "",
  };
}

async function gbpFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    const message = body.error?.message ?? `Google Business API error (${res.status})`;
    if (res.status === 429 || isRateLimitError(new AppError(message, res.status))) {
      markGbpRateLimited();
    }
    throw new AppError(message, res.status >= 500 ? 503 : 400);
  }
  return body;
}

/** In-memory account id after first successful lookup (avoids repeated accounts.list calls). */
let cachedGbpAccountId: string | null = getPersistedGbpAccountId() ?? null;
/** After a rate-limit error, pause API calls so refreshes do not make it worse. */
let gbpRateLimitedUntil = getPersistedRateLimitUntilMs();

if (gbpRateLimitedUntil > 0 && gbpRateLimitedUntil <= Date.now()) {
  gbpRateLimitedUntil = 0;
  persistGbpRateLimitUntil(0);
}

if (isBusinessProfileConfigured() && !env.GOOGLE_BUSINESS_ACCOUNT_ID.trim() && !cachedGbpAccountId) {
  console.warn(
    "[Google Business] GOOGLE_BUSINESS_ACCOUNT_ID is not set — each sync may call accounts.list and hit quota. Run: npm run google:list-business-account"
  );
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof AppError ? err.message : String(err);
  return /quota|rate|429|too many/i.test(msg);
}

function assertNotRateLimited(): void {
  if (Date.now() < gbpRateLimitedUntil) {
    const waitMin = Math.ceil((gbpRateLimitedUntil - Date.now()) / 60_000);
    throw new AppError(
      `Google Business API rate limit active. Wait about ${waitMin} minute(s), then click Refresh Google once.`,
      429
    );
  }
}

export function markGbpRateLimited(): void {
  const minutes = Math.max(5, env.GOOGLE_GBP_RATE_LIMIT_COOLDOWN_MINUTES);
  gbpRateLimitedUntil = Date.now() + minutes * 60_000;
  persistGbpRateLimitUntil(gbpRateLimitedUntil);
  console.warn(
    `[Google Business] Rate limit cooldown until ${new Date(gbpRateLimitedUntil).toLocaleString("en-IN")} (${minutes} min)`
  );
}

async function resolveAccountId(token: string): Promise<string> {
  const configured = env.GOOGLE_BUSINESS_ACCOUNT_ID.trim();
  if (configured) {
    return configured.replace(/^accounts\//, "");
  }

  if (cachedGbpAccountId) {
    return cachedGbpAccountId;
  }

  assertNotRateLimited();

  try {
    const data = await gbpFetch<{ accounts?: { name?: string }[] }>(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      token
    );

    const first = data.accounts?.[0]?.name;
    if (!first) {
      throw new AppError("No Google Business accounts found for this Google login.", 404);
    }
    cachedGbpAccountId = first.replace(/^accounts\//, "");
    persistGbpAccountId(cachedGbpAccountId);
    console.info(
      `[Google Business] Account id ${cachedGbpAccountId} — saved to data/google-business-profile-state.json (also set GOOGLE_BUSINESS_ACCOUNT_ID in .env)`
    );
    return cachedGbpAccountId;
  } catch (err) {
    if (isRateLimitError(err)) {
      markGbpRateLimited();
    }
    throw err;
  }
}

interface GbpLocation {
  name: string;
  title?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string };
}

async function listAllLocations(token: string, accountId: string): Promise<GbpLocation[]> {
  const locations: GbpLocation[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`
    );
    url.searchParams.set("readMask", "name,title,storefrontAddress");
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const data = await gbpFetch<{ locations?: GbpLocation[]; nextPageToken?: string }>(
      url.toString(),
      token
    );
    locations.push(...(data.locations ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return locations;
}

interface GbpReview {
  reviewId?: string;
  name?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
}

function parseStarRating(starRating?: string): number {
  if (!starRating) return 5;
  return STAR_MAP[starRating] ?? 5;
}

function formatReviewDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return undefined;
  }
}

async function listReviewsForLocation(
  token: string,
  accountId: string,
  location: GbpLocation
): Promise<{ reviews: GooglePlaceReview[]; averageRating?: number; totalReviewCount?: number }> {
  const locationId = location.name.replace(/^accounts\/[^/]+\/locations\//, "");
  const placeName =
    location.title ??
    location.storefrontAddress?.addressLines?.[0] ??
    `Location ${locationId}`;

  const reviews: GooglePlaceReview[] = [];
  let pageToken: string | undefined;
  let averageRating: number | undefined;
  let totalReviewCount: number | undefined;

  do {
    const url = new URL(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`
    );
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const data = await gbpFetch<{
      reviews?: GbpReview[];
      averageRating?: number;
      totalReviewCount?: number;
      nextPageToken?: string;
    }>(url.toString(), token);

    averageRating = data.averageRating ?? averageRating;
    totalReviewCount = data.totalReviewCount ?? totalReviewCount;

    for (const r of data.reviews ?? []) {
      const comment = (r.comment ?? "").trim();
      const content = comment || "—";
      reviews.push({
        id: `gbp-${locationId}-${r.reviewId ?? r.name ?? reviews.length}`,
        name: r.reviewer?.displayName ?? "Google User",
        content,
        rating: parseStarRating(r.starRating),
        source: "google",
        relativeTime: formatReviewDate(r.updateTime ?? r.createTime),
        profilePhotoUrl: r.reviewer?.profilePhotoUrl,
        placeId: location.name,
        placeName,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { reviews, averageRating, totalReviewCount };
}

/**
 * Fetch all reviews (with written feedback) from every location on the Google Business account.
 */
export function getGbpRateLimitHint(): string | undefined {
  const persisted = getPersistedRateLimitUntilMs();
  if (persisted > gbpRateLimitedUntil) {
    gbpRateLimitedUntil = persisted;
  }
  if (Date.now() < gbpRateLimitedUntil) {
    const waitMin = Math.ceil((gbpRateLimitedUntil - Date.now()) / 60_000);
    const accountHint = env.GOOGLE_BUSINESS_ACCOUNT_ID.trim()
      ? ""
      : " Set GOOGLE_BUSINESS_ACCOUNT_ID in backend/.env (run npm run google:list-business-account once when quota clears).";
    return `Google API quota exceeded. Wait ${waitMin} more minute(s), then sync once from CLI: npm run google:sync-reviews.${accountHint}`;
  }
  return undefined;
}

export async function fetchGoogleBusinessProfileReviews(): Promise<{
  reviews: GooglePlaceReview[];
  locations: GoogleLocationSummary[];
  rating?: number;
  totalRatings?: number;
  placeName?: string;
  fetchMode: "business_profile";
}> {
  assertNotRateLimited();
  const token = await getBusinessAccessToken();
  const accountId = await resolveAccountId(token);
  const gbpLocations = await listAllLocations(token, accountId);

  const allReviews: GooglePlaceReview[] = [];
  const locations: GoogleLocationSummary[] = [];
  let totalRatings = 0;
  let weightedRatingSum = 0;
  let ratingWeight = 0;

  for (let i = 0; i < gbpLocations.length; i++) {
    const loc = gbpLocations[i]!;
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 3500));
    }
    try {
      const result = await listReviewsForLocation(token, accountId, loc);
      const withText = result.reviews.filter((r) => r.content !== "—");
      allReviews.push(...result.reviews);

      locations.push({
        placeId: loc.name,
        placeName: loc.title ?? loc.name,
        rating: result.averageRating,
        totalRatings: result.totalReviewCount,
        reviewsReturned: result.reviews.length,
      });

      if (result.totalReviewCount != null && result.totalReviewCount > 0) {
        totalRatings += result.totalReviewCount;
        if (result.averageRating != null) {
          weightedRatingSum += result.averageRating * result.totalReviewCount;
          ratingWeight += result.totalReviewCount;
        }
      }

      console.log(
        `[Google Business] ${loc.title}: ${result.reviews.length} reviews (${withText.length} with written feedback)`
      );
    } catch (err) {
      console.error(`[Google Business] Skipped ${loc.title ?? loc.name}:`, err);
      if (isRateLimitError(err)) {
        markGbpRateLimited();
        break;
      }
      locations.push({
        placeId: loc.name,
        placeName: loc.title ?? loc.name,
        reviewsReturned: 0,
      });
    }
  }

  const aggregateRating =
    ratingWeight > 0 ? Math.round((weightedRatingSum / ratingWeight) * 10) / 10 : undefined;

  return {
    reviews: allReviews,
    locations,
    rating: aggregateRating,
    totalRatings: totalRatings || undefined,
    placeName:
      locations.length === 1
        ? locations[0]!.placeName
        : `Google Business (${locations.length} locations)`,
    fetchMode: "business_profile",
  };
}
