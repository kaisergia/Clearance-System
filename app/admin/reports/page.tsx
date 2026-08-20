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
  // Organizations list from the database
  const [dbOrganizations, setDbOrganizations] = useState<any[]>([]);

  // Export Modal States
  const [mounted, setMounted] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDepts, setExportDepts] = useState<string[]>([]);
  const [exportYears, setExportYears] = useState<string[]>([]);
  const [exportStatuses, setExportStatuses] = useState<string[]>([]);
  const [exportSignatory, setExportSignatory] = useState<string>("All");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  useEffect(() => {
    setMounted(true);
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
  const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

  // Calculations derived from dynamic term records
  const clearedStudents = students.filter((s) => {
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    if (studentRecs.length === 0) return false;
    return studentRecs.every((r) => r.status === "Cleared");
  });

  const totalApproved = clearedStudents.length;
  const totalPending = students.length - totalApproved;

  const deptStats: Record<string, { total: number; cleared: number }> = {};
  students.forEach((s) => {
    const deptKey = s.department || "Other";
    if (!deptStats[deptKey]) {
      deptStats[deptKey] = { total: 0, cleared: 0 };
    }
    deptStats[deptKey].total += 1;
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
    if (isCleared) {
      deptStats[deptKey].cleared += 1;
    }
  });

  const BAR_DATA = Object.entries(deptStats).map(([dept, stats]) => ({
    dept,
    cleared: stats.cleared,
    pending: stats.total - stats.cleared,
    total: stats.total,
    pct: Math.round((stats.cleared / stats.total) * 100) || 0,
  }));

  // Dynamic Office Compliance Rate Breakdown (only show offices active in this term's records)
  const activeOfficeIds = new Set(clearanceRecords.map((r) => r.officeId).filter(Boolean));
  const officeBreakdown = offices
    .filter((o) => activeOfficeIds.has(o.id))
    .map((office) => {
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

  // Dynamic Department Compliance Rate Breakdown (only show departments active in this term's records)
  const activeDeptIds = new Set(clearanceRecords.map((r) => r.departmentId).filter(Boolean));
  const departmentBreakdown = dbDepartments
    .filter((d) => activeDeptIds.has(d.id))
    .map((dept) => {
      const deptRecs = clearanceRecords.filter((r) => r.departmentId === dept.id);
      const total = deptRecs.length;
      const cleared = deptRecs.filter((r) => r.status === "Cleared").length;
      const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
      return {
        ...dept,
        pending: total - cleared,
        approved: cleared,
        clearedPct: rate,
      };
    });

  // Dynamic Organization Compliance Rate Breakdown (only show organizations active in this term's records)
  const activeOrgIds = new Set(clearanceRecords.map((r) => r.orgId).filter(Boolean));
  const organizationBreakdown = dbOrganizations
    .filter((org) => activeOrgIds.has(org.id))
    .map((org) => {
      const orgRecs = clearanceRecords.filter((r) => r.orgId === org.id);
      const total = orgRecs.length;
      const cleared = orgRecs.filter((r) => r.status === "Cleared").length;
      const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
      return {
        ...org,
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
    setExportFormat("pdf");
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

    if (exportFormat === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Failed to open print preview. Please check your browser pop-up settings.");
        return;
      }

      const rowsHTML = list.map((s) => {
        const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
        const isCleared = studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared");
        return `
          <tr>
            <td>${s.id}</td>
            <td style="font-weight: 500; color: #0f172a;">${s.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
            <td>${s.department || "N/A"}</td>
            <td>${s.program || "N/A"}</td>
            <td>${s.yearLevel || s.year || "N/A"}</td>
            <td>
              <span class="status-badge ${isCleared ? "status-cleared" : "status-pending"}">
                ${isCleared ? "CLEARED" : "PENDING"}
              </span>
            </td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Clearance Compliance Report</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                color: #1e293b;
                margin: 40px;
                padding: 0;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .logo-title h1 {
                font-size: 22px;
                font-weight: 700;
                color: #b51b15;
                margin: 0;
                letter-spacing: -0.5px;
              }
              .logo-title p {
                font-size: 13px;
                color: #64748b;
                margin: 2px 0 0 0;
              }
              .meta-box {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px 20px;
                margin-bottom: 30px;
                display: grid;
                grid-template-cols: repeat(2, 1fr);
                gap: 12px;
                font-size: 12px;
              }
              .meta-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
              .meta-label {
                font-weight: 600;
                color: #64748b;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 0.5px;
              }
              .meta-value {
                color: #0f172a;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 12px;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 600;
                color: #475569;
                text-align: left;
                padding: 12px 16px;
                border-bottom: 1.5px solid #cbd5e1;
              }
              td {
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .status-badge {
                display: inline-flex;
                align-items: center;
                font-weight: 700;
                font-size: 10px;
                padding: 3px 8px;
                border-radius: 9999px;
                text-transform: uppercase;
              }
              .status-cleared {
                background-color: #d1fae5;
                color: #065f46;
              }
              .status-pending {
                background-color: #fee2e2;
                color: #991b1b;
              }
              .footer {
                margin-top: 50px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #64748b;
              }
              @media print {
                body {
                  margin: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-title">
                <h1>Cor Jesu College, Inc.</h1>
                <p>Clearance Report</p>
              </div>
              <div style="text-align: right">
                <p style="font-size: 12px; font-weight: 600; color: #475569; margin: 0;">ADMINISTRATIVE REPORT</p>
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Date Generated: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div class="meta-box">
              <div class="meta-item">
                <span class="meta-label">Academic Term</span>
                <span class="meta-value">${selectedTerm?.name}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Overall Status Filter</span>
                <span class="meta-value">${exportStatuses.length > 0 ? exportStatuses.join(", ") : "ALL STATUSES"}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Departments Filter</span>
                <span class="meta-value">${exportDepts.length > 0 ? exportDepts.join(", ") : "ALL DEPARTMENTS"}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Year Levels Filter</span>
                <span class="meta-value">${exportYears.length > 0 ? exportYears.join(", ") : "ALL YEARS"}</span>
              </div>
              <div class="meta-item" style="grid-column: span 2;">
                <span class="meta-label">Signatory Focus Filter</span>
                <span class="meta-value">${
                  exportSignatory === "All"
                    ? "None (Showing all signatory states)"
                    : `Only showing students uncleared in: ${
                        exportSignatory.startsWith("office-")
                          ? offices.find((o) => `office-${o.id}` === exportSignatory)?.name || exportSignatory
                          : dbDepartments.find((d) => `dept-${d.id}` === exportSignatory)?.name || exportSignatory
                      }`
                }</span>
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
                  <th>Clearance Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>

            <div class="footer">
              <span>Generated by System Administrator</span>
              <span>Page 1 of 1</span>
            </div>

            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
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

              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Academic Departments
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant">
                  {uniqueDepartments.length > 0 && (
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none font-bold col-span-3 border-b border-outline-variant/30 pb-2">
                      <input
                        type="checkbox"
                        checked={exportDepts.length === uniqueDepartments.length}
                        onChange={() => {
                          if (exportDepts.length === uniqueDepartments.length) {
                            setExportDepts([]);
                          } else {
                            setExportDepts([...uniqueDepartments]);
                          }
                        }}
                        className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                      />
                      <span>ALL DEPARTMENTS</span>
                    </label>
                  )}
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

              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Year Levels
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant">
                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none font-bold col-span-3 border-b border-outline-variant/30 pb-2">
                    <input
                      type="checkbox"
                      checked={exportYears.length === YEAR_LEVELS.length}
                      onChange={() => {
                        if (exportYears.length === YEAR_LEVELS.length) {
                          setExportYears([]);
                        } else {
                          setExportYears([...YEAR_LEVELS]);
                        }
                      }}
                      className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                    />
                    <span>ALL YEAR LEVELS</span>
                  </label>
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

              <div className="space-y-2">
                <label className="font-label-sm text-xs font-bold text-secondary uppercase tracking-wider block">
                  Overall Clearance Status
                </label>
                <div className="flex flex-wrap gap-6 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant items-center">
                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none font-bold border-r border-outline-variant/30 pr-6 mr-2">
                    <input
                      type="checkbox"
                      checked={exportStatuses.length === 2}
                      onChange={() => {
                        if (exportStatuses.length === 2) {
                          setExportStatuses([]);
                        } else {
                          setExportStatuses(["Cleared", "Pending"]);
                        }
                      }}
                      className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-outline-variant cursor-pointer"
                    />
                    <span>ALL STATUSES</span>
                  </label>
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
                    onClick={() => setExportFormat("pdf")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      exportFormat === "pdf"
                        ? "bg-brand-red/10 border-brand-red text-brand-red shadow-sm"
                        : "bg-surface-container-low/40 border-outline-variant text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    PDF Document
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
