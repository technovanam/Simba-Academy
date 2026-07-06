/** One-time student platform registration fee (INR) */
export const STUDENT_PLATFORM_FEE_INR = 120;

/** Live Zoho Payments checkout widget */
export const PAYMENTS_LIVE_ZOHO = import.meta.env.VITE_PAYMENTS_LIVE_ZOHO === "true";

/** Demo checkout modal — only when VITE_PAYMENTS_MOCK=true (and live Zoho is off) */
export const PAYMENTS_MOCK_MODE =
  import.meta.env.VITE_PAYMENTS_MOCK === "true" && !PAYMENTS_LIVE_ZOHO;

/** Student registration + checkout payment gate */
export const PAYMENTS_ENABLED = PAYMENTS_LIVE_ZOHO || PAYMENTS_MOCK_MODE;

/** Class levels for student signup & story book browsing */
export const STUDENT_CLASS_LEVELS = ["Playgroup", "Pre-KG", "LKG", "UKG"] as const;
export type StudentClassLevel = (typeof STUDENT_CLASS_LEVELS)[number];

export const STUDENT_CLASS_OPTIONS: { id: StudentClassLevel; label: string }[] = [
  { id: "Playgroup", label: "Playgroup" },
  { id: "Pre-KG", label: "Pre-KG" },
  { id: "LKG", label: "LKG" },
  { id: "UKG", label: "UKG" },
];

export const STORY_BOOK_CLASS_FILTER_OPTIONS: { id: StudentClassLevel | "ALL"; label: string }[] = [
  { id: "ALL", label: "All classes" },
  ...STUDENT_CLASS_OPTIONS,
];

/** Accepted file extensions for story book uploads */
export const STORY_BOOK_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";

export function isValidStoryBookFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  );
}

export const WHATSAPP_NUMBER = "919884866727";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const SIMBA_LOGO_SRC = "/logos/simba-preschool-logo.webp";
export const APPLE_TOUCH_ICON_SRC = "/favicons/apple-touch-icon.webp";

export type PreschoolBranch = {
  slug: string;
  areaName: string;
  searchAliases?: string[];
  seoTitle: string;
  seoDescription: string;
  streetAddress: string;
  geo: { latitude: number; longitude: number };
  name: string;
  locationLabel: string;
  mapsUrl: string;
  mapEmbedUrl: string;
  instagramUrl: string;
  branchHead: string;
  phone: string;
  phoneTel: string;
};

