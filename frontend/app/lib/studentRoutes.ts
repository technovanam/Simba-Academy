export type StudentTab = "overview" | "library" | "notifications" | "settings";

export const STUDENT_TAB_SECTIONS: Record<StudentTab, string> = {
  overview: "dashboard",
  library: "library",
  notifications: "notifications",
  settings: "settings",
};

export const STUDENT_TAB_PATHS: Record<StudentTab, string> = Object.fromEntries(
  Object.entries(STUDENT_TAB_SECTIONS).map(([tab, section]) => [tab, `/student/${section}`])
) as Record<StudentTab, string>;

const SECTION_TO_TAB = Object.fromEntries(
  Object.entries(STUDENT_TAB_SECTIONS).map(([tab, section]) => [section, tab])
) as Record<string, StudentTab>;

export const STUDENT_SECTIONS = new Set(Object.values(STUDENT_TAB_SECTIONS));

export function studentTabFromSection(section: string | undefined): StudentTab {
  if (!section) return "overview";
  return SECTION_TO_TAB[section] ?? "overview";
}

export function studentTabTitle(tab: StudentTab): string {
  const titles: Record<StudentTab, string> = {
    overview: "Dashboard",
    library: "Story Books",
    notifications: "Notifications",
    settings: "Settings",
  };
  return titles[tab];
}
