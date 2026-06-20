import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FormPillSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Select…",
  hasError = false,
  compact = false,
  className = "",
}: {
  value: T | "";
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
  placeholder?: string;
  hasError?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div ref={ref} className={`relative w-full ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`w-full inline-flex items-center gap-2 rounded-xl border font-semibold text-left transition outline-none ${
          compact ? "pl-3.5 pr-3 py-2.5 text-sm" : "pl-4 pr-3 py-3.5 text-base"
        } ${
          hasError
            ? "border-red-400 bg-red-50/50 text-slate-800"
            : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-[#FF9F1C]/50 focus:border-[#FF9F1C] focus:bg-white"
        }`}
      >
        <span className={`flex-1 truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 py-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-semibold transition ${
                  o.id === value
                    ? "bg-[#FF9F1C]/15 text-[#c77a00]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
