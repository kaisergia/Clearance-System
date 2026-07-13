"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/components/contexts/SettingsContext";
import { mockOrgs, mockOrgMembers } from "@/mock/mockData";
import { mockStudents } from "@/mock/mockStudents";
import { ConstituentsFilterBar } from "@/components/ConstituentsFilterBar";
import { ConstituentsTable } from "@/components/ConstituentsTable";

export default function OrgConstituentsPage() {
  const { getAvailableTerms, currentTerm } = useSettings();
  const availableTerms = getAvailableTerms();

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState(currentTerm);
  const [yearLevel, setYearLevel] = useState("All Years");
  const [department, setDepartment] = useState("All Departments");
  const [program, setProgram] = useState("All Programs");

  const [org, setOrg] = useState<any>(null);
  const [constituents, setConstituents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSemester(currentTerm);
  }, [currentTerm]);

  useEffect(() => {
    const orgId = localStorage.getItem("orgId");
    if (orgId) {
      const currentOrg = mockOrgs.find((o) => o.id === parseInt(orgId));
      if (currentOrg) {
        setOrg(currentOrg);

        // Fetch students based on org type/scope logic
        let list: any[] = [];
        if (currentOrg.type === "Gov") {
          list = mockStudents;
        } else if (currentOrg.type === "LGU") {
          list = mockStudents.filter((s) => s.department === currentOrg.department);
          setDepartment(currentOrg.department || "All Departments"); // Lock department
        } else if (currentOrg.type === "AcademicClub") {
          list = mockStudents.filter((s) => s.course === currentOrg.program);
          setDepartment(currentOrg.department || "All Departments"); // Lock department
          setProgram(currentOrg.program || "All Programs"); // Lock program
        } else if (currentOrg.type === "NonAcademicClub") {
          const memberIds = mockOrgMembers
            .filter((m) => m.orgId === currentOrg.id)
            .map((m) => m.studentId);
          list = mockStudents.filter((s) => memberIds.includes(s.id));
        }
        setConstituents(list);
      }
    }
  }, []);

  // Extract unique departments dynamically from state (only relevant if Gov/NonAcademic)
  const uniqueDepartments = Array.from(
    new Set(constituents.map((student) => student.department))
  ).sort();

  // Extract unique programs dynamically, filtering by department if one is selected
  const availablePrograms = Array.from(
    new Set(
      constituents
        .filter((student) => department === "All Departments" || student.department === department)
        .map((student) => student.course || student.program)
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
    const matchesProg = program === "All Programs" || student.course === program || student.program === program;

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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<"Cleared" | "Pending" | null>(null);

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

  // Stats computation
  const totalCount = constituents.length;
  const clearedCount = constituents.filter((s) => s.status === "Cleared").length;
  const pendingCount = totalCount - clearedCount;
  const clearedPercent = totalCount === 0 ? 0 : Math.round((clearedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Constituents
          </h2>
          <span className="font-body-md text-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">groups</span>
            Organization: <span className="font-semibold text-on-surface">{org?.name || "Loading..."}</span>
            <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-tertiary">
              {org?.type === "Gov" ? "University-Wide" : org?.type === "LGU" ? `LGU (${org?.department})` : "Club"}
            </span>
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
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">{totalCount}</h3>
              <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">groups</span> Active roster this semester
              </p>
            </div>
          </div>

          {/* Summary Card 2: Cleared Students */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Cleared Students
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">{clearedCount}</h3>
              <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> {clearedPercent}% cleared
              </p>
            </div>
          </div>

          {/* Summary Card 3: Pending Review */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Pending / Deficient
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">{pendingCount}</h3>
              <p className="text-xs text-yellow-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> Action required
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
        org={org}
      />

      <ConstituentsTable
        students={filteredConstituents}
        selectedIds={selectedIds}
        onSelectStudent={handleSelectStudent}
        onSelectAllChange={handleSelectAllChange}
        onToggleStatus={handleToggleStatus}
        onBulkStatusChange={triggerBulkStatusChange}
        isAllSelected={isAllSelected}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
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
    </div>
  );
}
