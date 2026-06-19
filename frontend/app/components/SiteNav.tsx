import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { PawPrint } from "lucide-react";
import { NAV_LINKS } from "../lib/constants";
import { getUser, getDashboardPath } from "../lib/auth";

export function SiteNav() {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  return (
    <nav className="relative z-40 max-w-7xl mx-auto px-6 pt-6 flex flex-wrap justify-between items-center gap-4">
      <Link
        to="/"
        className="flex items-center gap-3 bg-white border-2 border-[#8AC926]/30 rounded-md px-5 py-2.5 shadow-lg hover:scale-105 transition-transform group"
      >
        <div className="w-16 h-16 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
          <img src="/Simba Logo 2025.pdf.png" alt="Simba Academy Logo" className="w-full h-full object-contain" />
        </div>
        <div className="text-left">
          <h1 className="font-sans font-bold text-lg leading-none tracking-wide text-[#3E2723]">
            Simba Academy
          </h1>
          <span className="text-[10px] font-bold text-[#4E8C52] tracking-widest uppercase mt-0.5 block">
            Sunny Preschool Savanna
          </span>
        </div>
      </Link>

      <div className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              location.pathname === link.to
                ? "bg-[#8AC926]/15 text-[#3E2723]"
                : "text-[#5D4037] hover:bg-white/70"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        {user ? (
          <Link
            to={getDashboardPath(user.role)}
            className="px-5 py-2.5 rounded-md bg-[#4E8C52] text-white font-sans font-bold text-sm shadow-lg hover:bg-[#3d7340] transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden sm:inline-flex px-5 py-2.5 rounded-md border-2 border-[#8C6239]/40 text-[#5D4037] font-sans font-bold hover:bg-white transition-colors text-sm shadow-sm bg-white/50"
            >
              Parent Login
            </Link>
            <Link
              to="/teacher/login"
              className="px-5 py-2.5 rounded-md bg-[#8AC926] border-b-4 border-[#6FA31D] text-white font-sans font-bold text-sm hover:translate-y-[-1px] active:translate-y-[1px] active:border-b-0 shadow-lg transition-all"
            >
              Teacher Portal
            </Link>
            <Link
              to="/admin/login"
              className="px-5 py-2.5 rounded-md bg-[#FF9F1C] border-b-4 border-[#E07A00] text-white font-sans font-bold text-sm hover:translate-y-[-1px] active:translate-y-[1px] active:border-b-0 shadow-lg transition-all"
            >
              Admin Portal
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
