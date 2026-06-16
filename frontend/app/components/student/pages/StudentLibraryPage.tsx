import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError, type AuthUser, type StoryBook, type LibraryFolder } from "../../../lib/api";
import { clearSession, saveSession } from "../../../lib/auth";
import { PAYMENTS_ENABLED } from "../../../lib/constants";
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
import { FolderOpen, Home, ChevronRight } from "lucide-react";

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

  const libraryPagination = useAdminPagination(filteredBooks, [librarySearch, studentClass, books.length]);

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

              {/* Folder cards */}
              {folders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5 shrink-0">
                  {folders.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50 transition"
                      onClick={() => navigateToFolder(f.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") navigateToFolder(f.id); }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-2">
                        <FolderOpen className="w-7 h-7 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{f.name}</p>
                          <p className="text-3xs text-slate-500 mt-1 font-medium">
                            {(f._count?.children ?? 0)} folders · {(f._count?.storyBooks ?? 0)} files
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Files */}
              {filteredBooks.length === 0 && folders.length === 0 ? (
                <AdminListEmpty message={currentFolderId ? "This folder is empty." : `No story books for ${studentClass} match your search.`} />
              ) : filteredBooks.length === 0 ? null : (
                <div className="flex-1 min-h-0 overflow-y-auto min-w-0 pb-12">
                  <AdminRecordList>
                    {libraryPagination.paginatedItems.map((b) => (
                      <div key={b.id} className={adminListRowClass}>
                        <div className="flex-1 min-w-[180px]">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-[#8AC926]/15 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30 shrink-0">
                              {b.category}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-800">{b.title}</p>

                        </div>
                        {token ? (
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <StoryBookActions
                              bookId={b.id}
                              token={token}
                              role="STUDENT"
                              title={b.title}
                              variant="admin"
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <AdminListPagination
                      rangeStart={libraryPagination.rangeStart}
                      rangeEnd={libraryPagination.rangeEnd}
                      total={filteredBooks.length}
                      safePage={libraryPagination.safePage}
                      totalPages={libraryPagination.totalPages}
                      pageNumbers={libraryPagination.pageNumbers}
                      onPageChange={libraryPagination.setCurrentPage}
                      itemLabel="books"
                    />
                  </AdminRecordList>
                </div>
              )}
            </>
          )}
        </AdminPageBody>
      </AdminPageShell>
    </div>
  );
}
