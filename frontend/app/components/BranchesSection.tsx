import { BranchCard } from "./branch/BranchCard";
import { PRESCHOOL_BRANCHES } from "../lib/constants";

type BranchesSectionProps = {
  showHeader?: boolean;
  embedded?: boolean;
};

export function BranchesSection({ showHeader = true, embedded = false }: BranchesSectionProps) {
  return (
    <section
      className={`branches-section relative overflow-hidden ${
        embedded
          ? "branches-section--embedded py-2"
          : showHeader
            ? "border-t border-[#E8AF34]/15 py-24"
            : "branch-page-grid-section py-14 sm:py-16"
      }`}
    >
      {!embedded && !showHeader && (
        <>
          <picture className="pointer-events-none absolute inset-0 h-full w-full select-none opacity-40">
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
          <div className="branches-section-overlay pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        </>
      )}

      {!embedded && showHeader && (
        <>
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
        </>
      )}

      <div
        className={`relative z-10 mx-auto w-full max-w-[90rem] ${
          embedded ? "px-0" : "px-6 sm:px-12"
        }`}
      >
        {showHeader && (
          <div className="mb-10 text-center sm:mb-14">
            <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#E8AF34]">
              Visit Us
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Our Joyful Campuses
            </h2>
            <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-[#E8AF34]" />
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-slate-600 sm:text-lg">
              Five joyful campuses across Salem — find your nearest Simba Preschool branch.
            </p>
          </div>
        )}

        <div className="branches-row">
          {PRESCHOOL_BRANCHES.map((branch, index) => (
            <BranchCard key={branch.slug} branch={branch} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { BranchCard };
