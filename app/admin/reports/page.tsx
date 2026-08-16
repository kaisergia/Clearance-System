"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  // Departments list from the database
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);

  // Export Modal States
  const [mounted, setMounted] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDepts, setExportDepts] = useState<string[]>([]);
  const [exportYears, setExportYears] = useState<string[]>([]);
  const [exportStatuses, setExportStatuses] = useState<string[]>([]);
  const [exportSignatory, setExportSignatory] = useState<string>("All");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch academic terms & departments on mount
  useEffect(() => {
    const fetchTermsAndDepts = async () => {
      try {
        const termsRes = await fetch("/api/terms");
        if (termsRes.ok) {
          const data = await termsRes.json();
          setTerms(data);
          const active = data.find((t: any) => t.status === "Active") || data[0];
          setSelectedTerm(active);
        }

        const deptsRes = await fetch("/api/departments");
        if (deptsRes.ok) {
          const depts = await deptsRes.json();
          setDbDepartments(depts);
        }
      } catch (err) {
        console.error("Failed to fetch initial settings:", err);
      }
    };
    fetchTermsAndDepts();
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

  // Unique departments currently present in the student list
  const uniqueDepartments = Array.from(
    new Set(students.map((s) => s.department).filter(Boolean))
  ) as string[];

  // Year levels helper
  const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Irregular"];

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

  // Filter students based on chosen modal options
  const getFilteredStudentsForExport = () => {
    let list = [...students];

    // 1. Filter by departments
    if (exportDepts.length > 0) {
      list = list.filter((s) => exportDepts.includes(s.department));
    }

    // 2. Filter by year levels
    if (exportYears.length > 0) {
      list = list.filter((s) => exportYears.includes(s.yearLevel || s.year));
    }

    // 3. Filter by overall status
    if (exportStatuses.length > 0) {
      list = list.filter((s) => {
        const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
        const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
        const status = isCleared ? "Cleared" : "Pending";
        return exportStatuses.includes(status);
      });
    }

    // 4. Filter by specific uncleared signatory
    if (exportSignatory !== "All") {
      const parts = exportSignatory.split("-");
      const type = parts[0];
      const idVal = parts[1];

      if (type === "office") {
        const officeId = parseInt(idVal, 10);
        list = list.filter((s) => {
          const rec = clearanceRecords.find((r) => r.studentId === s.id && r.officeId === officeId);
          return !rec || rec.status !== "Cleared";
        });
      } else if (type === "dept") {
        const deptId = parseInt(idVal, 10);
        list = list.filter((s) => {
          const rec = clearanceRecords.find((r) => r.studentId === s.id && r.departmentId === deptId);
          return !rec || rec.status !== "Cleared";
        });
      }
    }

    return list;
  };

  // Open Export Modal and reset state
  const handleOpenExportModal = () => {
    setExportDepts([]);
    setExportYears([]);
    setExportStatuses([]);
    setExportSignatory("All");
    setExportFormat("csv");
    setIsExportModalOpen(true);
  };

  // Checkbox helpers
  const toggleExportDept = (dept: string) => {
    setExportDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleExportYear = (year: string) => {
    setExportYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const toggleExportStatus = (status: string) => {
    setExportStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Download filtered report
  const handleDownloadReport = () => {
    const list = getFilteredStudentsForExport();

    if (list.length === 0) {
      alert("No student records found matching the selected filters.");
      return;
    }

    if (exportFormat === "csv") {
      const headers = ["Student ID", "Name", "Department", "Program", "Year Level", "Clearance Status"];
      const rows = list.map((s) => {
        const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
        const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
        return [
          s.id,
          s.name,
          s.department || "N/A",
          s.program || "N/A",
          s.yearLevel || s.year || "N/A",
          isCleared ? "CLEARED" : "PENDING",
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Clearance_Report_${selectedTerm.name.replace(/\s+/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Excel XML formatting (Worksheet grouping by department)
      const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="headerStyle">
      <Font ss:Bold="1" />
    </Style>
  </Styles>`;

      const buildSheet = (name: string, dataList: typeof list) => {
        let sheet = `  <Worksheet ss:Name="${name}">
    <Table>
      <Row>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Student ID</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Name</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Program</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Department</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Year Level</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Status</Data></Cell>
      </Row>`;

        dataList.forEach((s) => {
          const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
          const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
          sheet += `
      <Row>
        <Cell><Data ss:Type="String">${s.id}</Data></Cell>
        <Cell><Data ss:Type="String">${s.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
        <Cell><Data ss:Type="String">${(s.program || "").replace(/&/g, "&amp;")}</Data></Cell>
        <Cell><Data ss:Type="String">${s.department || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${s.yearLevel || s.year || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${isCleared ? "CLEARED" : "PENDING"}</Data></Cell>
      </Row>`;
        });

        sheet += `
    </Table>
  </Worksheet>`;
        return sheet;
      };

      let xmlSheets = buildSheet("All Students", list);

      // Group students by department on separate sheets
      const exportDeptsList = Array.from(new Set(list.map((s) => s.department).filter(Boolean))).sort();
      exportDeptsList.forEach((dept) => {
        const deptList = list.filter((s) => s.department === dept);
        xmlSheets += buildSheet(dept, deptList);
      });

      const xmlContent = xmlHeader + xmlSheets + "</Workbook>";
      const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Clearance_Report_${selectedTerm.name.replace(/\s+/g, "_")}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsExportModalOpen(false);
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
            onClick={handleOpenExportModal}
            className="flex items-center gap-2 bg-brand-red hover:bg-primary text-white px-6 py-2.5 rounded-lg font-label-md text-label-md transition-colors shadow-sm hover:shadow-md btn-hover cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download Report
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
                            onClick={handleOpenExportModal}
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

      {/* Export Options Modal Portal */}
      {mounted && isExportModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-red text-2xl">download</span>
                <h3 className="font-title-md text-lg font-bold text-on-surface uppercase tracking-wider">
                  Export Personalized Report
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-6">
              <p className="text-xs text-secondary">
                Personalize and filter the student clearance report for the current term (<strong>{selectedTerm?.name}</strong>).
              </p>

              {/* 1. Academic Department Filters */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Academic Departments
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant">
                  {uniqueDepartments.map((dept) => (
                    <label key={dept} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportDepts.includes(dept)}
                        onChange={() => toggleExportDept(dept)}
                        className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
                  {uniqueDepartments.length === 0 && (
                    <span className="text-secondary text-xs col-span-3">No departments found in students directory.</span>
                  )}
                </div>
              </div>

              {/* 2. Year Level Filters */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Year Levels
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant">
                  {YEAR_LEVELS.map((yr) => (
                    <label key={yr} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportYears.includes(yr)}
                        onChange={() => toggleExportYear(yr)}
                        className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                      />
                      <span>{yr}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Overall Clearance Status */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Overall Clearance Status
                </label>
                <div className="flex gap-6 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant">
                  {["Cleared", "Pending"].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportStatuses.includes(status)}
                        onChange={() => toggleExportStatus(status)}
                        className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                      />
                      <span>{status.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Admin Custom Filter: Signatory Uncleared Filter */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Uncleared Signatory Filter (Specialized)
                </label>
                <div className="p-4 bg-surface-container-low/40 rounded-xl border border-outline-variant space-y-3">
                  <p className="text-[11px] text-secondary">
                    Show only students who are <strong>UNCLEARED</strong> in the selected signatory below:
                  </p>
                  <div className="relative">
                    <select
                      value={exportSignatory}
                      onChange={(e) => setExportSignatory(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-sm text-sm px-3 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-red pr-8 appearance-none"
                    >
                      <option value="All">-- No Signatory Filter (Show All) --</option>
                      <optgroup label="Head Offices">
                        {offices.map((o) => (
                          <option key={`office-${o.id}`} value={`office-${o.id}`}>
                            {o.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Academic Departments">
                        {dbDepartments.map((d) => (
                          <option key={`dept-${d.id}`} value={`dept-${d.id}`}>
                            {d.name} ({d.abbreviation})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-base">
                      arrow_drop_down
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Export Format */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Export Format
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      exportFormat === "csv"
                        ? "bg-brand-red/10 border-brand-red text-brand-red shadow-sm"
                        : "bg-surface-container-low/40 border-outline-variant text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    CSV Spreadsheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("excel")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      exportFormat === "excel"
                        ? "bg-brand-red/10 border-brand-red text-brand-red shadow-sm"
                        : "bg-surface-container-low/40 border-outline-variant text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">table_chart</span>
                    Excel Workbook (.xls)
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-auto">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 border border-outline-variant rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors font-bold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-6 py-2.5 bg-brand-red hover:bg-primary text-white rounded-xl shadow-sm font-bold text-sm hover:shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Download Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
