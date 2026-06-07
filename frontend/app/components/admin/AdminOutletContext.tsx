import { createContext, useContext } from "react";
import type { AuthUser } from "../../lib/api";

export type AdminOutletContextValue = {
  token: string;
  user: AuthUser | null;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
};

const AdminOutletContext = createContext<AdminOutletContextValue | null>(null);

export function AdminOutletProvider({
  value,
  children,
}: {
  value: AdminOutletContextValue;
  children: React.ReactNode;
}) {
  return <AdminOutletContext.Provider value={value}>{children}</AdminOutletContext.Provider>;
}

export function useAdminOutlet(): AdminOutletContextValue {
  const ctx = useContext(AdminOutletContext);
  if (!ctx) {
    throw new Error("useAdminOutlet must be used within AdminLayout");
  }
  return ctx;
}
