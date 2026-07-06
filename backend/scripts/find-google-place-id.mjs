/**
 * Find Google Place ID for your business (Places API New).
 * Usage: node scripts/find-google-place-id.mjs "Simba Preschool Salem"
 */
import "dotenv/config";

const query = process.argv.slice(2).join(" ") || "Simba Preschool Salem Ammapet";
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

async function main() {
  if (!apiKey) {
    console.error("Set GOOGLE_PLACES_API_KEY in backend/.env first.");
    console.error("\nSetup:");
    console.error("1. Google Cloud Console → APIs & Services → Enable 'Places API (New)'");
    console.error("2. Create API key → restrict to Places API (New)");
    console.error("3. Add GOOGLE_PLACES_API_KEY=... to backend/.env");
    process.exit(1);
  }

  console.log(`Searching: "${query}"\n`);

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(20, parseInt(process.env.GOOGLE_PLACES_SEARCH_MAX || "20", 10)),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Search failed:", data.error?.message ?? res.status);
    process.exit(1);
  }

  const places = data.places ?? [];
  if (places.length === 0) {
    console.log("No places found. Try a more specific search string.");
    process.exit(1);
  }

  const ids = [];
  for (const p of places) {
    const id = (p.id ?? "").replace(/^places\//, "");
    ids.push(id);
    console.log(`Name:    ${p.displayName?.text ?? "—"}`);
    console.log(`Address: ${p.formattedAddress ?? "—"}`);
    console.log(`Place ID: ${id}`);
    console.log("—");
  }
  if (ids.length > 0) {
    console.log("\nPaste into backend/.env (all locations):\n");
    console.log(`GOOGLE_PLACE_IDS=${ids.join(",")}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
