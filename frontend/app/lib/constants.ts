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

/** Jungle-themed auth backgrounds — mobile vs laptop/desktop */
export const STUDENT_AUTH_BG_MOBILE = "/student-auth-bg-mobile.png";
export const STUDENT_AUTH_BG_DESKTOP = "/student-auth-bg-desktop.png";

export const WHATSAPP_NUMBER = "919884866727";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const SIMBA_LOGO_SRC = "/logos/simba-preschool-logo.png";
export const SIMBA_LOGO_TRANSPARENT_SRC = "/logos/simba-logo-transparent.png";
export const APPLE_TOUCH_ICON_SRC = "/favicons/apple-touch-icon.png";

export const BRANCHES = [
  { name: "Ramakrishna Park", address: "Near Ramakrishna Park, Salem" },
  { name: "Ponnamapet", address: "Ponnamapet, Salem" },
  { name: "Kondalampatti", address: "Kondalampatti, Salem" },
  { name: "Steel Plant", address: "Steel Plant Area, Salem" },
  { name: "Ammapet", address: "81, Anna Street, Ammapet Road, Salem - 636001" },
];

export const COURSE_LEVELS = [
  "Daycare",
  "Playgroup",
  "Pre-KG",
  "LKG",
  "UKG",
  "Phonics",
  "Handwriting",
  "Spoken English",
] as const;

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Franchise", to: "/franchise" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export const HEADER_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Franchise", to: "/franchise" },
  { label: "Contact", to: "/contact" },
] as const;

export const FOOTER_QUICK_LINKS = NAV_LINKS;

export const SOCIAL_LINKS = {
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  whatsapp: WHATSAPP_URL,
};
