"use client";

import { useState } from "react";

const DEPARTMENTS = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];

const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

interface ExpandableAppliesToProps {
  appliesTo: string[];
}

export function ExpandableAppliesTo({ appliesTo }: ExpandableAppliesToProps) {
  const [expandDept, setExpandDept] = useState(false);
  const [expandProg, setExpandProg] = useState(false);
  const [expandYear, setExpandYear] = useState(false);

  const depts = appliesTo.filter((item) => item === "All Departments" || DEPARTMENTS.includes(item));
  const allProgs = Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
  const progs = appliesTo.filter((item) => item === "All Programs" || allProgs.includes(item));
  const years = appliesTo.filter((item) => item === "All Year Levels" || YEAR_LEVELS.includes(item));

  const renderGroup = (
    label: string,
    items: string[],
    isExpanded: boolean,
    setExpanded: (v: boolean) => void,
    limit = 3
  ) => {
    if (items.length === 0) return null;
    const visibleItems = isExpanded ? items : items.slice(0, limit);
    const hasMore = items.length > limit;

    return (
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start py-0.5">
        <span className="text-[10px] font-bold text-secondary min-w-[85px] select-none pt-0.5 uppercase tracking-wider">
          {label}:
        </span>
        <div className="flex flex-wrap gap-1 flex-1">
          {visibleItems.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-[10px] font-semibold text-secondary border border-outline-variant/30"
            >
              {item}
            </span>
          ))}
          {hasMore && !isExpanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center px-1.5 py-0.5 bg-primary-container/10 text-primary border border-primary-container/20 rounded font-bold text-[10px] hover:bg-primary-container/20 transition-all cursor-pointer"
            >
              +{items.length - limit} more
            </button>
          )}
          {isExpanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center px-1.5 py-0.5 bg-outline-variant/10 text-secondary border border-outline-variant/20 rounded font-bold text-[10px] hover:bg-outline-variant/20 transition-all cursor-pointer"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1.5 mt-2 p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/30 max-w-xl">
      {renderGroup("Departments", depts, expandDept, setExpandDept)}
      {renderGroup("Programs", progs, expandProg, setExpandProg)}
      {renderGroup("Year Levels", years, expandYear, setExpandYear)}
    </div>
  );
}
