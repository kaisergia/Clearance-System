"use client";

import { useState, useEffect } from "react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";

export default function OrgAnnouncementsPage() {
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("orgId");
    if (stored) {
      setOrgId(parseInt(stored, 10));
    }
  }, []);

  return (
    <AnnouncementManager
      role="org"
      entityId={orgId}
      title="Organization Announcements"
      subtitle="Post announcements for members of your organization."
    />
  );
}
