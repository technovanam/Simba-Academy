import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { libraryStoryViewUrl } from "../lib/library";

interface StoryBookInlineViewerProps {
  bookId: string;
  title: string;
  token: string;
  printOnLoad?: boolean;
  onBack: () => void;
  /** Portal accent for back link and loader */
  accent?: "green" | "orange";
}

/** In-page story viewer (same tab) — view and print only. */
export function StoryBookInlineViewer({
  bookId,
  title,
  token,
  printOnLoad = false,
  onBack,
  accent = "green",
}: StoryBookInlineViewerProps) {
  const accentHover = accent === "orange" ? "hover:text-[#FF9F1C]" : "hover:text-[#8AC926]";
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
    if (!printOnLoad || !blobUrl || !iframeRef.current) return;
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
  }, [printOnLoad, blobUrl]);

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[70vh]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition ${accentHover}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to library
        </button>
        <h3 className="font-sans font-extrabold text-sm text-slate-900 truncate flex-1 text-center px-2">
          {title}
        </h3>
        {blobUrl && !loading && !loadError && (
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        )}
      </div>

      <div className="relative flex-1 min-h-[60vh] bg-slate-100">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
            <Loader2 className={`w-8 h-8 animate-spin ${accentSpin}`} />
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
  );
}
