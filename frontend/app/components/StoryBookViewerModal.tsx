import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Printer, Download, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { libraryStoryViewUrl, libraryStoryDownloadUrl } from "../lib/library";
import { api } from "../lib/api";
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

/** Dynamic loading of PDF.js from CDN */
const loadPdfJS = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.head.appendChild(script);
  });
};

/** Full-screen modal PDF/PPT viewer — 3D flipbook animation for PDFs. */
export function StoryBookViewerModal({
  bookId,
  title,
  token,
  printOnLoad = false,
  onClose,
  accent = "green",
  role = "STUDENT",
}: StoryBookViewerModalProps) {
  const handleClose = useCallback(async () => {
    if (role === "STUDENT" && token && bookId) {
      try {
        await api.updateBookStatus(token, bookId, "UNREAD");
      } catch (err) {
        console.error("Failed to reset reading status on close:", err);
      }
    }
    onClose();
  }, [role, token, bookId, onClose]);

  const handleMarkAsRead = useCallback(async () => {
    if (role === "STUDENT" && token && bookId) {
      try {
        await api.updateBookStatus(token, bookId, "READ");
      } catch (err) {
        console.error("Failed to update reading status to READ:", err);
      }
    }
    onClose();
  }, [role, token, bookId, onClose]);

  useEffect(() => {
    if (role === "STUDENT" && token && bookId) {
      api.updateBookStatus(token, bookId, "READING")
        .catch(console.error);
    }
  }, [role, token, bookId]);

  const accentSpin = accent === "orange" ? "text-[#FF9F1C]" : "text-[#8AC926]";
  const viewUrl = libraryStoryViewUrl(bookId, token);
  const isPpt = title.toLowerCase().endsWith(".ppt") || title.toLowerCase().endsWith(".pptx");
  
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // 3D Flipbook state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pagesDataUrls, setPagesDataUrls] = useState<Record<number, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  const renderingRef = useRef<Record<number, boolean>>({});

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
  }, []);

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (role === "ADMIN") return;
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const preventDoubleClick = (e: React.MouseEvent) => {
    if (e.detail > 1) {
      e.preventDefault();
    }
  };

  // Cursor drag / touch swipe navigation detection
  const touchStartRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ("button" in e && e.button !== 0) return; // Only track primary click
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    touchStartRef.current = clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartRef.current === null) return;
    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const diffX = touchStartRef.current - clientX;
    const threshold = 55; // drag threshold in pixels
    if (diffX > threshold) {
      handleNext();
    } else if (diffX < -threshold) {
      handlePrev();
    }
    touchStartRef.current = null;
  };

  // Determine mobile viewport status (phone/tablet vs desktop/laptop)
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Force currentPage to be even in desktop mode
  useEffect(() => {
    if (!isMobile) {
      setCurrentPage(prev => (prev % 2 === 0 ? prev : Math.max(0, prev - 1)));
    }
  }, [isMobile]);

  const playFlipSound = () => {
    try {
      const audio = new Audio("https://www.soundjay.com/misc/sounds/page-flip-01a.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
  };

  // Flip book navigation controls
  const totalSheets = Math.ceil((totalPages + 1) / 2);
  const currentSheetIndex = Math.floor(currentPage / 2);

  const handleNext = useCallback(() => {
    if (isMobile) {
      if (currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
        playFlipSound();
      }
    } else {
      if (currentSheetIndex < totalSheets - 1) {
        setCurrentPage(prev => {
          const next = prev + 2;
          if (next < totalPages) {
            playFlipSound();
            return next;
          }
          return prev;
        });
      }
    }
  }, [isMobile, currentPage, totalPages, currentSheetIndex, totalSheets]);

  const handlePrev = useCallback(() => {
    if (isMobile) {
      if (currentPage > 0) {
        setCurrentPage(prev => prev - 1);
        playFlipSound();
      }
    } else {
      if (currentPage > 0) {
        setCurrentPage(prev => {
          const prevPageVal = Math.max(0, prev - 2);
          if (prevPageVal !== prev) {
            playFlipSound();
          }
          return prevPageVal;
        });
      }
    }
  }, [isMobile, currentPage]);

  const nextRef = useRef(handleNext);
  const prevRef = useRef(handlePrev);
  useEffect(() => {
    nextRef.current = handleNext;
    prevRef.current = handlePrev;
  }, [handleNext, handlePrev]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      
      // Page turning keyboard navigation
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        nextRef.current();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        prevRef.current();
      }
      
      // Disable print and save shortcuts on main window
      if (role !== "ADMIN" && (e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (role !== "ADMIN") {
        e.preventDefault();
      }
    };

    const onGlobalMouseDown = (e: MouseEvent) => {
      if (role !== "ADMIN" && e.button === 2) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    if (role !== "ADMIN") {
      window.addEventListener("contextmenu", onContextMenu, true);
      window.addEventListener("mousedown", onGlobalMouseDown, true);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("mousedown", onGlobalMouseDown, true);
    };
  }, [handleClose, role]);

  // Render individual PDF pages dynamically
  const renderPage = useCallback(async (pdfInstance: any, pageNum: number) => {
    if (renderingRef.current[pageNum] || pagesDataUrls[pageNum]) return;
    renderingRef.current[pageNum] = true;
    try {
      const page = await pdfInstance.getPage(pageNum + 1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        renderingRef.current[pageNum] = false;
        return;
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPagesDataUrls(prev => ({ ...prev, [pageNum]: dataUrl }));
    } catch (err) {
      console.error(`Failed to render page ${pageNum}:`, err);
      renderingRef.current[pageNum] = false;
    }
  }, [pagesDataUrls]);

  // Load PDF document / PowerPoint iframe
  useEffect(() => {
    if (isPpt) {
      setBlobUrl(viewUrl);
      setLoading(false);
      return;
    }
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
        return res.arrayBuffer();
      })
      .then(async (arrayBuffer) => {
        if (cancelled) return;
        
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);

        try {
          const pdfjsLib = await loadPdfJS();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          if (cancelled) return;
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setPdfPages(pdf.numPages);
        } catch (pdfError) {
          console.error("PDF.js loading failed", pdfError);
          // Fallback to standard PDF regex count
          let pages = 10;
          try {
            const text = new TextDecoder("ascii").decode(new Uint8Array(arrayBuffer));
            const matches = [...text.matchAll(/\/Count\s+(\d+)/g)];
            if (matches.length > 0) {
              const lastMatch = matches[matches.length - 1];
              pages = parseInt(lastMatch[1], 10) || 10;
            }
          } catch (e) {
            console.error("Failed to parse PDF page count:", e);
          }
          setPdfPages(pages);
          setTotalPages(pages);
        }
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
  }, [viewUrl, revokeBlob, isPpt]);

  // Load-ahead pages caching trigger
  useEffect(() => {
    if (!pdfDoc) return;
    const pagesToRender = isMobile 
      ? [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
      : [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, currentPage + 3];
    
    pagesToRender.forEach(pageNum => {
      if (pageNum >= 0 && pageNum < totalPages && !pagesDataUrls[pageNum]) {
        renderPage(pdfDoc, pageNum);
      }
    });
  }, [pdfDoc, currentPage, isMobile, totalPages, renderPage, pagesDataUrls]);

  // Print support for admins (using invisible iframe)
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

  const handleDownload = () => {
    const downloadUrl = libraryStoryDownloadUrl(bookId, token);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${title}`}
      onClick={handleClose}
      onContextMenu={(e) => role !== "ADMIN" && e.preventDefault()}
      onMouseDown={preventDoubleClick}
    >
      <div
        className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <h3 className="font-sans font-extrabold text-sm text-slate-900 truncate pr-2">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && !loading && !loadError && (role === "ADMIN") && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </>
            )}
            {blobUrl && !loading && !loadError && role === "STUDENT" && (
              <button
                type="button"
                onClick={handleMarkAsRead}
                className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Finished Reading
              </button>
            )}
            <ModalCloseButton onClick={handleClose} />
          </div>
        </div>

        <div 
          className="relative flex-1 min-h-0 bg-slate-950 overflow-hidden" 
          onContextMenu={(e) => role !== "ADMIN" && e.preventDefault()}
          onMouseDown={(e) => {
            handleContainerMouseDown(e);
            handleTouchStart(e);
          }}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Injecting CSS 3D transforms stylesheet for flipbook layout */}
          <style dangerouslySetInnerHTML={{ __html: `
            .book-container {
              position: relative;
              width: 100%;
              height: 100%;
              perspective: 2000px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .book-3d {
              position: relative;
              width: 100%;
              height: 100%;
              max-width: 900px;
              aspect-ratio: 1.414 / 1;
              background: #0f172a;
              border-radius: 12px;
              box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.7);
              transform-style: preserve-3d;
            }
            @media (max-width: 1023px) {
              .book-3d {
                aspect-ratio: 0.707 / 1;
                max-width: 450px;
              }
            }
            .book-spine {
              position: absolute;
              left: 50%;
              top: 0;
              bottom: 0;
              width: 4px;
              transform: translateX(-50%) translateZ(1px);
              background: linear-gradient(to right, rgba(0,0,0,0.3), rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3));
              z-index: 50;
            }
            .book-sheet {
              position: absolute;
              right: 0;
              top: 0;
              width: 50%;
              height: 100%;
              transform-origin: left center;
              transform-style: preserve-3d;
              transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
              will-change: transform;
            }
            .book-page-front,
            .book-page-back {
              position: absolute;
              inset: 0;
              backface-visibility: hidden;
              background: #ffffff;
              box-shadow: inset 3px 0 20px rgba(0,0,0,0.06), 0 5px 15px rgba(0,0,0,0.08);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              overflow: hidden;
              border-radius: 0 8px 8px 0;
              border: 1px solid rgba(0,0,0,0.08);
            }
            .book-page-back {
              transform: rotateY(180deg);
              border-radius: 8px 0 0 8px;
              box-shadow: inset -3px 0 20px rgba(0,0,0,0.06), 0 5px 15px rgba(0,0,0,0.08);
            }
            .book-page-front::after {
              content: "";
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              width: 20px;
              background: linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0));
              pointer-events: none;
            }
            .book-page-back::after {
              content: "";
              position: absolute;
              top: 0;
              bottom: 0;
              right: 0;
              width: 20px;
              background: linear-gradient(to left, rgba(0,0,0,0.12), rgba(0,0,0,0));
              pointer-events: none;
            }
            .book-page-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              user-select: none;
              -webkit-user-drag: none;
            }
            .book-cover-left {
              position: absolute;
              left: 0;
              top: 0;
              width: 50%;
              height: 100%;
              background: linear-gradient(135deg, #1e293b, #0f172a);
              border-radius: 8px 0 0 8px;
              border: 1px solid rgba(255,255,255,0.05);
              box-shadow: inset -2px 0 10px rgba(0,0,0,0.4);
            }
            .book-cover-right {
              position: absolute;
              right: 0;
              top: 0;
              width: 50%;
              height: 100%;
              background: linear-gradient(135deg, #1e293b, #0f172a);
              border-radius: 0 8px 8px 0;
              border: 1px solid rgba(255,255,255,0.05);
              box-shadow: inset 2px 0 10px rgba(0,0,0,0.4);
            }
          ` }} />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 z-10 bg-slate-950">
              <Loader2 className={`w-8 h-8 animate-spin ${accentSpin}`} />
              <p className="text-xs font-semibold">Loading story book…</p>
            </div>
          )}
          {loadError && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-slate-950">
              <p className="text-sm font-semibold text-red-300 text-center">{loadError}</p>
            </div>
          )}
          
          {blobUrl && !loadError && !loading && (
            <>
              {isPpt ? (
                <div className="absolute inset-0 w-full h-full">
                  <iframe
                    ref={iframeRef}
                    title={title}
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`}
                    className="w-full h-full border-0 bg-white"
                    style={{ pointerEvents: "auto" }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
                  {/* Invisible print-iframe for admins */}
                  {role === "ADMIN" && (
                    <iframe
                      ref={iframeRef}
                      title={`${title}-print`}
                      src={blobUrl}
                      className="hidden"
                      style={{ display: "none", width: 0, height: 0 }}
                    />
                  )}
                  
                  <div className="book-container">
                    <div className="book-3d">
                      {!isMobile && (
                        <>
                          <div className="book-cover-left" />
                          <div className="book-cover-right" />
                          <div className="book-spine" />
                        </>
                      )}
                      
                      {isMobile ? (
                        <div className="absolute inset-0 w-full h-full flex flex-col justify-center items-center overflow-hidden">
                          {pagesDataUrls[currentPage] ? (
                            <img
                              src={pagesDataUrls[currentPage]}
                              alt={`Page ${currentPage + 1}`}
                              className="max-w-full max-h-full object-contain shadow-2xl rounded-md"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className={`w-6 h-6 animate-spin ${accentSpin}`} />
                              <p className="text-2xs text-slate-400 font-medium">Loading page...</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        Array.from({ length: totalSheets }).map((_, S) => {
                          const isFlipped = S < currentSheetIndex;
                          let zIndex = isFlipped ? S : totalSheets - S;
                          if (S === currentSheetIndex || S === currentSheetIndex - 1) {
                            zIndex = totalSheets + 10;
                          }
                          const frontPageNum = 2 * S;
                          const backPageNum = 2 * S + 1;

                          return (
                            <div
                              key={S}
                              className="book-sheet"
                              style={{
                                zIndex,
                                transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
                                pointerEvents: (S === currentSheetIndex || S === currentSheetIndex - 1) ? "auto" : "none"
                              }}
                            >
                              <div className="book-page-front">
                                {frontPageNum < totalPages ? (
                                  pagesDataUrls[frontPageNum] ? (
                                    <img
                                      src={pagesDataUrls[frontPageNum]}
                                      alt={`Page ${frontPageNum + 1}`}
                                      className="book-page-img"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-2">
                                      <Loader2 className={`w-5 h-5 animate-spin ${accentSpin}`} />
                                      <p className="text-3xs text-slate-400 font-medium">Loading...</p>
                                    </div>
                                  )
                                ) : (
                                  <div className="w-full h-full bg-slate-50" />
                                )}
                              </div>
                              <div className="book-page-back">
                                {backPageNum < totalPages ? (
                                  pagesDataUrls[backPageNum] ? (
                                    <img
                                      src={pagesDataUrls[backPageNum]}
                                      alt={`Page ${backPageNum + 1}`}
                                      className="book-page-img"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-2">
                                      <Loader2 className={`w-5 h-5 animate-spin ${accentSpin}`} />
                                      <p className="text-3xs text-slate-400 font-medium">Loading...</p>
                                    </div>
                                  )
                                ) : (
                                  <div className="w-full h-full bg-slate-50" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Left Page Flip Trigger Zone */}
                    <div
                      onClick={handlePrev}
                      className={`absolute left-0 top-0 bottom-0 ${isMobile ? "w-[12%]" : "w-1/2"} flex items-center justify-start pl-4 cursor-pointer z-50 group transition-all duration-300 ${currentPage > 0 ? "" : "pointer-events-none opacity-0"}`}
                    >
                      {!isMobile && (
                        <div className="p-3 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-800 shadow-lg backdrop-blur-sm transition-all duration-200">
                          <ChevronLeft className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Right Page Flip Trigger Zone */}
                    <div
                      onClick={handleNext}
                      className={`absolute right-0 top-0 bottom-0 ${isMobile ? "w-[12%]" : "w-1/2"} flex items-center justify-end pr-4 cursor-pointer z-50 group transition-all duration-300 ${isMobile ? (currentPage < totalPages - 1) : (currentSheetIndex < totalSheets - 1) ? "" : "pointer-events-none opacity-0"}`}
                    >
                      {!isMobile && (
                        <div className="p-3 rounded-full bg-white/10 hover:bg-white/90 text-white hover:text-slate-800 shadow-lg backdrop-blur-sm transition-all duration-200">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Page Indicator Footer */}
                  <div 
                    className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-400 select-none shrink-0 z-40 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/40"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentPage === 0}
                      className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    
                    {isMobile ? (
                      <span>Page {currentPage + 1} of {totalPages}</span>
                    ) : (
                      <span>
                        {currentPage === 0 ? "Cover (Page 1)" : `Pages ${currentPage} - ${Math.min(currentPage + 1, totalPages)}`} of {totalPages}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isMobile ? (currentPage >= totalPages - 1) : (currentSheetIndex >= totalSheets - 1)}
                      className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
