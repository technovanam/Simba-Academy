import type { ReactNode } from "react";
import { JungleHeader } from "./JungleHeader";
import { JungleFooter } from "./JungleFooter";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

interface PageShellProps {
  children: ReactNode;
  headerVariant?: "overlay" | "solid";
}

export function PageShell({ children, headerVariant = "solid" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-[#FAF8F5] to-[#FAF8F5] font-sans text-[#3E2723] selection:bg-[#FFD275] selection:text-[#3E2723] relative">
      <JungleHeader variant={headerVariant} />
      <main>{children}</main>
      <JungleFooter />
    </div>
  );
}
