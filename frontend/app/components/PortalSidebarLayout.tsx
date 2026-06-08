import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { Menu, X } from "lucide-react";

type PortalMenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
  menuOpen: boolean;
};

const PortalMenuContext = createContext<PortalMenuContextValue | null>(null);

export function usePortalMenu() {
  const ctx = useContext(PortalMenuContext);
  return (
    ctx ?? {
      openMenu: () => {},
      closeMenu: () => {},
      menuOpen: false,
    }
  );
}

interface PortalSidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  /** Shown in the built-in mobile top bar (when hideMobileBar is false) */
  mobileTitle?: string;
  /** Teacher portal uses its own header — hide the extra mobile bar */
  hideMobileBar?: boolean;
}

/**
 * Portal shell: fixed sidebar on lg+, standard full-height slide-out drawer below lg.
 */
export function PortalSidebarLayout({
  children,
  sidebar,
  mobileTitle = "Simba Academy",
  hideMobileBar = false,
}: PortalSidebarLayoutProps) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const mobileTopOffset = hideMobileBar
    ? ""
    : "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0";

  return (
    <PortalMenuContext.Provider value={{ openMenu, closeMenu, menuOpen }}>
      <div className="portal-app-shell w-full max-w-full h-[100dvh] max-h-[100dvh] bg-[#F8FAFC] font-sans text-sm text-slate-900 flex flex-col lg:flex-row overflow-hidden">
        {!hideMobileBar ? (
          <header className="portal-mobile-topbar lg:hidden fixed top-0 left-0 right-0 z-[60] px-4 flex items-center justify-between gap-3 bg-white border-b border-slate-200 shadow-sm select-none">
            <button
              type="button"
              onClick={menuOpen ? closeMenu : openMenu}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
            <p className="text-sm font-bold text-slate-900 truncate flex-1 text-center">{mobileTitle}</p>
            <div className="w-10 shrink-0" aria-hidden />
          </header>
        ) : null}

        {menuOpen ? (
          <button
            type="button"
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-[55] backdrop-blur-[1px]"
            onClick={closeMenu}
            aria-label="Close menu"
          />
        ) : null}

        <aside
          className={`portal-drawer fixed lg:static inset-y-0 left-0 z-[58] lg:z-30 w-[min(20rem,92vw)] sm:w-80 lg:w-72 lg:max-w-none h-[100dvh] max-h-[100dvh] lg:sticky lg:top-0 bg-[#F1F5F9] border-r border-slate-200 flex flex-col shrink-0 overflow-hidden select-none shadow-2xl lg:shadow-none transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          role="dialog"
          aria-modal={menuOpen}
          aria-label="Portal navigation"
        >
          <div className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-slate-200/90 bg-[#F1F5F9]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Navigation</p>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="portal-sidebar-inner flex-1 min-h-0 overflow-hidden px-5 py-4 lg:py-5 lg:px-5 flex flex-col"
            onClick={(event) => {
              const target = (event.target as HTMLElement).closest("a, button");
              if (target && menuOpen) closeMenu();
            }}
          >
            {sidebar}
          </div>
        </aside>

        <div
          className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden portal-main-column ${mobileTopOffset}`}
        >
          {children}
        </div>
      </div>
    </PortalMenuContext.Provider>
  );
}
