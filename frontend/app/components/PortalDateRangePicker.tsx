import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";

interface PortalDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onClear: () => void;
}

function parseDateString(str: string): Date | null {
  if (!str) return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  const date = new Date(y, m, d);
  if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
    return date;
  }
  return null;
}

function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function PortalDateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
}: PortalDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "end">("start");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [startText, setStartText] = useState(startDate);
  const [endText, setEndText] = useState(endDate);

  const containerRef = useRef<HTMLDivElement>(null);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [visibleYearsLimit, setVisibleYearsLimit] = useState(20);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);

  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);
  const selectedMonthRef = useRef<HTMLButtonElement>(null);

  // Close year/month dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open exclusive logic: close year when month opens, close month when year opens
  useEffect(() => {
    if (isMonthDropdownOpen) {
      setIsYearDropdownOpen(false);
    }
  }, [isMonthDropdownOpen]);

  useEffect(() => {
    if (isYearDropdownOpen) {
      setIsMonthDropdownOpen(false);
    }
  }, [isYearDropdownOpen]);

  // When year dropdown opens, reset limit, center active year
  useEffect(() => {
    if (isYearDropdownOpen) {
      setVisibleYearsLimit(20);
      
      const timer = setTimeout(() => {
        if (selectedYearRef.current && yearListRef.current) {
          const container = yearListRef.current;
          const element = selectedYearRef.current;
          
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const containerHeight = container.offsetHeight;
          
          container.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isYearDropdownOpen]);

  // When month dropdown opens, center active month
  useEffect(() => {
    if (isMonthDropdownOpen) {
      const timer = setTimeout(() => {
        if (selectedMonthRef.current && monthListRef.current) {
          const container = monthListRef.current;
          const element = selectedMonthRef.current;
          
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const containerHeight = container.offsetHeight;
          
          container.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMonthDropdownOpen]);

  // When calendar closes, close year & month dropdowns too
  useEffect(() => {
    if (!isOpen) {
      setIsYearDropdownOpen(false);
      setIsMonthDropdownOpen(false);
    }
  }, [isOpen]);

  const handleYearDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      setVisibleYearsLimit((prev) => prev + 20);
    }
  };

  // Keep text inputs synced with parent props
  useEffect(() => {
    setStartText(startDate);
  }, [startDate]);

  useEffect(() => {
    setEndText(endDate);
  }, [endDate]);

  // Handle outside clicks to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update month view when starting date is set/changed
  useEffect(() => {
    const parsed = parseDateString(startDate);
    if (parsed) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [startDate]);

  const handleStartTyping = (val: string) => {
    const clean = val.replace(/[^\d-]/g, "");
    setStartText(clean);

    const parsed = parseDateString(clean);
    if (parsed) {
      onStartChange(clean);
    }
  };

  const handleEndTyping = (val: string) => {
    const clean = val.replace(/[^\d-]/g, "");
    setEndText(clean);

    const parsed = parseDateString(clean);
    if (parsed) {
      onEndChange(clean);
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
    );
  };

  const handleDaySelect = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateString(selectedDate);

    if (activeField === "start") {
      onStartChange(dateStr);
      setActiveField("end");
    } else {
      const startParsed = parseDateString(startDate);
      if (startParsed && selectedDate < startParsed) {
        onStartChange(dateStr);
        onEndChange("");
        setActiveField("end");
      } else {
        onEndChange(dateStr);
        setIsOpen(false); // Close when selection is complete
      }
    }
  };

  // Calendar Day Generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray: Array<{ dayNum: number; isCurrentMonth: boolean }> = [];

  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      dayNum: prevMonthTotalDays - i,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - daysArray.length;
  for (let i = 1; i <= remaining; i++) {
    daysArray.push({
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const startParsed = parseDateString(startDate);
  const endParsed = parseDateString(endDate);

  const getDayStatus = (dayNum: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "other";
    const dateObj = new Date(year, month, dayNum);

    const isStart = startParsed && dateObj.toDateString() === startParsed.toDateString();
    const isEnd = endParsed && dateObj.toDateString() === endParsed.toDateString();
    const isBetween =
      startParsed && endParsed && dateObj > startParsed && dateObj < endParsed;

    if (isStart) return "start";
    if (isEnd) return "end";
    if (isBetween) return "between";
    return "none";
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Date Inputs Panel */}
      <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-xs hover:border-slate-300 transition duration-300 w-fit">
        <div className="flex items-center gap-1 px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-[#8AC926] shrink-0" />
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            value={startText}
            onChange={(e) => handleStartTyping(e.target.value)}
            onFocus={() => {
              setIsOpen(true);
              setActiveField("start");
            }}
            className={`w-24 text-2xs font-bold text-slate-800 outline-none bg-transparent ${
              isOpen && activeField === "start" ? "text-[#8AC926]" : ""
            }`}
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400 select-none">to</span>
        <div className="flex items-center gap-1 px-2.5 py-1">
          <input
            type="text"
            placeholder="YYYY-MM-DD"
            value={endText}
            onChange={(e) => handleEndTyping(e.target.value)}
            onFocus={() => {
              setIsOpen(true);
              setActiveField("end");
            }}
            className={`w-24 text-2xs font-bold text-slate-800 outline-none bg-transparent ${
              isOpen && activeField === "end" ? "text-[#8AC926]" : ""
            }`}
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0 mr-1"
            title="Clear Date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Custom Calendar Dropdown Panel (Absolute Popover Overlay) */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in p-4 select-none">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Custom Scrollable Month Dropdown Selector */}
              <div className="relative inline-block text-left" ref={monthDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center justify-between gap-1 text-xs font-bold text-slate-800 bg-white border border-slate-100 hover:border-slate-200 focus:border-[#8AC926] rounded-lg px-2 py-1 outline-none transition cursor-pointer leading-none h-[26px] min-w-[92px]"
                >
                  <span>{MONTHS[month]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isMonthDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isMonthDropdownOpen && (
                  <div
                    className="absolute left-0 mt-1.5 w-24 bg-white border border-slate-300 rounded-xl shadow-xl z-50 h-[196px] overflow-hidden"
                  >
                    <div
                      ref={monthListRef}
                      className="w-full h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)] py-1"
                    >
                      {MONTHS.map((m, idx) => {
                        const isSelected = idx === month;
                        return (
                          <button
                            key={m}
                            type="button"
                            ref={isSelected ? selectedMonthRef : null}
                            onClick={() => {
                              setCurrentMonth(new Date(year, idx, 1));
                              setIsMonthDropdownOpen(false);
                            }}
                            className={`w-full text-center text-2xs font-bold h-7 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                              isSelected
                                ? "bg-[#8AC926] text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Scrollable Year Dropdown Selector */}
              <div className="relative inline-block text-left" ref={yearDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center justify-between gap-1 text-xs font-bold text-slate-800 bg-white border border-slate-100 hover:border-slate-200 focus:border-[#8AC926] rounded-lg px-2 py-1 outline-none transition cursor-pointer leading-none h-[26px] min-w-[64px]"
                >
                  <span>{year}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isYearDropdownOpen && (
                  <div
                    className="absolute left-0 mt-1.5 w-20 bg-white border border-slate-300 rounded-xl shadow-xl z-50 h-[196px] overflow-hidden"
                  >
                    <div
                      ref={yearListRef}
                      onScroll={handleYearDropdownScroll}
                      className="w-full h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)] py-1"
                    >
                      {Array.from({ length: visibleYearsLimit }, (_, i) => {
                        const currentYear = new Date().getFullYear();
                        const listStartYear = Math.max(currentYear, year);
                        return listStartYear - i;
                      }).map((y) => {
                        const isSelected = y === year;
                        return (
                          <button
                            key={y}
                            type="button"
                            ref={isSelected ? selectedYearRef : null}
                            onClick={() => {
                              setCurrentMonth(new Date(y, month, 1));
                              setIsYearDropdownOpen(false);
                            }}
                            className={`w-full text-center text-2xs font-bold h-7 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                              isSelected
                                ? "bg-[#8AC926] text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[10px] font-bold text-slate-400">
                {day}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysArray.map(({ dayNum, isCurrentMonth }, idx) => {
              const status = getDayStatus(dayNum, isCurrentMonth);

              let cellStyle = "text-slate-300 cursor-default text-2xs py-1.5";
              if (isCurrentMonth) {
                cellStyle =
                  "text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer font-bold text-2xs py-1.5 transition-colors duration-150";
              }

              if (status === "start" || status === "end") {
                cellStyle =
                  "bg-[#8AC926] text-white rounded-lg font-black text-2xs py-1.5 cursor-pointer shadow-xs";
              } else if (status === "between") {
                cellStyle =
                  "bg-[#8AC926]/15 text-[#6B9E1A] hover:bg-[#8AC926]/20 font-bold text-2xs py-1.5 cursor-pointer rounded-lg";
              }

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={!isCurrentMonth}
                  onClick={() => handleDaySelect(dayNum)}
                  className={cellStyle}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Picker Footer info */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            <span>
              Active: <span className="text-[#8AC926]">{activeField === "start" ? "From Date" : "To Date"}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const todayStr = formatDateString(new Date());
                if (activeField === "start") {
                  onStartChange(todayStr);
                  setActiveField("end");
                } else {
                  onEndChange(todayStr);
                }
              }}
              className="text-[#8AC926] hover:text-[#78B020]"
            >
              Set Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
