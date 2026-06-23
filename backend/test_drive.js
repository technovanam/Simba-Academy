import { google } from "googleapis";
import { getDriveClient } from "./dist/services/googleDriveService.js";

async function main() {
  try {
    const drive = await getDriveClient();
    const id = "15eIZTCLMjQkSnwWXa5Foj4T-ke_CjBs_zgkvmn90uew";
    const resFile = await drive.files.get({
      fileId: id,
      fields: "*",
    });
    console.log("Metadata:", JSON.stringify(resFile.data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
