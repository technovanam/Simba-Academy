import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoryBook, LibraryFolder } from "../../lib/api";
import { api } from "../../lib/api";
import { audienceLabel } from "../../lib/library";
import { StoryBookActions } from "../StoryBookActions";
import { AdminPageBody, AdminPageHeader, AdminPageShell } from "../AdminPageShell";
import {
  AdminListEmpty,
  AdminListPagination,
  AdminRecordList,
  AdminSearchInput,
  adminListRowClass,
  useAdminPagination,
} from "../AdminListUi";
import { FolderOpen, Home, ChevronRight } from "lucide-react";

interface TeacherStoryLibraryProps {
  books: StoryBook[];
  token: string;
}

/** Story library list — same layout as admin panel (view/print only, no add/delete). */
export function TeacherStoryLibrary({ books: initialBooks, token }: TeacherStoryLibraryProps) {
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<StoryBook[]>(initialBooks);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderAncestors, setFolderAncestors] = useState<Array<{ id: string; name: string; parentId: string | null }>>([]);

  const loadFolder = useCallback(async (folderId: string | null) => {
    try {
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
    } catch {
      setFolders([]);
    }
  }, [token]);

  useEffect(() => {
    loadFolder(null);
  }, [loadFolder]);

  function navigateToFolder(folderId: string | null) {
    setCurrentFolderId(folderId);
    loadFolder(folderId);
  }

  const filteredBooks = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author ?? "").toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [books, search]);

  const pagination = useAdminPagination(filteredBooks, [search, books.length]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Story Books Library"
        description="All story books published for teachers and students — view and print only. Downloads are reserved for administrators."
        actions={
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search books…"
            ariaLabel="Search story books"
          />
        }
      />

      <AdminPageBody>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-4 flex-wrap">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
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

        {filteredBooks.length === 0 && folders.length === 0 ? (
          <AdminListEmpty message={currentFolderId ? "This folder is empty." : "No story books match your search."} />
        ) : filteredBooks.length === 0 ? null : (
          <AdminRecordList>
            {pagination.paginatedItems.map((b) => (
              <div key={b.id} className={adminListRowClass}>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#8AC926]/15 text-[#6B9E1A] text-4xs font-extrabold uppercase border border-[#8AC926]/30 shrink-0">
                      {b.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-4xs font-extrabold uppercase border border-violet-200 shrink-0">
                      {audienceLabel(b.audience ?? "BOTH")}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-800">{b.title}</p>

                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <StoryBookActions
                    bookId={b.id}
                    token={token}
                    role="TEACHER"
                    title={b.title}
                    variant="admin"
                  />
                </div>
              </div>
            ))}
            <AdminListPagination
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={filteredBooks.length}
              safePage={pagination.safePage}
              totalPages={pagination.totalPages}
              pageNumbers={pagination.pageNumbers}
              onPageChange={pagination.setCurrentPage}
              itemLabel="books"
            />
          </AdminRecordList>
        )}
      </AdminPageBody>
    </AdminPageShell>
  );
}
