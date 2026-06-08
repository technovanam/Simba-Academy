import { useMemo, useState } from "react";
import type { StoryBook } from "../../lib/api";
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

interface TeacherStoryLibraryProps {
  books: StoryBook[];
  token: string;
}

/** Story library list — same layout as admin panel (view/print only, no add/delete). */
export function TeacherStoryLibrary({ books, token }: TeacherStoryLibraryProps) {
  const [search, setSearch] = useState("");

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
        {filteredBooks.length === 0 ? (
          <AdminListEmpty message="No story books match your search." />
        ) : (
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
                  {b.author && (
                    <p className="text-2xs text-slate-600 font-medium">Author: {b.author}</p>
                  )}
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
