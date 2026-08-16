"use client";

import { useState, useEffect } from "react";
import { mockRecentReports } from "@/mock/mockData";
import { useOffices } from "@/components/contexts/OfficesContext";
import * as clearanceService from "@/services/clearanceService";

export default function ReportsPage() {
  const { offices } = useOffices();
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch academic terms on mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch("/api/terms");
        if (res.ok) {
          const data = await res.json();
          setTerms(data);
          const active = data.find((t: any) => t.status === "Active") || data[0];
          setSelectedTerm(active);
        }
      } catch (err) {
        console.error("Failed to fetch terms:", err);
      }
    };
    fetchTerms();
  }, []);

  // Fetch student records and term clearance records on selectedTerm change
  useEffect(() => {
    if (!selectedTerm) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const allStudents = await clearanceService.getStudents();
        const termStudents = allStudents.filter((s: any) => s.semester === selectedTerm.name);
        setStudents(termStudents);

        const res = await fetch(`/api/clearance-records?termId=${selectedTerm.id}`);
        if (res.ok) {
          const records = await res.json();
          setClearanceRecords(records);
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedTerm]);

  // Calculations derived from dynamic term records
  const clearedStudents = students.filter((s) => {
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    if (studentRecs.length === 0) return false;
    return studentRecs.every((r) => r.status === "Cleared");
  });

  const totalApproved = clearedStudents.length;
  const totalPending = students.length - totalApproved;

  const courseStats: Record<string, { total: number; cleared: number }> = {};
  students.forEach((s) => {
    if (!courseStats[s.program]) {
      courseStats[s.program] = { total: 0, cleared: 0 };
    }
    courseStats[s.program].total += 1;
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
    if (isCleared) {
      courseStats[s.program].cleared += 1;
    }
  });

  const BAR_DATA = Object.entries(courseStats).map(([dept, stats]) => ({
    dept,
    pct: Math.round((stats.cleared / stats.total) * 100) || 0,
  }));

  // Dynamic Office Compliance Rate Breakdown
  const officeBreakdown = offices.map((office) => {
    const officeRecs = clearanceRecords.filter((r) => r.officeId === office.id);
    const total = officeRecs.length;
    const cleared = officeRecs.filter((r) => r.status === "Cleared").length;
    const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return {
      ...office,
      pending: total - cleared,
      approved: cleared,
      clearedPct: rate,
    };
  });

  // Download Full Report Handler
  const handleDownloadFullReport = () => {
    if (!selectedTerm || students.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = ["Student ID", "Name", "Department", "Program", "Year Level", "Clearance Status"];
    const rows = students.map((s) => {
      const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
      const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
      return [
        s.id,
        s.name,
        s.department || "N/A",
        s.program || "N/A",
        s.year || "N/A",
        isCleared ? "CLEARED" : "PENDING",
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clearance_Full_Report_${selectedTerm.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-xl gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Reports &amp; Analytics</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Overview of student clearance progress and institutional compliance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Term Selector dropdown */}
          {terms.length > 0 && (
            <div className="relative">
              <select
                value={selectedTerm?.id || ""}
                onChange={(e) => {
                  const term = terms.find((t) => t.id === parseInt(e.target.value, 10));
                  if (term) setSelectedTerm(term);
                }}
                className="bg-surface-container-low border border-surface-container-high text-on-surface font-body-sm text-body-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red select-none cursor-pointer pr-8 appearance-none"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === "Active" ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-base">
                arrow_drop_down
              </span>
            </div>
          )}

          <button
            onClick={handleDownloadFullReport}
            className="flex items-center gap-2 bg-brand-red hover:bg-primary text-white px-6 py-2.5 rounded-lg font-label-md text-label-md transition-colors shadow-sm hover:shadow-md btn-hover cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download Full Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-secondary font-body-md">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Metric Cards + Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-gutter">
            {/* Metric 1 */}
            <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl p-lg border border-surface-container-high shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
                  <span className="material-symbols-outlined">how_to_reg</span>
                </div>
                <span className="bg-surface-container-low text-secondary font-label-md text-label-md px-2 py-1 rounded-md">This Term</span>
              </div>
              <div>
                <h3 className="font-body-sm text-body-sm text-secondary mb-1">Total Cleared</h3>
                <p className="font-display-lg text-display-lg text-on-surface">{totalApproved.toLocaleString()}</p>
                <p className="font-body-sm text-body-sm text-brand-red flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span> {students.length > 0 ? Math.round((totalApproved / students.length) * 100) : 0}% compliance rate
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl p-lg border border-surface-container-high shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-error-container/50 rounded-lg text-error">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="bg-surface-container-low text-secondary font-label-md text-label-md px-2 py-1 rounded-md">Active</span>
              </div>
              <div>
                <h3 className="font-body-sm text-body-sm text-secondary mb-1">Pending Clearances</h3>
                <p className="font-display-lg text-display-lg text-on-surface">{totalPending.toLocaleString()}</p>
                <p className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[16px]">schedule</span> Across {students.length} students
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-lg border border-surface-container-high shadow-sm flex flex-col min-h-[280px]">
              <h3 className="font-title-md text-title-md text-on-surface mb-6">Clearance Rate by Department</h3>
              <div className="flex-1 relative w-full rounded-lg overflow-hidden bg-surface-container-low border border-surface-container-high flex items-end p-4 gap-2">
                {BAR_DATA.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-secondary text-xs">
                    No compliance data available for this term
                  </div>
                ) : (
                  BAR_DATA.map((d) => (
                    <div key={d.dept} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                      <div
                        className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${d.pct}%`,
                          background: `rgba(244, 74, 59, ${d.pct / 100})`,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface-container-lowest text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {d.pct}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-secondary px-2">
                {BAR_DATA.map((d) => <span key={d.dept}>{d.dept}</span>)}
              </div>
            </div>
          </div>

          {/* Office Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-gutter">
            <div className="col-span-1 md:col-span-5 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg">
              <h3 className="font-title-md text-title-md text-on-surface mb-lg">Office Clearance Breakdown</h3>
              <div className="space-y-md">
                {officeBreakdown.map((office) => (
                  <div key={office.id}>
                    <div className="flex justify-between font-body-sm text-body-sm mb-1">
                      <span className="text-on-surface font-medium">{office.name}</span>
                      <span className="text-secondary">{office.clearedPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all duration-500"
                        style={{ width: `${office.clearedPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className="col-span-1 md:col-span-7 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
              <div className="p-lg border-b border-surface-container-high flex justify-between items-center">
                <h3 className="font-title-md text-title-md text-on-surface">Recent Report Generations</h3>
                <button className="text-brand-red font-label-md text-label-md hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface text-secondary font-label-md text-label-md uppercase tracking-wider">
                      <th className="p-4 font-medium">Report Name</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm divide-y divide-surface-container-low">
                    {mockRecentReports.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 flex items-center gap-3 text-on-surface font-medium">
                          <span className="material-symbols-outlined text-secondary shrink-0">description</span>
                          <span>{r.name}</span>
                        </td>
                        <td className="p-4 text-secondary">{r.date}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${r.status === "Completed" ? "bg-brand-red/10 text-brand-red" : "bg-surface-container-high text-secondary"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={handleDownloadFullReport}
                            className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
