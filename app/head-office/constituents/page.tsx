"use client";

import { useState } from "react";

// Mock constituents list based on the provided reference HTML
const INITIAL_CONSTITUENTS = [
  {
    id: "2021-0492",
    name: "Eleanor Shellstrop",
    department: "Philosophy",
    program: "BA Philosophy",
    year: "4th Year",
    status: "Cleared",
  },
  {
    id: "2022-1103",
    name: "Chidi Anagonye",
    department: "Ethics",
    program: "BA Ethics",
    year: "3rd Year",
    status: "Pending",
  },
  {
    id: "2020-8831",
    name: "Tahani Al-Jamil",
    department: "Arts",
    program: "BFA Arts",
    year: "2nd Year",
    status: "Cleared",
  },
  {
    id: "2023-0012",
    name: "Jason Mendoza",
    department: "Business",
    program: "BS Business",
    year: "1st Year",
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-3xl font-bold text-on-background">
            Constituents
          </h2>
          <span className="font-body-md text-sm text-secondary uppercase tracking-widest font-semibold mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="text-on-surface">Guidance Office</span>
          </span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card 1: Total Constituents */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex items-center justify-between group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-primary">
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
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                groups
              </span>
            </div>
          </div>

          {/* Summary Card 2: Pending Review */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex items-center justify-between group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-yellow-500">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Pending Review
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">42</h3>
              <p className="text-xs text-yellow-600 font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span> Action required
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                pending_actions
              </span>
            </div>
          </div>

          {/* Summary Card 3: Cleared Rate */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex items-center justify-between group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500">
            <div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Clearance Rate
              </p>
              <h3 className="text-3xl font-extrabold text-on-surface leading-none mt-1">94%</h3>
              <div className="w-28 bg-surface-container-low h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-green-500 h-full w-[94%]"></div>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
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
              className="w-full h-11 pl-11 pr-4 bg-surface-container-low/50 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-sm text-sm"
            />
          </div>

          {/* Semester Dropdown */}
          <div className="relative min-w-[280px]">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-surface-container-low/50 border border-outline-variant rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-sm text-sm text-on-surface cursor-pointer"
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
          {/* Year Level Dropdown */}
          <div className="relative flex-1 min-w-[150px]">
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-surface-container-low/50 border border-outline-variant rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-sm text-sm cursor-pointer"
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

          {/* Department Dropdown */}
          <div className="relative flex-1 min-w-[180px]">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-11 pl-4 pr-10 bg-surface-container-low/50 border border-outline-variant rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-sm text-sm cursor-pointer"
            >
              <option>All Departments</option>
              <option>Philosophy</option>
              <option>Ethics</option>
              <option>Arts</option>
              <option>Business</option>
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
              className="w-full h-11 pl-4 pr-10 bg-surface-container-low/50 border border-outline-variant rounded-lg appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-sm text-sm cursor-pointer"
            >
              <option>All Programs</option>
              <option>BA Philosophy</option>
              <option>BA Ethics</option>
              <option>BFA Arts</option>
              <option>BS Business</option>
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
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant text-left">
              <tr className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
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
                  <td colSpan={8} className="py-8 text-center text-secondary font-medium">
                    No constituents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredConstituents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-surface-container-low/20 transition-all duration-150"
                  >
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
