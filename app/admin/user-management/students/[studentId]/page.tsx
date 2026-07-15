"use client";

import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";

export default function AdminStudentClearanceView({ params }: { params: { studentId: string } }) {
  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8">
      <ClearanceStatusView targetStudentId={params.studentId} isSysAdminView={true} />
    </div>
  );
}
