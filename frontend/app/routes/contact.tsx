import type { Route } from "./+types/contact";
import { PageShell } from "../components/PageShell";
import { ContactForm } from "../components/ContactForm";
import { MapPin, Phone, Mail, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { BRANCHES, SOCIAL_LINKS, WHATSAPP_URL } from "../lib/constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Simba Academy" },
    { name: "description", content: "Get in touch with Simba Academy. Locate our branches in Salem, view working hours, and contact our intake rangers directly via form or WhatsApp." },
  ];
}

// Playful Wooden Header Component
function WoodenHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
      <div className="flex flex-col items-center select-none animate-rope-swing mb-4">
        {/* Hanging Rope Strands */}
        <div className="flex justify-between w-36 h-6 px-6 pointer-events-none">
          <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
          <div className="w-[3px] h-full bg-[#8b4513]/40 border-l-[1.5px] border-[#5c2c0a]/60 border-dashed" />
        </div>
        {/* Wooden Sign Board */}
        <div className="wood-board-sign wood-board-nails px-8 py-3.5 text-center text-white border-2 border-[#5c2c0a]">
          <span className="font-sans font-black text-[10px] uppercase tracking-widest text-[#FFD275] block drop-shadow-sm">
            {badge}
          </span>
          <h3 className="text-xl sm:text-2.5xl font-fredoka font-black tracking-tight text-white mt-1">
            {title}
          </h3>
        </div>
      </div>
      {subtitle && (
        <p className="text-[#5D4037] text-sm sm:text-base font-semibold max-w-xl mt-3 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function ContactPage() {
  return (
    <PageShell>
      <div className="py-16 px-6 sm:px-12 max-w-7xl mx-auto space-y-24">
        
        {/* Header */}
        <WoodenHeader 
          badge="Get in Touch" 
          title="Contact Our Intake Rangers" 
          subtitle="Have questions about admissions, enrollment tracks, or franchise availability? Shoot us a message or talk with a ranger."
        />

        {/* Section 1: Contact Form & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-2.5xl font-black text-[#3E2723] tracking-tight">Direct Inquiry</h3>
            <p className="text-[#5D4037]/90 text-sm font-semibold">
              Fill out this form and our intake coordinators will get back to you within 24 business hours.
            </p>
            <ContactForm />
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 space-y-8">
            {/* Working Hours Card */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xs space-y-5 text-left bouncy-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] flex items-center justify-center text-[#FF9F1C] border border-[#FF9F1C]/20 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black text-[#3E2723]">Working Hours</h4>
              </div>
              <ul className="space-y-3 text-xs text-[#5D4037] font-semibold">
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Weekdays (Mon - Fri)</span>
                  <span className="text-[#8AC926] font-bold">8:30 AM - 6:30 PM</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Saturdays</span>
                  <span className="text-[#FF9F1C] font-bold">9:00 AM - 1:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sundays</span>
                  <span className="text-red-500 font-bold">Closed</span>
                </li>
              </ul>
            </div>

            {/* Quick Contact Points */}
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xs space-y-6 text-left bouncy-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#8AC926] border border-[#8AC926]/20 shadow-2xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black text-[#3E2723]">Admissions Helpdesk</h4>
              </div>
              <ul className="space-y-4 text-xs text-[#5D4037] font-semibold">
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#8AC926]" />
                  <a href="tel:+919884866727" className="hover:underline hover:text-[#8AC926] transition-colors">
                    +91 98848 66727
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#8AC926]" />
                  <a href="mailto:support@simbapreschool.in" className="hover:underline hover:text-[#8AC926] transition-colors">
                    support@simbapreschool.in
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#8AC926]" />
                  <span>Salem, Tamil Nadu, India</span>
                </li>
              </ul>
              
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h5 className="text-[10px] font-black text-[#5D4037]/65 uppercase tracking-wider">Social Channels</h5>
                <div className="flex gap-2.5">
                  {Object.entries(SOCIAL_LINKS).map(([name, url]) => {
                    let svgIcon = <span>{name[0].toUpperCase()}</span>;
                    if (name === "facebook") {
                      svgIcon = (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                      );
                    } else if (name === "instagram") {
                      svgIcon = (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                      );
                    } else if (name === "youtube") {
                      svgIcon = (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
                          <polygon points="10 15 15 12 10 9"/>
                        </svg>
                      );
                    } else if (name === "whatsapp") {
                      svgIcon = (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-slate-200/50 flex items-center justify-center hover:bg-[#8AC926]/10 hover:border-[#8AC926]/25 transition-all text-[#3E2723] hover:text-[#8AC926] shadow-2xs hover:scale-105"
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
          <WoodenHeader 
            badge="Savanna Network" 
            title="Our Branches in Salem" 
            subtitle="Walk into any of our locations to explore the physical playrooms and meet the Intake Rangers."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {BRANCHES.map((branch, idx) => {
              const navigateUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
                `Hi Simba Academy, I would like to schedule a physical tour of your ${branch.name} branch!`
              )}`;
              return (
                <div 
                  key={idx}
                  className="bg-white border-2 border-slate-100/80 rounded-[2.5rem] p-8 shadow-xs flex flex-col justify-between hover:border-[#8AC926]/30 transition-all duration-300 bouncy-card"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-[#FAF6EE] rounded-2xl flex items-center justify-center border border-[#8AC926]/20 text-[#8AC926] shadow-2xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-extrabold text-[#3E2723]">{branch.name} Branch</h4>
                    <p className="text-xs text-[#5D4037]/80 leading-relaxed font-semibold">{branch.address}</p>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-5 mt-6 flex justify-between items-center text-[10px] font-extrabold text-[#5D4037]/75">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#8AC926]" /> +91 98848 66727
                    </span>
                    <a
                      href={navigateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8AC926] hover:underline flex items-center gap-0.5 hover:text-[#78b020] transition-all"
                    >
                      Schedule Tour <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Google Maps Integration */}
        <div>
          <WoodenHeader 
            badge="Savanna Coordinates" 
            title="Interactive Location Map" 
            subtitle="Find your way to the closest Simba Academy campus using Google Maps."
          />
          <div className="max-w-5xl mx-auto bg-white border-4 border-white rounded-[3rem] p-3 shadow-xl relative overflow-hidden">
            <iframe 
              src="https://maps.google.com/maps?q=Simba%20Preschool%20Salem&output=embed" 
              className="w-full h-[450px] rounded-[2.5rem] border-2 border-[#8AC926]/35" 
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
