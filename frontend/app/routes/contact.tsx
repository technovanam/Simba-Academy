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
            Have questions about admissions, enrollment tracks, or franchise availability? Shoot us a message or talk with our team.
          </p>
        </div>

        {/* Section 1: Contact Form & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Direct Inquiry</h3>
            <p className="text-slate-600 mb-8">
              Fill out this form and our admissions team will get back to you within 24 business hours.
            </p>
            <ContactForm />
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 space-y-8">
            {/* Working Hours Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Working Hours</h4>
              </div>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="font-medium">Weekdays (Mon - Fri)</span>
                  <span className="text-slate-900 font-bold">8:30 AM - 6:30 PM</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="font-medium">Saturdays</span>
                  <span className="text-slate-900 font-bold">9:00 AM - 1:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span className="font-medium">Sundays</span>
                  <span className="text-slate-400 font-bold">Closed</span>
                </li>
              </ul>
            </div>

            {/* Quick Contact Points */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Helpdesk</h4>
              </div>
              <ul className="space-y-5 text-sm text-slate-600">
                <li className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a href="tel:+919884866727" className="font-medium hover:text-blue-600 transition-colors">
                    +91 98848 66727
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <a href="mailto:support@simbapreschool.in" className="font-medium hover:text-blue-600 transition-colors">
                    support@simbapreschool.in
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Salem, Tamil Nadu, India</span>
                </li>
              </ul>
              
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Social Channels</h5>
                <div className="flex gap-3">
                  {Object.entries(SOCIAL_LINKS).map(([name, url]) => {
                    let svgIcon = <span>{name[0].toUpperCase()}</span>;
                    if (name === "facebook") {
                      svgIcon = (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                      );
                    } else if (name === "instagram") {
                      svgIcon = (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                      );
                    } else if (name === "youtube") {
                      svgIcon = (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                          <polygon points="10 15 15 12 10 9"/>
                        </svg>
                      );
                    } else if (name === "whatsapp") {
                      svgIcon = (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.13 2.82a10.85 10.85 0 0 0-15.34 0 10.74 10.74 0 0 0-2.26 12.3L2 22l7.07-1.84a10.8 10.8 0 0 0 12.06-2 10.85 10.85 0 0 0 0-15.34z"/>
                          <path d="M16.14 13a.76.76 0 0 1-.3-.08c-.46-.23-1.15-.57-1.3-.65a.55.55 0 0 0-.48 0c-.17.15-.53.53-.66.68a.33.33 0 0 1-.41.06c-.85-.35-1.52-1-1.86-1.86a.33.33 0 0 1 .06-.41c.15-.13.53-.49.68-.66a.55.55 0 0 0 0-.48c-.08-.15-.42-.84-.65-1.3a.76.76 0 0 1-.08-.3.44.44 0 0 0-.45-.44h-.35a1.18 1.18 0 0 0-1 .59 5.86 5.86 0 0 0-.82 2.65 8 8 0 0 0 2.21 4.7 9 9 0 0 0 4.7 2.21c.91.13 1.83-.15 2.65-.82a1.18 1.18 0 0 0 .59-1v-.35a.44.44 0 0 0-.44-.45z"/>
                        </svg>
                      );
                    }
                    return (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-600 hover:text-blue-600"
                        aria-label={`Visit our ${name}`}
                      >
                        {svgIcon}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Branch Contact Details */}
        <div>
          <SectionHeader 
            badge="Locations" 
            title="Our Branches in Salem" 
            subtitle="Walk into any of our locations to explore the facilities and meet the team."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BRANCHES.map((branch, idx) => {
              const navigateUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
                `Hi Simba Academy, I would like to schedule a tour of your ${branch.name} branch!`
              )}`;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-700 mb-6">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">{branch.name} Branch</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{branch.address}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between items-center text-sm font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> +91 98848 66727
                    </span>
                    <a
                      href={navigateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      Schedule Tour <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Google Maps Integration */}
        <div>
          <SectionHeader 
            badge="Map" 
            title="Interactive Location Map" 
            subtitle="Find your way to the closest Simba Academy campus using Google Maps."
          />
          <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] p-2 shadow-sm overflow-hidden">
            <iframe 
              src="https://maps.google.com/maps?q=Simba%20Preschool%20Salem&output=embed" 
              className="w-full h-[450px] rounded-[2rem] border border-slate-100" 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade" 
              title="Google Map showing Simba Preschool Branches in Salem"
            />
          </div>
        </div>

      </div>
    </PageShell>
  );
}
