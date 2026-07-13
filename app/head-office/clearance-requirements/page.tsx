"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Requirement {
  id: string;
  name: string;
  description: string;
  linkName?: string;
  linkUrl?: string;
  addedDate: string;
  status: "Live" | "Draft";
  appliesTo: string[];
}

const INITIAL_REQUIREMENTS: Requirement[] = [
  {
    id: "req-1",
    name: "Library Book Return",
    description: "Ensure all borrowed items are returned to the central library.",
    linkName: "Evaluation Form",
    linkUrl: "https://forms.google.com/example-library",
    addedDate: "Oct 24, 2023",
    status: "Live",
    appliesTo: ["All Departments", "All Programs", "All Year Levels"],
  },
  {
    id: "req-2",
    name: "Tuition Fee Settlement",
    description: "Clear all outstanding balances with the accounting office.",
    linkName: "Fee Details Link",
    linkUrl: "https://accounting.uni.edu.ph",
    addedDate: "Oct 22, 2023",
    status: "Live",
    appliesTo: ["CABE", "BS Business Administration"],
  },
  {
    id: "req-3",
    name: "Exit Interview",
    description: "Optional feedback session with guidance counselor.",
    addedDate: "Oct 20, 2023",
    status: "Draft",
    appliesTo: ["4th Year"],
  },
];

const DEPARTMENTS = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];

const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

