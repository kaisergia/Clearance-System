"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, X, Search, Filter, ShieldCheck, CheckSquare, Square, Layers, CheckCircle2, Clock, AlertCircle, Sparkles, Eye } from "lucide-react";
import * as clearanceService from "@/services/clearanceService";
import { PinConfirmationModal } from "@/components/clearance/PinConfirmationModal";
import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";
import { BatchCsvImporterModal } from "@/components/clearance/BatchCsvImporterModal";
import { DEPARTMENTS, ALL_PROGRAMS, YEAR_LEVELS, getDepartmentForProgram } from "@/lib/constants";

export interface RequirementItem {
  id: string;
  name: string;
  description: string;
  addedDate: string;
  status: "Live" | "Draft";
  appliesTo: string[];
  deadline?: string;
  requiresUpload?: boolean;
  type?: string;
  autoApprove?: boolean;
  surveyQuestions?: any;
  acknowledgmentText?: string;
}

interface RequirementBatchEvaluatorProps {
  entityType: "office" | "department" | "org";
  entityId: number;
  requirements: RequirementItem[];
  onRefresh?: () => void;
}

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  MANUAL: { label: "Manual", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  DOCUMENT_UPLOAD: { label: "Document", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  PAYMENT_PROOF: { label: "Payment", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  SURVEY: { label: "Survey", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  ACKNOWLEDGMENT: { label: "Acknowledgment", cls: "bg-teal-50 text-teal-700 border-teal-200" },
};

export function RequirementBatchEvaluator({
  entityType,
  entityId,
  requirements,
  onRefresh,
}: RequirementBatchEvaluatorProps) {
  const [selectedReqId, setSelectedReqId] = useState<string | null>(
    requirements.length > 0 ? requirements[0].id : null
  );
  const [students, setStudents] = useState<any[]>([]);
  const [clearanceRecords, setClearanceRecords] = useState<Record<string, any>>({});
  const [showCsvBatchModal, setShowCsvBatchModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Filters for Left window (requirements) & Right window (students)
  const [reqSearch, setReqSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "pending" | "cleared">("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Security PIN Modal & Student Details Modal states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select first requirement if available and none selected
  useEffect(() => {
    if (!selectedReqId && requirements.length > 0) {
      setSelectedReqId(requirements[0].id);
    }
  }, [requirements, selectedReqId]);

  // Load students & clearance records
  const loadData = async () => {
    setLoading(true);
    try {
      const allStudents = await clearanceService.getStudents();
      setStudents(allStudents);

      // Map clearance records by studentId
      const recordsMap: Record<string, any> = {};
      for (const st of allStudents) {
        const records = await clearanceService.getStudentClearanceRecords(st.id);
        const record = records.find((r: any) => {
          if (entityType === "office") return r.officeId === entityId;
          if (entityType === "department") return r.departmentId === entityId;
          if (entityType === "org") return r.orgId === entityId;
          return false;
        });
        if (record) {
          recordsMap[st.id] = record;
        }
      }
      setClearanceRecords(recordsMap);
    } catch (err) {
      console.error("Failed to load evaluator data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("clearanceRecordsUpdated", loadData);
    return () => window.removeEventListener("clearanceRecordsUpdated", loadData);
  }, [entityId, entityType]);

  const activeRequirement = requirements.find((r) => r.id === selectedReqId);
  const reqIndex = requirements.findIndex((r) => r.id === selectedReqId);

  // Helper to check student applicability across Department, Program, and Year filters
  const isApplicable = (student: any, req: RequirementItem) => {
    if (!req.appliesTo || req.appliesTo.length === 0 || req.appliesTo.includes("All Students")) {
      return true;
    }

    const deptFilters = req.appliesTo.filter((item) => DEPARTMENTS.includes(item));
    const progFilters = req.appliesTo.filter((item) => ALL_PROGRAMS.includes(item));
    const yearFilters = req.appliesTo.filter((item) => YEAR_LEVELS.includes(item));

    // Resolve canonical department from student's program to prevent mock data mismatch issues
    const actualDept = student.department || getDepartmentForProgram(student.program);
    const actualProg = student.program || student.course;

    // 1. Department Filter Check: Must match student's department if specified
    if (deptFilters.length > 0) {
      if (!deptFilters.includes(actualDept)) return false;
    }

    // 2. Program Filter Check: Must match student's program if specified
    if (progFilters.length > 0) {
      if (!progFilters.includes(actualProg)) return false;
    }

    // 3. Year Level Filter Check: Must match student's year level if specified
    if (yearFilters.length > 0) {
      if (!yearFilters.includes(student.year)) return false;
    }

    return true;
  };

  // Filtered Applicable Students for Currently Selected Requirement
  const applicableStudents = useMemo(() => {
    if (!activeRequirement) return [];
    return students.filter((s) => isApplicable(s, activeRequirement));
  }, [students, activeRequirement]);

  // Check requirement status for a student
  const getStudentReqStatus = (studentId: string): "Cleared" | "Pending" => {
    const record = clearanceRecords[studentId];
    if (!record) return "Pending";
    if (record.status === "Cleared") return "Cleared";

    // If completedTasks array contains the index of this requirement
    if (Array.isArray(record.completedTasks) && reqIndex !== -1 && record.completedTasks.includes(reqIndex)) {
      return "Cleared";
    }

    return "Pending";
  };

  // Filter right window student list
  const filteredStudents = useMemo(() => {
    return applicableStudents.filter((st) => {
      // Search
      const q = studentSearch.toLowerCase();
      const matchesSearch = st.name.toLowerCase().includes(q) || st.id.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Status filter
      const status = getStudentReqStatus(st.id);
      if (studentFilter === "pending" && status !== "Pending") return false;
      if (studentFilter === "cleared" && status !== "Cleared") return false;

      return true;
    });
  }, [applicableStudents, studentSearch, studentFilter, clearanceRecords, reqIndex]);

  // Counts for selected requirement
  const clearedCount = applicableStudents.filter((st) => getStudentReqStatus(st.id) === "Cleared").length;
  const pendingCount = applicableStudents.length - clearedCount;

  // Selection handlers
  const isAllSelected =
    filteredStudents.length > 0 && filteredStudents.every((st) => selectedStudentIds.includes(st.id));

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredStudents.map((s) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      const filteredSet = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds((prev) => [...prev, id]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((i) => i !== id));
    }
  };

  // Single Student Requirement Toggle Action (PIN Protected for clearing)
  const executeSingleToggle = async (studentId: string, willClear: boolean) => {
    if (reqIndex === -1) return;

    try {
      const res = await fetch("/api/clearance-records/manual-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          entityType,
          entityId,
          taskIndex: reqIndex,
          completed: willClear,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await loadData();
      if (onRefresh) onRefresh();

      setToastMessage(willClear ? `Cleared requirement for Student ${studentId}` : `Reverted Student ${studentId} to Pending`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update requirement status.");
    }
  };

  const handleToggleStudentRequirement = (studentId: string, currentStatus: "Cleared" | "Pending") => {
    const willClear = currentStatus !== "Cleared";
    if (willClear) {
      setPendingPinAction(() => () => executeSingleToggle(studentId, true));
      setShowPinModal(true);
    } else {
      executeSingleToggle(studentId, false);
    }
  };

  // Batch Clear Selected Students Action (PIN Protected)
  const executeBatchClear = async (idsToClear: string[]) => {
    if (reqIndex === -1 || idsToClear.length === 0) return;

    try {
      for (const stId of idsToClear) {
        await fetch("/api/clearance-records/manual-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: stId,
            entityType,
            entityId,
            taskIndex: reqIndex,
            completed: true,
          }),
        });
      }

      setSelectedStudentIds([]);
      await loadData();
      if (onRefresh) onRefresh();

      setToastMessage(`Successfully batch cleared ${idsToClear.length} students for "${activeRequirement?.name}"!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Batch clearing failed. Please try again.");
    }
  };

  const handleBatchClear = () => {
    const pendingSelected = selectedStudentIds.filter(
      (id) => getStudentReqStatus(id) === "Pending"
    );

    if (pendingSelected.length === 0) {
      alert("No pending students selected in your batch.");
      return;
    }

    setPendingPinAction(() => () => executeBatchClear(pendingSelected));
    setShowPinModal(true);
  };

  const executeBatchUncleared = async (idsToUncleared: string[]) => {
    if (reqIndex === -1 || idsToUncleared.length === 0) return;

    try {
      for (const stId of idsToUncleared) {
        await fetch("/api/clearance-records/manual-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: stId,
            entityType,
            entityId,
            taskIndex: reqIndex,
            completed: false,
          }),
        });
      }

      setSelectedStudentIds([]);
      await loadData();
      if (onRefresh) onRefresh();

      setToastMessage(`Marked ${idsToUncleared.length} students as uncleared for "${activeRequirement?.name}"`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Batch update failed. Please try again.");
    }
  };

  const handleBatchUncleared = () => {
    const clearedSelected = selectedStudentIds.filter(
      (id) => getStudentReqStatus(id) === "Cleared"
    );

    if (clearedSelected.length === 0) {
      alert("No cleared students selected in your batch.");
      return;
    }

    executeBatchUncleared(clearedSelected);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Two-Window Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 👈 LEFT WINDOW: Requirements Selector Sidebar (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c41e2a]" />
                Requirements List
              </h3>
              <p className="text-[11px] text-gray-500">Select a requirement to evaluate students</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#c41e2a]">
              {requirements.length}
            </span>
          </div>

          {/* Left Window Search Input */}
          <div className="relative">
            <input
              type="text"
              value={reqSearch}
              onChange={(e) => setReqSearch(e.target.value)}
              placeholder="Search requirements…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-gray-50/50 focus:bg-white focus:border-[#c41e2a] outline-none"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Requirements List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {requirements.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No requirements created yet. Switch to the Setup tab to add one.
              </div>
            ) : (
              requirements
                .filter((r) => r.name.toLowerCase().includes(reqSearch.toLowerCase()))
                .map((req, rIdx) => {
                  const isSelected = req.id === selectedReqId;
                  const reqTypeKey = req.type || "MANUAL";
                  const badge = TYPE_BADGES[reqTypeKey] || TYPE_BADGES.MANUAL;

                  // Compute compliance progress for this requirement
                  const applicable = students.filter((s) => isApplicable(s, req));
                  const cleared = applicable.filter((st) => {
                    const rec = clearanceRecords[st.id];
                    return rec?.status === "Cleared" || (Array.isArray(rec?.completedTasks) && rec.completedTasks.includes(rIdx));
                  }).length;
                  const percent = applicable.length === 0 ? 0 : Math.round((cleared / applicable.length) * 100);

                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        setSelectedReqId(req.id);
                        setSelectedStudentIds([]);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-red-50/40 border-[#c41e2a] shadow-xs"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className={`font-semibold text-xs leading-snug ${isSelected ? "text-[#c41e2a]" : "text-gray-900"}`}>
                          {req.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                        {req.description || "No description provided."}
                      </p>

                      {/* Progress Bar & Stats */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                          <span>{cleared} / {applicable.length} Cleared</span>
                          <span className="font-bold">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* 👉 RIGHT WINDOW: Student Batch Evaluator & Filter Panel (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-5">
          {!activeRequirement ? (
            <div className="py-24 text-center text-gray-400 text-xs">
              Select a requirement from the left panel to begin batch evaluating.
            </div>
          ) : (
            <>
              {/* Active Requirement Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-gray-900">{activeRequirement.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeRequirement.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeRequirement.description || "Batch evaluator window"}
                  </p>
                </div>

                {/* Batch Actions Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCsvBatchModal(true)}
                    className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold py-2 px-3.5 rounded-lg shadow-2xs hover:bg-amber-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Upload CSV spreadsheet to flag deficiencies or batch clear students"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    CSV Deficiencies & Batch
                  </button>

                  {selectedStudentIds.length > 0 && (
                    <>
                      <button
                        onClick={handleBatchClear}
                        className="bg-green-600 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-xs hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">done</span>
                        Mark Cleared ({selectedStudentIds.length})
                      </button>
                      <button
                        onClick={handleBatchUncleared}
                        className="bg-red-50 text-coral-red border border-coral-red text-xs font-bold py-2 px-3.5 rounded-lg shadow-xs hover:bg-coral-red hover:text-white active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">close</span>
                        Mark Uncleared ({selectedStudentIds.length})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Applicable</span>
                  <span className="text-xl font-extrabold text-gray-900 mt-0.5 block">{applicableStudents.length}</span>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Cleared</span>
                  <span className="text-xl font-extrabold text-emerald-800 mt-0.5 block">{clearedCount}</span>
                </div>
                <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
                  <span className="text-xl font-extrabold text-amber-800 mt-0.5 block">{pendingCount}</span>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl">
                {/* Search input */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student ID or name…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:border-[#c41e2a] outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-gray-200 shrink-0">
                  <button
                    onClick={() => setStudentFilter("all")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      studentFilter === "all" ? "bg-gray-900 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All ({applicableStudents.length})
                  </button>
                  <button
                    onClick={() => setStudentFilter("pending")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      studentFilter === "pending" ? "bg-amber-600 text-white shadow-xs" : "text-gray-600 hover:text-amber-700"
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStudentFilter("cleared")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      studentFilter === "cleared" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-emerald-700"
                    }`}
                  >
                    Cleared ({clearedCount})
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Program / Year</th>
                      <th className="py-3 px-4 text-center">Requirement Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 animate-pulse">
                          Loading student data…
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No applicable students match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const status = getStudentReqStatus(st.id);
                        const isCleared = status === "Cleared";
                        const isSelected = selectedStudentIds.includes(st.id);
                        const deptCode = st.department || getDepartmentForProgram(st.program || st.course);
                        const avatarSrc = st.avatarUrl || st.avatar || st.photoUrl || st.profilePicture || st.image;

                        return (
                          <tr
                            key={st.id}
                            className={`hover:bg-gray-50/80 transition-colors ${isSelected ? "bg-emerald-50/20" : ""}`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectStudent(st.id, e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-gray-900">{st.id}</td>
                            <td className="py-3 px-4 font-bold text-gray-900">
                              <div className="flex items-center gap-2.5">
                                {avatarSrc ? (
                                  <img
                                    src={avatarSrc}
                                    alt={st.name}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 shadow-2xs border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                                    {st.name?.slice(0, 2).toUpperCase() || "ST"}
                                  </div>
                                )}
                                <button
                                  onClick={() => setSelectedStudentForDetails(st)}
                                  className="text-left font-bold text-gray-900 hover:text-[#c41e2a] hover:underline cursor-pointer"
                                >
                                  {st.name}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-700">
                              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px]">
                                {deptCode}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {st.program || st.course} • {st.year}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isCleared ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[3]" /> Cleared
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isCleared ? (
                                  <button
                                    onClick={() => handleToggleStudentRequirement(st.id, status)}
                                    className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-red-50 text-coral-red hover:bg-coral-red hover:text-white border border-coral-red active:scale-95 shadow-xs cursor-pointer"
                                  >
                                    Mark Uncleared
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStudentRequirement(st.id, status)}
                                    className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-600 active:scale-95 shadow-xs cursor-pointer"
                                  >
                                    Mark Cleared
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedStudentForDetails(st)}
                                  className="text-coral-red hover:text-primary transition-colors font-bold text-xs cursor-pointer bg-transparent border-none outline-none flex items-center gap-1"
                                  title="View full requirement details and submissions"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Student Clearance Details Modal */}
      {selectedStudentForDetails && mounted && createPortal(
        <div 
          onClick={() => setSelectedStudentForDetails(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px] animate-fade-in p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-scale-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 mb-4">
              <div className="flex flex-col">
                <h3 className="font-title-md text-base font-bold text-on-surface">
                  Student Clearance Details
                </h3>
                <span className="text-xs text-secondary mt-0.5">
                  Viewing details and submissions for <span className="font-bold text-on-surface">{selectedStudentForDetails.name} ({selectedStudentForDetails.id})</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedStudentForDetails(null)}
                className="p-1.5 rounded-full hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content — full task checklist with file/payment/survey submissions & evaluation */}
            <div className="flex-1 overflow-y-auto pr-1">
              <ClearanceStatusView
                targetStudentId={selectedStudentForDetails.id}
                isSysAdminView={true}
                viewingOfficeId={entityType === "office" ? entityId : undefined}
                viewingDeptId={entityType === "department" ? entityId : undefined}
                viewingOrgId={entityType === "org" ? entityId : undefined}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSV Deficiency Import Modal */}
      <BatchCsvImporterModal
        isOpen={showCsvBatchModal}
        onClose={() => setShowCsvBatchModal(false)}
        entityType={entityType}
        entityId={entityId}
        onSuccess={() => {
          setToastMessage("Batch CSV updates applied successfully!");
          setTimeout(() => setToastMessage(null), 3500);
          loadData();
          if (onRefresh) onRefresh();
        }}
      />

      {/* Security PIN Authorization Modal */}
      <PinConfirmationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingPinAction(null);
        }}
        onConfirm={() => {
          if (pendingPinAction) pendingPinAction();
          setPendingPinAction(null);
        }}
        officeIdOrKey={entityId || "default"}
      />
    </div>
  );
}
