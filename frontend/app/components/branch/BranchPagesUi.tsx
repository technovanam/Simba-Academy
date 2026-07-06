import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

export function BranchesBackdrop() {
  return (
    <div className="branch-page-canvas-bg" aria-hidden>
      <picture className="branch-page-canvas-bg__picture">
        <source media="(min-width: 1024px)" srcSet="/Branches.webp" />
        <source
          media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
          srcSet="/Branches%20Tab%20Potrait.webp"
        />
        <source media="(min-width: 640px)" srcSet="/Braches%20Tab.webp" />
        <img
          src="/Branches%20Mobile.webp"
          alt=""
          className="branch-page-canvas-bg__image"
          loading="eager"
          decoding="async"
        />
      </picture>
      <div className="branch-page-canvas-overlay" />
    </div>
  );
}

/** Full-page branches background — hero + content share one canvas */
export function BranchPageCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="branch-page-canvas relative isolate">
      <BranchesBackdrop />
      <div className="branch-page-content relative z-[1]">{children}</div>
    </div>
  );
}

export function BranchBreadcrumb({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-[#C59124]/20 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur-sm"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#C59124]" />}
            {item.to && !isLast ? (
              <Link to={item.to} className="font-semibold transition-colors hover:text-[#9A6B1A]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-bold text-[#2C1810]" : "font-semibold"}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function BranchPageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumb: ReactNode;
}) {
  return (
    <header className="branch-page-hero mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 text-center sm:px-12 sm:pt-28 lg:pt-32">
      <div className="mb-6">{breadcrumb}</div>
      <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#9A6B1A]">{eyebrow}</span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <div className="mt-4 h-1 w-12 rounded-full bg-[#E8AF34]" />
      <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
        {description}
      </p>
    </header>
  );
}
