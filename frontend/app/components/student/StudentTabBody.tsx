import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError, type AuthUser } from "../../lib/api";
import { clearSession, saveSession } from "../../lib/auth";
import type { StudentTab } from "../../lib/studentRoutes";
import { useStudentOutlet } from "./StudentOutletContext";
import { StudentSettingsPanel } from "./StudentSettingsPanel";
import { PortalPageShell } from "../PortalPageShell";
import { StudentOverviewPage } from "./pages/StudentOverviewPage";
import { StudentNotificationsPage } from "./pages/StudentNotificationsPage";
import { DriveLibraryPanel } from "../DriveLibraryPanel";

export function StudentTabBody({ tab }: { tab: StudentTab }) {
  const navigate = useNavigate();
  const { token, user, setMessage, setError } = useStudentOutlet();
  const [localUser, setLocalUser] = useState<AuthUser | null>(user);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    if (!token || tab !== "settings") return;
    loadProfile();
  }, [token, tab]);

  async function loadProfile() {
    if (!token) return;
    setProfileLoading(true);
    try {
      const freshProfile = await api.profile(token);
      setProfile(freshProfile);
      saveSession(token, freshProfile);
      setLocalUser(freshProfile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("/login");
      } else {
        setError("Failed to load profile. Please try again.");
      }
    } finally {
      setProfileLoading(false);
    }
  }

  if (tab === "overview") {
    return (
      <PortalPageShell className="h-full !overflow-hidden flex flex-col min-h-0">
        <StudentOverviewPage />
      </PortalPageShell>
    );
  }

  if (tab === "library") {
    return (
      <PortalPageShell className="h-full !overflow-hidden flex flex-col min-h-0">
        {token && <DriveLibraryPanel token={token} role="STUDENT" />}
        {!token && <div className="p-4 text-slate-500">Loading library...</div>}
      </PortalPageShell>
    );
  }

  if (tab === "notifications") {
    return (
      <PortalPageShell className="h-full !overflow-hidden flex flex-col min-h-0">
        <StudentNotificationsPage />
      </PortalPageShell>
    );
  }

  if (tab === "settings" && token) {
    return (
      <PortalPageShell className="h-full !overflow-hidden flex flex-col min-h-0">
        <StudentSettingsPanel
          token={token}
          user={localUser}
          profile={profile}
          profileLoading={profileLoading}
          onNotify={setMessage}
          onError={setError}
          onProfileUpdated={(updated) => setLocalUser(updated)}
        />
      </PortalPageShell>
    );
  }

  return null;
}
