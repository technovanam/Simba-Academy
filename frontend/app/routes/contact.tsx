import type { Route } from "./+types/contact";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { BRANCHES, SOCIAL_LINKS } from "../lib/constants";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Simba Academy Preschool" },
    { name: "description", content: "Contact Simba Academy for admissions, franchise inquiries, and branch information." },
  ];
}

export default function ContactPage() {
  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-[#3E2723] mb-4">Contact Us</h1>
          <p className="text-[#5D4037] font-semibold">We&apos;d love to hear from you. Reach out for admissions or franchise opportunities.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          <ContactForm />

          <div className="space-y-6">
            <div className="glass-panel rounded-lg p-6">
              <h2 className="font-sans text-xl font-extrabold mb-4">Get In Touch</h2>
              <ul className="space-y-4 text-sm font-semibold text-[#5D4037]">
                <li className="flex gap-3"><MapPin className="w-5 h-5 text-[#FF9F1C] shrink-0" /> 81, Anna Street, Ammapet Road, Salem - 636001</li>
                <li className="flex gap-3"><Phone className="w-5 h-5 text-[#FF9F1C] shrink-0" /> <a href="tel:+919884866727" className="hover:text-[#3E2723]">+91 98848 66727</a></li>
                <li className="flex gap-3"><Mail className="w-5 h-5 text-[#FF9F1C] shrink-0" /> <a href="mailto:info@simbaacademy.com" className="hover:text-[#3E2723]">info@simbaacademy.com</a></li>
                <li className="flex gap-3"><Clock className="w-5 h-5 text-[#FF9F1C] shrink-0" /> Mon - Sat: 8:00 AM - 6:00 PM</li>
              </ul>
            </div>

            <div className="glass-panel rounded-lg p-6">
              <h2 className="font-sans text-xl font-extrabold mb-4">Our Branches</h2>
              <ul className="space-y-3">
                {BRANCHES.map((b) => (
                  <li key={b.name} className="text-sm font-semibold text-[#5D4037]">
                    <span className="font-extrabold text-[#3E2723]">{b.name}</span> — {b.address}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-lg overflow-hidden h-64">
              <iframe
                title="Simba Academy Location"
                src="https://maps.google.com/maps?q=Simba+Academy+Salem+Ammapet&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>

            <div className="flex gap-4">
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#25D366] hover:underline">WhatsApp</a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#5D4037] hover:underline">Facebook</a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#5D4037] hover:underline">Instagram</a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
