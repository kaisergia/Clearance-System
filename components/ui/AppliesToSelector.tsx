"use client";

import { useState, useEffect, useRef } from "react";

const DEPARTMENTS = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];

const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

interface AppliesToSelectorProps {
  selectedDepts: string[];
  setSelectedDepts: React.Dispatch<React.SetStateAction<string[]>>;
  selectedProgs: string[];
  setSelectedProgs: React.Dispatch<React.SetStateAction<string[]>>;
  selectedYears: string[];
  setSelectedYears: React.Dispatch<React.SetStateAction<string[]>>;
  isExclusiveDept?: boolean;
  isExclusiveProg?: boolean;
}

export function AppliesToSelector({
  selectedDepts,
  setSelectedDepts,
  selectedProgs,
  setSelectedProgs,
  selectedYears,
  setSelectedYears,
  isExclusiveDept = false,
  isExclusiveProg = false,
}: AppliesToSelectorProps) {
  // Popover Toggles
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [progPopoverOpen, setProgPopoverOpen] = useState(false);
  const [yearPopoverOpen, setYearPopoverOpen] = useState(false);

  // Popover Search Fields
  const [deptSearch, setDeptSearch] = useState("");
  const [progSearch, setProgSearch] = useState("");
  const [yearSearch, setYearSearch] = useState("");

  // Truncation Toggles
  const [expandDepts, setExpandDepts] = useState(false);
  const [expandProgs, setExpandProgs] = useState(false);
  const [expandYears, setExpandYears] = useState(false);

  // References for click-outside detection
  const deptRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setDeptPopoverOpen(false);
      }
      if (progRef.current && !progRef.current.contains(event.target as Node)) {
        setProgPopoverOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDept = (dept: string) => {
    if (isExclusiveDept) return;

    setSelectedDepts((prev) => {
      if (dept === "All Departments") {
        const isCurrentlyChecked = prev.includes("All Departments");
        if (isCurrentlyChecked) {
          setSelectedProgs([]);
          return [];
        } else {
          return ["All Departments", ...DEPARTMENTS];
        }
      } else {
        const isCurrentlyChecked = prev.includes(dept);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((d) => d !== dept && d !== "All Departments");
          const dependentPrograms = DEPT_PROGRAMS[dept] || [];
          setSelectedProgs((curr) => curr.filter((p) => !dependentPrograms.includes(p)));
        } else {
          const temp = [...prev, dept];
          const allSpecificSelected = DEPARTMENTS.every((d) => temp.includes(d));
          next = allSpecificSelected ? ["All Departments", ...temp] : temp;
        }
        return next;
      }
    });
  };

  const getAvailableProgramsList = () => {
    if (isExclusiveProg && selectedProgs.length > 0) {
      return [selectedProgs[0]];
    }
    if (selectedDepts.includes("All Departments")) {
      return Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
    }
    return selectedDepts.flatMap((d) => DEPT_PROGRAMS[d] || []);
  };

  const toggleProg = (prog: string) => {
    if (isExclusiveProg) return;

    const availableProgs = getAvailableProgramsList();
    setSelectedProgs((prev) => {
      if (prog === "All Programs") {
        const isCurrentlyChecked = prev.includes("All Programs");
        if (isCurrentlyChecked) {
          return [];
        } else {
          return ["All Programs", ...availableProgs];
        }
      } else {
        const isCurrentlyChecked = prev.includes(prog);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((p) => p !== prog && p !== "All Programs");
        } else {
          const temp = [...prev, prog];
          const allSpecificSelected = availableProgs.every((p) => temp.includes(p));
          next = allSpecificSelected ? ["All Programs", ...temp] : temp;
        }
        return next;
      }
    });
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) => {
      if (year === "All Year Levels") {
        const isCurrentlyChecked = prev.includes("All Year Levels");
        if (isCurrentlyChecked) {
          return [];
        } else {
          return ["All Year Levels", ...YEAR_LEVELS];
        }
      } else {
        const isCurrentlyChecked = prev.includes(year);
        let next: string[];
        if (isCurrentlyChecked) {
          next = prev.filter((y) => y !== year && y !== "All Year Levels");
        } else {
          const temp = [...prev, year];
          const allSpecificSelected = YEAR_LEVELS.every((y) => temp.includes(y));
          next = allSpecificSelected ? ["All Year Levels", ...temp] : temp;
        }
        return next;
      }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-label-md text-sm font-bold text-on-surface uppercase tracking-wider">
        Applies To
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department Dropdown */}
        <div className="space-y-2 relative" ref={deptRef}>
          <label className="font-label-sm text-xs font-semibold text-secondary block">
            Department
          </label>
          <button
            type="button"
            disabled={isExclusiveDept}
            onClick={() => {
              setDeptPopoverOpen(!deptPopoverOpen);
              setProgPopoverOpen(false);
              setYearPopoverOpen(false);
            }}
            className={`w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm focus:border-primary focus:ring-1 focus:ring-primary ${
              isExclusiveDept ? "bg-surface-container/30 cursor-not-allowed opacity-85" : "cursor-pointer"
            }`}
          >
            <span className="truncate">
              {selectedDepts.length === 0
                ? "Select Department"
                : selectedDepts.length === 1
                  ? selectedDepts[0]
                  : `${selectedDepts.length} Departments selected`}
            </span>
            {!isExclusiveDept && (
              <span className="material-symbols-outlined text-secondary">
                expand_more
              </span>
            )}
          </button>

          {deptPopoverOpen && !isExclusiveDept && (
            <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                  search
                </span>
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                  placeholder="Search departments..."
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedDepts(["All Departments", ...DEPARTMENTS])}
                  className="hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepts([]);
                    setSelectedProgs([]);
                  }}
                  className="hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                {["All Departments", ...DEPARTMENTS]
                  .filter((d) =>
                    d.toLowerCase().includes(deptSearch.toLowerCase())
                  )
                  .map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepts.includes(dept)}
                        onChange={() => toggleDept(dept)}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Program Dropdown */}
        <div className="space-y-2 relative" ref={progRef}>
          <label className="font-label-sm text-xs font-semibold text-secondary block">
            Program
          </label>
          <button
            type="button"
            disabled={selectedDepts.length === 0 || isExclusiveProg}
            onClick={() => {
              setProgPopoverOpen(!progPopoverOpen);
              setDeptPopoverOpen(false);
              setYearPopoverOpen(false);
            }}
            className={`w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant font-body-sm text-sm text-left flex items-center justify-between shadow-sm focus:border-primary focus:ring-1 focus:ring-primary ${
              selectedDepts.length === 0 || isExclusiveProg
                ? "bg-surface-container/30 text-secondary/50 cursor-not-allowed opacity-85"
                : "bg-surface-container-lowest text-on-surface cursor-pointer"
            }`}
          >
            <span className="truncate">
              {selectedDepts.length === 0
                ? "Select Department first"
                : selectedProgs.length === 0
                  ? "Select Program"
                  : selectedProgs.length === 1
                    ? selectedProgs[0]
                    : `${selectedProgs.length} Programs selected`}
            </span>
            {!isExclusiveProg && selectedDepts.length > 0 && (
              <span className="material-symbols-outlined text-secondary">
                expand_more
              </span>
            )}
          </button>

          {progPopoverOpen && selectedDepts.length > 0 && !isExclusiveProg && (
            <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                  search
                </span>
                <input
                  type="text"
                  value={progSearch}
                  onChange={(e) => setProgSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                  placeholder="Search programs..."
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const allFilteredProgs = selectedDepts.includes("All Departments")
                      ? ["All Programs", ...Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()))]
                      : ["All Programs", ...selectedDepts.flatMap((d) => DEPT_PROGRAMS[d] || [])];
                    setSelectedProgs(allFilteredProgs);
                  }}
                  className="hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProgs([])}
                  className="hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                {Array.from(
                  new Set(
                    selectedDepts.includes("All Departments")
                      ? ["All Programs", ...Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()))]
                      : ["All Programs", ...selectedDepts.flatMap((d) => DEPT_PROGRAMS[d] || [])]
                  )
                )
                  .filter((p) =>
                    p.toLowerCase().includes(progSearch.toLowerCase())
                  )
                  .map((prog) => (
                    <label
                      key={prog}
                      className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProgs.includes(prog)}
                        onChange={() => toggleProg(prog)}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                      />
                      <span>{prog}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Year Level Dropdown */}
        <div className="space-y-2 relative" ref={yearRef}>
          <label className="font-label-sm text-xs font-semibold text-secondary block">
            Year Level
          </label>
          <button
            type="button"
            onClick={() => {
              setYearPopoverOpen(!yearPopoverOpen);
              setDeptPopoverOpen(false);
              setProgPopoverOpen(false);
            }}
            className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <span className="truncate">
              {selectedYears.length === 0
                ? "Select Year Level"
                : selectedYears.length === 1
                  ? selectedYears[0]
                  : `${selectedYears.length} Year Levels selected`}
            </span>
            <span className="material-symbols-outlined text-secondary">
              expand_more
            </span>
          </button>

          {yearPopoverOpen && (
            <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">
                  search
                </span>
                <input
                  type="text"
                  value={yearSearch}
                  onChange={(e) => setYearSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 bg-surface-container-low/50 border border-outline-variant rounded-md text-xs outline-none focus:border-primary"
                  placeholder="Search years..."
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-bold text-primary border-b border-outline-variant/30 pb-1.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedYears(["All Year Levels", ...YEAR_LEVELS])}
                  className="hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedYears([])}
                  className="hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[160px]">
                {["All Year Levels", ...YEAR_LEVELS]
                  .filter((y) =>
                    y.toLowerCase().includes(yearSearch.toLowerCase())
                  )
                  .map((year) => (
                    <label
                      key={year}
                      className="flex items-center gap-2 text-xs text-on-surface cursor-pointer py-1 px-1.5 hover:bg-surface-container rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => toggleYear(year)}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                      />
                      <span>{year}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grouped, Labeled Tag Display */}
      {(selectedDepts.length > 0 || selectedProgs.length > 0 || selectedYears.length > 0) && (
        <div className="space-y-3 pt-2 bg-surface rounded-xl border border-outline-variant/50 p-4">
          {/* Department Tags */}
          {selectedDepts.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2 items-start">
              <span className="text-xs font-semibold text-secondary min-w-[90px] pt-1">
                Departments:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(expandDepts ? selectedDepts : selectedDepts.slice(0, 4)).map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-container/10 text-primary border border-primary-container/30 rounded-full font-label-sm text-xs font-medium"
                  >
                    {dept}
                    {!isExclusiveDept && (
                      <button
                        type="button"
                        onClick={() => toggleDept(dept)}
                        className="material-symbols-outlined text-sm hover:bg-primary-container/20 rounded-full leading-none p-0.5"
                      >
                        close
                      </button>
                    )}
                  </span>
                ))}
                {selectedDepts.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setExpandDepts(!expandDepts)}
                    className="inline-flex items-center px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full font-label-sm text-xs font-bold hover:bg-secondary/20"
                  >
                    {expandDepts ? "Show less" : `+${selectedDepts.length - 4} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Program Tags */}
          {selectedProgs.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2 items-start">
              <span className="text-xs font-semibold text-secondary min-w-[90px] pt-1">
                Programs:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(expandProgs ? selectedProgs : selectedProgs.slice(0, 4)).map((prog) => (
                  <span
                    key={prog}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-container/10 text-primary border border-primary-container/30 rounded-full font-label-sm text-xs font-medium"
                  >
                    {prog}
                    {!isExclusiveProg && (
                      <button
                        type="button"
                        onClick={() => toggleProg(prog)}
                        className="material-symbols-outlined text-sm hover:bg-primary-container/20 rounded-full leading-none p-0.5"
                      >
                        close
                      </button>
                    )}
                  </span>
                ))}
                {selectedProgs.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setExpandProgs(!expandProgs)}
                    className="inline-flex items-center px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full font-label-sm text-xs font-bold hover:bg-secondary/20"
                  >
                    {expandProgs ? "Show less" : `+${selectedProgs.length - 4} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Year Level Tags */}
          {selectedYears.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2 items-start">
              <span className="text-xs font-semibold text-secondary min-w-[90px] pt-1">
                Year Levels:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(expandYears ? selectedYears : selectedYears.slice(0, 4)).map((year) => (
                  <span
                    key={year}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-container/10 text-primary border border-primary-container/30 rounded-full font-label-sm text-xs font-medium"
                  >
                    {year}
                    <button
                      type="button"
                      onClick={() => toggleYear(year)}
                      className="material-symbols-outlined text-sm hover:bg-primary-container/20 rounded-full leading-none p-0.5"
                    >
                      close
                    </button>
                  </span>
                ))}
                {selectedYears.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setExpandYears(!expandYears)}
                    className="inline-flex items-center px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full font-label-sm text-xs font-bold hover:bg-secondary/20"
                  >
                    {expandYears ? "Show less" : `+${selectedYears.length - 4} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
