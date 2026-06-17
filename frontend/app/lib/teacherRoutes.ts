export type TeacherTab = "overview" | "tasks" | "library" | "planner" | "notifications" | "settings" | "students";

export const TEACHER_TAB_SECTIONS: Record<TeacherTab, string> = {
  overview: "dashboard",
  tasks: "tasks",
  library: "library",
  planner: "planner",
  notifications: "notifications",
  settings: "settings",
  students: "students",
};

export const TEACHER_TAB_PATHS: Record<TeacherTab, string> = Object.fromEntries(
  Object.entries(TEACHER_TAB_SECTIONS).map(([tab, section]) => [tab, `/teacher/${section}`])
) as Record<TeacherTab, string>;

const SECTION_TO_TAB = Object.fromEntries(
  Object.entries(TEACHER_TAB_SECTIONS).map(([tab, section]) => [section, tab])
) as Record<string, TeacherTab>;

export const TEACHER_SECTIONS = new Set(Object.values(TEACHER_TAB_SECTIONS));

export function teacherTabFromSection(section: string | undefined): TeacherTab {
  if (!section) return "overview";
  return SECTION_TO_TAB[section] ?? "overview";
}

export function teacherTabTitle(tab: TeacherTab): string {
  const titles: Record<TeacherTab, string> = {
    overview: "Dashboard",
    tasks: "Assigned Tasks",
    library: "Story Library",
    planner: "Lesson Planner",
    notifications: "Notifications",
    settings: "Account Settings",
    students: "Students",
  };
  return titles[tab];
}
