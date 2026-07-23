"use client";

import { useState, useEffect } from "react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";
import * as clearanceService from "@/services/clearanceService";

export default function HeadOfficeAnnouncementsPage() {
  const [officeId, setOfficeId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("officeId");
    if (stored) {
      setOfficeId(parseInt(stored, 10));
    }
  }, []);

  return (
    <AnnouncementManager
      role="head_office"
      entityId={officeId}
      title="Office Announcements"
      subtitle="Post announcements for all students or announce requirements and events for your office."
    />
  );
}
