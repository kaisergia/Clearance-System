"use client";

import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";

export default function AdminAnnouncementsPage() {
  return (
    <AnnouncementManager
      role="admin"
      title="System Announcements"
      subtitle="Manage all announcements, bulletin board posts, and public landing page posts."
    />
  );
}
