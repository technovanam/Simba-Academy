import { useState } from "react";
import { Link } from "react-router";
import { SOCIAL_LINKS } from "../lib/constants";
import { FaFacebook, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { MapPin, Phone, Mail, X, ExternalLink } from "lucide-react";

const IG_BRANCHES = [
  { name: "Ponnamapet", url: "https://www.instagram.com/simba_preschool_ponnamapet?igsh=MWo2M3VsMTBjbDN3OA%3D%3D&utm_source=qr" },
  { name: "Ammapet", url: "https://www.instagram.com/simba_preschool_ammapet?igsh=NnF1aDgwNDdodmFo&utm_source=qr" },
  { name: "Ramakrishna Park", url: "https://www.instagram.com/simbapreschool_ramakrishnapark?igsh=ZWdoY3UyMmUxMWY0&utm_source=qr" },
  { name: "Steelplant", url: "https://www.instagram.com/simba_preschool_steelplant?igsh=bGt3bnJoYXkzZXNh" },
  { name: "Kondalampatti", url: "https://www.instagram.com/simbapreschool_kondalampatti?igsh=MWFubGFwbHZhZzA1aw==" }
];

export function JungleFooter() {
  const [showIgPopup, setShowIgPopup] = useState(false);

  return (
    <footer className="pt-20 pb-6 px-6 sm:px-12 relative z-10 text-slate-700 bg-[#FAF6EE]">
      {/* Responsive Background Images */}
      <picture className="absolute inset-0 w-full h-full pointer-events-none -z-10">
        <source media="(min-width: 1024px)" srcSet="/Fotter.webp" />
        <source media="(min-width: 640px)" srcSet="/Fotter%20Tab.png" />
        <img loading="lazy" decoding="async" 
          src="/Fotter%20Mobile.png" 
          alt="Simba Academy Footer Background" 
          className="w-full h-full object-cover object-bottom"
          loading="lazy"
          decoding="async"
        />
      </picture>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
        {/* Column 1: Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              <img loading="lazy" decoding="async" src="/Simba Logo 2025.pdf.png" alt="Simba Preschool" className="w-full h-full object-contain scale-150" />
            </div>
          </div>
        </div>

        {/* Column 2: Courses links */}
        <div className="space-y-4 lg:-ml-12">
          <h5 className="text-sm font-bold uppercase tracking-wider text-[#c26d2e] relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-6 after:h-0.5 after:bg-[#c26d2e]">
            Courses
          </h5>
          <ul className="grid grid-rows-4 grid-flow-col gap-y-3 gap-x-6 text-sm text-slate-600 font-medium">
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Daycare
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Playgroup
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Pre-KG
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • LKG
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • UKG
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Phonics
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Handwriting
              </span>
            </li>
            <li>
              <span className="hover:text-[#c26d2e] transition-colors cursor-pointer">
                • Spoken English
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div className="space-y-4">
          <h5 className="text-sm font-bold uppercase tracking-wider text-[#c26d2e] relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-6 after:h-0.5 after:bg-[#c26d2e]">
            Contact Us
          </h5>
          <div className="space-y-6 text-sm text-slate-600 font-medium">
            <a 
              href="https://maps.google.com/?q=Simba+Preschool,+Salem" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-start gap-4 group cursor-pointer"
            >
              <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-[#c26d2e]" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-bold uppercase text-[#c26d2e] mb-1">Address:</p>
                <p className="leading-relaxed group-hover:text-[#c26d2e] transition-colors">
                  81, Anna Street, Ammapet Road,<br />
                  Salem - 636001
                </p>
              </div>
            </a>
            <a 
              href="tel:+919884866727"
              className="flex items-start gap-4 group cursor-pointer"
            >
              <Phone className="w-5 h-5 mt-0.5 shrink-0 text-[#c26d2e]" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-bold uppercase text-[#c26d2e] mb-1">Phone:</p>
                <p className="group-hover:text-[#c26d2e] transition-colors">+91 98848 66727</p>
              </div>
            </a>
            <a 
              href="mailto:contact@simbapreschool.in"
              className="flex items-start gap-4 group cursor-pointer"
            >
              <Mail className="w-5 h-5 mt-0.5 shrink-0 text-[#c26d2e]" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-bold uppercase text-[#c26d2e] mb-1">Mail Us:</p>
                <p className="break-all group-hover:text-[#c26d2e] transition-colors">contact@simbapreschool.in</p>
              </div>
            </a>
          </div>
        </div>

        {/* Column 4: Social Links */}
        <div className="space-y-4">
          <h5 className="text-sm font-bold uppercase tracking-wider text-[#c26d2e] relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-6 after:h-0.5 after:bg-[#c26d2e]">
            Follow Us
          </h5>
          <div className="flex flex-wrap gap-3 pt-2">
            {Object.entries(SOCIAL_LINKS).map(([name, url]) => {
              let svgIcon = <span className="font-bold text-xs uppercase">{name[0]}</span>;
              if (name === "facebook") {
                svgIcon = <FaFacebook className="w-5 h-5 text-[#1877F2] group-hover:text-white transition-colors" />;
              } else if (name === "instagram") {
                svgIcon = <FaInstagram className="w-5 h-5 text-[#E4405F] group-hover:text-white transition-colors" />;
              } else if (name === "youtube") {
                svgIcon = <FaYoutube className="w-5 h-5 text-[#FF0000] group-hover:text-white transition-colors" />;
              } else if (name === "whatsapp") {
                svgIcon = <FaWhatsapp className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />;
              }
              return name === "instagram" ? (
                <button
                  key={name}
                  onClick={() => setShowIgPopup(true)}
                  className="group w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-[#c26d2e] transition-all shadow-sm cursor-pointer"
                  aria-label={`Visit our ${name}`}
                >
                  {svgIcon}
                </button>
              ) : (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-[#c26d2e] transition-all shadow-sm cursor-pointer"
                  aria-label={`Visit our ${name}`}
                >
                  {svgIcon}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-52 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-800 font-semibold relative z-20">
        <p>© {new Date().getFullYear()} Simba Preschool. All rights reserved.</p>
        <p>
          Developed & Maintained by{" "}
          <a href="https://www.technovanam.in" target="_blank" rel="noreferrer" className="text-[#c26d2e] hover:underline font-extrabold">
            Techno Vanam
          </a>
        </p>
      </div>

      {/* Instagram Branches Popup Modal */}
      {showIgPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#E4405F]/10 to-[#FD1D1D]/10 px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <FaInstagram className="w-6 h-6 text-[#E4405F]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Select Branch</h3>
                  <p className="text-xs font-semibold text-slate-500">Follow us on Instagram</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIgPopup(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Branch Links */}
            <div className="p-3">
              <ul className="space-y-1.5">
                {IG_BRANCHES.map((branch, idx) => (
                  <li key={idx}>
                    <a 
                      href={branch.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 group transition-all"
                    >
                      <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                        {branch.name}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:border-[#E4405F]/30 group-hover:bg-[#E4405F]/5 transition-all">
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#E4405F] transition-colors" />
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 text-center border-t border-slate-100">
              <button 
                onClick={() => setShowIgPopup(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
