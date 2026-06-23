import { createContext, useContext } from "react";
import type { AuthUser, DriveItem } from "../../lib/api";

export type StudentOutletContextValue = {
  token: string;
  user: AuthUser | null;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  driveBooks: DriveItem[];
  driveBooksLoading: boolean;
  loadDriveBooks: (token: string) => Promise<void>;
};

const StudentOutletContext = createContext<StudentOutletContextValue | null>(null);

export function StudentOutletProvider({
  value,
  children,
}: {
  value: StudentOutletContextValue;
  children: React.ReactNode;
}) {
  return <StudentOutletContext.Provider value={value}>{children}</StudentOutletContext.Provider>;
}

export function useStudentOutlet(): StudentOutletContextValue {
  const ctx = useContext(StudentOutletContext);
  if (!ctx) {
    throw new Error("useStudentOutlet must be used within StudentLayout");
  }
  return ctx;
}
