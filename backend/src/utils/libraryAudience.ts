import type { LibraryAudience, Role } from "@prisma/client";

/** Roles allowed to see a story book based on its audience setting. */
export function audienceFilterForRole(role: Role): { audience: { in: LibraryAudience[] } } | Record<string, never> {
  if (role === "ADMIN") {
    return {};
  }
  if (role === "TEACHER") {
    return { audience: { in: ["TEACHER", "BOTH"] } };
  }
  return { audience: { in: ["STUDENT", "BOTH"] } };
}

export function canAccessStoryBook(role: Role, audience: LibraryAudience): boolean {
  if (role === "ADMIN") return true;
  if (audience === "BOTH") return true;
  if (role === "TEACHER" && audience === "TEACHER") return true;
  if (role === "STUDENT" && audience === "STUDENT") return true;
  return false;
}

/** Same audience filter logic applied to LibraryFolder. */
export const audienceFilterForFolders = audienceFilterForRole;

export function canAccessFolder(role: Role, audience: LibraryAudience): boolean {
  return canAccessStoryBook(role, audience);
}
