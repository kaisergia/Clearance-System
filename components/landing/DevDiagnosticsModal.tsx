"use client";

import { useState } from "react";
import { X, Terminal, Zap, Trash2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface DevDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevDiagnosticsModal({ isOpen, onClose }: DevDiagnosticsModalProps) {
  // Developer Bypass States
  const [devRole, setDevRole] = useState("student");
  const [selectedOfficeId, setSelectedOfficeId] = useState("1");
  const [selectedDeptId, setSelectedDeptId] = useState("1");
  const [selectedOrgId, setSelectedOrgId] = useState("1");

  // Debug Reset States
  const [resetStudentId, setResetStudentId] = useState("__all__");
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleDevBypass = () => {
    let entityId = "";
    if (devRole === "student") entityId = "2021-0492";
    else if (devRole === "head-office") entityId = selectedOfficeId;
    else if (devRole === "department") entityId = selectedDeptId;
    else if (devRole === "org") entityId = selectedOrgId;

    document.cookie = `dev-role-override=${devRole}; path=/; max-age=86400`;
    document.cookie = `dev-entityId-override=${entityId}; path=/; max-age=86400`;
    document.cookie = `role=${devRole}; path=/; max-age=86400`;

    if (devRole === "head-office") {
      document.cookie = `officeId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("officeId", entityId);
    } else if (devRole === "department") {
      document.cookie = `departmentId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("departmentId", entityId);
    } else if (devRole === "org") {
      document.cookie = `orgId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("orgId", entityId);
    } else if (devRole === "student") {
      document.cookie = `activeStudentId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("activeStudentId", entityId);
    }
    localStorage.setItem("role", devRole);

    const redirectUrls: Record<string, string> = {
      admin: "/admin/dashboard",
      "head-office": "/head-office/dashboard",
      department: "/department/dashboard",
      org: "/org/dashboard",
      student: "/student/dashboard",
    };
    window.location.href = redirectUrls[devRole] || "/";
  };

  const handleDebugReset = async () => {
    const label = resetStudentId === "__all__" ? "ALL students" : `student ${resetStudentId}`;
    if (!confirm(`⚠️ Reset clearance data for ${label}?\n\nThis will:\n• Delete all file submissions\n• Remove uploaded files\n• Reset all clearance statuses to Pending\n\nThis cannot be undone.`)) return;

    setIsResetting(true);
    setResetStatus(null);
    try {
      const body = resetStudentId === "__all__" ? {} : { studentId: resetStudentId };
      const res = await fetch("/api/debug/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setResetStatus({ type: "success", message: data.message });
    } catch (err: any) {
      setResetStatus({ type: "error", message: err.message || "Reset failed. Check server logs." });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-amber-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">Developer Diagnostics</h3>
              <p className="text-[11px] text-gray-400">Internal testing &amp; evaluation controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800">
          
          {/* Section 1: Bypass Login */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Role &amp; Entity Bypass Login
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600">Select Role</label>
                <select
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-800 outline-none focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a] transition-all"
                >
                  <option value="student">Student (Eleanor — 2021-0492)</option>
                  <option value="admin">System Admin</option>
                  <option value="head-office">Head Office</option>
                  <option value="department">Department Head</option>
                  <option value="org">Org / Club Adviser</option>
                </select>
              </div>

              {devRole === "head-office" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Select Office</label>
                  <select
                    value={selectedOfficeId}
                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-800 outline-none focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a] transition-all"
                  >
                    <option value="1">Registrar (ID: 1)</option>
                    <option value="2">Library (ID: 2)</option>
                    <option value="3">Guidance Office (ID: 3)</option>
                    <option value="4">Accounting (ID: 4)</option>
                    <option value="5">Discipline Office (ID: 5)</option>
                  </select>
                </div>
              )}

              {devRole === "department" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Select Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-800 outline-none focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a] transition-all"
                  >
                    <option value="1">CCIS (ID: 1)</option>
                    <option value="2">COE (ID: 2)</option>
                  </select>
                </div>
              )}

              {devRole === "org" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Select Org / Club</label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-800 outline-none focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a] transition-all"
                  >
                    <option value="1">Computer Science Society (ID: 1)</option>
                    <option value="6">CCIS LGU (ID: 6)</option>
                    <option value="4">Engineering Society (ID: 4)</option>
                    <option value="5">Student Government (ID: 5)</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDevBypass}
              className="w-full py-2.5 px-4 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-bold text-xs rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Bypass &amp; Sign In Immediately
            </button>
          </div>

          {/* Section 2: Debug Reset */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Trash2 className="w-4 h-4 text-red-500" />
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider">
                2. Debug Reset — Clear Submissions
              </h4>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">Target Student</label>
              <select
                value={resetStudentId}
                onChange={(e) => { setResetStudentId(e.target.value); setResetStatus(null); }}
                className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50/50 text-xs font-medium text-gray-800 outline-none focus:border-red-400 transition-all"
              >
                <option value="__all__">⚠️ All Students (Full Reset)</option>
                <option value="CJC-928994">CJC-928994 — GIELOU CHARLS SALUDO</option>
                <option value="2021-0492">2021-0492 — Eleanor Shellstrop</option>
                <option value="2022-1103">2022-1103 — Chidi Anagonye</option>
                <option value="2020-8831">2020-8831 — Tahani Al-Jamil</option>
                <option value="2023-0012">2023-0012 — Jason Mendoza</option>
                <option value="2021-5529">2021-5529 — Michael Realman</option>
              </select>
            </div>

            {resetStatus && (
              <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-medium ${
                resetStatus.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {resetStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDebugReset}
              disabled={isResetting}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resetting clearance data…</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Reset Clearance Submissions &amp; Statuses</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Unlocked via School Logo 5-click easter egg</span>
          <button onClick={onClose} className="font-semibold text-gray-700 hover:underline">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
