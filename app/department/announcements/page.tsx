"use client";

import { useState, useEffect } from "react";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";

export default function DepartmentAnnouncementsPage() {
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("departmentId");
    if (stored) {
      setDepartmentId(parseInt(stored, 10));
    }
  }, []);

  return (
    <AnnouncementManager
      role="department"
      entityId={departmentId}
      title="Department Announcements"
      subtitle="Post announcements for students enrolled in your department."
    />
  );
}
