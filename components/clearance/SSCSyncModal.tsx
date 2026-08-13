"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X, Filter, AlertTriangle, Layers, GraduationCap, Building2 } from "lucide-react";
import { DEPARTMENTS, DEPT_PROGRAMS, YEAR_LEVELS, ALL_PROGRAMS } from "@/lib/constants";

interface SSCSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  defaultDepartment?: string;
  defaultProgram?: string;
}

export function SSCSyncModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment = "All Departments",
  defaultProgram = "All Programs",
}: SSCSyncModalProps) {
  const [mounted, setMounted] = useState(false);
  const [department, setDepartment] = useState(defaultDepartment);
  const [program, setProgram] = useState(defaultProgram);
  const [yearLevel, setYearLevel] = useState("All Year Levels");
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDepartment(defaultDepartment && defaultDepartment !== "All" ? defaultDepartment : "All Departments");
      setProgram(defaultProgram && defaultProgram !== "All" ? defaultProgram : "All Programs");
      setError(null);
    }
  }, [isOpen, defaultDepartment, defaultProgram]);

  if (!isOpen || !mounted) return null;

  // Compute available programs based on selected department
  const availablePrograms =
    department && department !== "All Departments" && DEPT_PROGRAMS[department]
      ? DEPT_PROGRAMS[department]
      : ALL_PROGRAMS;

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    setProgram("All Programs");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sync: "true" });
      if (department && department !== "All Departments" && department !== "All") {
        params.append("department", department);
      }
      if (program && program !== "All Programs" && program !== "All") {
        params.append("program", program);
      }
      if (yearLevel && yearLevel !== "All Year Levels" && yearLevel !== "All Years" && yearLevel !== "All") {
        params.append("year", yearLevel);
      }

      const res = await fetch(`/api/integration/ssc/masterlist?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync with SSC API.");
      }

      onSuccess(data.message || `Successfully synced ${data.syncedCount || 0} students!`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Connection failed to SSC API (http://localhost:8081).");
    } finally {
      setIsSyncing(false);
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
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Sync SSC Masterlist API
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">Filter students to sync in targeted batches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="text-blue-200 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Sync Failed</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Filter className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Batch Sync Filtering</span>
              <p className="text-blue-800 leading-relaxed">
                To prevent heavy system load, select specific filters below to pull only the relevant student batch from the SSC Masterlist API.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                Department
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={isSyncing}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="All Departments">All Departments (All)</option>
                {DEPARTMENTS.map((dept) => (
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
                disabled={isSyncing}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="All Programs">All Programs (All)</option>
                {availablePrograms.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gray-500" />
                Year Level
              </label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                disabled={isSyncing}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="All Year Levels">All Year Levels (All)</option>
                {YEAR_LEVELS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Target Summary */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Target Filter:</span>
            <span className="font-bold text-blue-700">
              {department} • {program} • {yearLevel}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Batch..." : "Sync Selected Batch"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
