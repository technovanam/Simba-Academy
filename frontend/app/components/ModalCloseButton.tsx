import type { MouseEvent } from "react";
import { X } from "lucide-react";

interface ModalCloseButtonProps {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  size?: "sm" | "md";
}

/** Standard dismiss control — X icon only, no "Close" text */
export function ModalCloseButton({
  onClick,
  className = "",
  size = "md",
}: ModalCloseButtonProps) {
  const compact = size === "sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${compact ? "p-1" : "p-1.5"} rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${className}`.trim()}
      aria-label="Close"
    >
      <X className={compact ? "w-4 h-4" : "w-5 h-5"} strokeWidth={1.75} />
    </button>
  );
}
