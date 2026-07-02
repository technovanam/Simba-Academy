import type { Route } from "./+types/contact";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { BranchesSection } from "../components/BranchesSection";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Simba Academy" },
    { name: "description", content: "Get in touch with Simba Academy. Locate our branches in Salem, view working hours, and contact us directly via form or WhatsApp." },
  ];
}

export default function ContactPage() {
  return (
    <PageShell>
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto space-y-24">
        <div className="text-center max-w-3xl mx-auto pt-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Have questions about admissions, enrollment tracks, or franchise availability? We are here to help.
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
