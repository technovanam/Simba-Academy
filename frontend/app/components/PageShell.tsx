import type { ReactNode } from "react";
import { JungleHeader } from "./JungleHeader";
import { JungleFooter } from "./JungleFooter";

interface PageShellProps {
  children: ReactNode;
  headerVariant?: "overlay" | "solid";
}

export function PageShell({ children, headerVariant = "solid" }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#3E2723] selection:bg-[#FFD275] selection:text-[#3E2723] relative">
      <JungleHeader variant={headerVariant} />
      <main>{children}</main>
      <JungleFooter />
    </div>
  );
}
