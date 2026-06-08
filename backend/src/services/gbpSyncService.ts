import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import {
  getBusinessAccessToken,
  isBusinessProfileConfigured,
  markGbpRateLimited,
} from "./googleBusinessProfile.js";
import { fetchConfiguredPlacesReviews } from "./googleReviews.js";
import type { GooglePlaceReview } from "./googleReviewTypes.js";

/**
 * Google Business Profile reviews are served by the restricted My Business API (v4).
 * The Business Information API (v1) does not expose a /reviews route (returns 404).
 * Until Google approves GBP API access for your Cloud project, we fall back to Places API.
 */
const GBP_REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";
const GBP_API_ACCESS_DOCS = "https://developers.google.com/my-business/content/prereqs";
const REVIEWS_PAGE_SIZE = 50;
const SCHEDULER_INTERVAL_MS = 12 * 60 * 60 * 1000;
const STARTUP_SYNC_DELAY_MS = 10_000;

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

interface GbpReviewer {
  displayName?: string;
  profilePhotoUrl?: string;
}

interface GbpReview {
  name?: string;
  reviewId?: string;
  reviewer?: GbpReviewer;
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
}

interface GbpReviewsListResponse {
  reviews?: GbpReview[];
  nextPageToken?: string;
  error?: {
    message?: string;
    status?: string;
    details?: Array<{ reason?: string; metadata?: Record<string, string> }>;
  };
}

interface BranchFetchResult {
  branchId: string;
  reviews: GbpReview[];
  success: boolean;
  error?: string;
}

interface MappedGoogleReview {
  reviewId: string;
  reviewerName: string;
  reviewerPhotoUrl: string | null;
  comment: string;
  rating: number;
  locationId: string;
  createTime: Date;
  updateTime: Date;
}

function parseStarRating(starRating?: string): number {
  if (!starRating) return 5;
  return STAR_MAP[starRating] ?? 5;
}

