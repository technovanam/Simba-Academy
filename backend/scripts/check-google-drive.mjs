import fs from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

console.log("=== Google Drive configuration check ===\n");
console.log("System time:", new Date().toISOString());
console.log("GOOGLE_DRIVE_FOLDER_ID:", folderId || "(missing)");
console.log("GOOGLE_SERVICE_ACCOUNT_JSON:", keyPath || "(missing)");

if (!keyPath) {
  console.error("\nFAIL: GOOGLE_SERVICE_ACCOUNT_JSON is not set in backend/.env");
  process.exit(1);
}

const resolvedPath = path.isAbsolute(keyPath)
  ? keyPath
  : path.resolve(process.cwd(), keyPath);

let credentials;
try {
  credentials = JSON.parse(await fs.readFile(resolvedPath, "utf-8"));
  console.log("Service account:", credentials.client_email);
} catch (err) {
  console.error("\nFAIL: Could not read service account JSON:", err.message);
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

try {
  await auth.authorize();
  console.log("\nOK: Google authentication succeeded");
} catch (err) {
  console.error("\nFAIL: Google authentication failed");
  console.error(err.message);
  if (String(err.message).includes("invalid_grant")) {
    console.error(
      "\nTip: Sync Windows clock (Settings → Time & language → Sync now), restart backend, or regenerate the service account key."
    );
  }
  process.exit(1);
}

if (!folderId) {
  console.warn("\nWARN: GOOGLE_DRIVE_FOLDER_ID is missing");
  process.exit(0);
}

const drive = google.drive({ version: "v3", auth });
try {
  const folder = await drive.files.get({ fileId: folderId, fields: "id,name,mimeType" });
  console.log("OK: Root folder accessible:", folder.data.name);
} catch (err) {
  console.error("\nFAIL: Cannot access GOOGLE_DRIVE_FOLDER_ID");
  console.error(err.message);
  console.error(
    `\nTip: In Google Drive, share folder ${folderId} with ${credentials.client_email} as Editor.`
  );
  process.exit(1);
}

console.log("\nAll checks passed.");
