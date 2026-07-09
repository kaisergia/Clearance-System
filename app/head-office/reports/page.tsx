"use client";

import { useState, useMemo } from "react";

// Types
interface Student {
  id: string;
  name: string;
  course: string;
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

// Mock Data representing different terms
const TERMS = ["Fall Semester 2024", "Spring Semester 2024", "Fall Semester 2023"];

const MOCK_REQUIREMENTS: Requirement[] = [
  { id: "req-1", name: "Library Book Return", description: "Return borrowed library books", isActive: true },
  { id: "req-2", name: "Tuition Fee Settlement", description: "Settle outstanding accounting balances", isActive: true },
  { id: "req-3", name: "Exit Interview", description: "Complete guidance exit interview", isActive: true },
  { id: "req-4", name: "Laboratory Clearance", description: "Return lab materials", isActive: true },
];

const MOCK_STUDENTS_BY_TERM: Record<string, Student[]> = {
  "Fall Semester 2024": [
    { id: "2021-0492", name: "Eleanor Shellstrop", course: "BS Computer Science", department: "CCIS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-20" },
    { id: "2022-1103", name: "Chidi Anagonye", course: "BS Civil Engineering", department: "COE", yearLevel: "3rd Year", status: "uncleared", lastUpdated: "2024-11-22" },
    { id: "2020-8831", name: "Tahani Al-Jamil", course: "BS Data Science", department: "CEDAS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-18" },
    { id: "2023-0012", name: "Jason Mendoza", course: "BS Nursing", department: "CHS", yearLevel: "2nd Year", status: "uncleared", lastUpdated: "2024-11-25" },
    { id: "2021-5529", name: "Michael Realman", course: "BS Business Administration", department: "CABE", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-15" },
    { id: "2022-0941", name: "Janet Database", course: "BS Information Technology", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-11-19" },
    { id: "2023-1492", name: "Simone Garnet", course: "BS Psychology", department: "CHS", yearLevel: "2nd Year", status: "uncleared", lastUpdated: "2024-11-23" },
    { id: "2024-0312", name: "John Locke", course: "BS Applied Mathematics", department: "CEDAS", yearLevel: "1st Year", status: "uncleared", lastUpdated: "2024-11-24" },
    { id: "2022-4815", name: "Hugo Reyes", course: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-11-17" },
    { id: "2021-1623", name: "Jack Shephard", course: "BS Nursing", department: "CHS", yearLevel: "4th Year", status: "cleared", lastUpdated: "2024-11-12" },
  ],
  "Spring Semester 2024": [
    { id: "2021-0492", name: "Eleanor Shellstrop", course: "BS Computer Science", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-15" },
    { id: "2022-1103", name: "Chidi Anagonye", course: "BS Civil Engineering", department: "COE", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2024-05-14" },
    { id: "2020-8831", name: "Tahani Al-Jamil", course: "BS Data Science", department: "CEDAS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-18" },
    { id: "2023-0012", name: "Jason Mendoza", course: "BS Nursing", department: "CHS", yearLevel: "1st Year", status: "uncleared", lastUpdated: "2024-05-20" },
    { id: "2021-5529", name: "Michael Realman", course: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2024-05-10" },
    { id: "2022-0941", name: "Janet Database", course: "BS Information Technology", department: "CCIS", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2024-05-12" },
  ],
  "Fall Semester 2023": [
    { id: "2021-0492", name: "Eleanor Shellstrop", course: "BS Computer Science", department: "CCIS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-18" },
    { id: "2022-1103", name: "Chidi Anagonye", course: "BS Civil Engineering", department: "COE", yearLevel: "2nd Year", status: "cleared", lastUpdated: "2023-11-20" },
    { id: "2020-8831", name: "Tahani Al-Jamil", course: "BS Data Science", department: "CEDAS", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-15" },
    { id: "2021-5529", name: "Michael Realman", course: "BS Business Administration", department: "CABE", yearLevel: "3rd Year", status: "cleared", lastUpdated: "2023-11-10" },
  ],
};

const MOCK_RECORDS_BY_TERM: Record<string, ClearanceRecord[]> = {
  "Fall Semester 2024": [
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
  "Spring Semester 2024": [
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
  "Fall Semester 2023": [
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

// Reusable StackedBarChart component utilizing raw SVG
interface StackedBarChartProps {
  data: {
    label: string;
    cleared: number;
    uncleared: number;
  }[];
  title: string;
}

function StackedBarChart({ data, title }: StackedBarChartProps) {
  const maxValue = useMemo(() => {
    const maxVal = Math.max(...data.map((d) => d.cleared + d.uncleared));
    return maxVal === 0 ? 10 : Math.ceil(maxVal * 1.2);
  }, [data]);

  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingLeft = 30;
  const paddingRight = 10;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <h4 className="font-title-md text-sm font-bold text-on-surface mb-4">{title}</h4>
      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-secondary font-body-sm text-sm">
          No data available
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 400 ${chartHeight}`} className="w-full min-w-[320px] h-[220px]">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + graphHeight * (1 - ratio);
              const labelValue = Math.round(maxValue * ratio);
              return (
                <g key={index} className="opacity-30 dark:opacity-20">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={390}
                    y2={y}
                    stroke="var(--secondary)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 5}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--secondary)"
                    className="text-[10px] font-semibold"
                  >
                    {labelValue}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((item, index) => {
              const totalBars = data.length;
              const barSpacing = (400 - paddingLeft - paddingRight) / totalBars;
              const barWidth = Math.min(30, barSpacing * 0.5);
              const x = paddingLeft + index * barSpacing + (barSpacing - barWidth) / 2;

              const total = item.cleared + item.uncleared;
              const clearedHeight = total > 0 ? (item.cleared / maxValue) * graphHeight : 0;
              const unclearedHeight = total > 0 ? (item.uncleared / maxValue) * graphHeight : 0;

              const clearedY = paddingTop + graphHeight - clearedHeight;
              const unclearedY = clearedY - unclearedHeight;

              return (
                <g key={index} className="group">
                  {/* Cleared Bar */}
                  {item.cleared > 0 && (
                    <rect
                      x={x}
                      y={clearedY}
                      width={barWidth}
                      height={clearedHeight}
                      fill="#10B981" // emerald-500
                      rx={item.uncleared === 0 ? 3 : 0}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  )}

                  {/* Uncleared Bar */}
                  {item.uncleared > 0 && (
                    <rect
                      x={x}
                      y={unclearedY}
                      width={barWidth}
                      height={unclearedHeight}
                      fill="#EF4444" // red-500
                      rx={3}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  )}

                  {/* Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - paddingBottom + 18}
                    textAnchor="middle"
                    fill="var(--secondary)"
                    className="text-[10px] font-bold"
                  >
                    {item.label}
                  </text>

                  {/* Hover Tooltip Helper (using SVG title) */}
                  <title>{`${item.label}: ${item.cleared} Cleared, ${item.uncleared} Uncleared (Total: ${total})`}</title>
                </g>
              );
            })}
          </svg>

          {/* Legends */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#10B981]" />
              <span className="text-secondary font-medium">Cleared</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#EF4444]" />
              <span className="text-secondary font-medium">Uncleared</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [selectedTerm, setSelectedTerm] = useState("Fall Semester 2024");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch / get data for selected term
  const students = useMemo(() => MOCK_STUDENTS_BY_TERM[selectedTerm] || [], [selectedTerm]);
  const records = useMemo(() => MOCK_RECORDS_BY_TERM[selectedTerm] || [], [selectedTerm]);

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
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    return years.map((yr) => {
      const yrStudents = students.filter((s) => s.yearLevel === yr);
      const cleared = yrStudents.filter((s) => s.status === "cleared").length;
      const uncleared = yrStudents.filter((s) => s.status === "uncleared").length;
      return { label: yr, cleared, uncleared };
    });
  }, [students]);

  // Department breakdown
  const departmentData = useMemo(() => {
    const depts = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];
    return depts.map((d) => {
      const deptStudents = students.filter((s) => s.department === d);
      const cleared = deptStudents.filter((s) => s.status === "cleared").length;
      const uncleared = deptStudents.filter((s) => s.status === "uncleared").length;
      return { label: d, cleared, uncleared };
    });
  }, [students]);

  // Top Reasons (Remarks) List
  const topRemarks = useMemo(() => {
    const remarksCount: Record<string, number> = {};
    records
      .filter((r) => r.status === "uncleared" && r.remark)
      .forEach((r) => {
        const text = r.remark.trim();
        // Bucket common remarks or keep literal
        remarksCount[text] = (remarksCount[text] || 0) + 1;
      });

    const sorted = Object.entries(remarksCount)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxCount = sorted.length > 0 ? sorted[0].count : 1;

    return sorted.map((item) => ({
      ...item,
      percentage: Math.round((item.count / maxCount) * 100),
    }));
  }, [records]);

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

  // Export CSV Handler
  const handleExportCSV = () => {
    if (students.length === 0) return;

    // Headers
    const headers = ["Student ID", "Name", "Course", "Department", "Year Level", "Status", "Last Updated"];
    const rows = students.map((s) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.course,
      s.department,
      s.yearLevel,
      s.status.toUpperCase(),
      s.lastUpdated,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Clearance_Report_${selectedTerm.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <span className="material-symbols-outlined text-base text-primary">assessment</span>
            Analytics and downloadable clearance reports for your office
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
              {TERMS.map((term) => (
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
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
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

                  return (
                    <div
                      className="absolute bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg px-4 py-2 flex flex-col pointer-events-none transition-all duration-100 ease-out"
                      style={{
                        left: `${(p.x / 800) * 100}%`,
                        top: `${(p.y / 250) * 100 - 8}%`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 10,
                      }}
                    >
                      <span className="font-bold text-xs text-on-surface">{p.label}</span>
                      <span className="text-[11px] text-primary font-semibold mt-1 flex items-center gap-1 whitespace-nowrap">
                        cleared : <span className="font-bold text-primary">{p.count}</span>
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

          {/* Row 3: Top Reasons and Requirement Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Reasons Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm md:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">feedback</span>
                  Top Reasons for Hold
                </h3>
                {topRemarks.length === 0 ? (
                  <div className="py-8 text-center text-secondary text-sm font-medium">
                    No holds/remarks recorded
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topRemarks.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-on-surface">
                          <span className="truncate max-w-[180px]">{item.text}</span>
                          <span className="text-secondary">{item.count} holds</span>
                        </div>
                        <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-red h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Requirement Completion Table */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm md:col-span-2">
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
        </div>
      )}
    </div>
  );
}
