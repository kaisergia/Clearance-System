"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";

export default function OrgAnnouncementsPage() {
  const { data: session, status } = useSession();
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const entityId = (session.user as any).entityId;
      if (entityId) {
        setOrgId(Number(entityId));
        return;
      }
    }

    const stored = localStorage.getItem("orgId");
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setOrgId(parsed);
      }
    }
  }, [session, status]);

  return (
    <AnnouncementManager
      role="org"
      entityId={orgId}
      title="Organization Announcements"
      subtitle="Post announcements for members of your organization."
    />
  );
}
