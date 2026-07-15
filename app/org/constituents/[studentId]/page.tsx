import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";

export default async function OrgStudentClearanceView({ params }: { params: Promise<{ studentId: string }> }) {
  const resolvedParams = await params;
  const studentId = decodeURIComponent(resolvedParams.studentId);
  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8">
      <ClearanceStatusView targetStudentId={studentId} isSysAdminView={true} />
    </div>
  );
}
