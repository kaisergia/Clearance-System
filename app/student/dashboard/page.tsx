"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import * as clearanceService from "@/services/clearanceService";
import ClearanceStatus from "@/components/ui/ClearanceStatus";
import { Check } from "lucide-react";

import { ClearanceItem } from "@/services/clearanceService";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [student, setStudent] = useState<any>(null);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  const [requirements, setRequirements] = useState<ClearanceItem[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Don't load until we know the session state
    if (status === "loading") return;

    const loadDashboardData = async () => {
      try {
        const termsRes = await fetch("/api/terms");
        if (termsRes.ok) {
          const termsData = await termsRes.json();
          if (Array.isArray(termsData)) {
            const currentActive = termsData.find((t: any) => t.status === "Active") || termsData[0] || null;
            setActiveTerm(currentActive);
          }
        }
      } catch (err) {
        console.error("Failed to fetch academic terms:", err);
      }

      // Priority: real session entityId → localStorage → cookie
      const sessionStudentId = (session?.user as any)?.entityId as string | undefined;
      const cookieStudentId = document.cookie
        .split("; ")
        .find(c => c.startsWith("activeStudentId="))
        ?.split("=")[1];
      let activeStudentId = sessionStudentId || localStorage.getItem("activeStudentId") || cookieStudentId;

      let currentStudent = null;
      if (activeStudentId) {
        currentStudent = await clearanceService.getStudentById(activeStudentId);
      } else {
        currentStudent = await clearanceService.getStudentProfile();
      }

      if (currentStudent) {
        setStudent(currentStudent);
        localStorage.setItem("activeStudentId", currentStudent.id);
        document.cookie = `activeStudentId=${currentStudent.id}; path=/; max-age=86400`;
        const mergedReqs = await clearanceService.getStudentRequirements(currentStudent.id);
        setRequirements(mergedReqs);
        setAvatarUrl(currentStudent.avatarUrl || (session?.user as any)?.avatarUrl || localStorage.getItem("avatarUrl"));
      }
    };

    loadDashboardData();
    window.addEventListener("clearanceRecordsUpdated", loadDashboardData);
    return () => window.removeEventListener("clearanceRecordsUpdated", loadDashboardData);
  }, [status, session]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
      </div>
    );
  }

  // Compute stats dynamically
  const completedCount = requirements.filter((req) => req.status === "Cleared").length;
  const pendingCount = requirements.filter((req) => req.status === "Pending").length;
  const rejectedCount = requirements.filter((req) => req.status === "Rejected").length;
  const totalCount = requirements.length;

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Dashboard
          </h2>
        </div>
      </section>

      {/* Student Info Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {/* Profile Picture */}
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={student.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-16 h-16 rounded-full object-cover border border-surface-container-highest shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm">
              <span>{student.name ? student.name.charAt(0) : "S"}</span>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface">
                {student.name}
              </h1>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary-fixed text-on-secondary-fixed">
                {student.program} - {student.year}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-secondary font-body-sm text-sm">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">badge</span>
                <span>ID: {student.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span>{activeTerm ? `${activeTerm.semester} ${activeTerm.academicYear}` : (student.semester || "1st Semester 2025-2026")}</span>
                {activeTerm?.status === "Active" && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Active Term
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice when no clearance flow is defined/published for the active term */}
      {requirements.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4 text-amber-900 shadow-sm animate-fadeIn">
          <div className="p-2.5 bg-amber-500/15 rounded-xl text-amber-700 shrink-0">
            <span className="material-symbols-outlined text-2xl">lock_clock</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-900">
              Clearance Is Not Yet Open
            </h3>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              No clearance flow has been published for {activeTerm ? `${activeTerm.semester} ${activeTerm.academicYear}` : "the current academic term"}. Clearance checklist, signatory requirements, and progression will be accessible once the administration publishes the semestral clearance flow.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column - Clearance Timeline */}
        <div className="lg:col-span-3">
          <ClearanceStatus requirements={requirements} />
        </div>

        {/* Right Column - Overall Progress Chart */}
        <div className="lg:col-span-2 flex justify-center lg:justify-start w-full">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-sm w-full max-w-sm flex flex-col items-center">
            <h3 className="font-semibold text-on-surface text-base mb-6 self-start">Overall Progress</h3>
            
            {/* Circular Progress Ring */}
            <div className="relative w-40 h-40 shrink-0 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-surface-container fill-none"
                  strokeWidth="10"
                />
                {/* Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={totalCount > 0 ? "#f44a3b" : "#cbd5e1"}
                  strokeWidth="10"
                  className="fill-none"
                  strokeDasharray={314.159}
                  strokeDashoffset={totalCount > 0 ? 314.159 - (progressPercent / 100) * 314.159 : 314.159}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold tracking-tight ${totalCount > 0 ? "text-brand-red" : "text-slate-400"}`}>
                  {progressPercent}%
                </span>
                {totalCount === 0 && (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Legends Row (Side-by-Side below) */}
            <div className="flex justify-center gap-8 w-full border-t border-surface-container-high pt-5">
              {/* Completed Item */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${completedCount > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                  <Check size={18} strokeWidth={3} />
                </div>
                <span className="text-secondary font-medium text-xs whitespace-nowrap">
                  <strong className="text-on-surface font-extrabold text-sm mr-0.5">{completedCount}</strong> Completed
                </span>
              </div>

              {/* Pending Item */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${pendingCount + rejectedCount > 0 ? "bg-brand-red/90 text-white" : "bg-slate-200 text-slate-400"}`}>
                  <span className="material-symbols-outlined text-[18px] font-bold">group</span>
                </div>
                <span className="text-secondary font-medium text-xs whitespace-nowrap">
                  <strong className="text-on-surface font-extrabold text-sm mr-0.5">{pendingCount + rejectedCount}</strong> Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
