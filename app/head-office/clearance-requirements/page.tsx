"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AppliesToSelector } from "@/components/ui/AppliesToSelector";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { defaultOfficeRequirements } from "@/mock/mockData";

interface Requirement {
  id: string;
  name: string;
  description: string;
  linkName?: string;
  linkUrl?: string;
  addedDate: string;
  status: "Live" | "Draft";
  appliesTo: string[];
  deadline?: string;
  requiresUpload?: boolean;
}

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
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form State
  const [reqName, setReqName] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requiresUpload, setRequiresUpload] = useState(false);

  // New Applies To States
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedProgs, setSelectedProgs] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const storedOfficeId = localStorage.getItem("officeId");
    if (storedOfficeId) {
      const oid = parseInt(storedOfficeId, 10);
      setOfficeId(oid);
      
      const storedOfficeReqs = localStorage.getItem("officeRequirements");
      const allReqs = storedOfficeReqs ? JSON.parse(storedOfficeReqs) : defaultOfficeRequirements;
      setRequirements(allReqs[oid] || []);
    }
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
    setDeadline("");
    setRequiresUpload(false);
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
    setRequiresUpload(req.requiresUpload || false);

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
    setDeadline(req.deadline || "");

    setIsModalOpen(true);
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim()) return;
    setShowConfirm(true);
  };

  const saveToLocalStorage = (updatedReqs: Requirement[]) => {
    if (officeId) {
      const storedOfficeReqs = localStorage.getItem("officeRequirements");
      const allReqs = storedOfficeReqs ? JSON.parse(storedOfficeReqs) : defaultOfficeRequirements;
      allReqs[officeId] = updatedReqs;
      localStorage.setItem("officeRequirements", JSON.stringify(allReqs));
    }
  };

  const executeSaveRequirement = () => {
    // Combine all selected criteria
    const appliesTo: string[] = [];
    if (selectedDepts.length > 0) appliesTo.push(...selectedDepts);
    if (selectedProgs.length > 0) appliesTo.push(...selectedProgs);
    if (selectedYears.length > 0) appliesTo.push(...selectedYears);

    if (editingReqId) {
      setRequirements((prev) => {
        const updated = prev.map((r) =>
          r.id === editingReqId
            ? {
              ...r,
              name: reqName,
              description: reqDescription,
              linkName: linkName ? linkName : undefined,
              linkUrl: linkUrl ? linkUrl : undefined,
              appliesTo: appliesTo.length > 0 ? appliesTo : ["All Students"],
              deadline: deadline ? deadline : undefined,
              requiresUpload,
            }
            : r
        );
        saveToLocalStorage(updated);
        return updated;
      });
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
        deadline: deadline ? deadline : undefined,
        requiresUpload,
      };
      setRequirements((prev) => {
        const updated = [newReq, ...prev];
        saveToLocalStorage(updated);
        return updated;
      });
    }
    setIsModalOpen(false);
    setShowConfirm(false);
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToLocalStorage(updated);
      return updated;
    });
  };

  const handleToggleStatus = (id: string) => {
    setRequirements((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, status: (r.status === "Live" ? "Draft" : "Live") as "Live" | "Draft" } : r
      );
      saveToLocalStorage(updated);
      return updated;
    });
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
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 bg-surface-container-low border-b border-outline-variant font-label-sm text-xs font-semibold text-secondary uppercase tracking-wider">
          <div className="text-left">Requirement</div>
          <div className="text-center">Link</div>
          <div className="text-center">Added</div>
          <div className="text-center">Deadline</div>
          <div className="text-center">Status</div>
          <div className="text-center">Actions</div>
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
                className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-5 items-center hover:bg-surface-bright/50 transition-colors group"
              >
                {/* Name & Description */}
                <div className="flex flex-col gap-0.5">
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
                <div className="flex justify-center items-center">
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
                    <span className="text-secondary/60 font-label-md text-sm font-medium flex items-center gap-1 italic select-none">
                      <span className="material-symbols-outlined text-lg">link_off</span>
                      No link
                    </span>
                  )}
                </div>

                {/* Added Date */}
                <div className="flex justify-center items-center font-body-sm text-xs text-secondary text-center whitespace-nowrap">
                  {req.addedDate}
                </div>

                {/* Deadline */}
                <div className="flex justify-center items-center font-body-sm text-xs text-secondary text-center whitespace-nowrap">
                  {req.deadline ? (
                    <span className="text-orange-600 dark:text-orange-400 font-semibold text-center">
                      {new Date(req.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  ) : (
                    <span className="text-secondary/40 italic text-center">No deadline</span>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="flex justify-center items-center">
                  {req.status === "Live" ? (
                    <button
                      onClick={() => handleToggleStatus(req.id)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
                      title="Click to switch to Draft"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(req.id)}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container-high text-secondary border border-outline-variant rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
                      title="Click to publish Live"
                    >
                      <span className="material-symbols-outlined text-base">visibility_off</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Draft</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-center items-center">
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
                <AppliesToSelector
                  selectedDepts={selectedDepts}
                  setSelectedDepts={setSelectedDepts}
                  selectedProgs={selectedProgs}
                  setSelectedProgs={setSelectedProgs}
                  selectedYears={selectedYears}
                  setSelectedYears={setSelectedYears}
                />

                {/* Upload Toggle */}
                <div className="flex items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface">
                  <div>
                    <h3 className="font-label-md text-sm font-bold text-on-surface">
                      Requires Document Upload
                    </h3>
                    <p className="font-body-sm text-xs text-secondary mt-1">
                      Turn this on if students need to upload a file (e.g. ID, Receipt) to complete this task.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={requiresUpload}
                      onChange={(e) => setRequiresUpload(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
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

                {/* Deadline Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-label-md text-sm font-bold text-on-surface uppercase tracking-wider">
                      Deadline
                    </h3>
                  </div>
                  <div className="border border-outline-variant rounded-xl bg-surface p-4">
                    <div className="w-full">
                      <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                      />
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
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        title={editingReqId ? "Save Changes" : "Create Requirement"}
        message={
          editingReqId
            ? "Are you sure you want to update this clearance requirement? This will update it for all constituents."
            : "Are you sure you want to create this new clearance requirement?"
        }
        confirmText={editingReqId ? "Save Changes" : "Create"}
        onConfirm={executeSaveRequirement}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
