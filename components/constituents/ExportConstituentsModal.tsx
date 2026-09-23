"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X, Filter, FileSpreadsheet, Building2, GraduationCap, Layers, UserCheck, Shield } from "lucide-react";
import { DEPARTMENTS, DEPT_PROGRAMS, YEAR_LEVELS, ALL_PROGRAMS } from "@/lib/constants";

interface ExportConstituentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  users: any[];
  selectedIds?: string[];
  defaultDepartment?: string;
  defaultProgram?: string;
}

export function ExportConstituentsModal({
  isOpen,
  onClose,
  onSuccess,
  users,
  selectedIds = [],
  defaultDepartment = "All Departments",
  defaultProgram = "All Programs",
}: ExportConstituentsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<"filtered" | "selected">(selectedIds.length > 0 ? "selected" : "filtered");
  const [department, setDepartment] = useState(defaultDepartment);
  const [program, setProgram] = useState(defaultProgram);
  const [yearLevel, setYearLevel] = useState("All Year Levels");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Statuses");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [isExporting, setIsExporting] = useState(false);

  // Dynamic Options Loaded from Live SSC API / Constants
  const [departmentsList, setDepartmentsList] = useState<string[]>(DEPARTMENTS);
  const [deptProgramsMap, setDeptProgramsMap] = useState<Record<string, string[]>>(DEPT_PROGRAMS);
  const [allProgramsList, setAllProgramsList] = useState<string[]>(ALL_PROGRAMS);
  const [yearLevelsList, setYearLevelsList] = useState<string[]>(YEAR_LEVELS);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDepartment(defaultDepartment && defaultDepartment !== "All" ? defaultDepartment : "All Departments");
      setProgram(defaultProgram && defaultProgram !== "All" ? defaultProgram : "All Programs");
      setScope(selectedIds.length > 0 ? "selected" : "filtered");

      // Attempt to load dynamic API options
      const fetchOptions = async () => {
        try {
          const res = await fetch("/api/integration/ssc/masterlist?options=true");
          if (res.ok) {
            const data = await res.json();
            if (data.departments && Array.isArray(data.departments)) {
              setDepartmentsList(data.departments);
            }
            if (data.departmentPrograms && typeof data.departmentPrograms === "object") {
              setDeptProgramsMap(data.departmentPrograms);
            }
            if (data.allPrograms && Array.isArray(data.allPrograms)) {
              setAllProgramsList(data.allPrograms);
            }
            if (data.yearLevels && Array.isArray(data.yearLevels)) {
              setYearLevelsList(data.yearLevels);
            }
          }
        } catch (e) {
          console.warn("Could not load dynamic SSC options, using defaults:", e);
        }
      };

      fetchOptions();
    }
  }, [isOpen, defaultDepartment, defaultProgram, selectedIds.length]);

  if (!isOpen || !mounted) return null;

  // Compute available programs based on selected department
  const availablePrograms =
    department && department !== "All Departments" && deptProgramsMap[department]
      ? deptProgramsMap[department]
      : allProgramsList;

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    setProgram("All Programs");
  };

  // Compute Matching Users to export
  const matchingUsers = users.filter((u) => {
    if (scope === "selected") {
      return selectedIds.includes(u.id);
    }

    const matchesDept =
      department === "All Departments" ||
      department === "All" ||
      u.department === department ||
      u.department?.toLowerCase() === department.toLowerCase();

    const matchesProg =
      program === "All Programs" ||
      program === "All" ||
      u.program === program ||
      u.program?.toLowerCase() === program.toLowerCase();

    const matchesYear =
      yearLevel === "All Year Levels" ||
      yearLevel === "All Years" ||
      yearLevel === "All" ||
      u.joined === yearLevel ||
      u.raw?.student?.year === yearLevel ||
      (u.raw?.student?.year && u.raw.student.year.toLowerCase() === yearLevel.toLowerCase());

    const matchesRole =
      role === "All Roles" ||
      role === "All" ||
      u.role === role;

    const matchesStatus =
      status === "All Statuses" ||
      status === "All" ||
      u.status === status ||
      u.status?.toLowerCase() === status.toLowerCase();

    return matchesDept && matchesProg && matchesYear && matchesRole && matchesStatus;
  });

  const handleExport = () => {
    if (matchingUsers.length === 0) return;
    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const sanitizedDept = department.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Constituents_${sanitizedDept}_${timestamp}`;

      if (exportFormat === "csv") {
        const headers = ["Student/User ID", "Full Name", "Email", "Role", "Department", "Program", "Year Level", "Clearance/Account Status", "Joined/Year"];
        const rows = matchingUsers.map((u) => [
          u.studentId || u.id || "",
          u.name || "",
          u.email || "",
          u.role || "",
          u.department || "",
          u.program || "",
          u.raw?.student?.year || u.joined || "",
          u.status || "",
          u.joined || "",
        ]);

        const csvContent = "\uFEFF" + [
          headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
          ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const exportData = matchingUsers.map((u) => ({
          id: u.studentId || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          program: u.program,
          year: u.raw?.student?.year || u.joined,
          status: u.status,
          joined: u.joined,
        }));

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${filename}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      onSuccess(`Successfully exported ${matchingUsers.length} constituent record(s)!`);
      onClose();
    } catch (err: any) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#800000] to-[#b51b15] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Export Constituents
                <span className="text-[10px] font-mono font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                  {matchingUsers.length} Records
                </span>
              </h3>
              <p className="text-xs text-red-100 mt-0.5">Export custom batches with targeted filters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-red-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Scope Selector if rows are selected */}
          {selectedIds.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">Export Scope:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("selected")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                    scope === "selected"
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-amber-100/50"
                  }`}
                >
                  Selected Items ({selectedIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScope("filtered")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer ${
                    scope === "filtered"
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-amber-100/50"
                  }`}
                >
                  Apply Filters ({users.length} Total)
                </button>
              </div>
            </div>
          )}

          {/* Filter Description */}
          {scope === "filtered" && (
            <div className="bg-red-50/60 border border-red-100 rounded-xl p-3 text-xs text-[#b51b15] flex items-start gap-2.5">
              <Filter className="w-4 h-4 text-[#b51b15] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Targeted Batch Export</span>
                <p className="text-gray-600 leading-relaxed">
                  Configure department, program, year level, role, or clearance status filters below to export specific constituent segments.
                </p>
              </div>
            </div>
          )}

          {scope === "filtered" && (
            <div className="space-y-3.5">
              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="All Departments">All Departments (All)</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course / Program */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                  Course / Program
                </label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="All Programs">All Programs (All)</option>
                  {availablePrograms.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid 2 Cols: Year Level & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-500" />
                    Year Level
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="All Year Levels">All Year Levels</option>
                    {yearLevelsList.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-500" />
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Student">Student</option>
                    <option value="Office Head">Office Head</option>
                    <option value="Department Head">Department Head</option>
                    <option value="System Admin">System Admin</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                  Clearance / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>
          )}

          {/* Export Format Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat("csv")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  exportFormat === "csv"
                    ? "bg-[#b51b15]/10 border-[#b51b15] text-[#b51b15]"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV / Excel (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("json")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  exportFormat === "json"
                    ? "bg-[#b51b15]/10 border-[#b51b15] text-[#b51b15]"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="font-mono text-xs font-bold">{"{ }"}</span>
                <span>JSON (.json)</span>
              </button>
            </div>
          </div>

          {/* Active Target Summary Box */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-gray-800 block">Matched Records:</span>
              <span className="text-[11px] text-gray-500 font-mono">
                {scope === "selected" ? `${selectedIds.length} Selected` : `${department} • ${program} • ${yearLevel}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#b51b15] block">{matchingUsers.length}</span>
              <span className="text-[10px] font-semibold text-gray-400">Ready to export</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || matchingUsers.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting..." : `Export ${matchingUsers.length} Records`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
