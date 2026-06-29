import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import {
  Folder,
  FileText,
  Home,
  Clock,
  Eye,
  Loader2,
  ChevronRight,
  Search,
  Settings,
  Shield,
  ShieldX,
  ShieldOff,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import { api, formatApiError, type DriveItem, type DriveAncestor } from "../lib/api";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import {
  adminActionBtnDeleteIcon,
  adminActionBtnSettings,
  adminActionBtnSettingsIcon,
  adminActionBtnViewIcon,
} from "./AdminListUi";
import { AdminModal } from "./AdminModal";
import { STUDENT_CLASS_OPTIONS } from "../lib/constants";

export interface DriveLibraryPanelProps {
  token: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  classFilter?: string;
  /** Extra controls rendered in the header row next to search (e.g. class filter). */
  headerExtras?: ReactNode;
}

const FILE_TYPE_OPTIONS = [
  { id: "ALL" as const },
  { id: "FOLDER" as const },
  { id: "PDF" as const },
  { id: "DOC" as const },
  { id: "DOCX" as const },
  { id: "PPT" as const },
];

type FileTypeFilter = "ALL" | "FOLDER" | "PDF" | "DOC" | "DOCX" | "PPT" | "IMAGE";

const MIME_MATCHERS: Record<Exclude<FileTypeFilter, "ALL">, (m: string) => boolean> = {
  FOLDER: (m) => m === "application/vnd.google-apps.folder",
  PDF: (m) => m.includes("pdf"),
  DOC: (m) => m.includes("google-apps.document"),
  DOCX: (m) => m.includes("wordprocessingml") || m.includes("msword"),
  PPT: (m) => m.includes("presentation") || m.includes("powerpoint"),
  IMAGE: (m) => m.startsWith("image/"),
};

function ThumbnailImage({ item }: { item: DriveItem }) {
  const [error, setError] = useState(false);
  const isFolderItem = item.mimeType === "application/vnd.google-apps.folder";

  if (isFolderItem) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-amber-400">
        <Folder className="w-16 h-16 fill-amber-400" />
      </div>
    );
  }

  if (item.thumbnailLink && !error) {
    const isPPT = item.mimeType.includes("presentation") || item.mimeType.includes("powerpoint");
    return (
      <img
        src={item.thumbnailLink}
        alt={item.name}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className={`w-full h-full ${isPPT ? "object-contain p-2" : "object-cover"}`}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
      {item.mimeType.includes("image") ? (
        <FileText className="w-16 h-16 text-sky-300" />
      ) : item.mimeType.includes("pdf") ? (
        <FileText className="w-16 h-16 text-rose-300" />
      ) : (
        <FileText className="w-16 h-16 text-blue-300" />
      )}
    </div>
  );
}