function ExpandableAppliesTo({ appliesTo }: { appliesTo: string[] }) {
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

export default function ClearanceRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>(INITIAL_REQUIREMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [reqName, setReqName] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // New Applies To States
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedProgs, setSelectedProgs] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        const modalBody = document.getElementById("modal-body-scroll");
        if (modalBody) {
          modalBody.scrollTop = 0;
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setEditingReqId(null);
    setReqName("");
    setReqDescription("");
    setLinkName("");
    setLinkUrl("");
    setSelectedDepts([]);
    setSelectedProgs([]);
    setSelectedYears([]);
    setDeptPopoverOpen(false);
    setProgPopoverOpen(false);
    setYearPopoverOpen(false);
    setDeptSearch("");
    setProgSearch("");
    setYearSearch("");
    setExpandDepts(false);
    setExpandProgs(false);
    setExpandYears(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingReqId(null);
    setIsModalOpen(false);
  };

  const handleEditRequirement = (req: Requirement) => {
    setEditingReqId(req.id);
    setReqName(req.name);
    setReqDescription(req.description);
    setLinkName(req.linkName || "");
    setLinkUrl(req.linkUrl || "");

    const depts: string[] = [];
    const progs: string[] = [];
    const years: string[] = [];

    const ALL_PROGRAMS = Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));

    req.appliesTo.forEach((item) => {
      if (item === "All Departments" || DEPARTMENTS.includes(item)) {
        depts.push(item);
      } else if (item === "All Programs" || ALL_PROGRAMS.includes(item)) {
        progs.push(item);
      } else if (item === "All Year Levels" || YEAR_LEVELS.includes(item)) {
        years.push(item);
      }
    });

    setSelectedDepts(depts);
    setSelectedProgs(progs);
    setSelectedYears(years);

    setDeptPopoverOpen(false);
    setProgPopoverOpen(false);
    setYearPopoverOpen(false);
    setDeptSearch("");
    setProgSearch("");
    setYearSearch("");
    setExpandDepts(false);
    setExpandProgs(false);
    setExpandYears(false);
    setIsModalOpen(true);
  };

  // Helper toggle functions
  const toggleDept = (dept: string) => {
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
          // Remove dependent programs
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
    if (selectedDepts.includes("All Departments")) {
      return Array.from(new Set(Object.values(DEPT_PROGRAMS).flat()));
    }
    return selectedDepts.flatMap((d) => DEPT_PROGRAMS[d] || []);
  };

  const toggleProg = (prog: string) => {
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

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim()) return;

    // Combine all selected criteria
    const appliesTo: string[] = [];
    if (selectedDepts.length > 0) appliesTo.push(...selectedDepts);
    if (selectedProgs.length > 0) appliesTo.push(...selectedProgs);
    if (selectedYears.length > 0) appliesTo.push(...selectedYears);

    if (editingReqId) {
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === editingReqId
            ? {
              ...r,
              name: reqName,
              description: reqDescription,
              linkName: linkName ? linkName : undefined,
              linkUrl: linkUrl ? linkUrl : undefined,
              appliesTo: appliesTo.length > 0 ? appliesTo : ["All Students"],
            }
            : r
        )
      );
      setEditingReqId(null);
    } else {
      const newReq: Requirement = {
        id: `req-${Date.now()}`,
        name: reqName,
        description: reqDescription,
        linkName: linkName ? linkName : undefined,
        linkUrl: linkUrl ? linkUrl : undefined,
        addedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "Draft",
        appliesTo: appliesTo.length > 0 ? appliesTo : ["All Students"],
      };
      setRequirements((prev) => [newReq, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Live" ? "Draft" : "Live" } : r
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Clearance Requirements
          </h2>
          <p className="font-body-md text-secondary mt-1">
            Configure your office's clearance criteria
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-brand-red text-white px-5 py-2 rounded font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2 btn-hover self-start md:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Requirement
        </button>
      </div>

      {/* Content Panel */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-low border-b border-outline-variant font-label-sm text-xs font-semibold text-secondary uppercase tracking-wider">
          <div className="col-span-5">Requirement</div>
          <div className="col-span-2 text-center">Link</div>
          <div className="col-span-2 text-center">Added</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-outline-variant/30">
          {requirements.length === 0 ? (
            <div className="px-6 py-8 text-center text-secondary font-medium">
              No clearance requirements configured yet. Click "Add Requirement" to create one.
            </div>
          ) : (
            requirements.map((req) => (
              <div
                key={req.id}
                className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-surface-bright/50 transition-colors group"
              >
                {/* Name & Description */}
                <div className="flex flex-col gap-0.5 col-span-5">
                  <span className="font-body-md text-base font-bold text-on-surface">
                    {req.name}
                  </span>
                  <span className="font-body-sm text-sm text-secondary">
                    {req.description}
                  </span>
                  {req.appliesTo && req.appliesTo.length > 0 && (
                    <ExpandableAppliesTo appliesTo={req.appliesTo} />
                  )}
                </div>

                {/* View/Add Link */}
                <div className="col-span-2 flex justify-center items-center">
                  {req.linkUrl ? (
                    <a
                      href={req.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-label-md text-sm font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                      {req.linkName || "View Link"}
                    </a>
                  ) : (
                    <button className="text-secondary hover:text-primary font-label-md text-sm font-semibold flex items-center gap-1 italic">
                      <span className="material-symbols-outlined text-lg">add_link</span>
                      Add link
                    </button>
                  )}
                </div>

                {/* Added Date */}
                <div className="col-span-2 flex justify-center items-center font-body-sm text-sm text-secondary">
                  {req.addedDate}
                </div>

                {/* Status Toggle */}
                <div className="col-span-2 flex justify-center items-center">
                  {req.status === "Live" ? (
                    <button
                      onClick={() => handleToggleStatus(req.id)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors"
                      title="Click to switch to Draft"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(req.id)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container-high text-secondary border border-outline-variant rounded-full hover:bg-surface-variant transition-colors"
                      title="Click to publish Live"
                    >
                      <span className="material-symbols-outlined text-base">visibility_off</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Draft</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditRequirement(req)}
                      className="text-secondary hover:text-primary transition-colors p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      className="text-secondary hover:text-primary transition-colors p-1 text-error hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Requirement Modal */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          {/* Modal Content Container */}
          <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl shadow-2xl w-full max-w-2xl p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-title-md text-title-md text-on-surface">
                {editingReqId ? "Edit Requirement" : "Add Requirement"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded text-secondary hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div id="modal-body-scroll" className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
              <form onSubmit={handleSaveRequirement} className="space-y-6">
                {/* Requirement Name */}
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                    Requirement Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                    placeholder="E.g., Library Book Return"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none resize-none"
                    placeholder="Add details or instructions for this requirement"
                    rows={3}
                  ></textarea>
                </div>

                {/* Applies To Section */}
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
                        onClick={() => {
                          setDeptPopoverOpen(!deptPopoverOpen);
                          setProgPopoverOpen(false);
                          setYearPopoverOpen(false);
                        }}
                        className="w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-sm text-left text-on-surface flex items-center justify-between shadow-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <span className="truncate">
                          {selectedDepts.length === 0
                            ? "Select Department"
                            : selectedDepts.length === 1
                              ? selectedDepts[0]
                              : `${selectedDepts.length} Departments selected`}
                        </span>
                        <span className="material-symbols-outlined text-secondary">
                          expand_more
                        </span>
                      </button>

                      {deptPopoverOpen && (
                        <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
                          {/* Search Input */}
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

                          {/* Bulk Actions */}
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
                                setSelectedProgs([]); // clear programs since they depend on departments
                              }}
                              className="hover:underline"
                            >
                              Clear All
                            </button>
                          </div>

                          {/* Checklist Options */}
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
                        disabled={selectedDepts.length === 0}
                        onClick={() => {
                          setProgPopoverOpen(!progPopoverOpen);
                          setDeptPopoverOpen(false);
                          setYearPopoverOpen(false);
                        }}
                        className={`w-full h-10 px-3 pr-8 rounded-lg border border-outline-variant font-body-sm text-sm text-left flex items-center justify-between shadow-sm focus:border-primary focus:ring-1 focus:ring-primary ${selectedDepts.length === 0
                            ? "bg-surface-container/30 text-secondary/50 cursor-not-allowed opacity-60"
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
                        <span className="material-symbols-outlined text-secondary">
                          expand_more
                        </span>
                      </button>

                      {progPopoverOpen && selectedDepts.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg z-20 rounded-lg p-3 mt-1 flex flex-col gap-2.5 max-h-[300px] overflow-hidden">
                          {/* Search Input */}
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

                          {/* Bulk Actions */}
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

                          {/* Checklist Options */}
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
                          {/* Search Input */}
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

                          {/* Bulk Actions */}
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

                          {/* Checklist Options */}
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
                                <button
                                  type="button"
                                  onClick={() => toggleDept(dept)}
                                  className="material-symbols-outlined text-sm hover:bg-primary-container/20 rounded-full leading-none p-0.5"
                                >
                                  close
                                </button>
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
                                <button
                                  type="button"
                                  onClick={() => toggleProg(prog)}
                                  className="material-symbols-outlined text-sm hover:bg-primary-container/20 rounded-full leading-none p-0.5"
                                >
                                  close
                                </button>
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

                {/* Attach Forms/Links */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-label-md text-sm font-bold text-on-surface uppercase tracking-wider">
                      Attach Form/Link
                    </h3>
                  </div>
                  <div className="border border-outline-variant rounded-xl bg-surface p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 w-full">
                        <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                          Link Name
                        </label>
                        <input
                          type="text"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                          placeholder="E.g., Evaluation Form"
                        />
                      </div>
                      <div className="flex-[2] w-full">
                        <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-primary outline-none"
                          placeholder="E.g., https://forms.google.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSaveRequirement}
                className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md btn-hover shadow-sm"
              >
                {editingReqId ? "Update Requirement" : "Save Requirement"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
