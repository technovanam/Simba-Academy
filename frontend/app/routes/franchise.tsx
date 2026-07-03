import type { Route } from "./+types/franchise";
import { PageShell } from "../components/PageShell";
import { FranchiseForm } from "../components/FranchiseForm";
import { ArrowRight, Phone } from "lucide-react";
import { WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Franchise Opportunity | Simba Preschool" },
    {
      name: "description",
      content:
        "Become a Simba Preschool franchise partner. Build a meaningful business with proven curriculum, training, and ongoing support.",
    },
  ];
}

export default function FranchisePage() {
  return (
    <PageShell headerVariant="overlay">
      {/* Hero */}
      <section className="relative min-h-screen w-full overflow-hidden bg-[#FDF5E5]">
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 1024px)" srcSet="/Franchise.webp" />
          <source
            media="(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)"
            srcSet="/Franchise%20Tab%20Potrait.webp"
          />
          <source media="(min-width: 640px)" srcSet="/Franchise%20Tab.webp" />
          <img
            src="/Franchise%20Mobile.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-0 flex items-center justify-center px-6 pt-10 text-center sm:px-12 sm:pt-14">
          <h1 className="franchise-hero-title relative z-10 max-w-5xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-[#2C1810] drop-shadow-sm sm:text-5xl lg:text-6xl">
            <span className="md:hidden">
              Become a
              <br />
              Simba
              <br />
              Preschool
              <br />
              Franchise
              <br />
              Partner
            </span>
            <span className="hidden md:contents">
              <span className="block">Become a Simba Preschool</span>
              <span className="block">Franchise Partner</span>
            </span>
          </h1>
        </div>
      </section>

      {/* Section 2 — Content & enquiry */}
      <section className="franchise-enquiry-section relative w-full bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          <div className="franchise-enquiry-grid grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-16">
            {/* Content — top on mobile & tablet portrait */}
            <div className="franchise-content-column order-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8AF34]">Grow With Us</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Start Your Journey Today!
              </h2>
              <div className="mt-4 h-1 w-12 rounded-full bg-[#E8AF34]" />

              <div className="mt-8 space-y-4 text-base font-medium leading-relaxed text-slate-700 sm:text-lg">
                <p>
                  Build a meaningful business and shape young minds. Partner with Simba Preschool—a trusted brand
                  dedicated to nurturing children and inspiring lifelong learning.
                </p>
                <p>
                  Get proven curriculum, training, operations support, marketing help, and ongoing guidance to grow
                  your preschool.
                </p>
                <p>
                  Whether you&apos;re an entrepreneur or educator, join us to make a lasting impact and build a
                  rewarding venture.
                </p>
              </div>

              <p className="mt-6 text-base font-medium leading-relaxed text-slate-700 sm:text-lg">
                Join the Simba family and grow together—one child, one classroom at a time.
              </p>

              <p className="mt-3 text-base font-semibold leading-relaxed text-[#5C4033] sm:text-lg">
                Enquire now to become a Simba Preschool Franchise Partner.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E8AF34] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E8AF34]/30 transition-all hover:-translate-y-0.5 hover:bg-[#d69f2e]"
                >
                  Enquire on WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="tel:+919884866727"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4 text-[#E8AF34]" />
                  Call Us
                </a>
              </div>
            </div>

            {/* Form — below content on mobile & tablet portrait */}
            <aside className="franchise-form-aside order-2 w-full">
              <div className="franchise-form-card rounded-3xl border border-slate-200 bg-[#FFFAF0] p-6 shadow-sm sm:p-7">
                <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Franchise Enquiry</h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Share your details—we&apos;ll get in touch shortly.
                </p>
                <div className="franchise-form-body mt-5">
                  <FranchiseForm singleColumn fillHeight />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
