import type { PreschoolBranch } from "./constants";
import { PRESCHOOL_BRANCHES } from "./constants";

export const SITE_NAME = "Simba Preschool";
export const SITE_ORIGIN = "https://www.simbapreschool.in";
export const DEFAULT_OG_IMAGE = "/Hero%20Section.webp";
export const DEFAULT_OG_IMAGE_ALT =
  "Simba Preschool — Joyful Early Education in Salem, Tamil Nadu";

const BRANCH_KEYWORDS = PRESCHOOL_BRANCHES.flatMap((branch) => [
  branch.areaName,
  `Simba Preschool ${branch.areaName}`,
  ...(branch.searchAliases ?? []),
  ...(branch.searchAliases?.map((alias) => `Simba Preschool ${alias}`) ?? []),
]);

export const GLOBAL_KEYWORDS = [
  "Simba Preschool",
  "Simba Preschool Salem",
  "preschool Salem",
  "best preschool Salem",
  "playgroup Salem",
  "Pre-KG Salem",
  "LKG UKG Salem",
  "nursery school Salem",
  "Tamil Nadu preschool",
  ...BRANCH_KEYWORDS,
];

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export function buildPageMeta(input: PageSeoInput) {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image ?? DEFAULT_OG_IMAGE);
  const keywords = [...new Set([...(input.keywords ?? []), ...GLOBAL_KEYWORDS.slice(0, 12)])];

  return [
    { title: input.title },
    { name: "description", content: input.description },
    { name: "keywords", content: keywords.join(", ") },
    { name: "author", content: SITE_NAME },
    { name: "robots", content: input.noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large" },
    { name: "googlebot", content: input.noIndex ? "noindex, nofollow" : "index, follow" },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: input.imageAlt ?? DEFAULT_OG_IMAGE_ALT },
    { property: "og:locale", content: "en_IN" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "geo.region", content: "IN-TN" },
    { name: "geo.placename", content: "Salem, Tamil Nadu, India" },
  ];
}

export function getBranchBySlug(slug: string): PreschoolBranch | undefined {
  return PRESCHOOL_BRANCHES.find((branch) => branch.slug === slug);
}

export function branchPagePath(branch: PreschoolBranch): string {
  return `/branches/${branch.slug}`;
}

function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    alternateName: ["Simba Preschool Salem", "Simba Pre School Salem"],
    url: SITE_ORIGIN,
    logo: absoluteUrl("/logos/simba-preschool-logo.webp"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      "Simba Preschool offers Joyful Playgroup, Pre-KG, LKG, and UKG programs across five campuses in Salem, Tamil Nadu.",
    email: "contact@simbapreschool.in",
    telephone: "+919884866727",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Salem",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    areaServed: {
      "@type": "City",
      name: "Salem",
      containedInPlace: { "@type": "State", name: "Tamil Nadu" },
    },
    sameAs: PRESCHOOL_BRANCHES.map((branch) => branch.instagramUrl),
  };
}

function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    url: SITE_ORIGIN,
    name: SITE_NAME,
    description: "Official website of Simba Preschool — early childhood education in Salem.",
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    inLanguage: "en-IN",
  };
}

export function localBusinessJsonLd(branch: PreschoolBranch) {
  const alternateNames = [
    `Simba Preschool ${branch.areaName}`,
    ...(branch.searchAliases?.map((alias) => `Simba Preschool ${alias}`) ?? []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Preschool",
    "@id": `${absoluteUrl(branchPagePath(branch))}#localbusiness`,
    name: branch.seoTitle,
    alternateName: alternateNames,
    url: absoluteUrl(branchPagePath(branch)),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    telephone: branch.phoneTel,
    description: branch.seoDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.streetAddress,
      addressLocality: "Salem",
      addressRegion: "Tamil Nadu",
      postalCode: "636001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.geo.latitude,
      longitude: branch.geo.longitude,
    },
    hasMap: branch.mapsUrl,
    parentOrganization: { "@id": `${SITE_ORIGIN}/#organization` },
    areaServed: branch.locationLabel,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function homePageJsonLd() {
  return [
    organizationJsonLd(),
    websiteJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Simba Preschool Salem branches",
      itemListElement: PRESCHOOL_BRANCHES.map((branch, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: branch.seoTitle,
        url: absoluteUrl(branchPagePath(branch)),
      })),
    },
    ...PRESCHOOL_BRANCHES.map((branch) => localBusinessJsonLd(branch)),
  ];
}

