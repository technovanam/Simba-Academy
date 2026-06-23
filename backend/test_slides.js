import { google } from "googleapis";
import { getDriveClient } from "./dist/services/googleDriveService.js";

async function main() {
  try {
    const drive = await getDriveClient();
    const slides = google.slides({ version: "v1", auth: drive.context._options.auth });
    
    const id = "15eIZTCLMjQkSnwWXa5Foj4T-ke_CjBs_zgkvmn90uew";
    
    console.log("Fetching presentation...");
    const presentation = await slides.presentations.get({
      presentationId: id,
    });
    
    console.log("Got presentation with", presentation.data.slides.length, "slides");
    
    if (presentation.data.slides.length > 0) {
      const pageObjectId = presentation.data.slides[0].objectId;
      console.log("Fetching thumbnail for page", pageObjectId);
      const thumb = await slides.presentations.pages.getThumbnail({
        presentationId: id,
        pageObjectId: pageObjectId,
      });
      console.log("Thumbnail URL:", thumb.data.contentUrl);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
