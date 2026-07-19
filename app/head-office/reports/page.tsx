"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/components/contexts/SettingsContext";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

// Types
interface Student {
  id: string;
  name: string;
  program: string;
  department: string;
  yearLevel: string;
  status: "cleared" | "uncleared";
  lastUpdated: string;
}

interface ClearanceRecord {
  studentId: string;
  requirementId: string;
  status: "cleared" | "uncleared";
  remark: string;
  dateAssigned: string; // ISO date string
  dateResolved?: string; // ISO date string
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
  { value: "cleared", label: "Cleared" },
  { value: "uncleared", label: "Uncleared" },
];

const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

const MOCK_REQUIREMENTS: Requirement[] = [
  { id: "req-1", name: "Library Book Return", description: "Return borrowed library books", isActive: true },
  { id: "req-2", name: "Tuition Fee Settlement", description: "Settle outstanding accounting balances", isActive: true },
  { id: "req-3", name: "Exit Interview", description: "Complete guidance exit interview", isActive: true },
  { id: "req-4", name: "Laboratory Clearance", description: "Return lab materials", isActive: true },
];

const MOCK_STUDENTS_BY_TERM: Record<string, Student[]> = {
  "1st Semester 2025-2026": [
    { id: "2021-0492", name: "Eleanor Shellstrop", program: "BS Computer Science", department: "CCIS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-20" },
    { id: "2022-1103", name: "Chidi Anagonye", program: "BS Civil Engineering", department: "COE", yearLevel: "3rd Year", status: "uncleared", lastUpdated: "2024-11-22" },
    { id: "2020-8831", name: "Tahani Al-Jamil", program: "BS Data Science", department: "CEDAS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-18" },
    { id: "2023-0012", name: "Jason Mendoza", program: "BS Nursing", department: "CHS", yearLevel: "2nd Year", status: "uncleared", lastUpdated: "2024-11-25" },
    { id: "2021-5529", name: "Michael Realman", program: "BS Business Administration", department: "CABE", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-15" },
    { id: "2022-0941", name: "Janet Database", program: "BS Information Technology", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-11-19" },
    { id: "2023-1492", name: "Simone Garnet", program: "BS Psychology", department: "CHS", yearLevel: "2nd Year", status: "uncleared", lastUpdated: "2024-11-23" },
    { id: "2024-0312", name: "John Locke", program: "BS Applied Mathematics", department: "CEDAS", yearLevel: "1st Year", status: "uncleared", lastUpdated: "2024-11-24" },
    { id: "2022-4815", name: "Hugo Reyes", program: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-11-17" },
    { id: "2021-1623", name: "Jack Shephard", program: "BS Nursing", department: "CHS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-12" },
  ],
  "2nd Semester 2024-2025": [
    { id: "2021-0492", name: "Eleanor Shellstrop", program: "BS Computer Science", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-15" },
    { id: "2022-1103", name: "Chidi Anagonye", program: "BS Civil Engineering", department: "COE", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2024-05-14" },
    { id: "2020-8831", name: "Tahani Al-Jamil", program: "BS Data Science", department: "CEDAS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-18" },
    { id: "2023-0012", name: "Jason Mendoza", program: "BS Nursing", department: "CHS", yearLevel: "1st Year", status: "uncleared", lastUpdated: "2024-05-20" },
    { id: "2021-5529", name: "Michael Realman", program: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-10" },
    { id: "2022-0941", name: "Janet Database", program: "BS Information Technology", department: "CCIS", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2024-05-12" },
  ],
  "1st Semester 2024-2025": [
    { id: "2021-0492", name: "Eleanor Shellstrop", program: "BS Computer Science", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-18" },
    { id: "2022-1103", name: "Chidi Anagonye", program: "BS Civil Engineering", department: "COE", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2023-11-20" },
    { id: "2020-8831", name: "Tahani Al-Jamil", program: "BS Data Science", department: "CEDAS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-15" },
    { id: "2021-5529", name: "Michael Realman", program: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-10" },
  ],
};

const MOCK_RECORDS_BY_TERM: Record<string, ClearanceRecord[]> = {
  "1st Semester 2025-2026": [
    // Eleanor - Cleared
    { studentId: "2021-0492", requirementId: "req-1", status: "cleared", remark: "All books returned", dateAssigned: "2024-10-01", dateResolved: "2024-10-15" },
    { studentId: "2021-0492", requirementId: "req-2", status: "cleared", remark: "Fully paid", dateAssigned: "2024-10-01", dateResolved: "2024-11-10" },
    { studentId: "2021-0492", requirementId: "req-3", status: "cleared", remark: "Completed evaluation", dateAssigned: "2024-10-01", dateResolved: "2024-11-20" },
    // Chidi - Uncleared
    { studentId: "2022-1103", requirementId: "req-1", status: "cleared", remark: "Returned", dateAssigned: "2024-10-01", dateResolved: "2024-10-20" },
    { studentId: "2022-1103", requirementId: "req-2", status: "uncleared", remark: "Unpaid tuition balance PHP 5,200", dateAssigned: "2024-10-01" },
    { studentId: "2022-1103", requirementId: "req-3", status: "uncleared", remark: "Did not attend exit interview", dateAssigned: "2024-10-01" },
    // Tahani - Cleared
    { studentId: "2020-8831", requirementId: "req-1", status: "cleared", remark: "Returned library book", dateAssigned: "2024-10-01", dateResolved: "2024-10-10" },
    { studentId: "2020-8831", requirementId: "req-2", status: "cleared", remark: "Setted balance", dateAssigned: "2024-10-01", dateResolved: "2024-10-25" },
    { studentId: "2020-8831", requirementId: "req-3", status: "cleared", remark: "Completed counselor chat", dateAssigned: "2024-10-01", dateResolved: "2024-11-18" },
    // Jason - Uncleared
    { studentId: "2023-0012", requirementId: "req-1", status: "uncleared", remark: "Lost library book (Harry Potter)", dateAssigned: "2024-10-01" },
    { studentId: "2023-0012", requirementId: "req-2", status: "cleared", remark: "Paid", dateAssigned: "2024-10-01", dateResolved: "2024-10-30" },
    { studentId: "2023-0012", requirementId: "req-3", status: "uncleared", remark: "Did not attend exit interview", dateAssigned: "2024-10-01" },
    // Michael - Cleared
    { studentId: "2021-5529", requirementId: "req-1", status: "cleared", remark: "Returned books", dateAssigned: "2024-10-01", dateResolved: "2024-10-12" },
    { studentId: "2021-5529", requirementId: "req-2", status: "cleared", remark: "Paid in full", dateAssigned: "2024-10-01", dateResolved: "2024-10-20" },
    { studentId: "2021-5529", requirementId: "req-3", status: "cleared", remark: "Interview completed", dateAssigned: "2024-10-01", dateResolved: "2024-11-15" },
    // Janet - Cleared
    { studentId: "2022-0941", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-10-01", dateResolved: "2024-10-18" },
    { studentId: "2022-0941", requirementId: "req-2", status: "cleared", remark: "Cleared balance", dateAssigned: "2024-10-01", dateResolved: "2024-11-05" },
    { studentId: "2022-0941", requirementId: "req-3", status: "cleared", remark: "Interview done", dateAssigned: "2024-10-01", dateResolved: "2024-11-19" },
    // Simone - Uncleared
    { studentId: "2023-1492", requirementId: "req-1", status: "cleared", remark: "Returned books", dateAssigned: "2024-10-01", dateResolved: "2024-10-22" },
    { studentId: "2023-1492", requirementId: "req-2", status: "uncleared", remark: "Unpaid tuition balance PHP 1,500", dateAssigned: "2024-10-01" },
    { studentId: "2023-1492", requirementId: "req-3", status: "uncleared", remark: "Did not attend exit interview", dateAssigned: "2024-10-01" },
    // John - Uncleared
    { studentId: "2024-0312", requirementId: "req-1", status: "uncleared", remark: "Overdue library books", dateAssigned: "2024-10-01" },
    { studentId: "2024-0312", requirementId: "req-2", status: "cleared", remark: "Cleared balance", dateAssigned: "2024-10-01", dateResolved: "2024-11-12" },
    { studentId: "2024-0312", requirementId: "req-3", status: "uncleared", remark: "Did not attend exit interview", dateAssigned: "2024-10-01" },
    // Hugo - Cleared
    { studentId: "2022-4815", requirementId: "req-1", status: "cleared", remark: "Returned", dateAssigned: "2024-10-01", dateResolved: "2024-10-24" },
    { studentId: "2022-4815", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-10-01", dateResolved: "2024-10-28" },
    { studentId: "2022-4815", requirementId: "req-3", status: "cleared", remark: "Interview done", dateAssigned: "2024-10-01", dateResolved: "2024-11-17" },
    // Jack - Cleared
    { studentId: "2021-1623", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-10-01", dateResolved: "2024-10-15" },
    { studentId: "2021-1623", requirementId: "req-2", status: "cleared", remark: "Setted balance", dateAssigned: "2024-10-01", dateResolved: "2024-10-22" },
    { studentId: "2021-1623", requirementId: "req-3", status: "cleared", remark: "Interview done", dateAssigned: "2024-10-01", dateResolved: "2024-11-12" },
  ],
  "2nd Semester 2024-2025": [
    { studentId: "2021-0492", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-04-10" },
    { studentId: "2021-0492", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-05-15" },
    { studentId: "2022-1103", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-04-12" },
    { studentId: "2022-1103", requirementId: "req-2", status: "cleared", remark: "Cleared balance", dateAssigned: "2024-04-01", dateResolved: "2024-05-14" },
    { studentId: "2020-8831", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-04-18" },
    { studentId: "2020-8831", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-05-18" },
    { studentId: "2023-0012", requirementId: "req-1", status: "uncleared", remark: "Unreturned books", dateAssigned: "2024-04-01" },
    { studentId: "2023-0012", requirementId: "req-2", status: "uncleared", remark: "Unpaid balance", dateAssigned: "2024-04-01" },
    { studentId: "2021-5529", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-04-20" },
    { studentId: "2021-5529", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-05-10" },
    { studentId: "2022-0941", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-04-22" },
    { studentId: "2022-0941", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2024-04-01", dateResolved: "2024-05-12" },
  ],
  "1st Semester 2024-2025": [
    { studentId: "2021-0492", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-10-15" },
    { studentId: "2021-0492", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-11-18" },
    { studentId: "2022-1103", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-10-20" },
    { studentId: "2022-1103", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-11-20" },
    { studentId: "2020-8831", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-10-22" },
    { studentId: "2020-8831", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-11-15" },
    { studentId: "2021-5529", requirementId: "req-1", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-10-25" },
    { studentId: "2021-5529", requirementId: "req-2", status: "cleared", remark: "Cleared", dateAssigned: "2023-10-01", dateResolved: "2023-11-10" },
  ],
};

// Reusable StackedBarChart component matching the admin dashboard chart style
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
    <div className="bg-surface-container-lowest rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-high p-lg flex flex-col">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h4 className="font-title-md text-title-md text-on-surface">{title}</h4>
        </div>
        <div className="flex gap-sm">
          <span className="flex items-center gap-xs font-label-md text-label-md text-secondary">
            <span className="w-3 h-3 rounded-full bg-surface-container-high block" /> Pending
          </span>
          <span className="flex items-center gap-xs font-label-md text-label-md text-on-surface">
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
              <span key={pct} className="font-label-md text-label-md text-secondary text-right w-7">
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
          <div className="flex-1 h-full flex items-end justify-between px-md pb-[30px] relative z-10">
            {data.map((d) => {
              const total = d.cleared + d.uncleared;
              const clearedPct = total > 0 ? Math.round((d.cleared / total) * 100) : 0;
              const pendingPct = total > 0 ? 100 - clearedPct : 0;
              const totalPct = 100; // Each segment starts with full 100% capacity representing total population

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

                  {/* Tooltip styled like a chat window bubble */}
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
                    {/* Chat Bubble Arrow Pointer */}
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface-container-lowest border-r border-b border-outline-variant/60 rotate-45" />
                  </div>

                  <span className="absolute -bottom-7 font-label-md text-label-md text-secondary whitespace-nowrap">
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

export default function ReportsPage() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();
  const [selectedTerm, setSelectedTerm] = useState(currentTerm);
  const [activeOffice, setActiveOffice] = useState<any>(null);

  useEffect(() => {
    setSelectedTerm(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    const loadOffice = async () => {
      const storedOfficeId = localStorage.getItem("officeId");
      if (storedOfficeId) {
        const oid = parseInt(storedOfficeId, 10);
        const currentOffice = await clearanceService.getOfficeById(oid);
        if (currentOffice) setActiveOffice(currentOffice);
      }
    };
    loadOffice();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Mounted state for SSR safety (portal)
  const [mounted, setMounted] = useState(false);

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

  const toggleExportDept = (dept: string) => {
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
          // Remove dependent programs
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
    if (exportDepts.includes("All Departments")) {
      return Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
    }
    return exportDepts.flatMap((d) => DEPT_PROGRAMS[d] || []);
  };

  const toggleExportProg = (prog: string) => {
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

  // Fetch / get data for selected term
  const mockTermKey = useMemo(() => {
    if (MOCK_STUDENTS_BY_TERM[selectedTerm]) return selectedTerm;
    
    // Semantic fallback based on semester type
    if (selectedTerm.includes("1st Semester") || selectedTerm.includes("Fall")) {
      return "1st Semester 2025-2026";
    }
    if (selectedTerm.includes("2nd Semester") || selectedTerm.includes("Spring")) {
      return "2nd Semester 2024-2025";
    }
    return "1st Semester 2024-2025";
  }, [selectedTerm]);

  const students = useMemo(() => MOCK_STUDENTS_BY_TERM[mockTermKey] || [], [mockTermKey]);
  const records = useMemo(() => MOCK_RECORDS_BY_TERM[mockTermKey] || [], [mockTermKey]);

  // Trigger loading effect when term changes (to emulate backend connectivity)
  const handleTermChange = (term: string) => {
    setIsLoading(true);
    setSelectedTerm(term);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    if (students.length === 0) {
      return { totalStudents: 0, totalCleared: 0, totalUncleared: 0, clearanceRate: 0, unclearedRate: 0 };
    }

    const totalStudents = students.length;
    const totalCleared = students.filter((s) => s.status === "cleared").length;
    const totalUncleared = students.filter((s) => s.status === "uncleared").length;
    const clearanceRate = Math.round((totalCleared / totalStudents) * 100);
    const unclearedRate = 100 - clearanceRate;

    return { totalStudents, totalCleared, totalUncleared, clearanceRate, unclearedRate };
  }, [students]);

  // Clearance Progress Over Time (Cumulative Cleared by Week)
  const progressChartData = useMemo(() => {
    if (students.length === 0) return [];

    // Filter only cleared students
    const clearedStudents = students.filter((s) => s.status === "cleared" && s.lastUpdated);
    const dates = clearedStudents.map((s) => new Date(s.lastUpdated).getTime()).sort((a, b) => a - b);
    if (dates.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({ label: `Wk ${i + 1}`, count: 0 }));
    }

    const minDate = new Date(dates[0]);
    // Set to start of the week
    const startOfWeek = new Date(minDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    // Generate weekly labels
    const weeks: { start: number; end: number; label: string; count: number }[] = [];
    let current = new Date(startOfWeek);

    // Generate 12 weeks of tracking
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

    // Populate counts (cumulative: cleared on or before this week's end)
    weeks.forEach((w) => {
      w.count = clearedStudents.filter((s) => new Date(s.lastUpdated).getTime() <= w.end).length;
    });

    return weeks.map((w) => ({ label: w.label, count: w.count }));
  }, [students]);

  // Year Level breakdown
  const yearLevelData = useMemo(() => {
    return YEAR_LEVELS.map((yr) => {
      const yrStudents = students.filter((s) => s.yearLevel === yr);
      const cleared = yrStudents.filter((s) => s.status === "cleared").length;
      const uncleared = yrStudents.filter((s) => s.status === "uncleared").length;
      return { label: yr, cleared, uncleared };
    });
  }, [students]);

  // Department breakdown
  const departmentData = useMemo(() => {
    return DEPARTMENTS.map((d) => {
      const deptStudents = students.filter((s) => s.department === d);
      const cleared = deptStudents.filter((s) => s.status === "cleared").length;
      const uncleared = deptStudents.filter((s) => s.status === "uncleared").length;
      return { label: d, cleared, uncleared };
    });
  }, [students]);

  // Requirement Completion Table data
  const reqCompletionData = useMemo(() => {
    return MOCK_REQUIREMENTS.map((req) => {
      const assignedRecords = records.filter((r) => r.requirementId === req.id);
      const cleared = assignedRecords.filter((r) => r.status === "cleared").length;
      const total = assignedRecords.length;
      const rate = total > 0 ? Math.round((cleared / total) * 100) : 0;
      return { ...req, cleared, total, rate };
    });
  }, [records]);

  // Export CSV Modal Trigger
  const handleExportCSV = () => {
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
    setIsExportModalOpen(true);
  };

  const [showConfirmDownload, setShowConfirmDownload] = useState(false);

  const handleDownloadCSV = () => {
    setShowConfirmDownload(true);
  };

  // Actual Excel XML Generator and Downloader with applied export filters
  const executeDownloadCSV = () => {
    let list = MOCK_STUDENTS_BY_TERM[mockTermKey] || [];

    // Filter by selected departments (ignoring the "All Departments" selector)
    const activeDepts = exportDepts.filter((d) => d !== "All Departments");
    if (activeDepts.length > 0) {
      list = list.filter((s) => activeDepts.includes(s.department));
    }

    // Filter by selected programs (ignoring the "All Programs" selector)
    const activeProgs = exportProgs.filter((p) => p !== "All Programs");
    if (activeProgs.length > 0) {
      list = list.filter((s) => activeProgs.includes(s.program));
    }

    // Filter by selected year levels (ignoring the "All Year Levels" selector)
    const activeYears = exportYears.filter((y) => y !== "All Year Levels");
    if (activeYears.length > 0) {
      list = list.filter((s) => activeYears.includes(s.yearLevel));
    }

    // Filter by selected statuses
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

    // XML Spreadsheet 2003 content with header bolding styles
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
        <Cell><Data ss:Type="String">${s.yearLevel}</Data></Cell>
        <Cell><Data ss:Type="String">${s.status.toUpperCase()}</Data></Cell>
      </Row>`;
      });

      sheet += `
    </Table>
  </Worksheet>`;
      return sheet;
    };

    let xmlSheets = buildSheet("All Students", list);

    // Group and sort students by department dynamically
    const departments = Array.from(new Set(list.map((s) => s.department))).filter(Boolean).sort();
    departments.forEach((dept) => {
      const deptList = list
        .filter((s) => s.department === dept)
        .sort((a, b) => {
          const yrA = getYearWeight(a.yearLevel || "");
          const yrB = getYearWeight(b.yearLevel || "");
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
    link.setAttribute("download", `Clearance_Report_${selectedTerm.replace(/\s+/g, "_")}.xls`);
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
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Office Reports
          </h2>
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="font-semibold text-on-surface">{activeOffice ? activeOffice.name : "Loading..."}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Term Selector */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedTerm}
              onChange={(e) => handleTermChange(e.target.value)}
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



          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 btn-hover active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-surface-container-lowest animate-pulse rounded-xl border border-surface-container-high" />
            ))}
          </div>
          <div className="h-80 bg-surface-container-lowest animate-pulse rounded-xl border border-surface-container-high" />
        </div>
      ) : students.length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-secondary opacity-40">bar_chart_off</span>
          <h3 className="font-title-md text-lg font-bold text-on-surface mt-4">No data available</h3>
          <p className="text-secondary font-body-sm mt-1 max-w-sm mx-auto">
            There are no clearance records configured or students assigned for the selected term.
          </p>
        </div>
      ) : (
        /* Report Dashboard Content */
        <div className="space-y-8 animate-in fade-in duration-300">
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
                {/* SVG Area / Line Chart */}
                <svg viewBox="0 0 800 250" className="w-full h-auto">
                  {/* Grid Lines */}
                  {(() => {
                    const maxCount = Math.max(...progressChartData.map(d => d.count), 1);
                    const yMax = Math.ceil(maxCount / 4) * 4 || 4;

                    return [0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = 30 + 170 * (1 - ratio);
                      const labelVal = Math.round(yMax * ratio);
                      return (
                        <g key={index}>
                          {/* Horizontal Grid Line */}
                          <line x1="50" y1={y} x2="780" y2={y} stroke="var(--secondary)" strokeOpacity="0.15" strokeDasharray="3 3" />
                          <text x="40" y={y + 4} textAnchor="end" fill="var(--secondary)" className="text-[10px] font-semibold">
                            {labelVal}
                          </text>
                        </g>
                      );
                    });
                  })()}

                  {/* Vertical Grid Lines */}
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

                  {/* SVG Area Path & Line */}
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
                        {/* Area */}
                        <path d={areaPath} fill="url(#chart-gradient)" className="opacity-10" />
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="url(#line-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Static points on the line */}
                        {points.map((p, i) => (
                          <circle
                            key={`dot-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            fill="white"
                            stroke="url(#line-gradient)"
                            strokeWidth="2.5"
                            className="transition-all duration-150"
                          />
                        ))}

                        {/* Hover elements (Vertical Line and active dot) */}
                        {hoveredIndex !== null && points[hoveredIndex] && (
                          <g>
                            {/* Vertical line */}
                            <line
                              x1={points[hoveredIndex].x}
                              y1={30}
                              x2={points[hoveredIndex].x}
                              y2={200}
                              stroke="var(--primary)"
                              strokeOpacity="0.4"
                              strokeWidth="1.5"
                            />
                            {/* Highlighted Dot */}
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

                        {/* Interactive Hover Rects (vertical slices) */}
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

                        {/* Standard Static X Axis Labels */}
                        {points.map((p, i) => (
                          <text key={`lbl-${i}`} x={p.x} y={220} textAnchor="middle" fill="var(--secondary)" className="text-[10px] font-bold">
                            {p.label}
                          </text>
                        ))}
                      </g>
                    );
                  })()}

                  {/* Gradient Definition */}
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

                 {/* Custom Interactive Tooltip */}
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

          {/* Charts Row 2: Breakdown by Segment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StackedBarChart data={yearLevelData} title="Clearance Status by Year Level" />
            <StackedBarChart data={departmentData} title="Clearance Status by Department" />
          </div>

          {/* Row 3: Requirement Completion Table */}
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
                  {reqCompletionData.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-bright/50 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-on-surface">
                        {req.name}
                        <span className="block text-[11px] font-normal text-secondary mt-0.5">{req.description}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 justify-center min-w-[120px]">
                          <span className="font-bold text-xs w-8 text-right">{req.rate}%</span>
                          <div className="w-24 bg-surface-container-low h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                              style={{ width: `${req.rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right text-secondary font-bold text-xs">
                        {req.cleared} / {req.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                className="p-1 rounded-full hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-64">
              <p className="text-xs text-secondary mb-4">
                Select the filters to apply to the exported clearance report. By default, all constituents of the current term ({selectedTerm}) will be exported.
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

                      {/* Options */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                        {["All Departments", ...DEPARTMENTS]
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

              {/* Clearance Status Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Clearance Status</label>
                <div className="flex gap-4">
                  {STATUSES.map((status) => {
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
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-low font-label-md text-xs text-on-surface transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md text-xs shadow-sm hover:bg-primary-container transition-all flex items-center gap-2 btn-hover active:scale-95 animate-in fade-in"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download CSV
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