function normalizeResourceId(id: string): string {
  return id.trim().replace(/^(accounts|locations)\//, "");
}

function getConfiguredBranchIds(): string[] {
  return [
    env.BRANCH_ID_1,
    env.BRANCH_ID_2,
    env.BRANCH_ID_3,
    env.BRANCH_ID_4,
    env.BRANCH_ID_5,
  ]
    .map((id) => normalizeResourceId(id))
    .filter(Boolean);
}

function isPlacesApiConfigured(): boolean {
  return Boolean(
    env.GOOGLE_PLACES_API_KEY &&
      (env.GOOGLE_PLACE_IDS.trim() || env.GOOGLE_PLACE_ID.trim() || env.GOOGLE_PLACES_SEARCH_QUERY.trim())
  );
}

function isGbpApiAccessDenied(message?: string): boolean {
  if (!message) return false;
  return /not enabled|is disabled|SERVICE_DISABLED|has not been used|PERMISSION_DENIED|Failed to load/i.test(
    message
  );
}

function formatGbpApiError(body: GbpReviewsListResponse, status: number): string {
  const raw = body.error?.message ?? `Google Business API error (${status})`;

  const isDisabled =
    status === 403 &&
    (/has not been used|is disabled|SERVICE_DISABLED/i.test(raw) ||
      body.error?.details?.some((d) => d.reason === "SERVICE_DISABLED"));

  if (isDisabled) {
    return (
      "Google My Business API (mybusiness.googleapis.com) is restricted and not enabled for your OAuth project. " +
      `Request access via Google's approval form, then enable the API once approved: ${GBP_API_ACCESS_DOCS}`
    );
  }

  return raw;
}

function buildReviewsUrl(accountId: string, branchId: string): URL {
  const url = new URL(
    `${GBP_REVIEWS_BASE}/accounts/${accountId}/locations/${branchId}/reviews`
  );
  url.searchParams.set("pageSize", String(REVIEWS_PAGE_SIZE));
  url.searchParams.set("orderBy", "updateTime desc");
  return url;
}

function extractReviewId(review: GbpReview): string | undefined {
  if (review.reviewId?.trim()) {
    return review.reviewId.trim();
  }

  const name = review.name?.trim();
  if (!name) return undefined;

  const segments = name.split("/");
  const reviewsIndex = segments.lastIndexOf("reviews");
  if (reviewsIndex >= 0 && segments[reviewsIndex + 1]) {
    return segments[reviewsIndex + 1];
  }

  return segments.at(-1);
}

function mapGbpReviewToRecord(review: GbpReview, branchId: string): MappedGoogleReview | null {
  const reviewId = extractReviewId(review);
  if (!reviewId) {
    console.warn(`[GBP Sync] Skipping review with missing reviewId (name=${review.name ?? "unknown"})`);
    return null;
  }

  const createTime = review.createTime ? new Date(review.createTime) : new Date();
  const updateTime = review.updateTime ? new Date(review.updateTime) : createTime;

  return {
    reviewId,
    reviewerName: review.reviewer?.displayName?.trim() || "Google User",
    reviewerPhotoUrl: review.reviewer?.profilePhotoUrl ?? null,
    comment: (review.comment ?? "").trim(),
    rating: parseStarRating(review.starRating),
    locationId: branchId,
    createTime,
    updateTime,
  };
}

function resolvePlacesReviewDate(reviewId: string): Date {
  const legacyMatch = reviewId.match(/google-legacy-[^-]+-(\d{9,})$/);
  if (legacyMatch) {
    return new Date(Number(legacyMatch[1]) * 1000);
  }
  return new Date();
}

function mapPlacesReviewToRecord(review: GooglePlaceReview): MappedGoogleReview {
  const publishedAt = resolvePlacesReviewDate(review.id);
  return {
    reviewId: review.id,
    reviewerName: review.name,
    reviewerPhotoUrl: review.profilePhotoUrl ?? null,
    comment: review.content,
    rating: review.rating,
    locationId: review.placeId,
    createTime: publishedAt,
    updateTime: publishedAt,
  };
}

async function fetchReviewsPage(token: string, url: URL): Promise<GbpReviewsListResponse> {
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = (await response.json().catch(() => ({}))) as GbpReviewsListResponse;

  if (!response.ok) {
    const message = formatGbpApiError(body, response.status);
    if (response.status === 429 || /quota|rate|429/i.test(message)) {
      markGbpRateLimited();
    }
    throw new Error(message);
  }

  return body;
}

async function fetchReviewsForBranch(
  token: string,
  accountId: string,
  branchId: string
): Promise<GbpReview[]> {
  const allReviews: GbpReview[] = [];
  let pageToken: string | undefined;

  do {
    const url = buildReviewsUrl(accountId, branchId);
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const body = await fetchReviewsPage(token, url);
    if (body.reviews?.length) {
      allReviews.push(...body.reviews);
    }

    pageToken = body.nextPageToken;
  } while (pageToken);

  return allReviews;
}

async function upsertGoogleReview(record: MappedGoogleReview): Promise<void> {
  await prisma.googleReview.upsert({
    where: { reviewId: record.reviewId },
    update: {
      reviewerName: record.reviewerName,
      reviewerPhotoUrl: record.reviewerPhotoUrl,
      comment: record.comment,
      rating: record.rating,
      locationId: record.locationId,
      createTime: record.createTime,
      updateTime: record.updateTime,
    },
    create: {
      reviewId: record.reviewId,
      reviewerName: record.reviewerName,
      reviewerPhotoUrl: record.reviewerPhotoUrl,
      comment: record.comment,
      rating: record.rating,
      locationId: record.locationId,
      createTime: record.createTime,
      updateTime: record.updateTime,
    },
  });
}

async function fetchAllBranchesInParallel(
  token: string,
  accountId: string,
  branchIds: string[]
): Promise<BranchFetchResult[]> {
  return Promise.all(
    branchIds.map(async (branchId) => {
      try {
        const reviews = await fetchReviewsForBranch(token, accountId, branchId);
        console.info(`[GBP Sync] Branch ${branchId}: fetched ${reviews.length} review(s).`);
        return { branchId, reviews, success: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(`[GBP Sync] Branch ${branchId} failed: ${error}`);
        return { branchId, reviews: [], success: false, error };
      }
    })
  );
}

async function syncFromGbpApi(): Promise<{
  syncedCount: number;
  locationsSynced: number;
  success: boolean;
  error?: string;
}> {
  let syncedCount = 0;

  const accountId = normalizeResourceId(env.GOOGLE_BUSINESS_ACCOUNT_ID);
  if (!accountId) {
    throw new Error("GOOGLE_BUSINESS_ACCOUNT_ID is not configured in backend/.env.");
  }

  const branchIds = getConfiguredBranchIds();
  if (branchIds.length === 0) {
    console.warn("[GBP Sync] No branch IDs configured (BRANCH_ID_1 through BRANCH_ID_5).");
    return { syncedCount: 0, locationsSynced: 0, success: true };
  }

  const token = await getBusinessAccessToken();
  const branchResults = await fetchAllBranchesInParallel(token, accountId, branchIds);

  const failedBranches = branchResults.filter((result) => !result.success);
  const successfulBranches = branchResults.filter((result) => result.success);

  for (const branchResult of successfulBranches) {
    for (const review of branchResult.reviews) {
      const record = mapGbpReviewToRecord(review, branchResult.branchId);
      if (!record) continue;

      await upsertGoogleReview(record);
      syncedCount++;
    }
  }

  if (failedBranches.length > 0 && successfulBranches.length === 0) {
    const uniqueErrors = [...new Set(failedBranches.map((b) => b.error))];
    return {
      syncedCount,
      locationsSynced: 0,
      success: false,
      error: uniqueErrors.join(" | "),
    };
  }

  if (failedBranches.length > 0) {
    const details = failedBranches.map((b) => b.branchId).join(", ");
    console.warn(`[GBP Sync] Partial GBP success. Failed branches: ${details}`);
  }

  console.info(
    `[GBP Sync] GBP sync complete. Upserted ${syncedCount} review(s) across ${successfulBranches.length}/${branchIds.length} branch(es).`
  );

  return {
    syncedCount,
    locationsSynced: successfulBranches.length,
    success: failedBranches.length === 0,
    error:
      failedBranches.length > 0
        ? `Failed branches: ${failedBranches.map((b) => b.branchId).join(", ")}`
        : undefined,
  };
}

async function syncFromPlacesApi(): Promise<{
  syncedCount: number;
  locationsSynced: number;
  success: boolean;
  error?: string;
}> {
  if (!isPlacesApiConfigured()) {
    throw new Error(
      "Places API fallback is not configured. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_IDS in backend/.env."
    );
  }

  console.info("[GBP Sync] Syncing reviews via Places API fallback...");
  const reviews = await fetchConfiguredPlacesReviews();
  let syncedCount = 0;
  const locationIds = new Set<string>();

  for (const review of reviews) {
    const record = mapPlacesReviewToRecord(review);
    await upsertGoogleReview(record);
    locationIds.add(record.locationId);
    syncedCount++;
  }

  console.info(
    `[GBP Sync] Places fallback complete. Upserted ${syncedCount} review(s) across ${locationIds.size} place(s).`
  );

  return {
    syncedCount,
    locationsSynced: locationIds.size,
    success: true,
  };
}

export async function syncGoogleBusinessReviews(): Promise<{
  syncedCount: number;
  locationsSynced: number;
  success: boolean;
  error?: string;
}> {
  try {
    console.info("[GBP Sync] Starting Google Business Profile reviews sync...");

    if (isBusinessProfileConfigured() && getConfiguredBranchIds().length > 0) {
      const gbpResult = await syncFromGbpApi();
      if (gbpResult.success || gbpResult.syncedCount > 0) {
        return gbpResult;
      }

      if (isGbpApiAccessDenied(gbpResult.error) && isPlacesApiConfigured()) {
        console.warn(
          `[GBP Sync] My Business API is not approved for this project. ` +
            `Falling back to Places API. To unlock full GBP review text, request API access: ${GBP_API_ACCESS_DOCS}`
        );
        return syncFromPlacesApi();
      }

      return gbpResult;
    }

    if (isPlacesApiConfigured()) {
      console.info("[GBP Sync] GBP OAuth/branch IDs not configured — using Places API.");
      return syncFromPlacesApi();
    }

    throw new Error(
      "No review sync source configured. Set GBP OAuth credentials + branch IDs, or GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_IDS."
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[GBP Sync] Synchronization failed:", errorMsg);
    return { syncedCount: 0, locationsSynced: 0, success: false, error: errorMsg };
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startGbpSyncScheduler(): void {
  if (schedulerInterval) {
    console.log("[GBP Scheduler] Sync scheduler is already running.");
    return;
  }

  console.log("[GBP Scheduler] Initializing GBP reviews background sync scheduler (every 12 hours).");

  setTimeout(async () => {
    try {
      console.log("[GBP Scheduler] Running initial startup reviews sync...");
      const res = await syncGoogleBusinessReviews();
      console.log(
        `[GBP Scheduler] Initial startup sync finished. Status: ${
          res.success ? "Success" : "Failed"
        }. Synced ${res.syncedCount} review(s) across ${res.locationsSynced} location(s).`
      );
    } catch (err) {
      console.error("[GBP Scheduler] Initial startup reviews sync failed:", err);
    }
  }, STARTUP_SYNC_DELAY_MS);

  schedulerInterval = setInterval(async () => {
    try {
      console.log("[GBP Scheduler] Running scheduled reviews sync...");
      const res = await syncGoogleBusinessReviews();
      console.log(
        `[GBP Scheduler] Scheduled sync finished. Status: ${
          res.success ? "Success" : "Failed"
        }. Synced ${res.syncedCount} review(s) across ${res.locationsSynced} location(s).`
      );
    } catch (err) {
      console.error("[GBP Scheduler] Scheduled reviews sync failed:", err);
    }
  }, SCHEDULER_INTERVAL_MS);
}
