import { Link } from "react-router";
import { MapPin, Phone, Mail, ChevronRight } from "lucide-react";
import { SOCIAL_LINKS, WHATSAPP_URL } from "../lib/constants";

export function JungleFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-6 sm:px-12 border-t border-slate-800 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Column 1: Identity */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl px-1.5 py-1.5 flex items-center justify-center shadow-sm">
              <img src="/Simba Logo 2025.pdf.png" alt="Simba Academy" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="font-bold text-lg tracking-tight text-white">Simba Academy</h4>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">Premium Preschool</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            An immersive early learning ecosystem designed to foster cognitive, spatial, and academic growth.
          </p>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-100">Quick Links</h5>
          <ul className="space-y-3 text-sm text-slate-400">
            <li>
              <Link to="/about" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> About Us
              </Link>
            </li>
            <li>
              <Link to="/courses" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Programs
              </Link>
            </li>
            <li>
              <Link to="/franchise" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Franchise
              </Link>
            </li>
            <li>
              <Link to="/portals" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Portals
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-blue-400 transition-colors flex items-center gap-1 group">
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div className="space-y-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-100">Contact Info</h5>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3 items-start">
              <MapPin className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
              <span>Salem, Tamil Nadu, India</span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="w-4.5 h-4.5 text-blue-400 shrink-0" />
              <span>+91 98848 66727</span>
            </li>
            <li className="flex gap-3 items-center">
              <Mail className="w-4.5 h-4.5 text-blue-400 shrink-0" />
              <span>support@simbapreschool.in</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Socials / Credit */}
        <div className="space-y-5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-100">Social Connect</h5>
          <div className="flex gap-3 pt-1">
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
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 transition-all text-slate-400 hover:text-white"
                  aria-label={`Visit our ${name}`}
                >
                  {svgIcon}
                </a>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 pt-4 border-t border-slate-800 font-medium">
            Developed & Maintained by{" "}
            <a href="https://technovanam.in" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-bold">
              Techno Vanam
            </a>
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Simba Academy. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#privacy" className="hover:text-slate-300 transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-slate-300 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
