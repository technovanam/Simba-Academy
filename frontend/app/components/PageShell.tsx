import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { JungleFooter } from "./JungleFooter";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

interface PageShellProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function PageShell({ children, showFooter = true }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-[#FAF8F5] to-[#FAF8F5] font-sans text-[#3E2723] selection:bg-[#FFD275] selection:text-[#3E2723] overflow-x-hidden relative">
      <SiteNav />
      <main>{children}</main>
      {showFooter && <JungleFooter />}
      <FloatingWhatsApp />
    </div>
  );
}
