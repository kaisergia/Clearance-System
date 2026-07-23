"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/components/contexts/SettingsContext";
import * as clearanceService from "@/services/clearanceService";
import ClearanceStatus from "@/components/ui/ClearanceStatus";

export default function OrgDashboard() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedTerm, setSelectedTerm] = useState(currentTerm);

  const [org, setOrg] = useState<any>(null);
  const [constituents, setConstituents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState<any>(null);
  const [statusRequirements, setStatusRequirements] = useState<any[]>([]);

  const handleOpenStatusModal = async (student: any) => {
    const mergedReqs = await clearanceService.getStudentRequirements(student.id);
    setStatusRequirements(mergedReqs);
    setSelectedStudentForStatus(student);
  };

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const orgId = localStorage.getItem("orgId");
      if (orgId) {
        const currentOrg = await clearanceService.getOrgById(parseInt(orgId));
        if (currentOrg) {
          setOrg(currentOrg);

          const allStudents = await clearanceService.getStudents();
          setStudents(allStudents);

          // Fetch students based on org type/scope logic
          let list: any[] = [];
          if (currentOrg.type === "Gov") {
            list = allStudents;
          } else if (currentOrg.type === "LGU") {
            list = allStudents.filter((s) => s.department === currentOrg.department);
          } else if (currentOrg.type === "AcademicClub") {
            list = allStudents.filter((s) => s.program === currentOrg.program);
          } else if (currentOrg.type === "NonAcademicClub") {
            const memberIds = await clearanceService.getOrgMemberIds(currentOrg.id);
            list = allStudents.filter((s) => memberIds.includes(s.id));
          }

          const mappedList = [];
          for (const student of list) {
            const records = await clearanceService.getStudentClearanceRecords(student.id);
            const orgRec = records.find((r: any) => r.orgId === currentOrg.id);
            mappedList.push({
              ...student,
              status: orgRec?.status || "Pending",
            });
          }

          setConstituents(mappedList);
        }
      }
    };

    loadDashboardData();
    window.addEventListener("clearanceRecordsUpdated", loadDashboardData);
    return () => window.removeEventListener("clearanceRecordsUpdated", loadDashboardData);
  }, []);

  // Compute Stats
  const totalCount = constituents.length;
  const clearedCount = constituents.filter((s) => s.status === "Cleared").length;
  const pendingCount = totalCount - clearedCount;
  const clearedPercentage = totalCount === 0 ? 0 : Math.round((clearedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Cover Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: '16/5' }}>
        {org?.coverUrl ? (
          <Image
            src={org.coverUrl}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${org?.themeColor || '#b51b15'} 0%, ${org?.themeColor || '#b51b15'}88 50%, ${org?.themeColor || '#b51b15'}44 100%)`,
            }}
          />
        )}
        {/* Logo + Name overlay at bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center">
              {org?.logoUrl ? (
                <Image
                  src={org.logoUrl}
                  alt={org.name || 'Logo'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {org?.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">{org?.name || 'Loading...'}</h1>
              <p className="text-white/70 text-sm">{org?.head ? `Head: ${org.head}` : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Dashboard
          </h2>
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">groups</span>
            Organization: <span className="font-semibold text-on-surface">{org?.name || "Loading..."}</span>
            <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-tertiary">
              {org?.type === "Gov" ? "University-Wide" : org?.type === "LGU" ? `LGU (${org?.department})` : "Club"}
            </span>
          </p>
        </div>
        {/* Term Selector */}
        <div className="relative min-w-[220px]">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-4 pr-10 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm hover:bg-surface-bright transition-all appearance-none"
          >
            {availableTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-xl">
            expand_more
          </span>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1: Assigned Students */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              {org?.type === "NonAcademicClub" ? "Club Members" : "Total Constituents"}
            </span>
            <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">{totalCount}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm text-green-600">groups</span>
            <span>Active roster for this term</span>
          </div>
        </div>

        {/* Stat Card 2: Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              Cleared Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-lg text-4xl font-extrabold text-on-surface">{clearedCount}</span>
              <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                {clearedPercentage}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Overall progress rate</span>
          </div>
        </div>

        {/* Stat Card 3: Not Yet Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              Deficient / Pending
            </span>
            <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">{pendingCount}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm text-yellow-600">schedule</span>
            <span>Needs attention before deadline</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
            Constituents Roster ({org?.type === "Gov" || org?.type === "NonAcademicClub" ? "Inclusive Portal" : "Exclusive Portal"})
          </h3>
          <Link
            href="/org/constituents"
            className="font-label-md text-sm text-primary hover:text-surface-tint font-semibold flex items-center gap-1 transition-all group"
          >
            Manage Constituents
            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          {constituents.length === 0 ? (
            <div className="p-12 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
              <p className="text-body-md">No students found in this organization's scope.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-left">
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                    Department
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                    Program / Course
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                    Year
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-sm text-on-surface divide-y divide-outline-variant/30">
                {constituents.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-container-low/20 transition-all duration-150">
                    <td className="py-4 px-6 font-mono font-medium text-xs">{student.id}</td>
                    <td className="py-4 px-6 font-semibold">{student.name}</td>
                    <td className="py-4 px-6 text-secondary">{student.department || "N/A"}</td>
                    <td className="py-4 px-6 text-secondary">{student.program}</td>
                    <td className="py-4 px-6 text-secondary">{student.year}</td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          student.status === "Cleared"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : student.status === "Rejected"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-yellow-50 text-yellow-600 border-yellow-200"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleOpenStatusModal(student)}
                        className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs bg-transparent border-none outline-none cursor-pointer"
                      >
                        View Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedStudentForStatus && mounted && createPortal(
        <div 
          onClick={() => setSelectedStudentForStatus(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px] animate-fade-in p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-scale-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
              <div className="flex flex-col">
                <h3 className="font-title-md text-base font-bold text-on-surface">
                  Clearance Status Checklist
                </h3>
                <span className="text-xs text-secondary mt-0.5">
                  Viewing details for <span className="font-bold text-on-surface">{selectedStudentForStatus.name} ({selectedStudentForStatus.id})</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedStudentForStatus(null)}
                className="p-1.5 rounded-full hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              <ClearanceStatus 
                requirements={statusRequirements} 
                studentId={selectedStudentForStatus.id} 
                viewingOrgId={org?.id}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
