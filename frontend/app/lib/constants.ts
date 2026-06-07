/** One-time student platform registration fee (INR) */
export const STUDENT_PLATFORM_FEE_INR = 120;

/** Set true when Zoho Payments is verified and live. */
export const PAYMENTS_ENABLED = true;

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

export const STORY_BOOK_FILE_TYPES = ["PDF", "PPT"] as const;
export type StoryBookFileType = (typeof STORY_BOOK_FILE_TYPES)[number];

export const STORY_BOOK_FILE_TYPE_OPTIONS: { id: StoryBookFileType; label: string }[] = [
  { id: "PDF", label: "PDF document" },
  { id: "PPT", label: "PPT presentation" },
];

export function storyBookAcceptForType(type: StoryBookFileType): string {
  return type === "PDF" ? ".pdf" : ".ppt,.pptx";
}

export function storyBookFileMatchesType(file: File, type: StoryBookFileType): boolean {
  const name = file.name.toLowerCase();
  return type === "PDF" ? name.endsWith(".pdf") : name.endsWith(".ppt") || name.endsWith(".pptx");
}

/** Jungle-themed auth backgrounds — mobile vs laptop/desktop */
export const STUDENT_AUTH_BG_MOBILE = "/student-auth-bg-mobile.png";
export const STUDENT_AUTH_BG_DESKTOP = "/student-auth-bg-desktop.png";

export const WHATSAPP_NUMBER = "919884866727";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

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
  { label: "Courses", to: "/courses" },
  { label: "Franchise", to: "/franchise" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export const FOOTER_QUICK_LINKS = NAV_LINKS;

export const SOCIAL_LINKS = {
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  whatsapp: WHATSAPP_URL,
};
