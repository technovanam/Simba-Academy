const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** In-browser view (inline) — students & teachers cannot download via this URL. */
export function libraryStoryViewUrl(bookId: string, token: string): string {
  return `${API_URL}/api/library/storybooks/${encodeURIComponent(bookId)}/view?token=${encodeURIComponent(token)}`;
}

/** Admin-only download. */
export function libraryStoryDownloadUrl(bookId: string, token: string): string {
  return `${API_URL}/api/library/storybooks/${encodeURIComponent(bookId)}/view?download=1&token=${encodeURIComponent(token)}`;
}

export type LibraryAudience = "STUDENT" | "TEACHER" | "BOTH";

export const LIBRARY_AUDIENCE_OPTIONS: { id: LibraryAudience; label: string }[] = [
  { id: "STUDENT", label: "Students only" },
  { id: "TEACHER", label: "Teachers only" },
  { id: "BOTH", label: "Students & teachers" },
];

export function audienceLabel(audience: LibraryAudience): string {
  return LIBRARY_AUDIENCE_OPTIONS.find((o) => o.id === audience)?.label ?? audience;
}
