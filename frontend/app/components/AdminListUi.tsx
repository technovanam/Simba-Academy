import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

export const ADMIN_LIST_PAGE_SIZE = 5;

export const adminListContainerClass =
  "bg-white rounded-2xl border border-slate-200 px-2 sm:px-3 pt-2.5 sm:pt-3 pb-2 sm:pb-3 space-y-1.5 w-full min-w-0 max-w-full overflow-hidden";

export const adminListRowClass =
  "flex flex-wrap items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors min-w-0 w-full";

/** Stack row content on phones; inline from sm+ (story books, approvals, etc.) */
export const adminListRowStackClass =
  "flex flex-col sm:flex-row sm:items-center items-stretch gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors min-w-0 w-full";

/** Coloured icon action buttons for admin tables */
export const adminActionBtnBase =
  "p-1.5 rounded-lg border transition disabled:opacity-50 flex items-center justify-center shrink-0";

export const adminActionBtnView =
  `${adminActionBtnBase} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`;

export const adminActionBtnEdit =
  `${adminActionBtnBase} bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100`;

export const adminActionBtnDelete =
  `${adminActionBtnBase} bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100`;

export const adminActionBtnHistory =
  `${adminActionBtnBase} bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100`;

export const adminActionBtnLock =
  `${adminActionBtnBase} bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100`;

export const adminActionBtnUnlock =
  `${adminActionBtnBase} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`;

export const adminActionBtnApprove =
  `${adminActionBtnBase} bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100`;

export const adminActionBtnSettings =
  `${adminActionBtnBase} bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100`;

export const adminActionBtnMail =
  `${adminActionBtnBase} bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100`;

/** Larger icon-only buttons (e.g. story library table) */
export const adminActionBtnIconBase =
  "w-8 h-8 rounded-lg border transition disabled:opacity-50 flex items-center justify-center shrink-0";

export const adminActionBtnViewIcon =
  `${adminActionBtnIconBase} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100`;

export const adminActionBtnSettingsIcon =
  `${adminActionBtnIconBase} bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100`;

export const adminActionBtnDeleteIcon =
  `${adminActionBtnIconBase} bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100`;

export function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function useAdminPagination<T>(
  items: T[],
  deps: unknown[] = [],
  pageSize: number = ADMIN_LIST_PAGE_SIZE
) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(pageStart, pageStart + pageSize);
  const pageNumbers = buildPageNumbers(safePage, totalPages);
  const rangeStart = items.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, items.length);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return {
    paginatedItems,
    currentPage,
    setCurrentPage,
    totalPages,
    safePage,
    pageNumbers,
    rangeStart,
    rangeEnd,
  };
}

const PILL_ACCENT = {
  green: {
    border: "border-[#8AC926]",
    hover: "hover:bg-[#8AC926]/5",
    active: "bg-[#8AC926]/15 text-[#5a8218]",
    focusBorder: "focus:border-[#8AC926]",
  },
  blue: {
    border: "border-blue-600",
    hover: "hover:bg-blue-600/5",
    active: "bg-blue-600/15 text-blue-700",
    focusBorder: "focus:border-blue-500",
  },
  orange: {
    border: "border-[#FF9F1C]",
    hover: "hover:bg-[#FF9F1C]/5",
    active: "bg-[#FF9F1C]/15 text-[#c77a00]",
    focusBorder: "focus:border-[#FF9F1C]",
  },
} as const;

export function PillSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  accent = "green",
  align = "left",
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
  accent?: keyof typeof PILL_ACCENT;
  align?: "left" | "right";
}) {
  const tone = PILL_ACCENT[accent];
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
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1.5 pl-3.5 pr-2.5 py-2 rounded-full border ${tone.border} bg-white text-xs font-bold text-slate-800 ${tone.hover} transition min-w-[128px] max-w-[168px] justify-between leading-none`}
      >
        <span className="truncate leading-none">{selected?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-700 shrink-0 block transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute ${align === "right" ? "left-0 right-auto sm:right-0 sm:left-auto" : "left-0"} top-[calc(100%+6px)] z-30 min-w-[168px] py-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden`}
        >
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition ${
                  o.id === value ? tone.active : "text-slate-700 hover:bg-slate-50"
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

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  accent = "green",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  accent?: keyof typeof PILL_ACCENT;
}) {
  const tone = PILL_ACCENT[accent];
  return (
    <div className="relative w-full min-w-0 sm:w-[260px] max-w-full">
      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none ${tone.focusBorder} placeholder-slate-400 transition-all`}
        aria-label={ariaLabel}
      />
    </div>
  );
}

export function AdminRecordList({ children }: { children: ReactNode }) {
  return <div className={adminListContainerClass}>{children}</div>;
}

export function AdminListPagination({
  rangeStart,
  rangeEnd,
  total,
  safePage,
  totalPages,
  pageNumbers,
  onPageChange,
  itemLabel = "items",
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  safePage: number;
  totalPages: number;
  pageNumbers: (number | "ellipsis")[];
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 pt-2 border-t border-slate-100">
      <p className="text-2xs font-semibold text-slate-600">
        Showing{" "}
        <span className="font-bold text-slate-800">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-bold text-slate-800">{total}</span> {itemLabel}
      </p>
      <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          className="inline-arrow px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-2xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>
        <div className="flex items-center gap-0.5 mx-1">
          {pageNumbers.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-2xs font-bold text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === safePage ? "page" : undefined}
                className={`min-w-[2rem] px-2.5 py-1.5 rounded-lg text-2xs font-bold border transition ${
                  item === safePage
                    ? "bg-[#8AC926] border-[#8AC926] text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          className="inline-arrow px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-2xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>
    </div>
  );
}

export function AdminListEmpty({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 border border-slate-200">
      {message}
    </div>
  );
}
