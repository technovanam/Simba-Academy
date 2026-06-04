import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

export const ADMIN_LIST_PAGE_SIZE = 5;

export const adminListContainerClass =
  "bg-white rounded-2xl border border-slate-200 px-2 sm:px-3 pt-2.5 sm:pt-3 pb-2 sm:pb-3 space-y-1.5";

export const adminListRowClass =
  "flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-colors";

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

export function useAdminPagination<T>(items: T[], deps: unknown[] = []) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_LIST_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * ADMIN_LIST_PAGE_SIZE;
  const paginatedItems = items.slice(pageStart, pageStart + ADMIN_LIST_PAGE_SIZE);
  const pageNumbers = buildPageNumbers(safePage, totalPages);
  const rangeStart = items.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + ADMIN_LIST_PAGE_SIZE, items.length);

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

export function PillSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  ariaLabel: string;
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
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 pl-3.5 pr-2.5 py-2 rounded-full border border-[#8AC926] bg-white text-xs font-bold text-slate-800 hover:bg-[#8AC926]/5 transition min-w-[128px] max-w-[168px] justify-between"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-700 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[168px] py-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
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
                  o.id === value
                    ? "bg-[#8AC926]/15 text-[#5a8218]"
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

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="relative w-[220px] sm:w-[260px]">
      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none focus:border-[#8AC926] placeholder-slate-400 transition-all"
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
  if (total === 0) return null;

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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-2xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>
        <div className="flex items-center gap-0.5 mx-1">
          {pageNumbers.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-2xs font-bold text-slate-400 select-none">
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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-2xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
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
