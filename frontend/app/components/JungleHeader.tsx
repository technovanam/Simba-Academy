import { Link, useLocation } from "react-router";
import { HEADER_LINKS } from "../lib/constants";

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

  return (
    <header
      className={`left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 ${
        isOverlay ? "fixed" : "sticky"
      }`}
    >
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 max-w-7xl">
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
          <Link to="/contact" className="starbucks-contact-btn hidden sm:inline-flex">
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
