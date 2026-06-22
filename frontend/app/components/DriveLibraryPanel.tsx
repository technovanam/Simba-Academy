import { useEffect, useState, useCallback } from "react";
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
  Lock,
  Unlock,
} from "lucide-react";
import { api, type DriveItem, type DriveAncestor } from "../lib/api";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "./AdminPageShell";
import { AdminModal } from "./AdminModal";
import { STUDENT_CLASS_OPTIONS } from "../lib/constants";

export interface DriveLibraryPanelProps {
  token: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
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

export function DriveLibraryPanel({ token, role }: DriveLibraryPanelProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [ancestors, setAncestors] = useState<DriveAncestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("ALL");

  const [viewerFile, setViewerFile] = useState<DriveItem | null>(null);

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

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.browseDocuments(token, currentFolderId, searchQuery);

      if (fileTypeFilter !== "ALL") {
        const matcher = MIME_MATCHERS[fileTypeFilter];
        setItems(data.filter(item => matcher(item.mimeType)));
      } else {
        setItems(data);
      }

      if (currentFolderId && currentFolderId !== "root") {
        const pathAncestors = await api.getDocumentAncestors(token, currentFolderId);
        setAncestors(pathAncestors);
      } else {
        setAncestors([]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Failed to load documents. Please check your Google Drive configurations.");
    } finally {
      setLoading(false);
    }
  }, [token, currentFolderId, searchQuery, fileTypeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessItem || !token) return;
    setIsSavingAccess(true);
    try {
      if (accessForm.audiences.length === 0) {
        setError("Please select at least one audience.");
        setIsSavingAccess(false);
        return;
      }
      
      const audience = accessForm.audiences.includes("TEACHER") && accessForm.audiences.includes("STUDENT")
        ? "BOTH"
        : accessForm.audiences.includes("TEACHER") ? "TEACHER" : "STUDENT";

      const targetClass = accessForm.classes.length > 0 
        ? accessForm.classes.join(",") 
        : null;

      await api.updateDriveAccessRule(token, accessItem.id, audience, targetClass);
      
      // Update local item
      setItems((prev) => prev.map((item) => 
        item.id === accessItem.id 
          ? { ...item, accessRule: { audience, targetClass } }
          : item
      ));
      
      setAccessItem(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update access rule.");
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleRevokeAccess = async (fileId: string) => {
    if (!token) return;
    setError("");
    try {
      await api.revokeDriveAccessRule(token, fileId);
      setItems((prev) => prev.map((item) => 
        item.id === fileId 
          ? { ...item, accessRule: null }
          : item
      ));
    } catch (err) {
      console.error(err);
      setError("Failed to revoke access rule.");
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
                className="pl-8 pr-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-full text-xs w-full outline-none focus:border-[#8AC926] placeholder-slate-400 transition-all"
                aria-label="Search files and folders"
              />
            </div>
            <div className="flex bg-white rounded-full border border-slate-200 p-0.5 shrink-0 shadow-sm">
              {FILE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFileTypeFilter(type.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition ${
                    fileTypeFilter === type.id
                      ? "bg-[#8AC926]/15 text-[#5a8218] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {type.id}
                </button>
              ))}
            </div>
          </>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shrink-0">
          {error}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl overflow-hidden shadow-sm shrink-0 w-fit max-w-full">
        <button
          type="button"
          onClick={() => handleFolderClick("root")}
          className="flex items-center gap-1 font-bold text-[#8AC926] hover:underline shrink-0"
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
            <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Date Modified</th>
                    {role === "ADMIN" && <th className="px-4 py-3 font-semibold">Access</th>}
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
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
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 border border-slate-200">
            {searchQuery ? "No matching files or folders found." : "This folder is empty."}
          </div>
        ) : (
          <div className={`bg-white ${role === "STUDENT" ? "" : "border border-slate-200 shadow-sm"} rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col`}>
            <div className={`overflow-x-auto flex-1 min-h-0 overflow-y-auto modern-scrollbar ${role === "STUDENT" ? "p-4" : ""}`}>
              {role === "STUDENT" ? (
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
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Date Modified</th>
                      {role === "ADMIN" && <th className="px-4 py-3 font-semibold">Access</th>}
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
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
                                className="flex items-center gap-2.5 text-slate-800 hover:text-[#8AC926] transition font-bold text-sm text-left truncate w-full max-w-md"
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
                                    className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition shrink-0"
                                    title="Access Settings"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  {item.accessRule && (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeAccess(item.id)}
                                      className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition shrink-0"
                                      title="Revoke Access"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              {!isFolderItem && (
                                <button
                                  type="button"
                                  onClick={() => setViewerFile(item)}
                                  className="w-8 h-8 rounded-lg bg-[#8AC926]/10 border border-[#8AC926]/30 text-[#5a8218] hover:bg-[#8AC926]/20 flex items-center justify-center transition shrink-0"
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
              )}
            </div>
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
          accent="green"
        />
      )}

      {/* Access Settings Modal */}
      <AdminModal
        open={!!accessItem}
        onClose={() => {
          if (!isSavingAccess) setAccessItem(null);
        }}
        title="Access Settings"
      >
        <form onSubmit={handleSaveAccess} className="space-y-4">
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
    </AdminPageShell>
  );
}
