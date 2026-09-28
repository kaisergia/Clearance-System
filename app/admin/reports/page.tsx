"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mockRecentReports } from "@/mock/mockData";
import { useOffices } from "@/components/contexts/OfficesContext";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DEPARTMENTS, DEPT_PROGRAMS, YEAR_LEVELS } from "@/lib/constants";
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
  // Organizations list from the database
  const [dbOrganizations, setDbOrganizations] = useState<any[]>([]);

  // Export Modal States
  const [mounted, setMounted] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDepts, setExportDepts] = useState<string[]>([]);
  const [exportProgs, setExportProgs] = useState<string[]>([]);
  const [exportYears, setExportYears] = useState<string[]>([]);
  const [exportStatuses, setExportStatuses] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>("excel");
  const [showConfirmDownload, setShowConfirmDownload] = useState(false);

  // Popover Toggles
  const [exportDeptPopoverOpen, setExportDeptPopoverOpen] = useState(false);
  const [exportProgPopoverOpen, setExportProgPopoverOpen] = useState(false);
  const [exportYearPopoverOpen, setExportYearPopoverOpen] = useState(false);

  // Popover Search Fields
  const [exportDeptSearch, setExportDeptSearch] = useState("");
  const [exportProgSearch, setExportProgSearch] = useState("");
  const [exportYearSearch, setExportYearSearch] = useState("");

  // Refs for click outside
  const exportDeptRef = useRef<HTMLDivElement>(null);
  const exportProgRef = useRef<HTMLDivElement>(null);
  const exportYearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportDeptRef.current && !exportDeptRef.current.contains(event.target as Node)) {
        setExportDeptPopoverOpen(false);
      }
      if (exportProgRef.current && !exportProgRef.current.contains(event.target as Node)) {
        setExportProgPopoverOpen(false);
      }
      if (exportYearRef.current && !exportYearRef.current.contains(event.target as Node)) {
        setExportYearPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch academic terms, departments, & organizations on mount
  useEffect(() => {
    const fetchTermsDeptsOrgs = async () => {
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

        const orgsRes = await fetch("/api/orgs");
        if (orgsRes.ok) {
          const orgs = await orgsRes.json();
          setDbOrganizations(orgs);
        }
      } catch (err) {
        console.error("Failed to fetch initial settings:", err);
      }
    };
    fetchTermsDeptsOrgs();
  }, []);

  // Fetch student records and term clearance records on selectedTerm change
  useEffect(() => {
    if (!selectedTerm) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [allStudents, deptsRes, orgsRes] = await Promise.all([
          clearanceService.getStudents(),
          fetch("/api/departments").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/orgs").then((r) => (r.ok ? r.json() : [])),
        ]);

        if (Array.isArray(deptsRes) && deptsRes.length > 0) {
          setDbDepartments(deptsRes);
        }
        if (Array.isArray(orgsRes) && orgsRes.length > 0) {
          setDbOrganizations(orgsRes);
        }

        const termStudents = allStudents.filter(
          (s: any) => !s.semester || !selectedTerm || s.semester === selectedTerm.name
        );
        const finalStudents = termStudents.length > 0 ? termStudents : allStudents;
        setStudents(finalStudents);

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
  const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

  // Calculations derived from dynamic term records
  const clearedStudents = students.filter((s) => {
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    return Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
  });

  const totalApproved = clearedStudents.length;
  const totalPending = Math.max(0, students.length - totalApproved);

  const deptStats: Record<string, { total: number; cleared: number }> = {};
  
  // Seed with standard department abbreviations
  const knownDepts = dbDepartments.length > 0
    ? dbDepartments.map((d: any) => d.abbreviation)
    : ["CCIS", "COE", "CEDAS", "CHS", "CABE"];
    
  knownDepts.forEach((d: string) => {
    deptStats[d] = { total: 0, cleared: 0 };
  });

  students.forEach((s) => {
    const deptKey = s.department || "Other";
    if (!deptStats[deptKey]) {
      deptStats[deptKey] = { total: 0, cleared: 0 };
    }
    deptStats[deptKey].total += 1;
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
    if (isCleared) {
      deptStats[deptKey].cleared += 1;
    }
  });

  const BAR_DATA = Object.entries(deptStats).map(([dept, stats]) => ({
    dept,
    cleared: stats.cleared,
    pending: Math.max(0, stats.total - stats.cleared),
    total: stats.total,
    pct: stats.total > 0 ? Math.round((stats.cleared / stats.total) * 100) : 0,
  }));

  // Dynamic Office Compliance Rate Breakdown (all offices from database)
  const officeBreakdown = offices.map((office) => {
    const officeRecs = clearanceRecords.filter((r) => r.officeId === office.id);
    const cleared = officeRecs.filter((r) => r.status === "Cleared").length;
    const total = students.length;
    const pending = Math.max(0, total - cleared);
    const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return {
      ...office,
      total,
      pending,
      approved: cleared,
      clearedPct: rate,
    };
  });

  // Dynamic Department Compliance Rate Breakdown (all departments from database)
  const departmentBreakdown = dbDepartments.map((dept) => {
    const deptStudents = students.filter(
      (s) => s.department === dept.abbreviation || s.department === dept.name
    );
    const total = deptStudents.length;
    const cleared = deptStudents.filter((s) => {
      const rec = clearanceRecords.find((r) => r.studentId === s.id && r.departmentId === dept.id);
      return rec && rec.status === "Cleared";
    }).length;
    const pending = Math.max(0, total - cleared);
    const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return {
      ...dept,
      total,
      pending,
      approved: cleared,
      clearedPct: rate,
    };
  });

  // Dynamic Organization Compliance Rate Breakdown (all organizations from database)
  const organizationBreakdown = dbOrganizations.map((org) => {
    let orgStudents = students;
    if (org.type === "Gov") {
      orgStudents = students;
    } else if (org.type === "LGU") {
      orgStudents = students.filter((s) => s.department === org.department);
    } else if (org.type === "AcademicClub") {
      orgStudents = students.filter(
        (s) => s.program === org.program || s.department === org.department
      );
    }
    const total = orgStudents.length;
    const cleared = orgStudents.filter((s) => {
      const rec = clearanceRecords.find((r) => r.studentId === s.id && r.orgId === org.id);
      return rec && rec.status === "Cleared";
    }).length;
    const pending = Math.max(0, total - cleared);
    const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return {
      ...org,
      total,
      pending,
      approved: cleared,
      clearedPct: rate,
    };
  });

  const availableDepartments = dbDepartments.length > 0
    ? dbDepartments.map((d: any) => d.abbreviation)
    : DEPARTMENTS;

  const toggleExportDept = (dept: string) => {
    setExportDepts((prev) => {
      if (dept === "All Departments") {
        const isCurrentlyChecked = prev.includes("All Departments");
        if (isCurrentlyChecked) {
          setExportProgs([]);
          return [];
        } else {
          return ["All Departments", ...availableDepartments];
        }
      } else {
        const isCurrentlyChecked = prev.includes(dept);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((d) => d !== dept && d !== "All Departments");
          const dependentPrograms = DEPT_PROGRAMS[dept] || [];
          setExportProgs((curr) => curr.filter((p) => !dependentPrograms.includes(p)));
        } else {
          const temp = [...prev, dept];
          const allSpecificSelected = availableDepartments.every((d) => temp.includes(d));
          next = allSpecificSelected ? ["All Departments", ...temp] : temp;
        }
        return next;
      }
    });
  };

  const getAvailableExportProgramsList = () => {
    if (exportDepts.includes("All Departments") || exportDepts.length === 0) {
      return Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
    }
    return exportDepts.flatMap((d) => DEPT_PROGRAMS[d] || []);
  };

  const toggleExportProg = (prog: string) => {
    const available = getAvailableExportProgramsList();
    setExportProgs((prev) => {
      if (prog === "All Programs") {
        const isCurrentlyChecked = prev.includes("All Programs");
        return isCurrentlyChecked ? [] : ["All Programs", ...available];
      } else {
        const isCurrentlyChecked = prev.includes(prog);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((p) => p !== prog && p !== "All Programs");
        } else {
          const temp = [...prev, prog];
          const allSpecificSelected = available.every((p) => temp.includes(p));
          next = allSpecificSelected ? ["All Programs", ...temp] : temp;
        }
        return next;
      }
    });
  };

  const toggleExportYear = (year: string) => {
    setExportYears((prev) => {
      if (year === "All Year Levels") {
        const isCurrentlyChecked = prev.includes("All Year Levels");
        return isCurrentlyChecked ? [] : ["All Year Levels", ...YEAR_LEVELS];
      } else {
        const isCurrentlyChecked = prev.includes(year);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((y) => y !== year && y !== "All Year Levels");
        } else {
          const temp = [...prev, year];
          const allSpecificSelected = YEAR_LEVELS.every((y) => temp.includes(y));
          next = allSpecificSelected ? ["All Year Levels", ...temp] : temp;
        }
        return next;
      }
    });
  };

  // Filter students based on chosen modal options
  const getFilteredStudentsForExport = () => {
    let list = [...students];

    // 1. Filter by selected departments (ignoring "All Departments")
    const activeDepts = exportDepts.filter((d) => d !== "All Departments");
    if (activeDepts.length > 0) {
      list = list.filter((s) => activeDepts.includes(s.department));
    }

    // 2. Filter by selected programs (ignoring "All Programs")
    const activeProgs = exportProgs.filter((p) => p !== "All Programs");
    if (activeProgs.length > 0) {
      list = list.filter((s) => activeProgs.includes(s.program));
    }

    // 3. Filter by selected year levels (ignoring "All Year Levels")
    const activeYears = exportYears.filter((y) => y !== "All Year Levels");
    if (activeYears.length > 0) {
      list = list.filter((s) => activeYears.includes(s.yearLevel || s.year));
    }

    // 4. Filter by overall clearance status
    if (exportStatuses.length > 0) {
      list = list.filter((s) => {
        const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
        const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
        const statusVal = isCleared ? "cleared" : "uncleared";
        return exportStatuses.includes(statusVal);
      });
    }

    return list;
  };

  // Open Export Modal and reset state
  const handleOpenExportModal = () => {
    setExportDepts([]);
    setExportProgs([]);
    setExportYears([]);
    setExportStatuses([]);
    setExportDeptPopoverOpen(false);
    setExportProgPopoverOpen(false);
    setExportYearPopoverOpen(false);
    setExportDeptSearch("");
    setExportProgSearch("");
    setExportYearSearch("");
    setExportFormat("excel");
    setIsExportModalOpen(true);
  };

  const handleDownloadReport = () => {
    setShowConfirmDownload(true);
  };

  // Actual export downloader
  const executeDownloadReport = () => {
    const list = getFilteredStudentsForExport();

    if (list.length === 0) {
      alert("No students match the selected criteria for export.");
      return;
    }

    const termName = selectedTerm?.name || "Clearance";

    if (exportFormat === "csv") {
      const headers = ["Student ID", "Name", "Department", "Program", "Year Level", "Clearance Status"];
      const rows = list.map((s) => {
        const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
        const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
        return [
          s.id,
          s.name,
          s.department || "N/A",
          s.program || "N/A",
          s.yearLevel || s.year || "N/A",
          isCleared ? "CLEARED" : "UNCLEARED"
        ];
      });
      const csvContent = [headers, ...rows]
        .map((row) => row.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Clearance_Report_${termName.replace(/\s+/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModalOpen(false);
      setShowConfirmDownload(false);
      return;
    }

    if (exportFormat === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to export PDF.");
        return;
      }
      const title = `Clearance Report - ${termName}`;
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const rowsHtml = list
        .map((s) => {
          const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
          const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
          return `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${s.id}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.department || "N/A"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.program || "N/A"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${s.yearLevel || s.year || "N/A"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; ${
                  isCleared
                    ? "background-color: #D1FAE5; color: #065F46;"
                    : "background-color: #FEE2E2; color: #991B1B;"
                }">${isCleared ? "CLEARED" : "UNCLEARED"}</span>
              </td>
            </tr>
          `;
        })
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; color: #333; margin: 40px; }
              .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .title-section h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111; text-transform: uppercase; letter-spacing: 0.5px; }
              .title-section p { margin: 5px 0 0 0; font-size: 12px; color: #666; font-weight: 500; }
              .meta-section { text-align: right; font-size: 12px; color: #555; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background-color: #f3f4f6; padding: 10px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; color: #4b5563; border-bottom: 2px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-section">
                <h1>Clearance Status Report</h1>
                <p>Term: ${termName}</p>
              </div>
              <div class="meta-section">
                <div>Date Generated: ${dateStr}</div>
                <div style="margin-top: 4px; font-weight: bold;">Total Records: ${list.length}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Year Level</th>
                  <th style="text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setIsExportModalOpen(false);
      setShowConfirmDownload(false);
      return;
    }

    // Excel XML Formatting
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
        const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
        sheet += `
      <Row>
        <Cell><Data ss:Type="String">${s.id}</Data></Cell>
        <Cell><Data ss:Type="String">${(s.name || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
        <Cell><Data ss:Type="String">${(s.program || "").replace(/&/g, "&amp;")}</Data></Cell>
        <Cell><Data ss:Type="String">${s.department || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${s.yearLevel || s.year || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${isCleared ? "CLEARED" : "UNCLEARED"}</Data></Cell>
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
    link.setAttribute("download", `Clearance_Report_${termName.replace(/\s+/g, "_")}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
    setShowConfirmDownload(false);
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
            disabled={students.length === 0}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 btn-hover active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export
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
            <div className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-lg border border-surface-container-high shadow-sm flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-title-md text-title-md text-on-surface">Clearance Status by Department</h3>
                <div className="flex items-center gap-4 text-xs font-body-sm text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f44a3b]" />
                    <span>Cleared</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex gap-4 pl-12 pr-4 relative min-h-[220px] items-end pb-8">
                {/* Y-axis Labels */}
                <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-right pr-2 text-[10px] text-secondary font-body-sm select-none">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                
                {/* Grid Lines */}
                <div className="absolute left-10 right-0 top-0 bottom-8 pointer-events-none flex flex-col justify-between">
                  <div className="w-full border-t border-slate-100/80" />
                  <div className="w-full border-t border-slate-100/80" />
                  <div className="w-full border-t border-slate-100/80" />
                  <div className="w-full border-t border-slate-100/80" />
                  <div className="w-full border-t border-slate-200" />
                </div>

                {/* Bars Container */}
                <div className="absolute left-10 right-0 top-0 bottom-8 flex justify-around items-end px-4">
                  {BAR_DATA.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary text-xs">
                      No compliance data available for this term
                    </div>
                  ) : (
                    BAR_DATA.map((d) => (
                      <div key={d.dept} className="flex flex-col items-center justify-end h-full relative group w-12">
                        {/* Stacked Bar */}
                        <div className="w-8 h-full bg-slate-200 rounded-t-sm overflow-hidden relative transition-all duration-300 hover:opacity-95 cursor-pointer shadow-sm">
                          <div
                            className="absolute bottom-0 left-0 w-full bg-[#f44a3b] transition-all duration-500"
                            style={{
                              height: `${d.pct}%`,
                            }}
                          />
                        </div>
                        
                        {/* Stacked Tooltip on Hover */}
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-slate-700 text-xs py-2.5 px-3.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl flex flex-col gap-1 border border-slate-200/80 pointer-events-none w-36 min-w-max after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-white">
                          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">{d.dept}</div>
                          <div className="flex justify-between gap-3 text-[11px]">
                            <span className="text-secondary">Cleared:</span>
                            <span className="font-bold text-brand-red">{d.cleared} ({d.pct}%)</span>
                          </div>
                          <div className="flex justify-between gap-3 text-[11px]">
                            <span className="text-secondary">Pending:</span>
                            <span className="font-bold text-slate-800">{d.pending} ({100 - d.pct}%)</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* X-axis Labels */}
                <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-around items-center px-4 font-body-sm text-[11px] text-secondary">
                  {BAR_DATA.map((d) => (
                    <span key={d.dept} className="w-12 text-center select-none">{d.dept}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Clearance Breakdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
            {/* Office Completion Rate */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg flex flex-col min-h-[350px]">
              <h3 className="font-title-md text-title-md text-on-surface mb-lg">Office Completion Rate</h3>
              <div className="space-y-md flex-1 overflow-y-auto max-h-[400px] pr-1">
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
                {officeBreakdown.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">No offices found.</p>
                )}
              </div>
            </div>

            {/* Department Completion Rate */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg flex flex-col min-h-[350px]">
              <h3 className="font-title-md text-title-md text-on-surface mb-lg">Department Completion Rate</h3>
              <div className="space-y-md flex-1 overflow-y-auto max-h-[400px] pr-1">
                {departmentBreakdown.map((dept) => (
                  <div key={dept.id}>
                    <div className="flex justify-between font-body-sm text-body-sm mb-1">
                      <span className="text-on-surface font-medium">{dept.name}</span>
                      <span className="text-secondary">{dept.clearedPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all duration-500"
                        style={{ width: `${dept.clearedPct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {departmentBreakdown.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">No departments found.</p>
                )}
              </div>
            </div>

            {/* Organization Completion Rate */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg flex flex-col min-h-[350px]">
              <h3 className="font-title-md text-title-md text-on-surface mb-lg">Organization Completion Rate</h3>
              <div className="space-y-md flex-1 overflow-y-auto max-h-[400px] pr-1">
                {organizationBreakdown.map((org) => (
                  <div key={org.id}>
                    <div className="flex justify-between font-body-sm text-body-sm mb-1">
                      <span className="text-on-surface font-medium">{org.name}</span>
                      <span className="text-secondary">{org.clearedPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all duration-500"
                        style={{ width: `${org.clearedPct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {organizationBreakdown.length === 0 && (
                  <p className="text-xs text-secondary text-center py-8">No organizations found.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Export Options Modal Portal */}
      {mounted && isExportModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">download</span>
                <h3 className="font-title-md text-lg font-bold text-on-surface uppercase tracking-wider">
                  Export Clearance Report
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
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-16">
              <p className="text-xs text-secondary mb-4">
                Select the filters to apply to the exported clearance report. By default, all constituents of the current term ({selectedTerm?.name || "Current Term"}) will be exported.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Department Dropdown Selector (Popover style) */}
                <div className="space-y-2 relative" ref={exportDeptRef}>
                  <label className="font-label-sm text-xs font-semibold text-secondary block">
                    Department
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setExportDeptPopoverOpen(!exportDeptPopoverOpen);
                      setExportProgPopoverOpen(false);
                      setExportYearPopoverOpen(false);
                    }}
                    className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <span className="truncate">
                      {exportDepts.length === 0
                        ? "All Departments"
                        : exportDepts.includes("All Departments")
                        ? "All Departments"
                        : exportDepts.length === 1
                        ? exportDepts[0]
                        : `${exportDepts.length} Selected`}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-base">
                      expand_more
                    </span>
                  </button>

                  {exportDeptPopoverOpen && (
                    <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
                      {/* Search */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-xs">
                          search
                        </span>
                        <input
                          type="text"
                          value={exportDeptSearch}
                          onChange={(e) => setExportDeptSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                          placeholder="Search departments..."
                        />
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                        <button
                          type="button"
                          onClick={() => setExportDepts(["All Departments", ...availableDepartments])}
                          className="hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportDepts([]);
                            setExportProgs([]);
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Options */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                        {["All Departments", ...availableDepartments]
                          .filter((d) => d.toLowerCase().includes(exportDeptSearch.toLowerCase()))
                          .map((dept) => (
                            <label
                              key={dept}
                              className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={exportDepts.includes(dept)}
                                onChange={() => toggleExportDept(dept)}
                                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                              />
                              <span>{dept}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Program Dropdown Selector */}
                <div className="space-y-2 relative" ref={exportProgRef}>
                  <label className="font-label-sm text-xs font-semibold text-secondary block">
                    Program
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setExportProgPopoverOpen(!exportProgPopoverOpen);
                      setExportDeptPopoverOpen(false);
                      setExportYearPopoverOpen(false);
                    }}
                    className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <span className="truncate">
                      {exportProgs.length === 0
                        ? "All Programs"
                        : exportProgs.includes("All Programs")
                        ? "All Programs"
                        : exportProgs.length === 1
                        ? exportProgs[0]
                        : `${exportProgs.length} Selected`}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-base">
                      expand_more
                    </span>
                  </button>

                  {exportProgPopoverOpen && (
                    <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
                      {/* Search */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-xs">
                          search
                        </span>
                        <input
                          type="text"
                          value={exportProgSearch}
                          onChange={(e) => setExportProgSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                          placeholder="Search programs..."
                        />
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const available = getAvailableExportProgramsList();
                            setExportProgs(["All Programs", ...available]);
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportProgs([])}
                          className="hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Options */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                        {["All Programs", ...getAvailableExportProgramsList()]
                          .filter((p) => p.toLowerCase().includes(exportProgSearch.toLowerCase()))
                          .map((prog) => (
                            <label
                              key={prog}
                              className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={exportProgs.includes(prog)}
                                onChange={() => toggleExportProg(prog)}
                                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                              />
                              <span>{prog}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Year Level Dropdown Selector */}
                <div className="space-y-2 relative" ref={exportYearRef}>
                  <label className="font-label-sm text-xs font-semibold text-secondary block">
                    Year Level
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setExportYearPopoverOpen(!exportYearPopoverOpen);
                      setExportDeptPopoverOpen(false);
                      setExportProgPopoverOpen(false);
                    }}
                    className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <span className="truncate">
                      {exportYears.length === 0
                        ? "All Year Levels"
                        : exportYears.includes("All Year Levels")
                        ? "All Year Levels"
                        : exportYears.length === 1
                        ? exportYears[0]
                        : `${exportYears.length} Selected`}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-base">
                      expand_more
                    </span>
                  </button>

                  {exportYearPopoverOpen && (
                    <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
                      {/* Search */}
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-xs">
                          search
                        </span>
                        <input
                          type="text"
                          value={exportYearSearch}
                          onChange={(e) => setExportYearSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                          placeholder="Search year levels..."
                        />
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                        <button
                          type="button"
                          onClick={() => setExportYears(["All Year Levels", ...YEAR_LEVELS])}
                          className="hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportYears([])}
                          className="hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Options */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                        {["All Year Levels", ...YEAR_LEVELS]
                          .filter((y) => y.toLowerCase().includes(exportYearSearch.toLowerCase()))
                          .map((yr) => (
                            <label
                              key={yr}
                              className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={exportYears.includes(yr)}
                                onChange={() => toggleExportYear(yr)}
                                className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                              />
                              <span>{yr}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Format Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">File Format</label>
                <div className="flex gap-4">
                  {[
                    { value: "excel", label: "Excel (.xls)", icon: "table_view" },
                    { value: "csv", label: "CSV (.csv)", icon: "description" },
                    { value: "pdf", label: "PDF (.pdf)", icon: "picture_as_pdf" },
                  ].map((format) => {
                    const isChecked = exportFormat === format.value;
                    return (
                      <button
                        type="button"
                        key={format.value}
                        onClick={() => setExportFormat(format.value)}
                        className={`flex-1 flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all text-left outline-none ${
                          isChecked
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {format.icon}
                        </span>
                        <span className="text-xs">{format.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clearance Status Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Clearance Status</label>
                <div className="flex gap-4">
                  {[
                    { value: "cleared", label: "Cleared" },
                    { value: "uncleared", label: "Uncleared" },
                  ].map((status) => {
                    const isChecked = exportStatuses.includes(status.value);
                    return (
                      <label
                        key={status.value}
                        className={`flex-1 flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                          isChecked
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setExportStatuses((prev) =>
                              prev.includes(status.value)
                                ? prev.filter((s) => s !== status.value)
                                : [...prev, status.value]
                            );
                          }}
                          className="sr-only"
                        />
                        <span className="material-symbols-outlined text-[18px]">
                          {isChecked ? "check_box" : "check_box_outline_blank"}
                        </span>
                        <span className="text-xs">{status.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-2 mt-4 pt-4 border-t border-outline-variant/40">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                    Preview ({getFilteredStudentsForExport().length} students to be exported)
                  </label>
                </div>
                <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low max-h-[350px] overflow-y-auto">
                  {getFilteredStudentsForExport().length === 0 ? (
                    <div className="text-center py-6 text-xs text-secondary italic">
                      No students match the current filters.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-outline-variant/60 bg-surface-container/50 text-[10px] font-bold text-secondary uppercase tracking-wider">
                          <th className="py-2 px-3">Student ID</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Program</th>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 text-[11px] font-medium text-on-surface">
                        {getFilteredStudentsForExport().map((student) => {
                          const studentRecs = clearanceRecords.filter((r) => r.studentId === student.id);
                          const isCleared = Boolean(studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
                          return (
                            <tr key={student.id} className="hover:bg-surface-bright/50 transition-colors">
                              <td className="py-2 px-3 font-bold">{student.id}</td>
                              <td className="py-2 px-3 font-semibold">{student.name}</td>
                              <td className="py-2 px-3">{student.department || "N/A"}</td>
                              <td className="py-2 px-3">{student.program || "N/A"}</td>
                              <td className="py-2 px-3">{student.yearLevel || student.year || "N/A"}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                  isCleared
                                    ? "bg-[#D1FAE5] text-[#065F46]"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                  {isCleared ? "Cleared" : "Uncleared"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low font-label-md text-xs text-on-surface transition-colors active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md text-xs shadow-sm hover:bg-primary-container transition-all flex items-center gap-2 btn-hover active:scale-95 animate-in fade-in cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDownload}
        title="Confirm Report Export"
        message="Are you sure you want to download this student clearance report? This will generate and download the report based on your selected filters."
        confirmText="Download"
        onConfirm={executeDownloadReport}
        onCancel={() => setShowConfirmDownload(false)}
      />
    </div>
  );
}
