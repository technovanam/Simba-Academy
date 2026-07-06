import { Link } from "react-router";
import { MapPin, Phone, UserRound } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import type { PreschoolBranch } from "../../lib/constants";
import { WHATSAPP_URL } from "../../lib/constants";
import { branchPagePath } from "../../lib/seo";

type BranchCardProps = {
  branch: PreschoolBranch;
  index?: number;
  variant?: "grid" | "featured";
};

export function BranchCard({ branch, index = 0, variant = "grid" }: BranchCardProps) {
  const isFeatured = variant === "featured";

  return (
    <article
      className={`branch-card group flex h-full w-full min-w-0 flex-col self-stretch ${
        isFeatured ? "branch-card--featured" : ""
      }`}
    >
      <div className="branch-card-accent" aria-hidden />

      <div className="branch-card-inner flex min-h-0 flex-1 flex-col">
        <div
          className={`branch-card-body flex min-h-0 flex-1 flex-col ${
            isFeatured ? "p-5 sm:p-7 lg:p-8" : "p-3.5 sm:p-4"
          }`}
        >
          <div className={`branch-card-header flex items-start gap-3 ${isFeatured ? "mb-5" : "mb-3"}`}>
            {!isFeatured && (
              <span className="branch-card-index">{String(index + 1).padStart(2, "0")}</span>
            )}
            <div className="min-w-0 flex-1">
              {isFeatured && (
                <span className="branch-detail-label mb-2 block">Simba Preschool · Salem</span>
              )}
              {isFeatured ? (
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-[#2C1810]">
                  {branch.seoTitle}
                </h1>
              ) : (
                <h3 className="pt-0.5 text-sm font-extrabold leading-snug tracking-tight text-[#2C1810] sm:text-[0.95rem]">
                  <Link to={branchPagePath(branch)} className="hover:text-[#9A6B1A] transition-colors">
                    {branch.name}
                  </Link>
                </h3>
              )}
              {isFeatured && (
                <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-[#5c4030]/90">
                  {branch.locationLabel}
                </p>
              )}
            </div>
          </div>

          {isFeatured && (
            <div className="branch-program-pills mb-5 flex flex-wrap gap-2">
              {["Playgroup", "Pre-KG", "LKG", "UKG"].map((program) => (
                <span key={program} className="branch-program-pill">
                  {program}
                </span>
              ))}
            </div>
          )}

          <div className={`branch-card-details space-y-2 ${isFeatured ? "branch-card-details--featured" : ""}`}>
            {!isFeatured && (
              <a
                href={branch.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="branch-detail-row group/row"
              >
                <span className="branch-detail-icon">
                  <MapPin className="h-3.5 w-3.5 text-[#9A6B1A]" strokeWidth={2.25} />
                </span>
                <span className="min-w-0">
                  <span className="branch-detail-label">Location</span>
                  <span className="branch-detail-value group-hover/row:text-[#9A6B1A]">
                    {branch.locationLabel}
                  </span>
                </span>
              </a>
            )}

            <div className="branch-detail-row">
              <span className="branch-detail-icon">
                <UserRound className="h-3.5 w-3.5 text-[#9A6B1A]" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="branch-detail-label">Branch Head</span>
                <span className="branch-detail-value">{branch.branchHead}</span>
              </span>
            </div>

            <a href={`tel:${branch.phoneTel}`} className="branch-detail-row group/row">
              <span className="branch-detail-icon">
                <Phone className="h-3.5 w-3.5 text-[#9A6B1A]" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="branch-detail-label">Contact</span>
                <span className="branch-detail-value group-hover/row:text-[#9A6B1A]">{branch.phone}</span>
              </span>
            </a>

            {isFeatured && (
              <a
                href={branch.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="branch-detail-row group/row"
              >
                <span className="branch-detail-icon">
                  <MapPin className="h-3.5 w-3.5 text-[#9A6B1A]" strokeWidth={2.25} />
                </span>
                <span className="min-w-0">
                  <span className="branch-detail-label">Directions</span>
                  <span className="branch-detail-value group-hover/row:text-[#9A6B1A]">
                    Open in Google Maps
                  </span>
                </span>
              </a>
            )}
          </div>

          <div
            className={`branch-card-actions mt-auto flex shrink-0 items-center gap-2 border-t border-[#C59124]/15 ${
              isFeatured ? "pt-5 flex-wrap" : "pt-3"
            }`}
          >
            <a
              href={`tel:${branch.phoneTel}`}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E8AF34] font-extrabold text-[#2C1810] shadow-[0_4px_12px_rgba(198,145,36,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#D9A42E] ${
                isFeatured
                  ? "h-11 flex-1 min-w-[8.5rem] px-4 text-sm"
                  : "h-9 flex-1 px-3 text-[11px] sm:text-xs"
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              {isFeatured ? `Call ${branch.phone}` : "Call"}
            </a>

            {isFeatured && (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 flex-1 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-full border border-[#C59124]/25 bg-white/90 px-4 text-sm font-bold text-[#2C1810] transition-all hover:-translate-y-0.5 hover:border-[#C59124]/45"
              >
                WhatsApp
              </a>
            )}

            <a
              href={branch.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${branch.name} on Instagram`}
              className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#E4405F] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E4405F]/40 hover:bg-[#E4405F]/5 ${
                isFeatured ? "h-11 w-11" : "h-9 w-9"
              }`}
            >
              <FaInstagram className="h-4 w-4" />
            </a>

            {isFeatured && (
              <Link
                to="/contact"
                className="inline-flex h-11 w-full sm:w-auto sm:flex-1 items-center justify-center rounded-full border border-[#C59124]/25 bg-white/90 px-4 text-sm font-bold text-[#9A6B1A] transition-all hover:-translate-y-0.5 hover:border-[#E8AF34]/50"
              >
                Admissions enquiry
              </Link>
            )}
          </div>
        </div>

        <div
          className={`branch-card-map-wrap shrink-0 ${
            isFeatured ? "p-3 sm:p-4 lg:p-5 lg:pt-5" : "px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5"
          }`}
        >
          <div className="branch-card-map relative h-full overflow-hidden">
            <iframe
              title={`${branch.name} map`}
              src={branch.mapEmbedUrl}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={branch.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="branch-card-map-link absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#9A6B1A] shadow-md backdrop-blur-sm transition-colors hover:bg-white sm:text-[11px]"
            >
              <MapPin className="h-3 w-3" />
              Maps
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
