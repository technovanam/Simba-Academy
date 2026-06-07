import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, ApiError, type AuthUser } from "../../lib/api";
import { clearSession, saveSession } from "../../lib/auth";
import type { StudentTab } from "../../lib/studentRoutes";
import { useStudentOutlet } from "./StudentOutletContext";
import { StudentSettingsPanel } from "./StudentSettingsPanel";
import { PortalPageShell } from "../PortalPageShell";
import { StudentOverviewPage } from "./pages/StudentOverviewPage";
import { StudentLibraryPage } from "./pages/StudentLibraryPage";
import { StudentNotificationsPage } from "./pages/StudentNotificationsPage";

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
      <PortalPageShell>
        <StudentOverviewPage />
      </PortalPageShell>
    );
  }

  if (tab === "library") {
    return (
      <PortalPageShell>
        <StudentLibraryPage />
      </PortalPageShell>
    );
  }

  if (tab === "notifications") {
    return (
      <PortalPageShell className="overflow-y-auto">
        <StudentNotificationsPage />
      </PortalPageShell>
    );
  }

  if (tab === "settings" && token) {
    return (
      <PortalPageShell className="overflow-y-auto">
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
