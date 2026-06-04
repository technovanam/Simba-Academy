/**
 * Print the Google Business OAuth URL (open while logged in as business owner).
 * After approving, your browser redirects to the backend callback with the refresh token.
 */
import "dotenv/config";

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const redirect =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ??
  "http://localhost:3001/api/admin/google-reviews/oauth-callback";

if (!clientId) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env first.");
  process.exit(1);
}

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirect,
  response_type: "code",
  scope: "https://www.googleapis.com/auth/business.manage",
  access_type: "offline",
  prompt: "consent",
});

console.log("\n1. Start the backend on port 3001");
console.log("2. Open this URL and sign in with the Google account that manages Simba Preschool:\n");
console.log(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
console.log("\n3. After redirect, copy GOOGLE_BUSINESS_REFRESH_TOKEN into backend/.env");
console.log(`   Redirect URI must be: ${redirect}\n`);
