import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function HeadOfficeStudentClearanceView({ params }: { params: Promise<{ studentId: string }> }) {
  const resolvedParams = await params;
  const studentId = decodeURIComponent(resolvedParams.studentId);

  // Determine which office is viewing — dev-bypass cookie takes priority, then real session
  const cookieStore = await cookies();
  const devOfficeId = cookieStore.get("officeId")?.value;
  const session = await getServerSession(authOptions);
  const sessionOfficeId = (session?.user as any)?.officeId;
  const officeId: number | undefined = devOfficeId
    ? Number(devOfficeId)
    : sessionOfficeId
    ? Number(sessionOfficeId)
    : undefined;

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8">
      <ClearanceStatusView
        targetStudentId={studentId}
        isSysAdminView={true}
        viewingOfficeId={officeId}
      />
    </div>
  );
}
