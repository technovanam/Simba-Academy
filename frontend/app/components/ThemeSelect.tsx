import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface ThemeSelectOption {
  id: string;
  label: string;
}

interface ThemeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ThemeSelectOption[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ThemeSelect({
  value,
  onChange,
  options,
  className = "",
  placeholder = "Select an option",
  disabled = false,
}: ThemeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((opt) => opt.id === value);

  const updatePosition = () => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number | undefined;
      let bottom: number | undefined;
      let maxHeight: number;

      // If less than 250px below and more space above, open upwards
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        bottom = window.innerHeight - rect.top + 6;
        maxHeight = spaceAbove - 24; // 24px padding from edge
      } else {
        top = rect.bottom + 6;
        maxHeight = spaceBelow - 24;
      }

      setDropdownStyle({
        position: 'fixed',
        top: top !== undefined ? top : undefined,
        bottom: bottom !== undefined ? bottom : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: `${Math.max(100, Math.min(350, maxHeight))}px`,
      });
    }
  };

  useLayoutEffect(() => {
    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // If click is inside the container (button) or the portal itself, ignore
      if (
        containerRef.current?.contains(target) ||
        (target instanceof Element && target.closest(".theme-select-dropdown"))
      ) {
        return;
      }
      setIsOpen(false);
    }

    // Update position on scroll or resize
    window.addEventListener("scroll", updatePosition, true); // Use capture phase to catch internal scrolls
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl bg-white border px-4 py-3 text-left transition outline-none focus:border-[#8AC926] focus:ring-1 focus:ring-[#8AC926] ${
          isOpen ? "border-[#8AC926] ring-1 ring-[#8AC926]" : "border-slate-300 hover:border-[#8AC926]/50"
        } ${disabled ? "bg-slate-100 text-slate-500" : "text-slate-800"}`}
      >
        <span className="truncate pr-2 text-[15px] font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#8AC926]" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && typeof document !== "undefined" && createPortal(
        <div 
          className="theme-select-dropdown z-[9999] rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
          style={dropdownStyle}
        >
          <ul className="py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {options.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 text-[15px] transition-colors ${
                    value === opt.id
                      ? "bg-[#8AC926]/10 text-[#71a61c] font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
