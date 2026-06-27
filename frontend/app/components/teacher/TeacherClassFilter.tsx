import { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";

interface TeacherClassFilterProps {
  assignedClasses: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: "inline" | "button";
}

export function TeacherClassFilter({
  assignedClasses,
  value,
  onChange,
  className = "",
  variant = "button",
}: TeacherClassFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (assignedClasses.length <= 1) {
    return null;
  }

  const options = [
    { id: "all", label: "All Classes" },
    ...assignedClasses.map((cls) => ({ id: cls, label: cls })),
  ];

  const activeLabel = options.find((opt) => opt.id === value)?.label ?? "All Classes";

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 overflow-x-auto pb-0.5 ${className}`}>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Class</span>
        <div className="flex items-center gap-1.5 min-w-0">
          {options.map((opt) => {
            const active = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border transition shrink-0 ${
                  active
                    ? "bg-[#8AC926] text-white border-[#78B020] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#8AC926]/40"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-2xs flex items-center gap-1.5 shadow-xs hover:bg-[#8AC926]/10 hover:border-[#8AC926]/40 transition-all duration-300"
        aria-label={`Class filter: ${activeLabel}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#8AC926] shrink-0" />
        <span className="hidden sm:inline">Filter</span>
        <span className="text-[#6B9E1A] font-extrabold truncate max-w-[5.5rem] sm:max-w-[7rem]">
          {activeLabel}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Class filter options"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-50 min-w-[10.5rem] rounded-xl border border-slate-200 bg-white shadow-lg py-1 animate-fade-in"
        >
          {options.map((opt) => {
            const active = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-2xs font-bold flex items-center justify-between gap-2 transition ${
                  active
                    ? "bg-[#8AC926]/10 text-[#5a8a18]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active ? <Check className="w-3.5 h-3.5 text-[#8AC926] shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
