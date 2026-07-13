"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/components/contexts/SettingsContext";
import { mockOrgs, mockOrgMembers } from "@/mock/mockData";
import { mockStudents } from "@/mock/mockStudents";

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
          setDepartment(currentOrg.department); // Lock department
        } else if (currentOrg.type === "AcademicClub") {
          list = mockStudents.filter((s) => s.course === currentOrg.program);
          setDepartment(currentOrg.department); // Lock department
          setProgram(currentOrg.program); // Lock program
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

      {/* Filter Bar */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-high shadow-[0px_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[300px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="custom-ring w-full h-11 pl-12 pr-4 bg-surface-container-lowest border border-surface-container-high rounded-lg font-body-sm text-sm outline-none text-on-surface"
            />
          </div>

          {/* Semester Dropdown */}
          <div className="relative min-w-[280px]">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
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
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Department Dropdown (Only show/editable if Gov or NonAcademicClub) */}
          {(!org || org.type === "Gov" || org.type === "NonAcademicClub") ? (
            <div className="relative flex-1 min-w-[180px]">
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setProgram("All Programs");
                }}
                className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="All Departments">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-lg">
                expand_more
              </span>
            </div>
          ) : (
            <div className="flex-1 min-w-[180px] bg-surface-container-low px-4 h-11 rounded-lg border border-outline-variant flex items-center text-secondary text-sm">
              Department: {org.department}
            </div>
          )}

          {/* Program Dropdown (Editable if Gov, NonAcademicClub, or LGU. Hidden/Locked for AcademicClub) */}
          {(!org || org.type !== "AcademicClub") ? (
            <div className="relative flex-1 min-w-[180px]">
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="All Programs">All Programs</option>
                {availablePrograms.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-lg">
                expand_more
              </span>
            </div>
          ) : (
            <div className="flex-1 min-w-[180px] bg-surface-container-low px-4 h-11 rounded-lg border border-outline-variant flex items-center text-secondary text-sm">
              Program: {org.program}
            </div>
          )}

          {/* Year Level Dropdown */}
          <div className="relative flex-1 min-w-[150px]">
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
            >
              <option value="All Years">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-lg">
              expand_more
            </span>
          </div>

          {/* Clear Filters Button */}
          {(search || yearLevel !== "All Years" || (department !== "All Departments" && (!org || org.type === "Gov" || org.type === "NonAcademicClub")) || (program !== "All Programs" && (!org || org.type !== "AcademicClub"))) && (
            <button
              onClick={() => {
                setSearch("");
                setYearLevel("All Years");
                if (!org || org.type === "Gov" || org.type === "NonAcademicClub") {
                  setDepartment("All Departments");
                }
                if (!org || org.type !== "AcademicClub") {
                  setProgram("All Programs");
                }
              }}
              className="h-11 px-6 bg-secondary text-white font-bold text-sm rounded-lg hover:bg-opacity-95 transition-all shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Constituents List */}
      <section className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="bg-primary/5 px-6 py-3 border-b border-outline-variant flex justify-between items-center">
            <span className="text-sm font-semibold text-primary">
              {selectedIds.length} {selectedIds.length === 1 ? "student" : "students"} selected for bulk actions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerBulkStatusChange("Cleared")}
                className="bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">done</span>
                Mark Cleared
              </button>
              <button
                onClick={() => triggerBulkStatusChange("Pending")}
                className="bg-red-50 text-coral-red border border-coral-red text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-coral-red hover:text-white active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
                Mark Uncleared
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant text-left">
              <tr className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                <th className="py-4 px-6 text-left">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAllChange(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                    />
                    <span>All</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left">Student ID</th>
                <th className="py-4 px-6 text-left">Name</th>
                <th className="py-4 px-6 text-left">Department</th>
                <th className="py-4 px-6 text-left">Program</th>
                <th className="py-4 px-6 text-left">Year</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Action</th>
                <th className="py-4 px-6 text-center">Progress</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-sm text-on-surface divide-y divide-outline-variant/30">
              {filteredConstituents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-secondary font-medium">
                    No constituents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredConstituents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-surface-container-low/20 transition-all duration-150"
                  >
                    <td className="py-4 px-6 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-xs text-secondary">{student.id}</td>
                    <td className="py-4 px-6 font-bold">{student.name}</td>
                    <td className="py-4 px-6 text-secondary">{student.department || "N/A"}</td>
                    <td className="py-4 px-6 text-secondary">{student.course}</td>
                    <td className="py-4 px-6 text-secondary">{student.year}</td>
                    <td className="py-4 px-6 text-center">
                      {student.status === "Cleared" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {student.status === "Cleared" ? (
                        <button
                          onClick={() => handleToggleStatus(student.id)}
                          className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-red-50 text-coral-red hover:bg-coral-red hover:text-white border border-coral-red active:scale-95 shadow-sm"
                        >
                          Mark Uncleared
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(student.id)}
                          className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-600 active:scale-95 shadow-sm"
                        >
                          Mark Cleared
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="text-coral-red hover:text-primary transition-colors font-bold text-xs">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
