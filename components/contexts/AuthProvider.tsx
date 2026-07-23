"use client";

import { useEffect, useState } from "react";
import { SessionProvider, useSession } from "next-auth/react";

function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [devReady, setDevReady] = useState(false);
  const [hasDevOverride, setHasDevOverride] = useState(false);

  useEffect(() => {
    // Safety timeout: Ensure mobile/LAN devices never get stuck on 'Loading clearance portal…'
    const safetyTimer = setTimeout(() => {
      setDevReady(true);
    }, 1500);

    // Sync developer override cookies to localStorage
    const cookiesObj = Object.fromEntries(
      document.cookie.split("; ").map(c => {
        const [k, v] = c.split("=");
        return [k, decodeURIComponent(v || "")];
      })
    );
    const devRole = cookiesObj["dev-role-override"];
    const devEntityId = cookiesObj["dev-entityId-override"];

    if (devRole) {
      localStorage.setItem("role", devRole);
      document.cookie = `role=${devRole}; path=/; max-age=86400`;
      // Set a displayName for dev bypass so evaluations are stamped correctly
      localStorage.setItem("displayName", "Dev User (Bypass)");

      if (devRole === "head-office" && devEntityId) {
        localStorage.setItem("officeId", devEntityId);
        document.cookie = `officeId=${devEntityId}; path=/; max-age=86400`;
      } else if (devRole === "department" && devEntityId) {
        localStorage.setItem("departmentId", devEntityId);
        document.cookie = `departmentId=${devEntityId}; path=/; max-age=86400`;
      } else if (devRole === "org" && devEntityId) {
        localStorage.setItem("orgId", devEntityId);
        document.cookie = `orgId=${devEntityId}; path=/; max-age=86400`;
      } else if (devRole === "student" && devEntityId) {
        localStorage.setItem("activeStudentId", devEntityId);
        document.cookie = `activeStudentId=${devEntityId}; path=/; max-age=86400`;
      }

      setHasDevOverride(true);
    } else if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      const entityId = (session.user as any).entityId;
      const avatarUrl = (session.user as any).avatarUrl;

      if (role) {
        localStorage.setItem("role", role);
        document.cookie = `role=${role}; path=/; max-age=86400`;

        // Write the user's display name so office evaluations can be stamped with the reviewer's name
        if (session.user.name) {
          localStorage.setItem("displayName", session.user.name);
        }

        if (avatarUrl) {
          localStorage.setItem("avatarUrl", avatarUrl);
        } else {
          localStorage.removeItem("avatarUrl");
        }

        if (role === "head-office" && entityId) {
          localStorage.setItem("officeId", String(entityId));
          document.cookie = `officeId=${entityId}; path=/; max-age=86400`;
        } else if (role === "department" && entityId) {
          localStorage.setItem("departmentId", String(entityId));
          document.cookie = `departmentId=${entityId}; path=/; max-age=86400`;
        } else if (role === "org" && entityId) {
          localStorage.setItem("orgId", String(entityId));
          document.cookie = `orgId=${entityId}; path=/; max-age=86400`;
        } else if (role === "student" && entityId) {
          localStorage.setItem("activeStudentId", String(entityId));
          document.cookie = `activeStudentId=${entityId}; path=/; max-age=86400`;
        }
      }
    } else if (status === "unauthenticated") {
      const keys = ["role", "officeId", "departmentId", "orgId", "activeStudentId", "avatarUrl", "displayName"];
      keys.forEach((key) => {
        localStorage.removeItem(key);
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      });
    }

    setDevReady(true);
    return () => clearTimeout(safetyTimer);
  }, [status, session]);

  // Show spinner only when there's no dev override and the real session is still being resolved
  if (!hasDevOverride && !devReady && status === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-medium text-body-md text-secondary">Loading clearance portal…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync>{children}</AuthSync>
    </SessionProvider>
  );
}
