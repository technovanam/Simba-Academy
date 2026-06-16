import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError, type AuthUser, type StoryBook, type LibraryFolder } from "../../../lib/api";
import { clearSession, saveSession } from "../../../lib/auth";
import { PAYMENTS_ENABLED } from "../../../lib/constants";
import { audienceLabel } from "../../../lib/library";
import { StoryBookActions } from "../../StoryBookActions";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../../AdminPageShell";
import {
  adminListRowClass,
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  useAdminPagination,
} from "../../AdminListUi";
import { portalDashboardBodyClass } from "../../PortalPageShell";
import { useStudentOutlet } from "../StudentOutletContext";
import { StudentTabLoader } from "../StudentTabLoader";
import { Folder, FolderOpen, Home, ChevronRight, FileText } from "lucide-react";

export function StudentLibraryPage() {
  const navigate = useNavigate();
  const { token, user, setError } = useStudentOutlet();

  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderAncestors, setFolderAncestors] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");

  const studentClass = profile?.studentClass ?? user?.studentClass ?? null;

  const loadFolder = useCallback(async (folderId: string | null) => {
    if (!token) return;
    try {
      // For students, the API route already filters books by studentClass
      const [folderList, bookList] = await Promise.all([
        api.getPublicLibraryFolders(token, folderId),
        api.getLibraryStoryBooks(token, folderId),
      ]);
      setFolders(folderList);
      setBooks(bookList);
      if (folderId) {
        const ancestors = await api.getPublicFolderAncestors(token, folderId);
        setFolderAncestors(ancestors);
      } else {
        setFolderAncestors([]);
      }
    } catch (err) {
      console.error("Folder load error:", err);
      setFolders([]);
      setBooks([]);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResult, paymentsResult] = await Promise.allSettled([
          api.profile(token),
          api.getStudentPayments(token),
        ]);

        if (cancelled) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          saveSession(token, profileResult.value);
        }

        if (paymentsResult.status === "fulfilled" && PAYMENTS_ENABLED) {
          const successful = paymentsResult.value.filter((p) => p.status === "SUCCESS");
          if (successful.length === 0) {
            navigate("/student/checkout");
            return;
          }
        }

        // After profile loaded, load root folder
        await loadFolder(null);

      } catch (err) {
        console.error("Student library init error:", err);
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          navigate("/login");
        } else {
          setError("Failed to initialize library. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, setError, loadFolder]);

  function navigateToFolder(folderId: string | null) {
    setCurrentFolderId(folderId);
    loadFolder(folderId);
  }

  const filteredBooks = useMemo(() => {
    const q = librarySearch.toLowerCase();
    return books.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.author ?? "").toLowerCase().includes(q);
      const matchesClass = !studentClass || b.category === studentClass;
      return matchesSearch && matchesClass;
    });
  }, [books, librarySearch, studentClass]);

  const combinedItems = useMemo(() => {
    const q = librarySearch.toLowerCase().trim();
    const filteredFolders = !q ? folders : folders.filter((f) => f.name.toLowerCase().includes(q));
    return [
      ...filteredFolders.map((f) => ({ ...f, isFolder: true })),
      ...filteredBooks.map((b) => ({ ...b, isFolder: false })),
    ];
  }, [folders, filteredBooks, librarySearch]);

  const libraryPagination = useAdminPagination(combinedItems, [librarySearch, studentClass, books.length, folders.length], 10);

  if (loading) return <StudentTabLoader />;

  return (
    <div className={portalDashboardBodyClass}>
      <AdminPageShell>
        <AdminPageHeader
          title="Story Books Library"
          description={
            studentClass
              ? `Story books for ${studentClass} — matched to the class you selected at signup.`
              : "Story books for your class will appear here after your class is set on your profile."
          }
          actions={
            <AdminSearchInput
              value={librarySearch}
              onChange={setLibrarySearch}
              placeholder="Search books…"
              ariaLabel="Search story books"
            />
          }
        />
        <AdminPageBody className="flex-1 min-h-0 flex flex-col">
          {!studentClass ? (
            <AdminListEmpty message="Your class is not set yet. Contact Simba Academy if you need help." />
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => navigateToFolder(null)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition hover:bg-slate-100 ${
                    !currentFolderId ? "text-[#6B9E1A] bg-[#8AC926]/10" : "hover:text-slate-700"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" /> All Books
                </button>
                {folderAncestors.map((anc, i) => (
                  <span key={anc.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => navigateToFolder(anc.id)}
                      className={`px-2 py-1 rounded-lg transition hover:bg-slate-100 ${
                        i === folderAncestors.length - 1
                          ? "text-[#6B9E1A] bg-[#8AC926]/10"
                          : "hover:text-slate-700"
                      }`}
                    >
                      {anc.name}
                    </button>
                  </span>
                ))}
              </nav>

              {/* Combined Items Table */}
              {combinedItems.length === 0 ? (
                <AdminListEmpty
                  message={
                    currentFolderId
                      ? "This folder is empty."
                      : `No story books for ${studentClass} match your search.`
                  }
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col mb-12">
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Name</th>
                          <th className="px-4 py-3 font-semibold">Access</th>
                          <th className="px-4 py-3 font-semibold">Date Added</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {libraryPagination.paginatedItems.map((item: any) => {
                          if (item.isFolder) {
                            const f = item;
                            return (
                              <tr
                                key={`folder-${f.id}`}
                                className="hover:bg-slate-50 group transition cursor-pointer"
                                onClick={() => navigateToFolder(f.id)}
                              >
                                <td className="px-4 py-3 flex items-center gap-3 w-1/2">
                                  <Folder className="w-5 h-5 text-slate-400 fill-slate-400 shrink-0" />
                                  <span className="font-semibold text-slate-700 whitespace-normal break-words">
                                    {f.name}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-4xs font-extrabold uppercase border border-violet-200">
                                      {audienceLabel(f.audience ?? "BOTH")}
                                    </span>
                                    {f.category && (
                                      <span className="px-1.5 py-0.5 rounded bg-[#8AC926]/10 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30">
                                        {f.category}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">
                                  {new Date(f.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-4 py-2 text-right align-middle">
                                  {/* View is entering folder, done on click */}
                                </td>
                              </tr>
                            );
                          } else {
                            const b = item;
                            return (
                              <tr key={`book-${b.id}`} className="hover:bg-slate-50 group transition">
                                <td className="px-4 py-3 flex items-center gap-3 w-1/2">
                                  <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                  <span className="font-semibold text-slate-700 whitespace-normal break-words">
                                    {b.title}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {b.category && (
                                      <span className="px-1.5 py-0.5 rounded bg-[#8AC926]/10 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30">
                                        {b.category}
                                      </span>
                                    )}
                                    <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200">
                                      {audienceLabel(b.audience ?? "BOTH")}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">
                                  {new Date(b.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-4 py-2 text-right align-middle">
                                  <div className="flex items-center justify-end gap-1">
                                    {token && (
                                      <StoryBookActions
                                        bookId={b.id}
                                        token={token}
                                        role="STUDENT"
                                        title={b.title}
                                        variant="admin"
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                  {combinedItems.length > 10 && (
                    <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
                      <AdminListPagination
                        rangeStart={libraryPagination.rangeStart}
                        rangeEnd={libraryPagination.rangeEnd}
                        total={combinedItems.length}
                        safePage={libraryPagination.safePage}
                        totalPages={libraryPagination.totalPages}
                        pageNumbers={libraryPagination.pageNumbers}
                        onPageChange={libraryPagination.setCurrentPage}
                        itemLabel="items"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </AdminPageBody>
      </AdminPageShell>
    </div>
  );
}