export function aboutPageJsonLd() {
  return [
    organizationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  ];
}

export function franchisePageJsonLd() {
  return [
    organizationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Franchise", path: "/franchise" },
    ]),
  ];
}

export function contactPageJsonLd() {
  return [
    organizationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
    ...PRESCHOOL_BRANCHES.map((branch) => localBusinessJsonLd(branch)),
  ];
}

export function branchPageJsonLd(branch: PreschoolBranch) {
  return [
    organizationJsonLd(),
    localBusinessJsonLd(branch),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Branches", path: "/branches" },
      { name: branch.seoTitle, path: branchPagePath(branch) },
    ]),
  ];
}

export function branchesIndexJsonLd() {
  return [
    organizationJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Branches", path: "/branches" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Simba Preschool branches in Salem",
      itemListElement: PRESCHOOL_BRANCHES.map((branch, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: branch.seoTitle,
        url: absoluteUrl(branchPagePath(branch)),
      })),
    },
  ];
}

export const HOME_SEO = {
  title: "Simba Preschool Salem | Playgroup, Pre-KG, LKG & UKG",
  description:
    "Simba Preschool Salem — trusted early education with Playgroup, Pre-KG, LKG & UKG at Ramakrishna Park, Ponnamapet, Steel Plant, Kondalampatti & Ammapet. Admissions open.",
  path: "/",
  keywords: [
    "Simba Preschool Salem",
    "preschool near me Salem",
    "admissions Simba Preschool",
    "Playgroup Pre-KG LKG UKG Salem",
  ],
};

export const ABOUT_SEO = {
  title: "About Simba Preschool Salem | Mission, Vision & Values",
  description:
    "Learn about Simba Preschool Salem — our founder-led mission, Joyful Learning Philosophy, and nurturing environment for Playgroup through UKG across five Salem campuses.",
  path: "/about",
  keywords: ["about Simba Preschool", "Simba Preschool mission", "preschool values Salem"],
};

export const FRANCHISE_SEO = {
  title: "Simba Preschool Franchise | Partner With Us in Tamil Nadu",
  description:
    "Start a Simba Preschool franchise in Tamil Nadu. Proven curriculum, teacher training, marketing support, and a trusted preschool brand. Enquire about franchise opportunities.",
  path: "/franchise",
  keywords: [
    "Simba Preschool franchise",
    "preschool franchise Tamil Nadu",
    "franchise opportunity Salem",
  ],
};

export const CONTACT_SEO = {
  title: "Contact Simba Preschool | Branches, Phone & Admissions",
  description:
    "Contact Simba Preschool — Ramakrishna Park, Ponnamapet (Poonampet), Steel Plant, Kondalampatti & Ammapet. Call branch heads, WhatsApp, or send an admissions enquiry.",
  path: "/contact",
  keywords: [
    "contact Simba Preschool",
    "Simba Preschool phone number",
    "Simba Preschool Ponnamapet",
    "Simba Preschool Poonampet",
    "Simba Preschool Ammapet",
  ],
};

export const BRANCHES_INDEX_SEO = {
  title: "Simba Preschool Branches in Salem | All Campus Locations",
  description:
    "Find every Simba Preschool branch in Salem — Ramakrishna Park, Ponnamapet, Steel Plant, Kondalampatti & Ammapet. Addresses, maps, phone numbers & branch heads.",
  path: "/branches",
};
