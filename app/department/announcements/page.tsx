"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";

export default function DepartmentAnnouncementsPage() {
  const { data: session, status } = useSession();
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const entityId = (session.user as any).entityId;
      if (entityId) {
        setDepartmentId(Number(entityId));
        return;
      }
    }

    const stored = localStorage.getItem("departmentId");
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setDepartmentId(parsed);
      }
    }
  }, [session, status]);

  return (
    <AnnouncementManager
      role="department"
      entityId={departmentId}
      title="Department Announcements"
      subtitle="Post announcements for students enrolled in your department."
    />
  );
}
