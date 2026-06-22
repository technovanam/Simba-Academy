import { getDriveClient } from "./src/services/googleDriveService.js";
import { env } from "./src/config/env.js";

async function main() {
  try {
    const drive = await getDriveClient();
    const rootId = env.GOOGLE_DRIVE_FOLDER_ID;
    console.log("Root ID:", rootId);
    
    const res = await drive.files.list({
      q: "trashed = false",
      fields: "files(id, name, mimeType, parents)",
      pageSize: 50,
    });
    
    console.log("Files found:");
    for (const f of res.data.files || []) {
      console.log(`- Name: "${f.name}", MimeType: "${f.mimeType}", ID: "${f.id}", Parents: ${JSON.stringify(f.parents)}`);
    }
  } catch (err) {
    console.error("Error listing files:", err);
  }
}

main();
