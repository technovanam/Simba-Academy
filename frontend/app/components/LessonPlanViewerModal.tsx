import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_URL, type LessonPlan } from "../lib/api";
import { ModalCloseButton } from "./ModalCloseButton";

interface LessonPlanViewerModalProps {
  plan: LessonPlan;
  onClose: () => void;
}

/**
 * Lesson Plan Viewer Modal — if the plan has a fileUrl (PDF/Word),
 * it fetches the file and embeds it in an iframe as a PDF viewer.
 * Otherwise it shows the plan title and materials text.
 */
export function LessonPlanViewerModal({
  plan,
  onClose,
}: LessonPlanViewerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);
  const handleOverlayWheel = (e: React.WheelEvent) => {
    if (iframeRef.current) {
      const event = new WheelEvent("wheel", {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        bubbles: true,
        cancelable: true,
      });
      iframeRef.current.dispatchEvent(event);
    }
  };

  // Fetch the file and create a blob URL
  useEffect(() => {
    if (!plan.fileUrl) return;

    let cancelled = false;
    setLoading(true);
    setLoadError("");
    revokeBlob();

    const fullUrl = plan.fileUrl.startsWith("/") ? `${API_URL}${plan.fileUrl}` : plan.fileUrl;
    fetch(fullUrl, { credentials: "omit" })
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
        setLoadError(
          err instanceof Error ? err.message : "Could not load the document."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      revokeBlob();
    };
  }, [plan.fileUrl, revokeBlob]);

  // Lock body scroll, ESC to close, & Security
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Disable print and save shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu, true);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [onClose]);

  useEffect(() => {
    if (!blobUrl || !iframeRef.current) return;
    const iframe = iframeRef.current;
    
    const applyProtections = () => {
      try {
        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframeWindow?.document;
        if (iframeDoc) {
          iframeDoc.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, true);
          iframeDoc.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);
        }
        
        if (iframeWindow) {
          iframeWindow.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, true);
          iframeWindow.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);
        }
      } catch (err) {
        // ignore CORS if any
      }
    };

    iframe.addEventListener("load", applyProtections);
    applyProtections();
    const t1 = setTimeout(applyProtections, 300);
    const t2 = setTimeout(applyProtections, 1000);

    return () => {
      iframe.removeEventListener("load", applyProtections);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [blobUrl]);

  const hasFile = Boolean(plan.fileUrl);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${plan.title}`}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`flex flex-col flex-1 min-h-0 w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-full ${
          hasFile ? "max-w-6xl" : "max-w-3xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <h3 className="font-sans font-extrabold text-sm text-slate-900 pr-2 break-words max-w-[85%]">
            {plan.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <ModalCloseButton onClick={onClose} />
          </div>
        </div>

        {/* Body */}
        {hasFile ? (
          <div 
            className="relative flex-1 min-h-0 bg-white"
            onContextMenu={(e) => e.preventDefault()}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-800 bg-white/90 z-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#8AC926]" />
                <p className="text-xs font-semibold">Loading document…</p>
              </div>
            )}
            {loadError && !loading && (
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-white z-20">
                <p className="text-sm font-semibold text-red-500 text-center">
                  {loadError}
                </p>
              </div>
            )}
            {blobUrl && !loadError && (
              plan.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                <div 
                  className="w-full h-full overflow-y-auto overflow-x-hidden pdf-scrollbar bg-white"
                  style={{ paddingRight: "2px" }}
                >
                  <div className="w-full h-[4500px] overflow-hidden relative">
                    <iframe
                      ref={iframeRef}
                      title={plan.title}
                      scrolling="no"
                      src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="absolute inset-y-0 left-0 border-0 bg-white block"
                      style={{ pointerEvents: "none", height: "4500px", width: "100%" }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-555">File type not supported for preview.</p>
              )
            )}
          </div>
        ) : (
          /* ── Fallback: text only (no file attached) ── */
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 select-none">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Lesson plan
              </h4>
              <p className="text-sm text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">
                {plan.content || plan.title}
              </p>
            </div>

            {plan.materialsNeeded && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Materials needed
                </h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium">
                  {plan.materialsNeeded}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
