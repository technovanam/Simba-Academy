import fs from "node:fs";
import path from "node:path";

export interface GoogleBusinessProfileState {
  accountId?: string;
  /** ISO timestamp — do not call Google until after this time */
  rateLimitedUntil?: string;
}

const STATE_PATH = path.resolve("data/google-business-profile-state.json");

export function loadGoogleBusinessProfileState(): GoogleBusinessProfileState {
  try {
    if (!fs.existsSync(STATE_PATH)) return {};
    const data = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as GoogleBusinessProfileState;
    return data ?? {};
  } catch {
    return {};
  }
}

export function saveGoogleBusinessProfileState(patch: Partial<GoogleBusinessProfileState>): void {
  const dir = path.dirname(STATE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const next = { ...loadGoogleBusinessProfileState(), ...patch };
  fs.writeFileSync(STATE_PATH, JSON.stringify(next, null, 2), "utf8");
}

export function persistGbpAccountId(accountId: string): void {
  const id = accountId.replace(/^accounts\//, "").trim();
  if (!id) return;
  saveGoogleBusinessProfileState({ accountId: id });
}

export function getPersistedGbpAccountId(): string | undefined {
  const id = loadGoogleBusinessProfileState().accountId?.trim();
  return id || undefined;
}

export function getPersistedRateLimitUntilMs(): number {
  const iso = loadGoogleBusinessProfileState().rateLimitedUntil;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function persistGbpRateLimitUntil(untilMs: number): void {
  if (untilMs <= Date.now()) {
    const state = loadGoogleBusinessProfileState();
    if (state.rateLimitedUntil) {
      const { rateLimitedUntil: _, ...rest } = state;
      fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
      fs.writeFileSync(STATE_PATH, JSON.stringify(rest, null, 2), "utf8");
    }
    return;
  }
  saveGoogleBusinessProfileState({ rateLimitedUntil: new Date(untilMs).toISOString() });
}
