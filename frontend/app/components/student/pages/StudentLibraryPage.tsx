import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Printer } from "lucide-react";
import { api, ApiError, type AuthUser, type StoryBook } from "../../../lib/api";
import { clearSession, saveSession } from "../../../lib/auth";
import { PAYMENTS_ENABLED } from "../../../lib/constants";
import { StoryBookInlineViewer } from "../../StoryBookInlineViewer";
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

export function StudentLibraryPage() {
  const navigate = useNavigate();
  const { token, user, setError } = useStudentOutlet();

  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [books, setBooks] = useState<StoryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryViewer, setLibraryViewer] = useState<{
    bookId: string;
    title: string;
    print: boolean;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResult, booksResult, paymentsResult] = await Promise.allSettled([
          api.profile(token),
          api.getPublicStoryBooks(token),
          api.getStudentPayments(token),
        ]);

        if (cancelled) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          saveSession(token, profileResult.value);
        }

        if (booksResult.status === "fulfilled") {
          setBooks(booksResult.value);
        } else {
          throw booksResult.reason;
        }

        if (paymentsResult.status === "fulfilled" && PAYMENTS_ENABLED) {
          const successful = paymentsResult.value.filter((p) => p.status === "SUCCESS");
          if (successful.length === 0) {
            navigate("/student/checkout");
            return;
          }
        }
      } catch (err) {
        console.error("Student library load error:", err);
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          navigate("/login");
        } else {
          setError("Failed to load story books. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, setError]);

  const studentClass = profile?.studentClass ?? user?.studentClass ?? null;

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

  if (libraryViewer && token) {
    return (
      <div className={`${portalDashboardBodyClass} h-full`}>
        <AdminPageShell>
          <AdminPageBody>
            <StoryBookInlineViewer
              bookId={libraryViewer.bookId}
              title={libraryViewer.title}
              token={token}
              printOnLoad={libraryViewer.print}
              accent="orange"
              onBack={() => setLibraryViewer(null)}
            />
          </AdminPageBody>
        </AdminPageShell>
      </div>
    );
  }

  return (
    <div className={`${portalDashboardBodyClass} h-full`}>
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
          ) : filteredBooks.length === 0 ? (
            <AdminListEmpty message={`No story books for ${studentClass} match your search yet.`} />
          ) : (
            <AdminRecordList>
              {libraryPagination.paginatedItems.map((b) => (
                <div key={b.id} className={adminListRowClass}>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-[#FF9F1C]/15 text-[#c77a00] text-4xs font-extrabold uppercase border border-[#FF9F1C]/30 shrink-0">
                        {b.category}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-800">{b.title}</p>
                    {b.author ? (
                      <p className="text-2xs text-slate-600 font-medium">Author: {b.author}</p>
                    ) : null}
                  </div>
                  {token ? (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLibraryViewer({ bookId: b.id, title: b.title, print: false })}
                        className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-[#FF9F1C]/10 border-[#FF9F1C]/30 text-[#c77a00] hover:bg-[#FF9F1C]/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => setLibraryViewer({ bookId: b.id, title: b.title, print: true })}
                        className="px-3 py-1.5 rounded-lg font-bold text-2xs flex items-center gap-1 border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
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
          )}
        </AdminPageBody>
      </AdminPageShell>
    </div>
  );
}
