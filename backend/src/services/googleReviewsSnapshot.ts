import fs from "node:fs";
import path from "node:path";
import type { GoogleReviewsResult } from "./googleReviewTypes.js";

export interface GoogleReviewsSnapshot extends GoogleReviewsResult {
  syncedAt: string;
}

const SNAPSHOT_PATH = path.resolve("data/google-reviews-snapshot.json");

export function loadGoogleReviewsSnapshot(): GoogleReviewsSnapshot | null {
  try {
    if (!fs.existsSync(SNAPSHOT_PATH)) return null;
    const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    const data = JSON.parse(raw) as GoogleReviewsSnapshot;
    if (!data.syncedAt || !Array.isArray(data.reviews)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGoogleReviewsSnapshot(result: GoogleReviewsResult): GoogleReviewsSnapshot {
  const dir = path.dirname(SNAPSHOT_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const snapshot: GoogleReviewsSnapshot = {
    ...result,
    syncedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}

export function snapshotAgeMinutes(snapshot: GoogleReviewsSnapshot): number {
  return Math.floor((Date.now() - new Date(snapshot.syncedAt).getTime()) / 60_000);
}