function DriveTableColGroup({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <colgroup>
        <col style={{ width: "28%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "22%" }} />
        <col style={{ width: "22%" }} />
      </colgroup>
    );
  }
  return (
    <colgroup>
      <col style={{ width: "32%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "36%" }} />
    </colgroup>
  );
}

function DriveTableHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <thead className="text-slate-500 font-medium text-xs">
      <tr>
        <th className="px-4 py-3 font-semibold">Name</th>
        <th className="px-4 py-3 font-semibold">Type</th>
        <th className="px-4 py-3 font-semibold">Date Modified</th>
        {isAdmin && <th className="px-4 py-3 font-semibold">Access</th>}
        <th className="px-4 py-3 font-semibold text-right">Actions</th>
      </tr>
    </thead>
  );
}

const DRIVE_ACCENT = {
  green: {
    focusBorder: "focus:border-[#8AC926]",
    pillActive: "bg-[#8AC926]/15 text-[#5a8218] shadow-xs",
    link: "text-[#8AC926]",
    folderHover: "hover:text-[#8AC926]",
    btnPrimary: "bg-[#8AC926] text-white hover:bg-[#78B020] shadow-md shadow-[#8AC926]/10",
    btnSecondary: "bg-[#8AC926]/10 border border-[#8AC926]/35 text-[#5a8218] hover:bg-[#8AC926]/20",
    checkbox: "hover:border-[#8AC926] checked:border-[#8AC926] checked:bg-[#8AC926]",
    viewerAccent: "green" as const,
  },
  blue: {
    focusBorder: "focus:border-blue-500",
    pillActive: "bg-blue-600/15 text-blue-700 shadow-xs",
    link: "text-blue-600",
    folderHover: "hover:text-blue-600",
    btnPrimary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20",
    btnSecondary: "bg-blue-600/10 border border-blue-600/35 text-blue-700 hover:bg-blue-600/20",
    checkbox: "hover:border-blue-600 checked:border-blue-600 checked:bg-blue-600",
    viewerAccent: "blue" as const,
  },
  orange: {
    focusBorder: "focus:border-[#FF9F1C]",
    pillActive: "bg-[#FF9F1C]/15 text-[#c77a00] shadow-xs",
    link: "text-[#FF9F1C]",
    folderHover: "hover:text-[#FF9F1C]",
    btnPrimary: "bg-[#FF9F1C] text-white hover:bg-[#e88f0a] shadow-md shadow-[#FF9F1C]/20",
    btnSecondary: "bg-[#FF9F1C]/10 border border-[#FF9F1C]/35 text-[#c77a00] hover:bg-[#FF9F1C]/20",
    checkbox: "hover:border-[#FF9F1C] checked:border-[#FF9F1C] checked:bg-[#FF9F1C]",
    viewerAccent: "orange" as const,
  },
} as const;

function driveAccentForRole(role: DriveLibraryPanelProps["role"]) {
  if (role === "TEACHER") return DRIVE_ACCENT.blue;
  if (role === "STUDENT") return DRIVE_ACCENT.orange;
  return DRIVE_ACCENT.green;
}

export function DriveLibraryPanel({ token, role, classFilter, headerExtras }: DriveLibraryPanelProps) {
  const accent = driveAccentForRole(role);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [ancestors, setAncestors] = useState<DriveAncestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("ALL");

  const [viewerFile, setViewerFile] = useState<DriveItem | null>(null);

  // Cache to make folder navigation instant
  const cacheRef = useRef<Record<string, { items: DriveItem[]; ancestors: DriveAncestor[] }>>({});

  // Access Rule Modal State
  const [accessItem, setAccessItem] = useState<DriveItem | null>(null);
  const [accessForm, setAccessForm] = useState<{
    audiences: ("TEACHER" | "STUDENT")[];
    classes: string[];
  }>({
    audiences: ["TEACHER", "STUDENT"],
    classes: [],
  });
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Revoke confirm state
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const fetchDocuments = useCallback(async (signal: { cancelled: boolean }) => {
    if (!token) return;

    const cacheKey = `${currentFolderId || "root"}|${searchQuery}|${fileTypeFilter}|${classFilter ?? ""}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setItems(cached.items);
      setAncestors(cached.ancestors);
      if (!signal.cancelled) setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const data = await api.browseDocuments(token, currentFolderId, searchQuery, undefined, classFilter);
      if (signal.cancelled) return;

      let finalItems = data;
      if (fileTypeFilter !== "ALL") {
        const matcher = MIME_MATCHERS[fileTypeFilter];
        finalItems = data.filter(item => matcher(item.mimeType));
      }

      let pathAncestors: DriveAncestor[] = [];
      if (currentFolderId && currentFolderId !== "root") {
        pathAncestors = await api.getDocumentAncestors(token, currentFolderId);
      }
      if (signal.cancelled) return;

      cacheRef.current[cacheKey] = { items: finalItems, ancestors: pathAncestors };
      
      setItems(finalItems);
      setAncestors(pathAncestors);
    } catch (err) {
      if (signal.cancelled) return;
      console.error("Failed to load documents:", err);
      setItems([]);
      setAncestors([]);
      setLoadError(
        formatApiError(
          err,
          "Failed to load documents. Please check your Google Drive configurations."
        )
      );
    } finally {
      if (!signal.cancelled) {
        setLoading(false);
      }
    }
  }, [token, currentFolderId, searchQuery, fileTypeFilter, classFilter]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchDocuments(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchDocuments]);

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessItem || !token) return;
    setIsSavingAccess(true);
    try {
      if (accessForm.audiences.length === 0) {
        setActionError("Please select at least one audience.");
        setIsSavingAccess(false);
        return;
      }
      
      const audience = accessForm.audiences.includes("TEACHER") && accessForm.audiences.includes("STUDENT")
        ? "BOTH"
        : accessForm.audiences.includes("TEACHER") ? "TEACHER" : "STUDENT";

      const targetClass = accessForm.classes.length > 0 
        ? accessForm.classes.join(",") 
        : null;

      await api.updateDriveAccessRule(token, accessItem.id, audience, targetClass, accessItem.name);
      
      // Update local item
      setItems((prev) => prev.map((item) => 
        item.id === accessItem.id 
          ? { ...item, accessRule: { audience, targetClass } }
          : item
      ));
      
      setAccessItem(null);
      setActionError("");
    } catch (err) {
      console.error(err);
      setActionError("Failed to update access rule.");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleRevokeAccess = async (fileId: string) => {
    if (!token) return;
    setActionError("");
    setRevokeLoading(true);
    try {
      await api.revokeDriveAccessRule(token, fileId);
      setItems((prev) => prev.map((item) => 
        item.id === fileId 
          ? { ...item, accessRule: null }
          : item
      ));
    } catch (err) {
      console.error(err);
      setActionError("Failed to revoke access rule.");
    } finally {
      setRevokeLoading(false);
      setRevokeTarget(null);
    }
  };

  const renderAccessBadge = (item: DriveItem) => {
    if (!item.accessRule) {
      return (
        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
          <Lock className="w-2.5 h-2.5 text-slate-400" />
          Access: None (Admin Only)
        </span>
      );
    }
    const { audience, targetClass } = item.accessRule;
    if (audience === "BOTH") {
      return (
        <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
          <Unlock className="w-2.5 h-2.5 text-emerald-500" />
          Access: Teachers & Students
        </span>
      );
    }
    if (audience === "TEACHER") {
      return (
        <span className="flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
          <Lock className="w-2.5 h-2.5 text-blue-500" />
          Access: Teachers Only
        </span>
      );
    }
    const classLabel = targetClass ? ` (${targetClass})` : "";
    return (
      <span className="flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
        <Lock className="w-2.5 h-2.5 text-purple-500" />
        Access: Students Only{classLabel}
      </span>
    );
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId === "root" ? null : folderId);
    setSearchQuery("");
  };

  const isFolder = (mimeType: string) => mimeType === "application/vnd.google-apps.folder";

  return (
    <AdminPageShell className="h-full flex flex-col min-h-0 overflow-hidden">
      <AdminPageHeader
        title="Story Library"
        description="Browse and view files and folders from Google Drive."
        actions={
          <>
            <div className="relative w-full min-w-0 sm:w-[260px] max-w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder="Search library…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none ${accent.focusBorder} placeholder-slate-400 transition-all`}
                aria-label="Search files and folders"
              />
            </div>
            <div className="flex flex-wrap bg-white rounded-full border border-slate-200 p-0.5 shadow-sm w-full sm:w-auto min-w-0">
              {FILE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFileTypeFilter(type.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition ${
                    fileTypeFilter === type.id
                      ? accent.pillActive
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {type.id}
                </button>
              ))}
            </div>
            {headerExtras}
          </>
        }
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl overflow-hidden shadow-sm shrink-0 w-fit max-w-full">
        <button
          type="button"
          onClick={() => handleFolderClick("root")}
          className={`flex items-center gap-1 font-bold ${accent.link} hover:underline shrink-0`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Library Home</span>
        </button>
        {ancestors.map((folder) => (
          <div key={folder.id} className="flex items-center gap-1.5 shrink-0 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => handleFolderClick(folder.id)}
              className="font-bold hover:underline truncate max-w-[120px] text-slate-700"
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      <AdminPageBody className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col animate-pulse">
            <div className="hidden xl:flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-x-auto shrink-0 border-b border-slate-200 bg-slate-50">
                <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                  <DriveTableColGroup isAdmin={role === "ADMIN"} />
                  <DriveTableHeader isAdmin={role === "ADMIN"} />
                </table>
              </div>
              <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto bg-white">
                <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                  <DriveTableColGroup isAdmin={role === "ADMIN"} />
                  <tbody className="divide-y divide-slate-100">
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
                          <div className="h-4 bg-slate-200 rounded w-48"></div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-3.5 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-3.5 bg-slate-200 rounded w-24"></div>
                      </td>
                      {role === "ADMIN" && (
                        <td className="px-4 py-4">
                          <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                        </td>
                      )}
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <div className="h-7 bg-slate-200 rounded-lg w-16"></div>
                          <div className="h-7 bg-slate-200 rounded-lg w-12"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="xl:hidden flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded-xl w-28 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : loadError || items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold border border-slate-200 flex-1 min-h-0 flex items-center justify-center">
            <p className={loadError ? "text-rose-700" : "text-slate-600"}>
              {loadError || (searchQuery ? "No matching files or folders found." : "This folder is empty.")}
            </p>
          </div>
        ) : (
          <div className={`bg-white ${role === "STUDENT" ? "" : "border border-slate-200 shadow-sm"} rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col`}>
            {role === "STUDENT" ? (
              <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto bg-white p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 content-start">
                  {items.map((item) => {
                    const isFolderItem = isFolder(item.mimeType);
                    return (
                      <div key={item.id} className="flex flex-col items-center gap-3 group">
                        {isFolderItem ? (
                          <button
                            type="button"
                            onClick={() => handleFolderClick(item.id)}
                            className="w-full aspect-[210/297] border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative bg-white flex flex-col"
                          >
                            <ThumbnailImage item={item} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewerFile(item)}
                            className="w-full aspect-[210/297] border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative bg-white flex flex-col"
                          >
                            <ThumbnailImage item={item} />
                          </button>
                        )}
                        
                        <div className="flex flex-col items-center justify-center gap-2 w-full px-2">
                          <h3 className="text-sm font-bold text-slate-800 text-center line-clamp-2" title={item.name}>
                            {item.name}
                          </h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="xl:hidden flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3">
                  <div className="space-y-3">
                    {items.map((item) => {
                      const isFolderItem = isFolder(item.mimeType);
                      const displayDate = new Date(item.createdTime).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      let mimeLabel = "File";
                      if (isFolderItem) mimeLabel = "Folder";
                      else if (item.mimeType.includes("pdf")) mimeLabel = "PDF Document";
                      else if (item.mimeType.includes("image")) mimeLabel = "Image File";
                      else if (item.mimeType.includes("google-apps.document") || item.mimeType.includes("word")) mimeLabel = "Document";
                      else if (item.mimeType.includes("google-apps.presentation") || item.mimeType.includes("powerpoint")) mimeLabel = "Presentation";
                      else if (item.mimeType.includes("google-apps.spreadsheet") || item.mimeType.includes("spreadsheet")) mimeLabel = "Spreadsheet";

                      return (
                        <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            {isFolderItem ? (
                              <Folder className="w-10 h-10 text-amber-400 shrink-0 fill-amber-400" />
                            ) : item.mimeType.includes("image") ? (
                              <FileText className="w-10 h-10 text-sky-500 shrink-0" />
                            ) : item.mimeType.includes("pdf") ? (
                              <FileText className="w-10 h-10 text-rose-500 shrink-0" />
                            ) : (
                              <FileText className="w-10 h-10 text-blue-500 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-slate-800 text-sm break-words leading-tight">
                                {item.name}
                              </h3>
                              <p className="text-3xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <span>{mimeLabel}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {displayDate}
                                </span>
                              </p>
                              {role === "ADMIN" && (
                                <div className="mt-1">{renderAccessBadge(item)}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 border-t border-slate-100/65 pt-2.5">
                            {isFolderItem ? (
                              <button
                                type="button"
                                onClick={() => handleFolderClick(item.id)}
                                className={`px-4 py-2 rounded-xl font-sans font-bold text-xs transition ${accent.btnPrimary}`}
                              >
                                Open Folder
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewerFile(item)}
                                className={`px-4 py-2 rounded-xl font-sans font-bold text-xs transition flex items-center gap-1 ${accent.btnSecondary}`}
                              >
                                <Eye className="w-4 h-4" /> View File
                              </button>
                            )}
                            {role === "ADMIN" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const aud = item.accessRule?.audience || "BOTH";
                                    const tClass = item.accessRule?.targetClass || "";
                                    setAccessItem(item);
                                    setAccessForm({
                                      audiences: aud === "BOTH" ? ["TEACHER", "STUDENT"] : [aud],
                                      classes: tClass ? tClass.split(",") : [],
                                    });
                                  }}
                                  className={adminActionBtnSettings}
                                  title="Access Settings"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                {item.accessRule && (
                                  <button
                                    type="button"
                                    onClick={() => setRevokeTarget(item.id)}
                                    className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-650 hover:bg-rose-100 transition"
                                    title="Revoke Access"
                                  >
                                    <ShieldOff className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Table View (hidden xl:block) */}
                <div className="hidden xl:flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="overflow-x-auto shrink-0 border-b border-slate-200 bg-slate-50">
                    <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                      <DriveTableColGroup isAdmin={role === "ADMIN"} />
                      <DriveTableHeader isAdmin={role === "ADMIN"} />
                    </table>
                  </div>
                  <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto bg-white">
                    <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                      <DriveTableColGroup isAdmin={role === "ADMIN"} />
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                          const isFolderItem = isFolder(item.mimeType);
                          const displayDate = new Date(item.createdTime).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                          let mimeLabel = "File";
                          if (isFolderItem) mimeLabel = "Folder";
                          else if (item.mimeType.includes("pdf")) mimeLabel = "PDF Document";
                          else if (item.mimeType.includes("image")) mimeLabel = "Image File";
                          else if (item.mimeType.includes("google-apps.document") || item.mimeType.includes("word")) mimeLabel = "Document";
                          else if (item.mimeType.includes("google-apps.presentation") || item.mimeType.includes("powerpoint")) mimeLabel = "Presentation";
                          else if (item.mimeType.includes("google-apps.spreadsheet") || item.mimeType.includes("spreadsheet")) mimeLabel = "Spreadsheet";

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-4 py-3 align-middle">
                                {isFolderItem ? (
                                  <button
                                    type="button"
                                    onClick={() => handleFolderClick(item.id)}
                                    className={`flex items-center gap-2.5 text-slate-800 ${accent.folderHover} transition font-bold text-sm text-left truncate w-full max-w-md`}
                                  >
                                    <Folder className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400" />
                                    <div className="flex flex-col truncate min-w-0">
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setViewerFile(item)}
                                    className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 transition font-bold text-sm text-left truncate w-full max-w-md"
                                  >
                                    {item.mimeType.includes("image") ? (
                                      <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                                    ) : item.mimeType.includes("pdf") ? (
                                      <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                                    ) : (
                                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                    )}
                                    <div className="flex flex-col truncate min-w-0">
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3 align-middle text-xs text-slate-600 font-medium">
                                {mimeLabel}
                              </td>
                              <td className="px-4 py-3 align-middle text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {displayDate}
                                </span>
                              </td>
                              {role === "ADMIN" && (
                                <td className="px-4 py-3 align-middle text-xs font-medium">
                                  {renderAccessBadge(item)}
                                </td>
                              )}
                              <td className="px-4 py-2 text-right align-middle">
                                <div className="flex items-center justify-end gap-1.5">
                                  {role === "ADMIN" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const aud = item.accessRule?.audience || "BOTH";
                                          const tClass = item.accessRule?.targetClass || "";
                                          
                                          setAccessItem(item);
                                          setAccessForm({
                                            audiences: aud === "BOTH" ? ["TEACHER", "STUDENT"] : [aud],
                                            classes: tClass ? tClass.split(",") : [],
                                          });
                                        }}
                                        className={adminActionBtnSettingsIcon}
                                        title="Access Settings"
                                      >
                                        <Settings className="w-4 h-4" />
                                      </button>
                                      {item.accessRule && (
                                        <button
                                          type="button"
                                          onClick={() => setRevokeTarget(item.id)}
                                          className={adminActionBtnDeleteIcon}
                                          title="Revoke Access"
                                        >
                                          <ShieldOff className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {!isFolderItem && (
                                    <button
                                      type="button"
                                      onClick={() => setViewerFile(item)}
                                      className={adminActionBtnViewIcon}
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </AdminPageBody>

      {viewerFile && (
        <DocumentViewerModal
          fileId={viewerFile.id}
          title={viewerFile.name}
          mimeType={viewerFile.mimeType}
          token={token}
          onClose={() => setViewerFile(null)}
          role={role}
          accent={accent.viewerAccent}
        />
      )}

      {/* Access Settings Modal */}
      <AdminModal
        open={!!accessItem}
        onClose={() => {
          if (!isSavingAccess) {
            setAccessItem(null);
            setActionError("");
          }
        }}
        title="Access Settings"
      >
        <form onSubmit={handleSaveAccess} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-slate-700 font-bold mb-3 text-2xs uppercase tracking-wider">Target Audience</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    checked={accessForm.audiences.includes("TEACHER")}
                    onChange={(e) => {
                      setAccessForm(prev => ({
                        ...prev,
                        audiences: e.target.checked 
                          ? [...prev.audiences, "TEACHER"]
                          : prev.audiences.filter(a => a !== "TEACHER")
                      }));
                    }}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-[#8AC926] checked:border-[#8AC926] checked:bg-[#8AC926] transition cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-sm text-slate-700 font-semibold group-hover:text-slate-900 transition">Teachers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    checked={accessForm.audiences.includes("STUDENT")}
                    onChange={(e) => {
                      setAccessForm(prev => ({
                        ...prev,
                        audiences: e.target.checked 
                          ? [...prev.audiences, "STUDENT"]
                          : prev.audiences.filter(a => a !== "STUDENT")
                      }));
                    }}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-[#8AC926] checked:border-[#8AC926] checked:bg-[#8AC926] transition cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-sm text-slate-700 font-semibold group-hover:text-slate-900 transition">Students</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-3 text-2xs uppercase tracking-wider">Restrict to Classes (Optional)</label>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {STUDENT_CLASS_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <input
                      type="checkbox"
                      checked={accessForm.classes.includes(opt.id)}
                      onChange={(e) => {
                        setAccessForm(prev => ({
                          ...prev,
                          classes: e.target.checked
                            ? [...prev.classes, opt.id]
                            : prev.classes.filter(c => c !== opt.id)
                        }));
                      }}
                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-[#8AC926] checked:border-[#8AC926] checked:bg-[#8AC926] transition cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
            <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 font-medium">
              Access rules apply to this item only. For folders, the rule restricts who can open it, effectively hiding all its contents from restricted users.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSavingAccess}
            className="w-full py-3 rounded-xl bg-[#8AC926] text-white font-sans font-bold text-xs uppercase hover:bg-[#78B020] transition disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
          >
            {isSavingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Access Rule"}
          </button>
        </form>
      </AdminModal>

      {/* Revoke Access Confirmation Popup */}
      {revokeTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm relative">
            {/* Icon badge */}
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 mx-auto mb-4">
              <ShieldOff className="w-6 h-6 text-rose-500" />
            </div>

            <h3 className="text-center font-extrabold text-slate-900 text-base mb-1">Revoke Access?</h3>
            <p className="text-center text-xs text-slate-500 font-medium mb-5 leading-relaxed">
              This will remove the access rule for this item. Teachers and students who currently have access will <span className="font-bold text-rose-600">immediately lose access</span>.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                disabled={revokeLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRevokeAccess(revokeTarget)}
                disabled={revokeLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {revokeLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldOff className="w-3.5 h-3.5" />
                )}
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
