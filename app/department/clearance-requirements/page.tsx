"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AppliesToSelector } from "@/components/ui/AppliesToSelector";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import * as clearanceService from "@/services/clearanceService";
import { DEPARTMENTS, DEPT_PROGRAMS, YEAR_LEVELS } from "@/lib/constants";

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
  type?: string;
  surveyQuestions?: any;
  acknowledgmentText?: string;
}

// DEPARTMENTS, DEPT_PROGRAMS, YEAR_LEVELS are imported from @/lib/constants

import { ExpandableAppliesTo } from "@/components/ui/ExpandableAppliesTo";

export default function ClearanceRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [reqName, setReqName] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requiresUpload, setRequiresUpload] = useState(false);
  const [reqType, setReqType] = useState<string>("MANUAL");
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [acknowledgmentText, setAcknowledgmentText] = useState<string>("");

  // New Applies To States
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedProgs, setSelectedProgs] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);

    const fetchDept = async () => {
      const storedDepartmentId = localStorage.getItem("departmentId");
      if (storedDepartmentId) {
        const oid = parseInt(storedDepartmentId, 10);
        setDepartmentId(oid);

        const currentDept = await clearanceService.getDepartmentById(oid);
        if (currentDept) setActiveDepartment(currentDept);

        // DATABASE SWAP POINT: replace with DB query via clearanceService
        clearanceService.getDepartmentRequirements(oid).then(setRequirements);
      }
    };
    fetchDept();
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
    setSelectedDepts(activeDepartment ? [activeDepartment.abbreviation] : []);
    setSelectedProgs([]);
    setSelectedYears([]);
    setDeadline("");
    setRequiresUpload(false);
    setReqType("MANUAL");
    setSurveyQuestions([]);
    setAcknowledgmentText("");
    setShowNameError(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingReqId(null);
    setShowNameError(false);
    setIsModalOpen(false);
  };

  const handleEditRequirement = (req: Requirement) => {
    setEditingReqId(req.id);
    setReqName(req.name);
    setReqDescription(req.description);
    setLinkName(req.linkName || "");
    setLinkUrl(req.linkUrl || "");
    setRequiresUpload(req.requiresUpload || false);
    setReqType(req.type || "MANUAL");
    setSurveyQuestions(
      req.surveyQuestions 
        ? (typeof req.surveyQuestions === "string" ? JSON.parse(req.surveyQuestions) : req.surveyQuestions)
        : []
    );
    setAcknowledgmentText(req.acknowledgmentText || "");

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

    setSelectedDepts(activeDepartment ? [activeDepartment.abbreviation] : depts);
    setSelectedProgs(progs);
    setSelectedYears(years);
    setDeadline(req.deadline || "");

    setIsModalOpen(true);
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim()) {
      setShowNameError(true);
      nameInputRef.current?.focus();
      const modalBody = document.getElementById("modal-body-scroll");
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
      return;
    }
    setShowNameError(false);
    setShowConfirm(true);
  };

  const saveRequirements = (updatedReqs: Requirement[]) => {
    if (departmentId) {
      // DATABASE SWAP POINT: clearanceService.saveDepartmentRequirements wraps the localStorage write.
      clearanceService.saveDepartmentRequirements(departmentId, updatedReqs);
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
              requiresUpload: reqType === "DOCUMENT_UPLOAD" || reqType === "PAYMENT_PROOF",
              type: reqType,
              surveyQuestions: reqType === "SURVEY" ? surveyQuestions : undefined,
              acknowledgmentText: reqType === "ACKNOWLEDGMENT" ? acknowledgmentText : undefined,
            }
            : r
        );
        saveRequirements(updated);
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
        requiresUpload: reqType === "DOCUMENT_UPLOAD" || reqType === "PAYMENT_PROOF",
        type: reqType,
        surveyQuestions: reqType === "SURVEY" ? surveyQuestions : undefined,
        acknowledgmentText: reqType === "ACKNOWLEDGMENT" ? acknowledgmentText : undefined,
      };
      setRequirements((prev) => {
        const updated = [newReq, ...prev];
        saveRequirements(updated);
        return updated;
      });
    }
    setIsModalOpen(false);
    setShowConfirm(false);
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRequirements(updated);
      return updated;
    });
  };

  const handleToggleStatus = (id: string) => {
    setRequirements((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, status: (r.status === "Live" ? "Draft" : "Live") as "Live" | "Draft" } : r
      );
      saveRequirements(updated);
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
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Department: <span className="font-semibold text-on-surface">{activeDepartment ? activeDepartment.name : "Loading..."}</span>
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
                  {req.description && (
                    <span className="font-body-sm text-sm text-secondary">
                      {req.description}
                    </span>
                  )}
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
                <div className="relative">
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                    Requirement Name <span className="text-error">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    value={reqName}
                    onChange={(e) => {
                      setReqName(e.target.value);
                      if (e.target.value.trim()) setShowNameError(false);
                    }}
                    className={`custom-ring w-full px-4 py-2.5 rounded-lg border bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none ${
                      showNameError ? "border-brand-red ring-1 ring-brand-red" : "border-surface-container-high"
                    }`}
                    placeholder="E.g., Library Book Return"
                  />
                  {showNameError && (
                    <div className="absolute left-8 top-[calc(100%+8px)] z-50 bg-white border border-outline-variant/60 rounded shadow-md px-3 py-2 flex items-center gap-2 text-xs font-semibold text-[#1F2937] animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="absolute top-[-6px] left-4 w-2.5 h-2.5 bg-white border-t border-l border-outline-variant/60 rotate-45" />
                      <div className="w-5 h-5 flex items-center justify-center bg-[#EA580C] text-white font-bold text-sm rounded">!</div>
                      <span>Please fill out this field.</span>
                    </div>
                  )}
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
                  isExclusiveDept={true}
                />

                {/* Requirement Type Selector */}
                <div className="space-y-2">
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                  >
                    <option value="MANUAL">Manual Clearance (Checkbox toggled by Admin)</option>
                    <option value="DOCUMENT_UPLOAD">Document Upload (Student uploads files)</option>
                    <option value="PAYMENT_PROOF">Payment Proof (Student uploads file + OR Number)</option>
                    <option value="SURVEY">Survey (Student fills questionnaire)</option>
                    <option value="ACKNOWLEDGMENT">Acknowledgment (Student checks box after reading text)</option>
                  </select>
                </div>

                {/* SURVEY Question Builder */}
                {reqType === "SURVEY" && (
                  <div className="border border-outline-variant rounded-xl bg-surface p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-label-md text-sm font-bold text-on-surface">Survey Questions</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSurveyQuestions(prev => [
                            ...prev,
                            { id: `q-${Date.now()}`, label: "", questionType: "text", options: [] }
                          ]);
                        }}
                        className="px-3 py-1 bg-primary text-white font-label-md text-xs rounded hover:bg-primary-dark transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">add</span> Add Question
                      </button>
                    </div>

                    {surveyQuestions.length === 0 ? (
                      <p className="font-body-sm text-xs text-secondary italic">No questions added yet. Click "Add Question" to start building your survey.</p>
                    ) : (
                      <div className="space-y-4">
                        {surveyQuestions.map((q, qIdx) => (
                          <div key={q.id} className="border border-surface-container-high rounded-lg p-3 space-y-3 relative bg-surface-container-lowest">
                            <button
                              type="button"
                              onClick={() => {
                                setSurveyQuestions(prev => prev.filter(item => item.id !== q.id));
                              }}
                              className="absolute top-2 right-2 p-1 rounded text-error hover:bg-error/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                              <div>
                                <label className="block font-label-md text-[11px] text-secondary mb-1">Question Label/Text</label>
                                <input
                                  type="text"
                                  required
                                  value={q.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSurveyQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, label: val } : item));
                                  }}
                                  placeholder="e.g. Do you have any pending library fines?"
                                  className="custom-ring w-full px-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest font-body-sm text-xs text-on-surface outline-none"
                                />
                              </div>
                              <div>
                                <label className="block font-label-md text-[11px] text-secondary mb-1">Question Type</label>
                                <select
                                  value={q.questionType}
                                  onChange={(e) => {
                                    const val = e.target.value as "text" | "multiple_choice";
                                    setSurveyQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, questionType: val } : item));
                                  }}
                                  className="custom-ring w-full px-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest font-body-sm text-xs text-on-surface outline-none"
                                >
                                  <option value="text">Text Response</option>
                                  <option value="multiple_choice">Multiple Choice</option>
                                </select>
                              </div>
                            </div>

                            {q.questionType === "multiple_choice" && (
                              <div className="pl-2 border-l-2 border-primary/20 space-y-2">
                                <label className="block font-label-md text-[11px] text-secondary">
                                  Choices / Options (comma-separated list)
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Yes, No, Maybe"
                                  value={(q.options || []).join(", ")}
                                  onChange={(e) => {
                                    const opts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                    setSurveyQuestions(prev => prev.map((item, idx) => idx === qIdx ? { ...item, options: opts } : item));
                                  }}
                                  className="custom-ring w-full px-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest font-body-sm text-xs text-on-surface outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ACKNOWLEDGMENT text area */}
                {reqType === "ACKNOWLEDGMENT" && (
                  <div className="space-y-2">
                    <label className="block font-body-sm text-body-sm text-on-surface mb-1">
                      Acknowledgment Statement
                    </label>
                    <textarea
                      required
                      value={acknowledgmentText}
                      onChange={(e) => setAcknowledgmentText(e.target.value)}
                      rows={4}
                      className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none resize-none"
                      placeholder="e.g. I hereby acknowledge that all information provided is accurate and that I have cleared all my departmental liabilities."
                    ></textarea>
                  </div>
                )}

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
