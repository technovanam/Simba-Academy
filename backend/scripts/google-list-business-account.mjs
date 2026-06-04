/**
 * One-time helper: print GOOGLE_BUSINESS_ACCOUNT_ID for backend/.env
 * Run when NOT rate-limited: npm run google:list-business-account
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN ?? "",
    grant_type: "refresh_token",
  }),
});
const tokenData = await tokenRes.json();
if (!tokenData.access_token) {
  console.error("OAuth failed:", tokenData.error_description ?? tokenData.error);
  process.exit(1);
}

const res = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
  headers: { Authorization: `Bearer ${tokenData.access_token}` },
});
const data = await res.json();
if (!res.ok) {
  console.error("Accounts API:", data.error?.message ?? res.status);
  console.error("If rate-limited, wait 30+ minutes, then run this script once (do not click Sync repeatedly).");
  process.exit(1);
}

const name = data.accounts?.[0]?.name;
if (!name) {
  console.error("No Google Business accounts found for this login.");
  process.exit(1);
}

const accountId = name.replace(/^accounts\//, "");
const statePath = path.resolve("data/google-business-profile-state.json");
const prev = fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, "utf8"))
  : {};
fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.writeFileSync(
  statePath,
  JSON.stringify({ ...prev, accountId }, null, 2),
  "utf8"
);
console.log("\nSaved account id to data/google-business-profile-state.json");
console.log("\nAdd to backend/.env:\n");
console.log(`GOOGLE_BUSINESS_ACCOUNT_ID=${accountId}\n`);
