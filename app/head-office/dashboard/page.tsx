"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/components/contexts/SettingsContext";

import { mockOffices, mockStudentClearanceRecords } from "@/mock/mockData";
import { mockStudents } from "@/mock/mockStudents";

export default function HeadOfficeDashboard() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();
  const [selectedTerm, setSelectedTerm] = useState(currentTerm);

  const [activeOffice, setActiveOffice] = useState<any>(null);
  const [clearanceRecords, setClearanceRecords] = useState<any>({});
  const [stats, setStats] = useState({ assigned: 0, cleared: 0, pending: 0, percent: 0 });

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    // 1. Get the logged in office
    const officeId = localStorage.getItem("officeId");
    if (officeId) {
      const office = mockOffices.find((o) => o.id === Number(officeId));
      if (office) setActiveOffice(office);
    }

    // 2. Load clearance records from localStorage or initialize
    let storedRecords = localStorage.getItem("studentClearanceRecords");
    if (!storedRecords) {
      localStorage.setItem("studentClearanceRecords", JSON.stringify(mockStudentClearanceRecords));
      storedRecords = JSON.stringify(mockStudentClearanceRecords);
    }
    const records = JSON.parse(storedRecords);
    setClearanceRecords(records);

    // 3. Compute stats
    if (officeId) {
      const assigned = mockStudents.length;
      let cleared = 0;
      
      mockStudents.forEach(student => {
        const studentRecs = records[student.id];
        if (studentRecs) {
          const officeRec = studentRecs.find((r: any) => r.officeId === Number(officeId));
          if (officeRec && officeRec.status === "Cleared") {
            cleared++;
          }
        }
      });
      
      const pending = assigned - cleared;
      const percent = assigned > 0 ? Math.round((cleared / assigned) * 100) : 0;
      setStats({ assigned, cleared, pending, percent });
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Dashboard
          </h2>
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="font-semibold text-on-surface">{activeOffice ? activeOffice.name : "Loading..."}</span>
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
              Assigned Students
            </span>
            <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">{stats.assigned.toLocaleString()}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm text-green-600">trending_up</span>
            <span>+4.2% from last term</span>
          </div>
        </div>

        {/* Stat Card 2: Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              Cleared
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display-lg text-4xl font-extrabold text-on-surface">{stats.cleared.toLocaleString()}</span>
              <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                {stats.percent}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Progressing steadily</span>
          </div>
        </div>

        {/* Stat Card 3: Not Yet Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col gap-1">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              Not Yet Cleared
            </span>
            <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">{stats.pending.toLocaleString()}</span>
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
            <span className="material-symbols-outlined text-primary text-xl">history</span>
            Recently Updated Records
          </h3>
          <Link
            href="/head-office/constituents"
            className="font-label-md text-sm text-primary hover:text-surface-tint font-semibold flex items-center gap-1 transition-all group"
          >
            View All Constituents
            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
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
                  Program
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
              {mockStudents.slice(0, 5).map((student, index) => {
                const studentRecs = clearanceRecords[student.id] || [];
                const officeRec = studentRecs.find((r: any) => r.officeId === Number(activeOffice?.id));
                const status = officeRec?.status || "Pending";

                return (
                  <tr key={student.id} className={`hover:bg-surface-container-low/20 transition-all duration-150 ${status === "Rejected" ? "bg-[#FEF2F2]/10" : ""}`}>
                    <td className="py-4 px-6 font-mono font-medium text-xs">{student.id}</td>
                    <td className="py-4 px-6 font-semibold">{student.name}</td>
                    <td className="py-4 px-6 text-secondary">{student.department}</td>
                    <td className="py-4 px-6 text-secondary">{student.program}</td>
                    <td className="py-4 px-6 text-secondary">{student.year}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status === "Cleared" ? "bg-green-50 text-green-600 border-green-200" : status === "Rejected" ? "bg-red-50 text-red-600 border-red-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        href="/head-office/constituents"
                        className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                      >
                        View Progress
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
