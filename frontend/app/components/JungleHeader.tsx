import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { HEADER_LINKS } from "../lib/constants";
import { Menu, X } from "lucide-react";

const LOGO_SRC = "/Simba Logo 2025.pdf.png";

const CENTER_NAV_LINKS = HEADER_LINKS.filter((link) => link.to !== "/contact");

type JungleHeaderProps = {
  variant?: "overlay" | "solid";
};

function isActivePath(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function JungleHeader({ variant = "solid" }: JungleHeaderProps) {
  const location = useLocation();
  const isOverlay = variant === "overlay";

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header if scrolling up, or if very close to the top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Hide header if scrolling down and past the top area
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 transition-transform duration-300 ease-in-out ${
        isOverlay ? "fixed" : "sticky"
      } ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="mx-auto grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 max-w-7xl relative">
        <Link
          to="/"
          className="group justify-self-start"
          aria-label="Simba Academy home"
        >
          <img
            src={LOGO_SRC}
            alt="Simba Academy"
            className="h-16 w-auto max-w-none object-contain transition-transform duration-300 group-hover:scale-[1.02] sm:h-[4.5rem] md:h-20 lg:h-[5.5rem]"
          />
        </Link>

        <nav
          className="starbucks-nav-pill justify-self-center hidden lg:flex"
          aria-label="Main navigation"
        >
          {CENTER_NAV_LINKS.map((link) => {
            const active = isActivePath(location.pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`starbucks-nav-link ${active ? "is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <Link to="/contact" className="starbucks-contact-btn hidden lg:inline-flex">
            Contact
          </Link>
          <button 
            className="lg:hidden p-3 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-slate-200 text-slate-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`absolute top-full left-4 right-4 mt-4 transition-all duration-300 ease-in-out transform origin-top ${isMobileMenuOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible pointer-events-none'}`}
      >
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl p-6 flex flex-col gap-2 lg:hidden max-h-[70vh] overflow-y-auto">
          {HEADER_LINKS.map((link) => {
            const active = isActivePath(location.pathname, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-lg font-bold py-3 px-5 rounded-2xl transition-colors ${active ? 'bg-[#E8AF34] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
