import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Printer, Download, Loader2 } from "lucide-react";
import { libraryStoryViewUrl, libraryStoryDownloadUrl } from "../lib/library";
import { ModalCloseButton } from "./ModalCloseButton";

interface StoryBookActionsProps {
  bookId: string;
  token: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  title?: string;
  variant?: "student" | "teacher" | "admin";
}

export function StoryBookActions({
  bookId,
  token,
  role,
  title = "Story book",
  variant = "student",
}: StoryBookActionsProps) {
  const viewUrl = libraryStoryViewUrl(bookId, token);
  const downloadUrl = role === "ADMIN" ? libraryStoryDownloadUrl(bookId, token) : null;

  const [viewerOpen, setViewerOpen] = useState(false);
  const [printOnLoad, setPrintOnLoad] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const btnBase =
    variant === "student"
      ? "px-3.5 py-2 rounded-2xl font-sans font-black text-2xs transition shadow-md flex items-center gap-1"
      : "px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border transition";

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setPrintOnLoad(false);
    setLoadError("");
    revokeBlob();
  }, [revokeBlob]);

  const openViewer = useCallback(
    (shouldPrint: boolean) => {
      setPrintOnLoad(shouldPrint);
      setLoadError("");
      revokeBlob();
      setViewerOpen(true);
    },
    [revokeBlob]
  );

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

  useEffect(() => {
    if (!viewerOpen) return;

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetch(viewUrl, { credentials: "omit" })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to load (${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load this story book.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewerOpen, viewUrl]);

  useEffect(() => {
    if (!printOnLoad || !blobUrl || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const handleLoad = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* print may be blocked in some browsers */
      }
      setPrintOnLoad(false);
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [printOnLoad, blobUrl]);

  const handlePrintInViewer = () => {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      /* ignore */
    }
  };

  const handleAdminDownload = async () => {
    if (!downloadUrl) return;
    try {
      const res = await fetch(downloadUrl, { credentials: "omit" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title.replace(/[^\w\s.-]/g, "_") || "storybook";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setLoadError("Download failed. Please try again.");
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openViewer(false)}
          className={
            variant === "student"
              ? `${btnBase} bg-[#ff9f1c] hover:bg-[#ffb703] text-white shadow-[#ff9f1c]/10`
              : `${btnBase} bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100`
          }
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          type="button"
          onClick={() => openViewer(true)}
          className={
            variant === "student"
              ? `${btnBase} bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`
              : `${btnBase} bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100`
          }
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
        {downloadUrl && (
          <button
            type="button"
            onClick={handleAdminDownload}
            className={`${btnBase} bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100`}
          >
            <Download className="w-3.5 h-3.5" />
            Download
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
                {blobUrl && !loading && !loadError && (
                  <button
                    type="button"
                    onClick={handlePrintInViewer}
                    className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                )}
                <ModalCloseButton onClick={closeViewer} />
              </div>
            </div>

            <div className="relative flex-1 min-h-0 bg-slate-100">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
                  <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
                  <p className="text-xs font-semibold">Loading story book…</p>
                </div>
              )}
              {loadError && !loading && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <p className="text-sm font-semibold text-red-600 text-center">{loadError}</p>
                </div>
              )}
              {blobUrl && !loadError && (
                <iframe
                  ref={iframeRef}
                  title={title}
                  src={blobUrl}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
