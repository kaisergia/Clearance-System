"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/components/contexts/SettingsContext";
import { mockOrgs, mockOrgMembers } from "@/mock/mockData";
import { mockStudents } from "@/mock/mockStudents";

export default function OrgDashboard() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();
  const [selectedTerm, setSelectedTerm] = useState(currentTerm);

  const [org, setOrg] = useState<any>(null);
  const [constituents, setConstituents] = useState<any[]>([]);

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    const orgId = localStorage.getItem("orgId");
    if (orgId) {
      const currentOrg = mockOrgs.find((o) => o.id === parseInt(orgId));
      if (currentOrg) {
        setOrg(currentOrg);

        // Fetch students based on org type/scope logic
        let list: any[] = [];
        if (currentOrg.type === "Gov") {
          list = mockStudents;
        } else if (currentOrg.type === "LGU") {
          list = mockStudents.filter((s) => s.department === currentOrg.department);
        } else if (currentOrg.type === "AcademicClub") {
          list = mockStudents.filter((s) => s.course === currentOrg.program);
        } else if (currentOrg.type === "NonAcademicClub") {
          const memberIds = mockOrgMembers
            .filter((m) => m.orgId === currentOrg.id)
            .map((m) => m.studentId);
          list = mockStudents.filter((s) => memberIds.includes(s.id));
        }
        setConstituents(list);
      }
    }
  }, []);

  // Compute Stats
  const totalCount = constituents.length;
  const clearedCount = constituents.filter((s) => s.status === "Cleared").length;
  const pendingCount = totalCount - clearedCount;
  const clearedPercentage = totalCount === 0 ? 0 : Math.round((clearedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
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
                    <td className="py-4 px-6 text-secondary">{student.course}</td>
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
                      <Link
                        href="/org/constituents"
                        className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                      >
                        View Progress
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