export const PRESCHOOL_BRANCHES: PreschoolBranch[] = [
  {
    slug: "ramakrishna-park",
    areaName: "Ramakrishna Park",
    searchAliases: ["Near Cluny", "Cluny Salem"],
    seoTitle: "Simba Preschool Ramakrishna Park",
    seoDescription:
      "Simba Preschool Ramakrishna Park (Near Cluny), Salem — Playgroup, Pre-KG, LKG & UKG. Joyful Early Learning Campus led by Ms. Nirmala. Call 98848 66727.",
    streetAddress: "Near Cluny, Ramakrishna Park",
    geo: { latitude: 11.6647, longitude: 78.146 },
    name: "Simba Preschool - Near Cluny (Ramakrishna Park),Salem",
    locationLabel: "Near Cluny, Ramakrishna Park, Salem",
    mapsUrl: "https://maps.app.goo.gl/u9jnVog3h76FLuX5A",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Simba+Preschool+Ramakrishna+Park+Salem&z=16&ie=UTF8&iwloc=&output=embed",
    instagramUrl:
      "https://www.instagram.com/simbapreschool_ramakrishnapark?igsh=ZWdoY3UyMmUxMWY0",
    branchHead: "Ms. Nirmala",
    phone: "98848 66727",
    phoneTel: "+919884866727",
  },
  {
    slug: "ponnamapet",
    areaName: "Ponnamapet",
    searchAliases: ["Poonampet", "Poonamapet"],
    seoTitle: "Simba Preschool Ponnamapet",
    seoDescription:
      "Simba Preschool Ponnamapet (also searched as Poonampet), Salem — Playgroup, Pre-KG, LKG & UKG admissions. Campus led by Ms. Nirmala. Call 98848 66727.",
    streetAddress: "Ponnamapet",
    geo: { latitude: 11.652, longitude: 78.159 },
    name: "Simba Preschool - Ponnamapet, Salem",
    locationLabel: "Ponnamapet, Salem",
    mapsUrl: "https://maps.app.goo.gl/bQuZnVqQ83GDAkpp8",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Simba+Preschool+Ponnamapet+Salem&z=16&ie=UTF8&iwloc=&output=embed",
    instagramUrl:
      "https://www.instagram.com/simba_preschool_ponnamapet?igsh=MWo2M3VsMTBjbDN3OA==",
    branchHead: "Ms. Nirmala",
    phone: "98848 66727",
    phoneTel: "+919884866727",
  },
  {
    slug: "steel-plant",
    areaName: "Steel Plant",
    searchAliases: ["Steel Plant Road", "SAIL Salem"],
    seoTitle: "Simba Preschool Steel Plant",
    seoDescription:
      "Simba Preschool Steel Plant Road, Salem — nurturing Playgroup, Pre-KG, LKG & UKG programs. Campus led by Ms. Deepika. Call 97917 97080.",
    streetAddress: "Steel Plant Road",
    geo: { latitude: 11.628, longitude: 78.082 },
    name: "Simba Preschool - Steel Plant RD, Salem",
    locationLabel: "Steel Plant, Salem",
    mapsUrl: "https://maps.app.goo.gl/PesENfcJFHetqpoaA",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Simba+Preschool+Steel+Plant+Salem&z=16&ie=UTF8&iwloc=&output=embed",
    instagramUrl:
      "https://www.instagram.com/simba_preschool_steelplant?igsh=MTd5c29xMnpndnp4NQ==",
    branchHead: "Ms. Deepika",
    phone: "97917 97080",
    phoneTel: "+919791797080",
  },
  {
    slug: "kondalampatti",
    areaName: "Kondalampatti",
    searchAliases: ["Kondalmpatti", "Sowdeshwari College"],
    seoTitle: "Simba Preschool Kondalampatti",
    seoDescription:
      "Simba Preschool Kondalampatti, Salem (Opp. Sowdeshwari College) — Playgroup, Pre-KG, LKG & UKG. Campus led by Ms. Jothi. Call 86670 47306.",
    streetAddress: "Kondalampatti, Opp. Sowdeshwari College",
    geo: { latitude: 11.686, longitude: 78.098 },
    name: "Simba Preschool - Kondalmpatti, Salem",
    locationLabel: "Kondalampatti, Opp. Sowdeshwari College, Salem",
    mapsUrl: "https://maps.app.goo.gl/7FymeBBh9XFXmYTs8",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Simba+Preschool+Kondalampatti+Salem&z=16&ie=UTF8&iwloc=&output=embed",
    instagramUrl:
      "https://www.instagram.com/simbapreschool_kondalampatti?igsh=MW96dTZyYnl2ejRhaw==",
    branchHead: "Ms. Jothi",
    phone: "86670 47306",
    phoneTel: "+918667047306",
  },
  {
    slug: "ammapet",
    areaName: "Ammapet",
    searchAliases: ["Ammapet Salem"],
    seoTitle: "Simba Preschool Ammapet",
    seoDescription:
      "Simba Preschool Ammapet, Salem — trusted Playgroup, Pre-KG, LKG & UKG early education. Campus led by Ms. Indhumathi. Call 86104 84363.",
    streetAddress: "Ammapet",
    geo: { latitude: 11.678, longitude: 78.128 },
    name: "Simba Preschool - Ammapet, Salem",
    locationLabel: "Ammapet, Salem",
    mapsUrl: "https://maps.app.goo.gl/FTYJ7yJ86NkXVttw7?g_st=aw",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Simba+Preschool+Ammapet+Salem&z=16&ie=UTF8&iwloc=&output=embed",
    instagramUrl:
      "https://www.instagram.com/simba_preschool_ammapet?igsh=OHY1dGJnOXZtY3Nm",
    branchHead: "Ms. Indhumathi",
    phone: "86104 84363",
    phoneTel: "+918610484363",
  },
];

export const HEADER_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Franchise", to: "/franchise" },
  { label: "Contact", to: "/contact" },
] as const;
