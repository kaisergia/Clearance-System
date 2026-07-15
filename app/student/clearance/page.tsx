"use client";

import { useEffect, useState } from "react";
import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";

export default function StudentClearance() {
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("studentId");
    if (id) setStudentId(id);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ClearanceStatusView targetStudentId={studentId} isSysAdminView={!!studentId} />;
}
