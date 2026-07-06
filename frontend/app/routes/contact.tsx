import type { Route } from "./+types/contact";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { BranchesSection } from "../components/BranchesSection";
import { JsonLd } from "../components/JsonLd";
import { CONTACT_SEO, buildPageMeta, contactPageJsonLd } from "../lib/seo";

export function meta({}: Route.MetaArgs) {
  return buildPageMeta(CONTACT_SEO);
}

export default function ContactPage() {
  return (
    <PageShell>
      <JsonLd data={contactPageJsonLd()} />
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto space-y-24">
        <div className="text-center max-w-3xl mx-auto pt-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Contact Simba Preschool
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Have questions about admissions, Playgroup, Pre-KG, LKG, or UKG enrollment? Reach Simba
            Preschool at Ramakrishna Park, Ponnamapet (Poonampet), Steel Plant, Kondalampatti, or
            Ammapet — by form, phone, or WhatsApp.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Direct Inquiry</h3>
            <p className="text-slate-600 mb-8">
              Fill out the form below and our admissions team will get back to you shortly.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>

      <BranchesSection />
    </PageShell>
  );
}
