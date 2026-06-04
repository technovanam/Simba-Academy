import { useCallback, useEffect, useState } from "react";
import { Eye, Download, Printer, Loader2 } from "lucide-react";
import { resolveStorageUrl } from "../lib/storage";
import { ModalCloseButton } from "./ModalCloseButton";

interface GalleryItemActionsProps {
  imageUrl: string;
  title?: string;
  variant?: "admin";
  onEdit?: () => void;
}

export function GalleryItemActions({
  imageUrl,
  title = "Gallery photo",
  variant = "admin",
  onEdit,
}: GalleryItemActionsProps) {
  const src = resolveStorageUrl(imageUrl);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const btnBase =
    variant === "admin"
      ? "px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border transition"
      : "";

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setLoadError("");
  }, []);

  useEffect(() => {
    if (!viewerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerOpen, closeViewer]);

  const handleDownload = async () => {
    setDownloading(true);
    setLoadError("");
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const ext = imageUrl.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase() ?? "jpg";
      const base = title.replace(/[^\w\s.-]/g, "_").trim() || "gallery-photo";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${base}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setLoadError("Download failed. Please try again.");
      setViewerOpen(true);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const w = window.open(src, "_blank", "noopener,noreferrer");
    w?.addEventListener("load", () => {
      try {
        w?.print();
      } catch {
        /* ignore */
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className={`${btnBase} bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100`}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className={`${btnBase} bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100`}
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
        <button
          type="button"
          disabled={downloading}
          onClick={handleDownload}
          className={`${btnBase} bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50`}
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Download
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={`${btnBase} bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100`}
          >
            Edit
          </button>
        )}
      </div>

      {viewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${title}`}
          onClick={closeViewer}
        >
          <div
            className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-sans font-extrabold text-sm text-slate-900 truncate pr-2">{title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download
                </button>
                <ModalCloseButton onClick={closeViewer} />
              </div>
            </div>

            <div className="relative flex-1 min-h-0 bg-slate-100 flex items-center justify-center p-4">
              {loadError && (
                <p className="text-sm font-semibold text-red-600 text-center">{loadError}</p>
              )}
              {!loadError && (
                <img
                  src={src}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
