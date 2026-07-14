"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mockOrgs } from "@/mock/mockData";
import { ExpandableAppliesTo } from "@/components/ui/ExpandableAppliesTo";
import { AppliesToSelector } from "@/components/ui/AppliesToSelector";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface Requirement {
  id: string;
  orgId: number;
  name: string;
  description: string;
  linkName?: string;
  linkUrl?: string;
  addedDate: string;
  status: "Live" | "Draft";
  appliesTo: string[];
  deadline?: string;
}

const INITIAL_REQUIREMENTS: Requirement[] = [
  {
    id: "org-req-1",
    orgId: 1, // Computer Science Society (AcademicClub, CCIS, BSCS)
    name: "CSS Membership Fee Settlement",
    description: "Submit receipt of CSS membership fee payment to the treasurer.",
    addedDate: "Oct 24, 2023",
    status: "Live",
    appliesTo: ["CCIS", "BS Computer Science"],
  },
  {
    id: "org-req-2",
    orgId: 1,
    name: "General Assembly Attendance",
    description: "Attend the CSS first General Assembly or submit an excuse letter.",
    addedDate: "Oct 22, 2023",
    status: "Live",
    appliesTo: ["CCIS", "BS Computer Science"],
  },
  {
    id: "org-req-3",
    orgId: 5, // Student Government (Gov)
    name: "University Clearance Form Submission",
    description: "Submit a physical copy of the consolidated clearance form.",
    addedDate: "Oct 20, 2023",
    status: "Draft",
    appliesTo: ["All Departments", "All Programs", "All Year Levels"],
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

export default function OrgClearanceRequirementsPage() {
  const [org, setOrg] = useState<any>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
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

  // Applies To States
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedProgs, setSelectedProgs] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);

    const orgId = localStorage.getItem("orgId");
    if (orgId) {
      const currentOrg = mockOrgs.find((o) => o.id === parseInt(orgId));
      if (currentOrg) {
        setOrg(currentOrg);
        // Filter requirements for this org
        const list = INITIAL_REQUIREMENTS.filter((r) => r.orgId === currentOrg.id);
        setRequirements(list);
      }
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

  // Exclusive/Inclusive Targeting logic
  const isExclusiveDept = org && (org.type === "LGU" || org.type === "AcademicClub");
  const isExclusiveProg = org && org.type === "AcademicClub";

  const handleOpenModal = () => {
    setEditingReqId(null);
    setReqName("");
    setReqDescription("");
    setLinkName("");
    setLinkUrl("");

    // Initialize locked values for exclusive orgs
    if (isExclusiveDept && org.department) {
      setSelectedDepts([org.department]);
    } else {
      setSelectedDepts([]);
    }

    if (isExclusiveProg && org.program) {
      setSelectedProgs([org.program]);
    } else {
      setSelectedProgs([]);
    }

    setSelectedYears([]);
    setDeadline("");
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
    setDeadline(req.deadline || "");

    setIsModalOpen(true);
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !org) return;
    setShowConfirm(true);
  };

  const executeSaveRequirement = () => {
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
                deadline: deadline ? deadline : undefined,
              }
            : r
        )
      );
      setEditingReqId(null);
    } else {
      const newReq: Requirement = {
        id: `org-req-${Date.now()}`,
        orgId: org.id,
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
      };
      setRequirements((prev) => [newReq, ...prev]);
    }
    setIsModalOpen(false);
    setShowConfirm(false);
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
            Configure and manage requirements for your organization
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

            {/* Modal Body */}
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
                    placeholder="E.g., CSS Membership Fee Settlement"
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
                  isExclusiveDept={isExclusiveDept}
                  isExclusiveProg={isExclusiveProg}
                />

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

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-container-high">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 border border-outline-variant text-secondary rounded-lg font-label-md hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-red text-white rounded-lg font-label-md shadow-sm hover:bg-primary transition-colors"
                  >
                    {editingReqId ? "Save Changes" : "Create Requirement"}
                  </button>
                </div>
              </form>
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
