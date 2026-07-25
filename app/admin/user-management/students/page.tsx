"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/components/contexts/SettingsContext";
import { ConstituentsFilterBar } from "@/components/constituents/ConstituentsFilterBar";
import { ConstituentsTable, TableStudent } from "@/components/constituents/ConstituentsTable";
import * as clearanceService from "@/services/clearanceService";
import Link from "next/link";
import { mockStudents } from "@/mock/mockStudents";
import { mockRequirements } from "@/mock/mockData";
import ClearanceStatus from "@/components/ui/ClearanceStatus";

export default function ManageStudentsPage() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState(currentTerm);

  useEffect(() => {
    setSemester(currentTerm);
  }, [currentTerm]);
  
  const [yearLevel, setYearLevel] = useState("All Years");
  const [department, setDepartment] = useState("All Departments");
  const [program, setProgram] = useState("All Programs");

  const [constituents, setConstituents] = useState<any[]>([]);

  useEffect(() => {
    const updateConstituentsStatus = async () => {
      // DATABASE SWAP POINT: clearanceService.getStudents() replaces localStorage["students"]
      const studentsList = await clearanceService.getStudents();

      const allMapped = await Promise.all(
        studentsList.map(async (student: any) => {
          // DATABASE SWAP POINT: clearanceService.getStudentClearanceRecords() replaces
          // localStorage["studentClearanceRecords"] direct read
          const records = await clearanceService.getStudentClearanceRecords(student.id);
          const reqs = await clearanceService.getStudentRequirements(student.id);

          const allCleared = reqs.every(
            (req: any) =>
              records.some(
                (r: any) =>
                  ((req.type === "office" && r.officeId === req.id) ||
                    (req.type === "org" && r.orgId === req.id) ||
                    (req.type === "department" && r.departmentId === req.id)) &&
                  r.status === "Cleared"
              )
          );

          return { ...student, status: reqs.length === 0 || !allCleared ? "Pending" : "Cleared" };
        })
      );

      setConstituents(allMapped);
    };

    updateConstituentsStatus();

    window.addEventListener("clearanceRecordsUpdated", updateConstituentsStatus);
    return () => window.removeEventListener("clearanceRecordsUpdated", updateConstituentsStatus);
  }, []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  const handleToggleStatus = (id: string) => {
    setConstituents((prev) =>
      prev.map((student) => {
        if (student.id === id) {
          return {
            ...student,
            status: student.status === "Cleared" ? "Pending" : "Cleared",
          };
        }
        return student;
      })
    );
  };

  // Filter students based on state
  const filteredConstituents = constituents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.id.includes(search);
    const matchesYear = yearLevel === "All Years" || student.year === yearLevel;
    const matchesDept = department === "All Departments" || student.department === department;
    const matchesProg = program === "All Programs" || student.program === program;
    
    // Check if the student belongs to the selected semester (optional, based on mockData)
    // If student.semester is not set, we just display them.
    const matchesSem = !student.semester || student.semester === semester;

    return matchesSearch && matchesYear && matchesDept && matchesProg && matchesSem;
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

    const currentStudentState = constituents.find((s) => s.id === selectedStudentForDetails.id);
    const isOverallCleared = currentStudentState ? currentStudentState.status === "Cleared" : false;

    if (isOverallCleared) {
      return normalized.map((r: any) => ({
        ...r,
        status: "Cleared",
        dateCleared: r.dateCleared || "Jan 14, 2026"
      }));
    }
    return normalized;
  };

  const triggerBulkStatusChange = (status: "Cleared" | "Pending") => {
    setPendingBulkStatus(status);
    setShowConfirmModal(true);
  };

  const confirmBulkStatusChange = () => {
    if (pendingBulkStatus) {
      setConstituents((prev) =>
        prev.map((student) =>
          selectedIds.includes(student.id) ? { ...student, status: pendingBulkStatus } : student
        )
      );
      setSelectedIds([]);
    }
    setShowConfirmModal(false);
    setPendingBulkStatus(null);
  };

  const totalCount = constituents.length;
  const clearedCount = constituents.filter((s) => s.status === "Cleared").length;
  const pendingCount = constituents.filter((s) => s.status === "Pending").length;

  const clearedPercent = totalCount === 0 ? 0 : Math.round((clearedCount / totalCount) * 100);
  const pendingPercent = totalCount === 0 ? 0 : Math.round((pendingCount / totalCount) * 100);

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline-lg text-headline-lg text-on-background">
              Manage Constituents
            </h2>
            <span className="font-body-md text-body-md text-secondary mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">admin_panel_settings</span>
              Office: <span className="font-semibold text-on-surface">System Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-secondary hover:text-primary hover:bg-surface-container-low transition-all font-label-md text-label-md shadow-sm">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Export CSV
            </button>
            <Link href="/admin/user-management/students/batch-import" className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-secondary hover:text-primary hover:bg-surface-container-low transition-all font-label-md text-label-md shadow-sm">
              <span className="material-symbols-outlined text-sm">group_add</span>
              Import Students
            </Link>
            <button className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-all font-label-md text-label-md shadow-sm btn-hover">
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Student
            </button>
          </div>
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
                <span className="material-symbols-outlined text-sm">trending_up</span> +12% from
                last sem
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
        isSysAdmin={true}
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

      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl max-w-xl w-full shadow-lg animate-scale-up overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-surface-container-high bg-surface-container-low">
              <div>
                <h3 className="font-bold text-lg text-on-surface">Student Clearance Status</h3>
                <p className="text-xs text-secondary mt-0.5">{selectedStudentForDetails.name} ({selectedStudentForDetails.id})</p>
              </div>
              <button 
                onClick={() => setSelectedStudentForDetails(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <ClearanceStatus requirements={getSelectedStudentRequirements()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
