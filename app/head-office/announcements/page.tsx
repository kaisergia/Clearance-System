"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";
import * as clearanceService from "@/services/clearanceService";

export default function HeadOfficeAnnouncementsPage() {
  const { data: session, status } = useSession();
  const [officeId, setOfficeId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const entityId = (session.user as any).entityId;
      if (entityId) {
        setOfficeId(Number(entityId));
        return;
      }
    }

    const stored = localStorage.getItem("officeId");
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setOfficeId(parsed);
      }
    }
  }, [session, status]);

  console.log("[HeadOfficeAnnouncementsPage] RENDER officeId:", officeId, "status:", status, "session.user.role:", session?.user?.role);

  return (
    <AnnouncementManager
      role="head_office"
      entityId={officeId}
      title="Office Announcements"
      subtitle="Post announcements for all students or announce requirements and events for your office."
    />
  );
}
