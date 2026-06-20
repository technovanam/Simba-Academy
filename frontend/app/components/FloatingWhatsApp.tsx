import { WHATSAPP_URL } from "../lib/constants";

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[#25D366]/40 cursor-pointer group"
    >
      <svg className="w-7 h-7 animate-float-gentle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.13 2.82a10.85 10.85 0 0 0-15.34 0 10.74 10.74 0 0 0-2.26 12.3L2 22l7.07-1.84a10.8 10.8 0 0 0 12.06-2 10.85 10.85 0 0 0 0-15.34z" />
        <path d="M16.14 13a.76.76 0 0 1-.3-.08c-.46-.23-1.15-.57-1.3-.65a.55.55 0 0 0-.48 0c-.17.15-.53.53-.66.68a.33.33 0 0 1-.41.06c-.85-.35-1.52-1-1.86-1.86a.33.33 0 0 1 .06-.41c.15-.13.53-.49.68-.66a.55.55 0 0 0 0-.48c-.08-.15-.42-.84-.65-1.3a.76.76 0 0 1-.08-.3.44.44 0 0 0-.45-.44h-.35a1.18 1.18 0 0 0-1 .59 5.86 5.86 0 0 0-.82 2.65 8 8 0 0 0 2.21 4.7 9 9 0 0 0 4.7 2.21c.91.13 1.83-.15 2.65-.82a1.18 1.18 0 0 0 .59-1v-.35a.44.44 0 0 0-.44-.45z" />
      </svg>
      {/* Soft tooltip */}
      <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all origin-right bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
        Chat with intake Ranger 👋
      </span>
    </a>
  );
}
