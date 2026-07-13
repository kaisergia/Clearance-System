"use client";

interface ConstituentsFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  semester: string;
  setSemester: (v: string) => void;
  availableTerms: string[];
  department: string;
  setDepartment: (v: string) => void;
  uniqueDepartments: string[];
  program: string;
  setProgram: (v: string) => void;
  availablePrograms: string[];
  yearLevel: string;
  setYearLevel: (v: string) => void;
  org?: {
    type: "Gov" | "LGU" | "AcademicClub" | "NonAcademicClub";
    department: string | null;
    program: string | null;
  } | null;
}

export function ConstituentsFilterBar({
  search,
  setSearch,
  semester,
  setSemester,
  availableTerms,
  department,
  setDepartment,
  uniqueDepartments,
  program,
  setProgram,
  availablePrograms,
  yearLevel,
  setYearLevel,
  org,
}: ConstituentsFilterBarProps) {
  // Check if department dropdown should be editable/visible
  const showDeptSelect = !org || org.type === "Gov" || org.type === "NonAcademicClub";
  // Check if program dropdown should be editable/visible
  const showProgSelect = !org || org.type !== "AcademicClub";

  const handleClearFilters = () => {
    setSearch("");
    setYearLevel("All Years");
    if (showDeptSelect) {
      setDepartment("All Departments");
    }
    if (showProgSelect) {
      setProgram("All Programs");
    }
  };

  const hasActiveFilters =
    search ||
    yearLevel !== "All Years" ||
    (department !== "All Departments" && showDeptSelect) ||
    (program !== "All Programs" && showProgSelect);

  return (
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
        {/* Department Dropdown */}
        {showDeptSelect ? (
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
            Department: {org?.department}
          </div>
        )}

        {/* Program Dropdown */}
        {showProgSelect ? (
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
            Program: {org?.program}
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
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="h-11 px-6 bg-secondary text-white font-bold text-sm rounded-lg hover:bg-opacity-95 transition-all shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>
    </section>
  );
}
