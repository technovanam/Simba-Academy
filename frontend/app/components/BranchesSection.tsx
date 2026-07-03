import { MapPin, Phone, UserRound } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { PRESCHOOL_BRANCHES, type PreschoolBranch } from "../lib/constants";

export function BranchesSection() {
  return (
    <section className="branches-section relative py-24 overflow-hidden border-t border-[#E8AF34]/15">
      <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <source media="(min-width: 1024px)" srcSet="/Branches.webp" />
        <source
          media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
          srcSet="/Branches%20Tab%20Potrait.webp"
        />
        <source media="(min-width: 640px)" srcSet="/Braches%20Tab.webp" />
        <img
          src="/Branches%20Mobile.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div className="branches-section-overlay pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 sm:px-12 w-full">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Visit Us</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Preschool Branches</h2>
          <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
          <p className="text-slate-600 font-medium text-base sm:text-lg max-w-2xl mx-auto mt-6">
            Four joyful campuses across Salem — find your nearest Simba Preschool branch.
          </p>
        </div>

        <div className="branches-row">
          {PRESCHOOL_BRANCHES.map((branch, index) => (
            <BranchCard key={branch.name} branch={branch} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BranchCard({ branch, index }: { branch: PreschoolBranch; index: number }) {
  return (
    <article className="branch-card group flex h-full w-full min-w-0 flex-col self-stretch">
      <div className="branch-card-accent" aria-hidden />

      <div className="branch-card-inner flex min-h-0 flex-1 flex-col">
        <div className="branch-card-body flex min-h-0 flex-1 flex-col p-3.5 sm:p-4">
          <div className="branch-card-header mb-3 flex items-start gap-3">
            <span className="branch-card-index">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="pt-0.5 text-sm font-extrabold leading-snug tracking-tight text-[#2C1810] sm:text-[0.95rem]">
              {branch.name}
            </h3>
          </div>

          <div className="branch-card-details space-y-2">
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
                <span className="branch-detail-value group-hover/row:text-[#9A6B1A]">{branch.locationLabel}</span>
              </span>
            </a>

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
          </div>

          <div className="branch-card-actions mt-auto flex shrink-0 items-center gap-2 border-t border-[#C59124]/15 pt-3">
            <a
              href={`tel:${branch.phoneTel}`}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#E8AF34] px-3 text-[11px] font-extrabold text-[#2C1810] shadow-[0_4px_12px_rgba(198,145,36,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#D9A42E] sm:text-xs"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
            <a
              href={branch.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${branch.name} on Instagram`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#E4405F] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#E4405F]/40 hover:bg-[#E4405F]/5"
            >
              <FaInstagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="branch-card-map-wrap shrink-0 px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5">
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
