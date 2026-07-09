"use client";

import { useState } from "react";

// Mock constituents list based on the updated departments
const INITIAL_CONSTITUENTS = [
  {
    id: "2021-0492",
    name: "Eleanor Shellstrop",
    department: "CCIS",
    program: "BS Computer Science",
    year: "4th Year",
    status: "Cleared",
  },
  {
    id: "2022-1103",
    name: "Chidi Anagonye",
    department: "COE",
    program: "BS Civil Engineering",
    year: "3rd Year",
    status: "Pending",
  },
  {
    id: "2020-8831",
    name: "Tahani Al-Jamil",
    department: "CEDAS",
    program: "BS Data Science",
    year: "2nd Year",
    status: "Cleared",
  },
  {
    id: "2023-0012",
    name: "Jason Mendoza",
    department: "CHS",
    program: "BS Nursing",
    year: "1st Year",
    status: "Cleared",
  },
  {
    id: "2021-5529",
    name: "Michael Realman",
    department: "CABE",
    program: "BS Business Administration",
    year: "4th Year",
    status: "Cleared",
  },
];

export default function ConstituentsPage() {
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("2025-2026 — 1st Semester (Current)");
  const [yearLevel, setYearLevel] = useState("All Years");
  const [department, setDepartment] = useState("All Departments");
  const [program, setProgram] = useState("All Programs");

  // Keep state for table items to make "Mark Cleared / Uncleared" toggling work instantly!
  const [constituents, setConstituents] = useState(INITIAL_CONSTITUENTS);
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

  const handleBulkStatusChange = (status: "Cleared" | "Pending") => {
    setConstituents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id) ? { ...student, status } : student
      )
    );
    setSelectedIds([]);
  };  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Constituents
          </h2>
          <span className="font-body-md text-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="font-semibold text-on-surface">Guidance Office</span>
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
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">1,284</h3>
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
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">1,207</h3>
              <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> 94% of total constituents
              </p>
            </div>
          </div>

          {/* Summary Card 3: Pending Review */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-6 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Pending Review
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">42</h3>
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
              <option>2025-2026 — 1st Semester (Current)</option>
              <option>2024-2025 — 2nd Semester</option>
              <option>2024-2025 — 1st Semester</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-lg">
              expand_more
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Department Dropdown */}
          <div className="relative flex-1 min-w-[180px]">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setProgram("All Programs");
              }}
              className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
            >
              <option>All Departments</option>
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

          {/* Program Dropdown */}
          <div className="relative flex-1 min-w-[180px]">
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
            >
              <option>All Programs</option>
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

          {/* Year Level Dropdown */}
          <div className="relative flex-1 min-w-[150px]">
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="custom-ring w-full h-11 pl-4 pr-10 bg-surface-container-lowest border border-surface-container-high rounded-lg appearance-none font-body-sm text-sm text-on-surface cursor-pointer focus:outline-none"
            >
              <option>All Years</option>
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
          {(search || yearLevel !== "All Years" || department !== "All Departments" || program !== "All Programs") && (
            <button
              onClick={() => {
                setSearch("");
                setYearLevel("All Years");
                setDepartment("All Departments");
                setProgram("All Programs");
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
                onClick={() => handleBulkStatusChange("Cleared")}
                className="bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">done</span>
                Mark Cleared
              </button>
              <button
                onClick={() => handleBulkStatusChange("Pending")}
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
                    <td className="py-4 px-6 text-secondary">{student.department}</td>
                    <td className="py-4 px-6 text-secondary">{student.program}</td>
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
    </div>
  );
}
