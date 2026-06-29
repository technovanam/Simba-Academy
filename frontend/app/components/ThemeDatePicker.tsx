import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface ThemeDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  minDate?: string; // YYYY-MM-DD
}

export function ThemeDatePicker({ value, onChange, minDate }: ThemeDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse value or default to today
  const selectedDate = value ? new Date(value) : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update current view if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    // Format to YYYY-MM-DD locally avoiding timezone offset issues
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Select Date";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-[#8AC926] hover:border-slate-300 transition"
      >
        <span className="font-semibold text-sm">{formatDateLabel(value)}</span>
        <Calendar className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto top-full sm:bottom-full sm:top-auto mt-2 sm:mt-0 sm:mb-2 p-4 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 w-full max-w-[min(18rem,calc(100vw-2rem))] sm:w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-slate-800 text-sm">
              {new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === dateStr;
              
              let isDisabled = false;
              if (minDate) {
                isDisabled = dateStr < minDate;
              }

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(day)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition mx-auto
                    ${isSelected ? "bg-[#8AC926] text-white shadow-sm shadow-[#8AC926]/20" : ""}
                    ${!isSelected && !isDisabled ? "text-slate-700 hover:bg-slate-100" : ""}
                    ${isDisabled ? "text-slate-300 cursor-not-allowed" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
