import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { libraryStoryViewUrl } from "../lib/library";
import { ModalCloseButton } from "./ModalCloseButton";

export interface StoryBookViewerModalProps {
  bookId: string;
  title: string;
  token: string;
  printOnLoad?: boolean;
  onClose: () => void;
  accent?: "green" | "orange";
  role?: "ADMIN" | "TEACHER" | "STUDENT";
}

/** Full-screen modal PDF/PPT viewer — view and print only (matches admin story viewer). */
export function StoryBookViewerModal({
  bookId,
  title,
  token,
  printOnLoad = false,
  onClose,
  accent = "green",
  role = "STUDENT",
}: StoryBookViewerModalProps) {
  const accentSpin = accent === "orange" ? "text-[#FF9F1C]" : "text-[#8AC926]";
  const viewUrl = libraryStoryViewUrl(bookId, token);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    revokeBlob();

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
      revokeBlob();
    };
  }, [viewUrl, revokeBlob]);

  useEffect(() => {
    if (role !== "ADMIN" || !printOnLoad || !blobUrl || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const handleLoad = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* print may be blocked */
      }
    };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [printOnLoad, blobUrl, role]);

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${title}`}
      onClick={onClose}
    >
      <div
        className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <h3 className="font-sans font-extrabold text-sm text-slate-900 truncate pr-2">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {role === "ADMIN" && blobUrl && !loading && !loadError && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            )}
            <ModalCloseButton onClick={onClose} />
          </div>
        </div>

        <div className="relative flex-1 min-h-0 bg-slate-800/95">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 z-10">
              <Loader2 className={`w-8 h-8 animate-spin ${accentSpin}`} />
              <p className="text-xs font-semibold">Loading story book…</p>
            </div>
          )}
          {loadError && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
              <p className="text-sm font-semibold text-red-300 text-center">{loadError}</p>
            </div>
          )}
          {blobUrl && !loadError && (
            <iframe
              ref={iframeRef}
              title={title}
              src={role === "ADMIN" ? blobUrl : `${blobUrl}#toolbar=0`}
              className="absolute inset-0 w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
