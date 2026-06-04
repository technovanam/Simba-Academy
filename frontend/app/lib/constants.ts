/** One-time student platform registration fee (INR) */
export const STUDENT_PLATFORM_FEE_INR = 130;

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
