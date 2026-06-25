import type { Route } from "./+types/contact";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { MapPin, Phone, Mail, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { BRANCHES, SOCIAL_LINKS, WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Simba Academy" },
    { name: "description", content: "Get in touch with Simba Academy. Locate our branches in Salem, view working hours, and contact us directly via form or WhatsApp." },
  ];
}

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <span className="text-sm font-bold uppercase tracking-wider text-blue-600 block mb-3">
        {badge}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <PageShell>
      <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto space-y-24">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto pt-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Have questions about admissions, enrollment tracks, or franchise availability? We are here to help.
          </p>
        </div>

        {/* Section 1: Contact Form */}
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

      {/* 6. Branch Information from Home Page */}
      <section className="min-h-screen flex items-center py-24 relative overflow-hidden">
        {/* Responsive Background Images */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source media="(min-width: 1024px)" srcSet="/Map.webp" />
          <source media="(min-width: 640px)" srcSet="/Map%20Tab.png" />
          <img loading="lazy" decoding="async" 
            src="/Map%20Mobile.png" 
            alt="Simba Academy Branches Map Background" 
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-0 bg-slate-950/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full text-center relative z-10">
          <div className="relative -translate-y-44 sm:-translate-y-16">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest text-[#E8AF34] uppercase block mb-3">Our Network</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Our Branches</h2>
              <div className="w-12 h-1 bg-[#E8AF34] mx-auto mt-4 rounded-full" />
            </div>

            <p className="text-white sm:text-slate-700 font-semibold text-base sm:text-lg max-w-2xl mx-auto mb-10 drop-shadow-sm">
              Simba Academy is expanding! Discover our interactive locations and flagship campuses across the region.
            </p>
          </div>

          {/* Interactive Google Map Box */}
          <div className="w-[65%] sm:w-full max-w-[520px] mx-auto h-[200px] sm:h-[276px] overflow-hidden rounded-none bg-white/95 backdrop-blur-sm shadow-2xl -mt-24 sm:-mt-10 relative z-20">
            <iframe
              title="Simba Academy Salem Branches Map"
              src="https://maps.google.com/maps?q=Simba%20Preschool,%20Salem&t=&z=12&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
