"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/components/contexts/SettingsContext";
import { ConstituentsFilterBar } from "@/components/constituents/ConstituentsFilterBar";
import { ConstituentsTable, TableStudent } from "@/components/constituents/ConstituentsTable";
import * as clearanceService from "@/services/clearanceService";
import { ClearanceStatusView } from "@/components/constituents/ClearanceStatusView";
import { mockStudents } from "@/mock/mockStudents";
import { mockRequirements } from "@/mock/mockData";
import ClearanceStatus from "@/components/ui/ClearanceStatus";

export default function ConstituentsPage() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState(currentTerm);

  useEffect(() => {
    setSemester(currentTerm);
  }, [currentTerm]);
  const [yearLevel, setYearLevel] = useState("All Years");
  const [department, setDepartment] = useState("All Departments");
  const [program, setProgram] = useState("All Programs");

  // Keep state for table items to make "Mark Cleared / Uncleared" toggling work instantly!
  const [constituents, setConstituents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeOffice, setActiveOffice] = useState<any>(null);

  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState<any>(null);
  const [statusRequirements, setStatusRequirements] = useState<any[]>([]);
  const [currentOfficeId, setCurrentOfficeId] = useState<number | null>(null);

  const handleOpenStatusModal = async (student: any) => {
    const mergedReqs = await clearanceService.getStudentRequirements(student.id);
    setStatusRequirements(mergedReqs);
    setSelectedStudentForStatus(student);
  };

  useEffect(() => {
    const loadData = async () => {
      const officeId = localStorage.getItem("officeId");
      let currentOffice = null;
      if (officeId) {
        currentOffice = await clearanceService.getOfficeById(Number(officeId));
        if (currentOffice) setActiveOffice(currentOffice);
        setCurrentOfficeId(Number(officeId));
      }

      const allStudents = await clearanceService.getStudents();
      const mappedStudents = [];
      for (const student of allStudents) {
        const records = await clearanceService.getStudentClearanceRecords(student.id);
        const officeRec = records.find((r: any) => r.officeId === Number(officeId));
        mappedStudents.push({
          ...student,
          status: officeRec?.status || "Pending",
        });
      }
      setConstituents(mappedStudents);
    };

    loadData();
    window.addEventListener("clearanceRecordsUpdated", loadData);
    return () => window.removeEventListener("clearanceRecordsUpdated", loadData);
  }, []);

  // Extract unique departments dynamically from state
  const uniqueDepartments = Array.from(
    new Set(constituents.map((student) => student.department))
  ).sort();

  // Extract unique programs dynamically, filtering by department if one is selected
  const availablePrograms = Array.from(
    new Set(
      constituents
        .filter((student) => department === "All Departments" || student.department === department)
        .map((student) => student.program)
    )
  ).sort();

  // Toggle status handler
  const handleToggleStatus = async (id: string) => {
    const officeId = localStorage.getItem("officeId");
    if (!officeId) return;

    const student = constituents.find(s => s.id === id);
    if (!student) return;

    const newStatus = student.status === "Cleared" ? "Pending" : "Cleared";
    
    // Optimistic UI update
    setConstituents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, status: newStatus };
        }
        return s;
      })
    );

    await clearanceService.updateClearanceRecord(id, Number(officeId), "office", newStatus);
  };

  // Filter students based on state
  const filteredConstituents = constituents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.id.includes(search);
    const matchesYear = yearLevel === "All Years" || student.year === yearLevel;
    const matchesDept = department === "All Departments" || student.department === department;
    const matchesProg = program === "All Programs" || student.program === program;

    return matchesSearch && matchesYear && matchesDept && matchesProg;
  });

  // Selection handlers
  const isAllSelected =
    filteredConstituents.length > 0 &&
    filteredConstituents.every((student) => selectedIds.includes(student.id));

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredConstituents.map((student) => student.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    } else {
      const filteredIds = filteredConstituents.map((student) => student.id);
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<TableStudent | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<"Cleared" | "Pending" | null>(null);

  const getSelectedStudentRequirements = () => {
    if (!selectedStudentForDetails) return [];
    const storedReqs = localStorage.getItem("requirements");
    const reqsList = storedReqs ? JSON.parse(storedReqs) : mockRequirements;
    
    // Normalize Rejected to Pending
    const normalized = reqsList.map((r: any) => ({
      ...r,
      status: r.status === "Rejected" ? "Pending" : r.status
    }));

    // Find the student in the current page constituents state to get their local toggle status
    const currentStudentState = constituents.find((s) => s.id === selectedStudentForDetails.id);
    const isOfficeCleared = currentStudentState ? currentStudentState.status === "Cleared" : false;

    // Only mark the "Guidance Office" requirement based on this status
    return normalized.map((r: any) => {
      if (r.responsible === "Guidance Office") {
        return {
          ...r,
          status: isOfficeCleared ? "Cleared" : "Pending",
          dateCleared: isOfficeCleared ? (r.dateCleared || "Jan 14, 2026") : null
        };
      }
      return r;
    });
  };

  const triggerBulkStatusChange = (status: "Cleared" | "Pending") => {
    setPendingBulkStatus(status);
    setShowConfirmModal(true);
  };

  const confirmBulkStatusChange = async () => {
    if (pendingBulkStatus) {
      const officeId = localStorage.getItem("officeId");
      if (!officeId) return;

      setConstituents((prev) =>
        prev.map((student) => {
          if (selectedIds.includes(student.id)) {
            return { ...student, status: pendingBulkStatus };
          }
          return student;
        })
      );

      for (const id of selectedIds) {
        await clearanceService.updateClearanceRecord(id, Number(officeId), "office", pendingBulkStatus);
      }

      setSelectedIds([]);
    }
    setShowConfirmModal(false);
    setPendingBulkStatus(null);
  };  const totalCount = constituents.length;
  const clearedCount = constituents.filter((s) => s.status === "Cleared").length;
  const pendingCount = constituents.filter((s) => s.status === "Pending").length;

  const clearedPercent = totalCount === 0 ? 0 : Math.round((clearedCount / totalCount) * 100);
  const pendingPercent = totalCount === 0 ? 0 : Math.round((pendingCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Constituents
          </h2>
          <span className="font-body-md text-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="font-semibold text-on-surface">{activeOffice ? activeOffice.name : "Loading..."}</span>
          </span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card 1: Total Constituents */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Total Constituents
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">
                {totalCount.toLocaleString()}
              </h3>
              <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
              </p>
            </div>
          </div>

          {/* Summary Card 2: Cleared Students */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Cleared Students
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">
                {clearedCount.toLocaleString()}
              </h3>
              <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> {clearedPercent}% of total constituents
              </p>
            </div>
          </div>

          {/* Summary Card 3: Pending Review */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Pending Review
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">
                {pendingCount.toLocaleString()}
              </h3>
              <p className="text-xs text-yellow-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> {pendingPercent}% pending review
              </p>
            </div>
          </div>
        </div>
      </section>

      <ConstituentsFilterBar
        search={search}
        setSearch={setSearch}
        semester={semester}
        setSemester={setSemester}
        availableTerms={availableTerms}
        department={department}
        setDepartment={setDepartment}
        uniqueDepartments={uniqueDepartments}
        program={program}
        setProgram={setProgram}
        availablePrograms={availablePrograms}
        yearLevel={yearLevel}
        setYearLevel={setYearLevel}
      />

      <ConstituentsTable
        students={filteredConstituents}
        selectedIds={selectedIds}
        onSelectStudent={handleSelectStudent}
        onSelectAllChange={handleSelectAllChange}
        onToggleStatus={handleToggleStatus}
        onBulkStatusChange={triggerBulkStatusChange}
        onViewDetails={setSelectedStudentForDetails}
        isAllSelected={isAllSelected}
        onViewDetails={handleOpenStatusModal}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 max-w-md w-full mx-4 shadow-lg animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold">Confirm Bulk Action</h3>
            </div>
            <p className="font-body-md text-body-md text-secondary mb-6">
              Are you sure you want to mark the <strong>{selectedIds.length}</strong> selected students as{" "}
              <strong className={pendingBulkStatus === "Cleared" ? "text-green-600" : "text-coral-red"}>
                {pendingBulkStatus}
              </strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingBulkStatus(null);
                }}
                className="px-md py-sm border border-surface-container-high hover:bg-surface-container-low text-secondary rounded-lg font-label-md text-label-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkStatusChange}
                className={`px-md py-sm text-white rounded-lg font-label-md text-label-md transition-colors shadow-sm ${
                  pendingBulkStatus === "Cleared" ? "bg-green-600 hover:bg-green-700" : "bg-brand-red hover:bg-primary"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentForStatus && mounted && createPortal(
        <div 
          onClick={() => setSelectedStudentForStatus(null)}
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
                  Viewing details for <span className="font-bold text-on-surface">{selectedStudentForStatus.name} ({selectedStudentForStatus.id})</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedStudentForStatus(null)}
                className="p-1.5 rounded-full hover:bg-surface-container-low text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content — full task checklist with submissions & review actions */}
            <div className="flex-1 overflow-y-auto pr-1">
              <ClearanceStatusView
                targetStudentId={selectedStudentForStatus.id}
                isSysAdminView={true}
                viewingOfficeId={currentOfficeId ?? undefined}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
