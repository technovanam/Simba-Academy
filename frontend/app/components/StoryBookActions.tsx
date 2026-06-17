import { useCallback, useState } from "react";
import { BookOpen, Printer, Download, Eye } from "lucide-react";
import { libraryStoryDownloadUrl } from "../lib/library";
import { StoryBookViewerModal } from "./StoryBookViewerModal";

interface StoryBookActionsProps {
  bookId: string;
  token: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  title?: string;
  variant?: "student" | "teacher" | "admin";
  onViewClose?: () => void;
}

export function StoryBookActions({
  bookId,
  token,
  role,
  title = "Story book",
  variant = "student",
  onViewClose,
}: StoryBookActionsProps) {
  const downloadUrl = role === "ADMIN" ? libraryStoryDownloadUrl(bookId, token) : null;

  const [viewerOpen, setViewerOpen] = useState(false);
  const [printOnLoad, setPrintOnLoad] = useState(false);
  const [loadError, setLoadError] = useState("");

  const btnBase =
    variant === "student"
      ? "px-3.5 py-2 rounded-2xl font-sans font-black text-2xs transition shadow-md flex items-center gap-1"
      : "px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border transition";

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setPrintOnLoad(false);
    setLoadError("");
    if (onViewClose) {
      onViewClose();
    }
  }, [onViewClose]);

  const openViewer = useCallback((shouldPrint: boolean) => {
    setPrintOnLoad(shouldPrint);
    setLoadError("");
    setViewerOpen(true);
  }, []);

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

  if (variant === "admin") {
    return (
      <>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openViewer(false)}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          {role === "ADMIN" && (
            <button
              type="button"
              onClick={() => openViewer(true)}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          {downloadUrl && (
            <button
              type="button"
              onClick={handleAdminDownload}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>

        {loadError && !viewerOpen && (
          <p className="text-2xs font-semibold text-red-600 mt-1 absolute">{loadError}</p>
        )}

        {viewerOpen && (
          <StoryBookViewerModal
            bookId={bookId}
            title={title}
            token={token}
            printOnLoad={printOnLoad}
            onClose={closeViewer}
            accent="green"
            role={role}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => openViewer(false)}
          className={
            variant === "student"
              ? `${btnBase} bg-[#ff9f1c] hover:bg-[#ffb703] text-white shadow-[#ff9f1c]/10`
              : `${btnBase} bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100`
          }
        >
          {role === "STUDENT" ? (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              Reading
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              View
            </>
          )}
        </button>
        {role === "ADMIN" && (
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
        )}
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

      {loadError && !viewerOpen && (
        <p className="text-2xs font-semibold text-red-600 mt-1">{loadError}</p>
      )}

      {viewerOpen && (
        <StoryBookViewerModal
          bookId={bookId}
          title={title}
          token={token}
          printOnLoad={printOnLoad}
          onClose={closeViewer}
          accent={variant === "student" ? "orange" : "green"}
          role={role}
        />
      )}
    </>
  );
}
