"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/components/contexts/SettingsContext";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import * as clearanceService from "@/services/clearanceService";

// Types
interface Student {
  id: string;
  name: string;
  program: string;
  department: string;
  year: string;
  status: string;
  email?: string;
  semester?: string;
  lastUpdated?: string;
}

interface ClearanceRecord {
  studentId: string;
  requirementId: string;
  status: "cleared" | "uncleared";
  remark: string;
  dateAssigned: string;
  dateResolved?: string;
}

interface Requirement {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const DEPARTMENTS = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const STATUSES = [
  { value: "Cleared", label: "Cleared" },
  { value: "Pending", label: "Pending" },
];

const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

const MOCK_REQUIREMENTS: Requirement[] = [
  { id: "org-req-1", name: "CSS Membership Fee Settlement", description: "Submit receipt of CSS membership fee payment.", isActive: true },
  { id: "org-req-2", name: "General Assembly Attendance", description: "Attend the CSS first General Assembly.", isActive: true },
  { id: "org-req-3", name: "University Clearance Form Submission", description: "Submit a physical copy of form.", isActive: true },
];

const MOCK_RECORDS: ClearanceRecord[] = [
  { studentId: "2021-00001", requirementId: "org-req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-10-01", dateResolved: "2024-10-15" },
  { studentId: "2021-00001", requirementId: "org-req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-10-01", dateResolved: "2024-11-20" },
  { studentId: "2021-00002", requirementId: "org-req-1", status: "uncleared", remark: "Unpaid balance", dateAssigned: "2024-10-01" },
  { studentId: "2021-00002", requirementId: "org-req-2", status: "uncleared", remark: "Absent", dateAssigned: "2024-10-01" },
];

interface StackedBarChartProps {
  data: {
    label: string;
    cleared: number;
    uncleared: number;
  }[];
  title: string;
}

function StackedBarChart({ data, title }: StackedBarChartProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-high p-6 flex flex-col">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-title-md text-title-md text-on-surface">{title}</h4>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 font-label-md text-xs text-secondary">
            <span className="w-3 h-3 rounded-full bg-surface-container-high block" /> Pending
          </span>
          <span className="flex items-center gap-1 font-label-md text-xs text-on-surface">
            <span className="w-3 h-3 rounded-full bg-brand-red block" /> Cleared
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-secondary font-body-sm text-sm">
          No data available
        </div>
      ) : (
        <div className="w-full h-[260px] relative flex items-end pl-8">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between pb-[30px]">
            {["100%", "75%", "50%", "25%", "0%"].map((pct) => (
              <span key={pct} className="font-label-md text-[10px] text-secondary text-right w-7">
                {pct}
              </span>
            ))}
          </div>
          {/* Grid lines */}
          <div className="absolute left-8 right-0 top-0 h-full flex flex-col justify-between pb-[30px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full border-t border-surface-container-high/60" />
            ))}
          </div>
          {/* Bars */}
          <div className="flex-1 h-full flex items-end justify-between px-2 pb-[30px] relative z-10">
            {data.map((d) => {
              const total = d.cleared + d.uncleared;
              const clearedPct = total > 0 ? Math.round((d.cleared / total) * 100) : 0;
              const pendingPct = total > 0 ? 100 - clearedPct : 0;
              const totalPct = 100;

              return (
                <div key={d.label} className="flex flex-col items-center gap-1 flex-1 h-full justify-end relative group">
                  <div
                    className="w-[50%] max-w-[32px] rounded-t-sm relative overflow-hidden transition-all duration-300 hover:opacity-90 animate-bar-grow"
                    style={{ height: `${totalPct}%` }}
                  >
                    <div className="absolute inset-0 bg-surface-container-high rounded-t-sm" />
                    <div
                      className="absolute bottom-0 w-full bg-brand-red rounded-t-sm transition-all duration-500"
                      style={{ height: `${clearedPct}%` }}
                    />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-[108%] left-1/2 -translate-x-1/2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl px-3.5 py-2.5 flex flex-col items-start w-max whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-30">
                    <span className="font-bold border-b border-outline-variant/40 pb-1 mb-1.5 w-full text-xs text-on-surface">{d.label}</span>
                    <span className="text-[11px] text-secondary flex justify-between w-full gap-4">
                      <span>Cleared:</span>
                      <span className="font-bold text-primary">{d.cleared} ({clearedPct}%)</span>
                    </span>
                    <span className="text-[11px] text-secondary flex justify-between w-full gap-4">
                      <span>Pending:</span>
                      <span className="font-bold text-on-surface">{d.uncleared} ({pendingPct}%)</span>
                    </span>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface-container-lowest border-r border-b border-outline-variant/60 rotate-45" />
                  </div>

                  <span className="absolute -bottom-7 font-label-md text-[10px] text-secondary whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgReportsPage() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();
  const [selectedTerm, setSelectedTerm] = useState(currentTerm);

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Active Org Configuration
  const [org, setOrg] = useState<any>(null);

  // Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDepts, setExportDepts] = useState<string[]>([]);
  const [exportProgs, setExportProgs] = useState<string[]>([]);
  const [exportYears, setExportYears] = useState<string[]>([]);
  const [exportStatuses, setExportStatuses] = useState<string[]>([]);

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

    const fetchOrg = async () => {
      const orgId = localStorage.getItem("orgId");
      if (orgId) {
        const currentOrg = await clearanceService.getOrgById(parseInt(orgId));
        if (currentOrg) {
          setOrg(currentOrg);
        }
      }
    };
    fetchOrg();

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

  const isExclusiveDept = org && (org.type === "LGU" || org.type === "AcademicClub");
  const isExclusiveProg = org && org.type === "AcademicClub";

  const toggleExportDept = (dept: string) => {
    if (isExclusiveDept) return;
    setExportDepts((prev) => {
      if (dept === "All Departments") {
        const isCurrentlyChecked = prev.includes("All Departments");
        if (isCurrentlyChecked) {
          setExportProgs([]);
          return [];
        } else {
          return ["All Departments", ...DEPARTMENTS];
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
          const allSpecificSelected = DEPARTMENTS.every((d) => temp.includes(d));
          next = allSpecificSelected ? ["All Departments", ...temp] : temp;
        }
        return next;
      }
    });
  };

  const getAvailableExportProgramsList = () => {
    if (isExclusiveProg && org?.program) {
      return [org.program];
    }
    if (exportDepts.includes("All Departments")) {
      return Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
    }
    return exportDepts.flatMap((d) => DEPT_PROGRAMS[d] || []);
  };

  const toggleExportProg = (prog: string) => {
    if (isExclusiveProg) return;
    const availableProgs = getAvailableExportProgramsList();
    setExportProgs((prev) => {
      if (prog === "All Programs") {
        const isCurrentlyChecked = prev.includes("All Programs");
        if (isCurrentlyChecked) {
          return [];
        } else {
          return ["All Programs", ...availableProgs];
        }
      } else {
        const isCurrentlyChecked = prev.includes(prog);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((p) => p !== prog && p !== "All Programs");
        } else {
          const temp = [...prev, prog];
          const allSpecificSelected = availableProgs.every((p) => temp.includes(p));
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
        if (isCurrentlyChecked) {
          return [];
        } else {
          return ["All Year Levels", ...YEAR_LEVELS];
        }
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

  const [constituents, setConstituents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchConstituents = async () => {
      if (!org) {
        setConstituents([]);
        return;
      }
      let list: Student[] = [];

      // Map students to reports-compatible interface
      const fetchedStudents = await clearanceService.getStudents();
      const mappedStudents: Student[] = fetchedStudents.map((s: any) => ({
        id: s.id,
        name: s.name,
        program: s.program,
        department: s.department,
        year: s.year,
        status: s.status || "Pending",
        email: s.email,
        semester: s.semester,
        lastUpdated: "2024-11-20", // Mock date
      }));

      if (org.type === "Gov") {
        list = mappedStudents;
      } else if (org.type === "LGU") {
        list = mappedStudents.filter((s) => s.department === org.department);
      } else if (org.type === "AcademicClub") {
        list = mappedStudents.filter((s) => s.program === org.program);
      } else if (org.type === "NonAcademicClub") {
        const memberIds = await clearanceService.getOrgMemberIds(org.id);
        list = mappedStudents.filter((s) => memberIds.includes(s.id));
      }

      setConstituents(list);
    };
    fetchConstituents();
  }, [org]);

  const handleTermChange = (term: string) => {
    setIsLoading(true);
    setSelectedTerm(term);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    if (constituents.length === 0) {
      return { totalStudents: 0, totalCleared: 0, totalUncleared: 0, clearanceRate: 0, unclearedRate: 0 };
    }

    const totalStudents = constituents.length;
    const totalCleared = constituents.filter((s) => s.status === "Cleared").length;
    const totalUncleared = constituents.filter((s) => s.status === "Pending").length;
    const clearanceRate = Math.round((totalCleared / totalStudents) * 100);
    const unclearedRate = 100 - clearanceRate;

    return { totalStudents, totalCleared, totalUncleared, clearanceRate, unclearedRate };
  }, [constituents]);

  // Clearance Progress Over Time (Cumulative Cleared by Week)
  const progressChartData = useMemo(() => {
    if (constituents.length === 0) return [];

    const clearedStudents = constituents.filter((s) => s.status === "Cleared" && s.lastUpdated);
    const dates = clearedStudents.map((s) => new Date(s.lastUpdated || "").getTime()).sort((a, b) => a - b);
    if (dates.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({ label: `Wk ${i + 1}`, count: 0 }));
    }

    const minDate = new Date(dates[0]);
    const startOfWeek = new Date(minDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weeks: { start: number; end: number; label: string; count: number }[] = [];
    let current = new Date(startOfWeek);

    for (let i = 1; i <= 12; i++) {
      const start = current.getTime();
      const end = new Date(current);
      end.setDate(end.getDate() + 7);
      weeks.push({
        start,
        end: end.getTime(),
        label: `Wk ${i}`,
        count: 0,
      });
      current = end;
    }

    weeks.forEach((w) => {
      w.count = clearedStudents.filter((s) => new Date(s.lastUpdated || "").getTime() <= w.end).length;
    });

    return weeks.map((w) => ({ label: w.label, count: w.count }));
  }, [constituents]);

  // Year level breakdown
  const yearLevelData = useMemo(() => {
    return YEAR_LEVELS.map((yr) => {
      const yrStudents = constituents.filter((s) => s.year === yr);
      const cleared = yrStudents.filter((s) => s.status === "Cleared").length;
      const uncleared = yrStudents.filter((s) => s.status === "Pending").length;
      return { label: yr, cleared, uncleared };
    });
  }, [constituents]);

  // Group breakdown depending on Org Scope
  const scopeBreakdownData = useMemo(() => {
    if (!org) return [];

    if (org.type === "AcademicClub") {
      return yearLevelData;
    } else if (org.type === "LGU") {
      const programs = DEPT_PROGRAMS[org.department || ""] || [];
      return programs.map((prog) => {
        const progStudents = constituents.filter((s) => s.program === prog);
        const cleared = progStudents.filter((s) => s.status === "Cleared").length;
        const uncleared = progStudents.filter((s) => s.status === "Pending").length;
        return { label: prog, cleared, uncleared };
      });
    } else {
      return DEPARTMENTS.map((d) => {
        const deptStudents = constituents.filter((s) => s.department === d);
        const cleared = deptStudents.filter((s) => s.status === "Cleared").length;
        const uncleared = deptStudents.filter((s) => s.status === "Pending").length;
        return { label: d, cleared, uncleared };
      });
    }
  }, [org, constituents, yearLevelData]);

  // Dynamic Chart Title
  const barChartTitle = useMemo(() => {
    if (!org) return "Compliance Roster";
    if (org.type === "AcademicClub") return "Clearance Status by Year Level";
    if (org.type === "LGU") return "Clearance Status by College Programs";
    return "Clearance Status by Department";
  }, [org]);

  // Requirement Completion Table data
  const reqCompletionData = useMemo(() => {
    return MOCK_REQUIREMENTS.map((req) => {
      const assignedRecords = MOCK_RECORDS.filter((r) => r.requirementId === req.id);
      const cleared = assignedRecords.filter((r) => r.status === "cleared").length;
      const total = assignedRecords.length;
      const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
      return { ...req, cleared, total, rate };
    });
  }, []);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (isExclusiveDept && org.department) {
      setExportDepts([org.department]);
    } else {
      setExportDepts([]);
    }

    if (isExclusiveProg && org.program) {
      setExportProgs([org.program]);
    } else {
      setExportProgs([]);
    }

    setExportYears([]);
    setExportStatuses([]);
    setExportDeptPopoverOpen(false);
    setExportProgPopoverOpen(false);
    setExportYearPopoverOpen(false);
    setExportDeptSearch("");
    setExportProgSearch("");
    setExportYearSearch("");
    setIsExportModalOpen(true);
  };

  const [showConfirmDownload, setShowConfirmDownload] = useState(false);

  const handleDownloadCSV = () => {
    setShowConfirmDownload(true);
  };

  const executeDownloadCSV = () => {
    let list = [...constituents];

    const activeDepts = exportDepts.filter((d) => d !== "All Departments");
    if (activeDepts.length > 0 && !isExclusiveDept) {
      list = list.filter((s) => activeDepts.includes(s.department));
    }

    const activeProgs = exportProgs.filter((p) => p !== "All Programs");
    if (activeProgs.length > 0 && !isExclusiveProg) {
      list = list.filter((s) => activeProgs.includes(s.program));
    }

    const activeYears = exportYears.filter((y) => y !== "All Year Levels");
    if (activeYears.length > 0) {
      list = list.filter((s) => activeYears.includes(s.year));
    }

    if (exportStatuses.length > 0) {
      list = list.filter((s) => exportStatuses.includes(s.status));
    }

    if (list.length === 0) {
      alert("No students match the selected criteria for export.");
      return;
    }

    const getYearWeight = (yr: string) => {
      if (yr.includes("1st")) return 1;
      if (yr.includes("2nd")) return 2;
      if (yr.includes("3rd")) return 3;
      if (yr.includes("4th")) return 4;
      return 9;
    };

    const sortedList = [...list].sort((a, b) => {
      const deptA = a.department || "";
      const deptB = b.department || "";
      if (deptA !== deptB) return deptA.localeCompare(deptB);

      const yrA = getYearWeight(a.year || "");
      const yrB = getYearWeight(b.year || "");
      if (yrA !== yrB) return yrA - yrB;

      return a.name.localeCompare(b.name);
    });

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
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Course/Program</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Department</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Year Level</Data></Cell>
        <Cell ss:StyleID="headerStyle"><Data ss:Type="String">Status</Data></Cell>
      </Row>`;

      dataList.forEach((s) => {
        sheet += `
      <Row>
        <Cell><Data ss:Type="String">${s.id}</Data></Cell>
        <Cell><Data ss:Type="String">${s.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>
        <Cell><Data ss:Type="String">${s.program.replace(/&/g, "&amp;")}</Data></Cell>
        <Cell><Data ss:Type="String">${s.department}</Data></Cell>
        <Cell><Data ss:Type="String">${s.year}</Data></Cell>
        <Cell><Data ss:Type="String">${s.status.toUpperCase()}</Data></Cell>
      </Row>`;
      });

      sheet += `
    </Table>
  </Worksheet>`;
      return sheet;
    };

    let xmlSheets = buildSheet("All Students", list);

    const departments = Array.from(new Set(list.map((s) => s.department))).filter(Boolean).sort();
    departments.forEach((dept) => {
      const deptList = list
        .filter((s) => s.department === dept)
        .sort((a, b) => {
          const yrA = getYearWeight(a.year || "");
          const yrB = getYearWeight(b.year || "");
          if (yrA !== yrB) return yrA - yrB;
          return a.name.localeCompare(b.name);
        });
      xmlSheets += buildSheet(dept, deptList);
    });

    const xmlContent = xmlHeader + xmlSheets + "</Workbook>";
    const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${org?.name || "org"}_clearance_report.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
    setShowConfirmDownload(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports & Metrics</h2>
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="material-symbols-outlined text-base text-primary">groups</span>
            Organization: <span className="font-semibold text-on-surface">{org?.name || "Loading..."}</span>
            <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-tertiary">
              {org?.type === "Gov" ? "University-Wide" : org?.type === "LGU" ? `LGU (${org?.department})` : "Club"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Term Selector */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedTerm}
              onChange={(e) => handleTermChange(e.target.value)}
              className="custom-ring w-full h-10 pl-4 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
            >
              {availableTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-lg">
              expand_more
            </span>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="h-10 px-5 bg-brand-red text-white font-label-md text-sm font-semibold rounded-lg shadow-sm hover:bg-opacity-95 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center text-secondary font-medium">
          Loading metrics data...
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Constituents */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Total Constituents
                </span>
                <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">
                  {stats.totalStudents}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low text-xs text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Total assigned constituents</span>
              </div>
            </div>

            {/* Total Cleared */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Total Cleared
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display-lg text-4xl font-extrabold text-on-surface">
                    {stats.totalCleared}
                  </span>
                  <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                    {stats.clearanceRate}%
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low text-xs text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Students cleared for this term</span>
              </div>
            </div>

            {/* Total Uncleared */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Total Uncleared
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display-lg text-4xl font-extrabold text-on-surface">
                    {stats.totalUncleared}
                  </span>
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    {stats.unclearedRate}%
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low text-xs text-secondary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Students with pending clearances</span>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Clearance Progress Over Time */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex flex-col gap-1 mb-6">
              <h3 className="text-base font-bold text-on-surface uppercase tracking-wider">
                Clearance Progress Over Time
              </h3>
              <p className="text-xs text-secondary">
                Cumulative students cleared, by week — {selectedTerm}
              </p>
            </div>
            {progressChartData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-secondary">
                No clearance timeline data to display.
              </div>
            ) : (
              <div className="w-full relative">
                <svg viewBox="0 0 800 250" className="w-full h-auto">
                  {(() => {
                    const maxCount = Math.max(...progressChartData.map(d => d.count), 1);
                    const yMax = Math.ceil(maxCount / 4) * 4 || 4;

                    return [0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = 30 + 170 * (1 - ratio);
                      const labelVal = Math.round(yMax * ratio);
                      return (
                        <g key={index}>
                          <line x1="50" y1={y} x2="780" y2={y} stroke="var(--secondary)" strokeOpacity="0.15" strokeDasharray="3 3" />
                          <text x="40" y={y + 4} textAnchor="end" fill="var(--secondary)" className="text-[10px] font-semibold">
                            {labelVal}
                          </text>
                        </g>
                      );
                    });
                  })()}

                  {progressChartData.map((d, index) => {
                    const x = 50 + (index * (730 / (progressChartData.length - 1)));
                    return (
                      <line
                        key={`v-grid-${index}`}
                        x1={x}
                        y1={30}
                        x2={x}
                        y2={200}
                        stroke="var(--secondary)"
                        strokeOpacity="0.1"
                        strokeDasharray="3 3"
                      />
                    );
                  })}

                  {(() => {
                    const maxCount = Math.max(...progressChartData.map(d => d.count), 1);
                    const yMax = Math.ceil(maxCount / 4) * 4 || 4;
                    const points = progressChartData.map((d, index) => {
                      const x = 50 + (index * (730 / (progressChartData.length - 1)));
                      const y = 200 - (d.count / yMax) * 170;
                      return { x, y, label: d.label, count: d.count };
                    });

                    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                    const areaPath = `${linePath} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                    return (
                      <g>
                        <path d={areaPath} fill="url(#chart-gradient)" className="opacity-10" />
                        <path d={linePath} fill="none" stroke="url(#line-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {points.map((p, i) => (
                          <circle
                            key={`dot-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="white"
                            stroke="url(#line-gradient)"
                            strokeWidth="2.5"
                          />
                        ))}

                        {hoveredIndex !== null && points[hoveredIndex] && (
                          <g>
                            <line
                              x1={points[hoveredIndex].x}
                              y1={30}
                              x2={points[hoveredIndex].x}
                              y2={200}
                              stroke="var(--primary)"
                              strokeOpacity="0.4"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx={points[hoveredIndex].x}
                              cy={points[hoveredIndex].y}
                              r="6"
                              fill="var(--primary)"
                              stroke="white"
                              strokeWidth="2.5"
                            />
                          </g>
                        )}

                        {points.map((p, i) => {
                          const totalSlices = points.length;
                          const sliceWidth = 730 / (totalSlices - 1);
                          const startX = p.x - sliceWidth / 2;
                          return (
                            <rect
                              key={`slice-${i}`}
                              x={i === 0 ? 50 : startX}
                              y={30}
                              width={i === 0 || i === totalSlices - 1 ? sliceWidth / 2 : sliceWidth}
                              height={170}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredIndex(i)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                          );
                        })}

                        {points.map((p, i) => (
                          <text key={`lbl-${i}`} x={p.x} y={220} textAnchor="middle" fill="var(--secondary)" className="text-[10px] font-bold">
                            {p.label}
                          </text>
                        ))}
                      </g>
                    );
                  })()}

                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="line-gradient" x1="50" y1="0" x2="780" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f44a3b" />
                      <stop offset="100%" stopColor="#b51b15" />
                    </linearGradient>
                  </defs>
                </svg>

                {hoveredIndex !== null && (() => {
                  const maxCount = Math.max(...progressChartData.map(d => d.count), 1);
                  const yMax = Math.ceil(maxCount / 4) * 4 || 4;
                  const points = progressChartData.map((d, index) => {
                    const x = 50 + (index * (730 / (progressChartData.length - 1)));
                    const y = 200 - (d.count / yMax) * 170;
                    return { x, y, label: d.label, count: d.count };
                  });
                  const p = points[hoveredIndex];
                  if (!p) return null;

                  const total = stats.totalStudents;
                  const rate = total > 0 ? Math.round((p.count / total) * 100) : 0;
                  const pending = total - p.count;
                  const pendingRate = total > 0 ? 100 - rate : 0;

                  return (
                    <div
                      className="absolute bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg px-4 py-2.5 flex flex-col pointer-events-none transition-all duration-100 ease-out w-max whitespace-nowrap z-10"
                      style={{
                        left: `${(p.x / 800) * 100}%`,
                        top: `${(p.y / 250) * 100 - 8}%`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 10,
                      }}
                    >
                      <span className="font-bold text-xs text-on-surface border-b border-outline-variant/40 pb-1 mb-1.5 w-full">{p.label}</span>
                      <span className="text-[11px] font-semibold text-secondary flex justify-between items-center gap-4">
                        <span>Cleared:</span>
                        <span className="text-primary font-bold">{p.count} <span className="text-[10px] font-medium">({rate}%)</span></span>
                      </span>
                      <span className="text-[11px] font-semibold text-secondary flex justify-between items-center gap-4">
                        <span>Pending:</span>
                        <span className="text-on-surface font-bold">{pending} <span className="text-[10px] font-medium">({pendingRate}%)</span></span>
                      </span>
                      <span className="text-[11px] font-semibold text-secondary flex justify-between items-center gap-4 border-t border-outline-variant/20 pt-1 mt-1">
                        <span>Total:</span>
                        <span className="text-on-surface font-bold">{total}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Charts Row 2: Segment Breakdown side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StackedBarChart data={yearLevelData} title="Clearance Status by Year Level" />
            <StackedBarChart data={scopeBreakdownData} title={barChartTitle} />
          </div>

          {/* Row 3: Requirement Completion Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-xl font-bold">fact_check</span>
              Requirement Completion Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[11px] font-bold text-secondary uppercase tracking-wider">
                    <th className="pb-3">Requirement</th>
                    <th className="pb-3 text-center">Completion Rate</th>
                    <th className="pb-3 text-right">Cleared / Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm font-body-sm">
                  {reqCompletionData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-secondary">
                        No organization requirements configured yet.
                      </td>
                    </tr>
                  ) : (
                    reqCompletionData.map((req) => (
                      <tr key={req.id} className="hover:bg-surface-bright/50 transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-on-surface">
                          {req.name}
                          <span className="block text-[11px] font-normal text-secondary mt-0.5">{req.description}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center gap-3 justify-center min-w-[120px]">
                            <span className="text-xs font-bold text-on-surface w-8">{req.rate}%</span>
                            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden max-w-[100px]">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${req.rate}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pl-4 text-right font-mono text-secondary">
                          {req.cleared} / {req.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Export Modal */}
      {isExportModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-title-md text-title-md text-on-surface">Export Compliance Roster</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded text-secondary hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Department Selector */}
              <div className="space-y-1.5 relative" ref={exportDeptRef}>
                <label className="font-label-sm text-xs font-semibold text-secondary block">
                  Department
                </label>
                <button
                  type="button"
                  disabled={isExclusiveDept}
                  onClick={() => {
                    setExportDeptPopoverOpen(!exportDeptPopoverOpen);
                    setExportProgPopoverOpen(false);
                    setExportYearPopoverOpen(false);
                  }}
                  className={`w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm focus:border-primary focus:ring-1 focus:ring-primary ${
                    isExclusiveDept ? "bg-surface-container/30 cursor-not-allowed opacity-80" : "cursor-pointer"
                  }`}
                >
                  <span className="truncate">
                    {exportDepts.length === 0
                      ? "All Departments"
                      : exportDepts.length === 1
                        ? exportDepts[0]
                        : `${exportDepts.length} Departments selected`}
                  </span>
                  {!isExclusiveDept && (
                    <span className="material-symbols-outlined text-secondary">expand_more</span>
                  )}
                </button>

                {exportDeptPopoverOpen && !isExclusiveDept && (
                  <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[250px] overflow-hidden">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                        search
                      </span>
                      <input
                        type="text"
                        value={exportDeptSearch}
                        onChange={(e) => setExportDeptSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none"
                        placeholder="Search departments..."
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => setExportDepts(["All Departments", ...DEPARTMENTS])}
                        className="hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExportDepts([]);
                          setExportProgs([]);
                        }}
                        className="hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[120px]">
                      {["All Departments", ...DEPARTMENTS]
                        .filter((d) => d.toLowerCase().includes(exportDeptSearch.toLowerCase()))
                        .map((d) => (
                          <label key={d} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1 rounded hover:bg-surface-container transition-colors">
                            <input
                              type="checkbox"
                              checked={exportDepts.includes(d)}
                              onChange={() => toggleExportDept(d)}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                            />
                            <span>{d}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Program Selector */}
              <div className="space-y-1.5 relative" ref={exportProgRef}>
                <label className="font-label-sm text-xs font-semibold text-secondary block">
                  Program
                </label>
                <button
                  type="button"
                  disabled={exportDepts.length === 0 || isExclusiveProg}
                  onClick={() => {
                    setExportProgPopoverOpen(!exportProgPopoverOpen);
                    setExportDeptPopoverOpen(false);
                    setExportYearPopoverOpen(false);
                  }}
                  className={`w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant font-body-sm text-sm text-left flex items-center justify-between shadow-sm focus:border-primary focus:ring-1 focus:ring-primary ${
                    exportDepts.length === 0 || isExclusiveProg
                      ? "bg-surface-container/30 text-secondary/50 cursor-not-allowed opacity-80"
                      : "bg-surface-container-lowest text-on-surface cursor-pointer"
                  }`}
                >
                  <span className="truncate">
                    {exportDepts.length === 0
                      ? "Select Department first"
                      : exportProgs.length === 0
                        ? "All Programs"
                        : exportProgs.length === 1
                          ? exportProgs[0]
                          : `${exportProgs.length} Programs selected`}
                  </span>
                  {!isExclusiveProg && exportDepts.length > 0 && (
                    <span className="material-symbols-outlined text-secondary">expand_more</span>
                  )}
                </button>

                {exportProgPopoverOpen && exportDepts.length > 0 && !isExclusiveProg && (
                  <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[250px] overflow-hidden">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                        search
                      </span>
                      <input
                        type="text"
                        value={exportProgSearch}
                        onChange={(e) => setExportProgSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none"
                        placeholder="Search programs..."
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allFilteredProgs = exportDepts.includes("All Departments")
                            ? ["All Programs", ...Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()))]
                            : ["All Programs", ...exportDepts.flatMap((d) => DEPT_PROGRAMS[d] || [])];
                          setExportProgs(allFilteredProgs);
                        }}
                        className="hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportProgs([])}
                        className="hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[120px]">
                      {Array.from(
                        new Set(
                          exportDepts.includes("All Departments")
                            ? ["All Programs", ...Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()))]
                            : ["All Programs", ...exportDepts.flatMap((d) => DEPT_PROGRAMS[d] || [])]
                        )
                      )
                        .filter((p) => p.toLowerCase().includes(exportProgSearch.toLowerCase()))
                        .map((p) => (
                          <label key={p} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1 rounded hover:bg-surface-container transition-colors">
                            <input
                              type="checkbox"
                              checked={exportProgs.includes(p)}
                              onChange={() => toggleExportProg(p)}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                            />
                            <span>{p}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Year Selector */}
              <div className="space-y-1.5 relative" ref={exportYearRef}>
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
                      : exportYears.length === 1
                        ? exportYears[0]
                        : `${exportYears.length} Year Levels selected`}
                  </span>
                  <span className="material-symbols-outlined text-secondary">expand_more</span>
                </button>

                {exportYearPopoverOpen && (
                  <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[250px] overflow-hidden">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                        search
                      </span>
                      <input
                        type="text"
                        value={exportYearSearch}
                        onChange={(e) => setExportYearSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none"
                        placeholder="Search years..."
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                      <button
                        type="button"
                        onClick={() => setExportYears(["All Year Levels", ...YEAR_LEVELS])}
                        className="hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportYears([])}
                        className="hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[120px]">
                      {["All Year Levels", ...YEAR_LEVELS]
                        .filter((y) => y.toLowerCase().includes(exportYearSearch.toLowerCase()))
                        .map((y) => (
                          <label key={y} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1 rounded hover:bg-surface-container transition-colors">
                            <input
                              type="checkbox"
                              checked={exportYears.includes(y)}
                              onChange={() => toggleExportYear(y)}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                            />
                            <span>{y}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-label-sm text-xs font-semibold text-secondary block">
                  Clearance Status
                </label>
                <div className="flex gap-4">
                  {STATUSES.map((status) => (
                    <label key={status.value} className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportStatuses.includes(status.value)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setExportStatuses((prev) =>
                            checked
                              ? [...prev, status.value]
                              : prev.filter((s) => s !== status.value)
                          );
                        }}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                      />
                      <span>{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 border border-outline-variant text-secondary rounded-lg font-label-md hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-5 py-2.5 bg-brand-red text-white rounded-lg font-label-md shadow-sm hover:bg-opacity-95 transition-colors"
              >
                Export CSV
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
        onConfirm={executeDownloadCSV}
        onCancel={() => setShowConfirmDownload(false)}
      />
    </div>
  );
}
