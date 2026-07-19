"use client";

import { useState, useEffect, useRef } from "react";
import { mockRequirements, mockStudentClearanceRecords, mockOrgs, mockOrgMembers, defaultOfficeRequirements, defaultOrgRequirements, mockDepartments, defaultDepartmentRequirements } from "@/mock/mockData";
import { Check, ChevronDown, ChevronUp, UploadCloud, FileText, X } from "lucide-react";
import * as clearanceService from "@/services/clearanceService";

interface ClearanceItem {
  id: number;
  name: string;
  responsible: string;
  type: "office" | "org" | "department";
  status: "Cleared" | "Pending" | "Rejected" | "Submitted";
  dateCleared?: string | null;
  remarks?: string;
  uploadedFiles?: Record<number, string>;
  completedTasks?: number[];
  tasks?: any[];
}

const itemStatusStyles = {
  Cleared: {
    dot: "bg-green-500 text-white border-2 border-green-500",
    badge: "bg-green-50 text-green-700",
    line: "bg-green-400",
    label: "Cleared",
  },
  Submitted: {
    dot: "bg-blue-500 text-white border-2 border-blue-500",
    badge: "bg-blue-50 text-blue-700",
    line: "bg-blue-400",
    label: "Under Review",
  },
  Pending: {
    dot: "bg-white text-gray-300 border-2 border-gray-300",
    badge: "bg-gray-50 text-gray-500",
    line: "bg-gray-200",
    label: "Pending",
  },
  Rejected: {
    dot: "bg-red-500 text-white border-2 border-red-500",
    badge: "bg-red-50 text-red-700",
    line: "bg-red-400",
    label: "Action Required",
  },
};

/** Safely parse uploadedFileUrls — Prisma Json can return either an array or a JSON string from MySQL */
function parseFileUrls(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function ClearanceItemRow({
  item,
  isLast,
  isSysAdminView,
  studentId,
  onStatusChange,
  tasks = []
}: {
  item: ClearanceItem;
  isLast: boolean;
  isSysAdminView: boolean;
  studentId: string;
  onStatusChange: (status: ClearanceItem["status"], data?: any) => void;
  tasks?: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const styles = itemStatusStyles[item.status] || itemStatusStyles.Pending;

  // Track completed tasks locally for MANUAL tasks
  const [completedTasks, setCompletedTasks] = useState<number[]>(item.completedTasks || []);
  
  // Local submission states
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [surveyForms, setSurveyForms] = useState<Record<string, Record<string, string>>>({});
  const [acknowledgedFlags, setAcknowledgedFlags] = useState<Record<string, boolean>>({});
  // Track which task IDs the student has just submitted — used for optimistic UI before re-fetch
  const [locallySubmittedIds, setLocallySubmittedIds] = useState<Set<string>>(new Set());

  const isFullyComplete = item.status === "Cleared" || item.status === "Submitted";

  useEffect(() => {
    // Auto-fill all checkboxes only when the OFFICE has fully cleared this item.
    // Do NOT auto-fill for "Submitted" (Under Review) — the student is still waiting
    // for the office to confirm, so MANUAL tasks should stay in their actual state.
    if (item.status === "Cleared" && completedTasks.length !== tasks.length) {
      setCompletedTasks(tasks.map((_, idx) => idx));
    }
  }, [item.status, tasks.length]);

  const handleToggleTask = (idx: number, task: any) => {
    // Only block if item is already fully processed — not by admin/office view
    if (isFullyComplete) return;
    if (task.type && task.type !== "MANUAL") return;

    setCompletedTasks((prev) => {
      const isCurrentlyCompleted = prev.includes(idx);
      const newCompleted = isCurrentlyCompleted ? prev.filter((i) => i !== idx) : [...prev, idx];
      if (newCompleted.length === tasks.length && item.status !== "Cleared") {
        onStatusChange("Submitted", { completedTasks: newCompleted });
      } else if (newCompleted.length < tasks.length && item.status === "Submitted") {
        onStatusChange("Pending", { completedTasks: newCompleted });
      } else {
        onStatusChange(item.status, { completedTasks: newCompleted });
      }
      return newCompleted;
    });
  };

  // Office/evaluator-side MANUAL task toggle — persists to DB
  const handleOfficeManualToggle = async (idx: number) => {
    const willBeCompleted = !completedTasks.includes(idx);
    const newCompleted = willBeCompleted
      ? [...completedTasks, idx]
      : completedTasks.filter((i) => i !== idx);

    // Optimistic UI
    setCompletedTasks(newCompleted);

    const entityType = item.type === "office" ? "office" : item.type === "department" ? "department" : "org";

    try {
      const res = await fetch("/api/clearance-records/manual-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          entityType,
          entityId: item.id,
          taskIndex: idx,
          completed: willBeCompleted,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.allCleared) {
        onStatusChange("Cleared", { completedTasks: newCompleted });
      } else {
        onStatusChange(item.status === "Cleared" ? "Submitted" : item.status, { completedTasks: newCompleted });
      }
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
    } catch (err) {
      console.error(err);
      setCompletedTasks(completedTasks); // revert
      alert("Failed to save. Please try again.");
    }
  };


  const handleSubmitTask = async (taskId: string, type: string) => {
    setSubmittingTaskId(taskId);
    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("requirementId", taskId);
      formData.append("type", type);

      if (type === "DOCUMENT_UPLOAD" || type === "PAYMENT_PROOF") {
        const file = selectedFiles[taskId];
        if (file) {
          formData.append("files", file);
        } else {
          alert("Please select a file to upload.");
          setSubmittingTaskId(null);
          return;
        }
      }

      if (type === "PAYMENT_PROOF") {
        const ref = paymentRefs[taskId];
        if (!ref) {
          alert("Please enter a payment reference / OR number.");
          setSubmittingTaskId(null);
          return;
        }
        formData.append("paymentReference", ref);
      }

      if (type === "SURVEY") {
        const answers = surveyForms[taskId] || {};
        const formatted = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        }));
        formData.append("surveyAnswers", JSON.stringify(formatted));
      }

      if (type === "ACKNOWLEDGMENT") {
        if (!acknowledgedFlags[taskId]) {
          alert("Please confirm the acknowledgment checklist.");
          setSubmittingTaskId(null);
          return;
        }
        formData.append("acknowledged", "true");
      }

      const res = await fetch("/api/student-requirements/submit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      // Immediately flip the parent clearance card to "Under Review" without waiting for re-fetch
      onStatusChange("Submitted");

      // Mark this task as locally-submitted so the UI shows "Pending Review" right away
      setLocallySubmittedIds(prev => new Set(prev).add(taskId));

      // Clear local file/form state for this task so the input resets
      setSelectedFiles((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
      setPaymentRefs((prev) => { const n = { ...prev }; delete n[taskId]; return n; });
      setSurveyForms((prev) => { const n = { ...prev }; delete n[taskId]; return n; });

      // Trigger background re-sync to pull updated submission data
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const handleCancelSubmission = async (submissionId: string, taskId: string) => {
    if (!confirm("Cancel this submission? The file will be deleted and you can re-submit.")) return;
    try {
      const res = await fetch(`/api/submissions/${submissionId}/cancel`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to cancel submission.");
        return;
      }
      // Optimistically revert UI — remove from locally submitted
      setLocallySubmittedIds(prev => { const n = new Set(prev); n.delete(taskId); return n; });
      // Trigger background re-sync
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
    } catch (err) {
      console.error(err);
      alert("Failed to cancel. Please try again.");
    }
  };

  const handleEvaluateSubmission = async (submissionId: string, status: "approved" | "rejected") => {
    let notes = "";
    if (status === "rejected") {
      notes = prompt("Please provide a remark/notes for rejection:") || "";
      if (!notes.trim()) {
        alert("Rejection reason is required.");
        return;
      }
    }

    try {
      const res = await fetch(`/api/submissions/${submissionId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewedBy: localStorage.getItem("displayName") || "Office Evaluator",
          reviewNotes: notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Evaluation failed");
      }

      // Trigger re-sync
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Please try again.");
    }
  };

  return (
    <div className="flex gap-3">
      {/* Node + connecting line */}
      <div className="flex flex-col items-center mt-1">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${styles.dot}`}
        >
          {isFullyComplete && <Check size={12} strokeWidth={4} />}
          {!isFullyComplete && item.status === "Rejected" && <X size={12} strokeWidth={4} />}
          {!isFullyComplete && item.status !== "Rejected" && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${styles.line}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="rounded-xl px-3 py-2 -mt-2 border border-surface-container-low hover:border-surface-container-high hover:bg-surface-container-low/50 transition-all duration-150">
          <div 
            onClick={() => setExpanded(!expanded)}
            className="flex items-start justify-between cursor-pointer"
          >
            <div className="min-w-0">
              <span className="text-[15px] font-semibold text-on-surface block leading-tight">{item.name}</span>
              <span className="text-[12px] text-secondary mt-0.5 block">{item.responsible}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap uppercase tracking-wider ${styles.badge}`}>
                {styles.label}
              </span>
              <button className="p-1 hover:bg-surface-container-high rounded-full transition-colors">
                {expanded ? (
                  <ChevronUp size={18} className="text-secondary" />
                ) : (
                  <ChevronDown size={18} className="text-secondary" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Drawer content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-surface-container-high space-y-4 animate-fadeIn">
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Requirements Checklist</span>
                
                {tasks.length === 0 ? (
                  <p className="text-xs text-secondary italic">No requirements configured for this office.</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, idx) => {
                      const sub = task.submission;
                      const subStatus = sub?.status;
                      // Use local optimistic state first — shows "Pending Review" immediately after submit
                      const isLocallySubmitted = locallySubmittedIds.has(task.id);
                      const isTaskApproved = subStatus === "approved";
                      const isManualCompleted = (task.type === "MANUAL" || !task.type) && completedTasks.includes(idx);
                      const isCleared = isTaskApproved || isManualCompleted;

                      return (
                        <div key={task.id || idx} className="border border-surface-container-high rounded-xl p-4 bg-surface-container-low/30 space-y-3">
                          {/* Title and Type Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className={`text-sm font-bold block leading-tight ${isCleared ? "text-secondary line-through" : "text-on-surface"}`}>
                                {task.name}
                              </span>
                              {task.description && (
                                <span className="text-[12px] text-secondary mt-1 block leading-snug">{task.description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-surface-container-highest text-secondary">
                                {task.type === "DOCUMENT_UPLOAD" && "Document"}
                                {task.type === "PAYMENT_PROOF" && "Payment"}
                                {task.type === "SURVEY" && "Survey"}
                                {task.type === "ACKNOWLEDGMENT" && "Confirm"}
                                {(task.type === "MANUAL" || !task.type) && "Manual"}
                              </span>
                            </div>
                          </div>

                          {/* Submission & Interaction Panel */}
                          {!isSysAdminView ? (
                            // STUDENT VIEW
                            <div className="space-y-2 pt-1 border-t border-dashed border-surface-container-high">
                              {isCleared ? (
                                <div className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 w-fit">
                                  <Check size={14} strokeWidth={3} /> Requirement Cleared
                                </div>
                              ) : (subStatus === "pending" || isLocallySubmitted) ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                      <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                      Pending Review
                                    </div>
                                    {sub?.id && subStatus === "pending" && (
                                      <button
                                        onClick={() => handleCancelSubmission(sub.id, task.id)}
                                        className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                                      >
                                        <X size={11} strokeWidth={3} /> Cancel
                                      </button>
                                    )}
                                  </div>
                                  {(() => { const urls = parseFileUrls(sub?.uploadedFileUrls); return urls.length > 0 && (
                                    <a
                                      href={urls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg inline-flex max-w-full hover:bg-primary/10"
                                    >
                                      <FileText size={12} /> View submitted document
                                    </a>
                                  ); })()}
                                </div>
                              ) : (
                                // No submission OR rejected
                                <div className="space-y-3">
                                  {subStatus === "rejected" && (
                                    <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                      <span className="font-bold">❌ Rejected:</span> {sub?.reviewNotes || "Please re-submit your files."}
                                    </div>
                                  )}

                                  {/* Interaction Input depending on requirement type */}
                                  {task.type === "DOCUMENT_UPLOAD" && (
                                    <div className="space-y-2">
                                      <label className="block text-[11px] font-bold text-secondary">Upload Document (PDF, PNG, JPG)</label>
                                      <input
                                        type="file"
                                        required
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            setSelectedFiles(prev => ({ ...prev, [task.id]: e.target.files![0] }));
                                          }
                                        }}
                                        className="block w-full text-xs text-secondary file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                      />
                                      <button
                                        onClick={() => handleSubmitTask(task.id, task.type)}
                                        disabled={submittingTaskId === task.id}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded shadow transition-all disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <UploadCloud size={13} /> {submittingTaskId === task.id ? "Uploading..." : "Submit File"}
                                      </button>
                                    </div>
                                  )}

                                  {task.type === "PAYMENT_PROOF" && (
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-secondary">Upload Receipt Image/PDF</label>
                                        <input
                                          type="file"
                                          required
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              setSelectedFiles(prev => ({ ...prev, [task.id]: e.target.files![0] }));
                                            }
                                          }}
                                          className="block w-full text-xs text-secondary file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[11px] font-bold text-secondary">Official Receipt (OR) / Reference No. *</label>
                                        <input
                                          type="text"
                                          required
                                          placeholder="Enter reference number"
                                          value={paymentRefs[task.id] || ""}
                                          onChange={(e) => setPaymentRefs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                          className="custom-ring w-full px-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest font-body-sm text-xs text-on-surface outline-none"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSubmitTask(task.id, task.type)}
                                        disabled={submittingTaskId === task.id}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded shadow transition-all disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <UploadCloud size={13} /> {submittingTaskId === task.id ? "Submitting..." : "Submit Receipt"}
                                      </button>
                                    </div>
                                  )}

                                  {task.type === "SURVEY" && (
                                    <div className="space-y-3 bg-surface-container-lowest/60 p-3 rounded-lg border border-surface-container-high">
                                      {(() => {
                                        const questions = task.surveyQuestions 
                                          ? (typeof task.surveyQuestions === 'string' ? JSON.parse(task.surveyQuestions) : task.surveyQuestions)
                                          : [];
                                        return questions.map((q: any) => (
                                          <div key={q.id} className="space-y-1">
                                            <label className="block text-xs font-bold text-on-surface">{q.label}</label>
                                            {q.questionType === "multiple_choice" ? (
                                              <div className="flex flex-wrap gap-3 mt-1.5">
                                                {(q.options || []).map((opt: string) => (
                                                  <label key={opt} className="inline-flex items-center gap-1.5 text-xs text-on-surface cursor-pointer">
                                                    <input
                                                      type="radio"
                                                      name={`${task.id}-${q.id}`}
                                                      value={opt}
                                                      checked={surveyForms[task.id]?.[q.id] === opt}
                                                      onChange={() => setSurveyForms(prev => ({
                                                        ...prev,
                                                        [task.id]: { ...(prev[task.id] || {}), [q.id]: opt }
                                                      }))}
                                                      className="text-primary focus:ring-primary"
                                                    />
                                                    {opt}
                                                  </label>
                                                ))}
                                              </div>
                                            ) : (
                                              <input
                                                type="text"
                                                required
                                                placeholder="Enter answer"
                                                value={surveyForms[task.id]?.[q.id] || ""}
                                                onChange={(e) => setSurveyForms(prev => ({
                                                  ...prev,
                                                  [task.id]: { ...(prev[task.id] || {}), [q.id]: e.target.value }
                                                }))}
                                                className="custom-ring w-full px-3 py-1.5 rounded border border-surface-container-high bg-surface-container-lowest font-body-sm text-xs text-on-surface outline-none"
                                              />
                                            )}
                                          </div>
                                        ));
                                      })()}
                                      <button
                                        onClick={() => handleSubmitTask(task.id, task.type)}
                                        disabled={submittingTaskId === task.id}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded shadow transition-all disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <Check size={13} /> {submittingTaskId === task.id ? "Submitting..." : "Submit Survey"}
                                      </button>
                                    </div>
                                  )}

                                  {task.type === "ACKNOWLEDGMENT" && (
                                    <div className="space-y-3 bg-surface-container-lowest/60 p-3 rounded-lg border border-surface-container-high">
                                      <p className="text-xs text-secondary leading-relaxed bg-surface-container-high/20 p-2.5 rounded border border-surface-container-high">
                                        {task.acknowledgmentText || 'I confirm that I have fulfilled this requirement.'}
                                      </p>
                                      <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={!!acknowledgedFlags[task.id]}
                                          onChange={(e) => setAcknowledgedFlags(prev => ({ ...prev, [task.id]: e.target.checked }))}
                                          className="rounded text-primary focus:ring-primary h-4 w-4"
                                        />
                                        I confirm and agree to this statement.
                                      </label>
                                      <button
                                        onClick={() => handleSubmitTask(task.id, task.type)}
                                        disabled={submittingTaskId === task.id}
                                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded shadow transition-all disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <Check size={13} /> {submittingTaskId === task.id ? "Submitting..." : "Confirm & Submit"}
                                      </button>
                                    </div>
                                  )}

                                  {(task.type === "MANUAL" || !task.type) && (
                                    <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg border border-surface-container-high">
                                      <div className="w-4 h-4 rounded-[4px] border border-outline-variant bg-surface-container-lowest shrink-0" />
                                      <span className="text-xs text-secondary font-medium">Waiting for office to clear manually.</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            // EVALUATOR VIEW
                            <div className="space-y-2 pt-2 border-t border-dashed border-surface-container-high text-xs">
                              {task.type === "MANUAL" || !task.type ? (
                                <div 
                                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-surface-container-high/50 select-none"
                                  onClick={() => handleOfficeManualToggle(idx)}
                                >
                                  <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center border transition-colors shrink-0 ${
                                    completedTasks.includes(idx) 
                                      ? "bg-primary border-primary text-white" 
                                      : "border-outline-variant bg-surface-container-lowest text-transparent"
                                  }`}>
                                    <Check size={12} strokeWidth={4} />
                                  </div>
                                  <span className={`text-xs block ${completedTasks.includes(idx) ? "text-secondary line-through font-medium" : "text-on-surface font-semibold"}`}>
                                    Mark as completed (Manual)
                                  </span>
                                </div>
                              ) : sub ? (
                                <div className="space-y-3 bg-surface p-3 rounded-lg border border-surface-container-high">
                                  <div className="flex justify-between items-center text-[10px] text-secondary border-b border-surface-container-high pb-1.5">
                                    <span>Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                    <span className={`font-bold uppercase tracking-wider ${
                                      subStatus === "approved" ? "text-green-600" :
                                      subStatus === "rejected" ? "text-red-600" : "text-blue-600"
                                    }`}>
                                      {subStatus}
                                    </span>
                                  </div>

                                  {/* Display submissions info */}
                                  {task.type === "DOCUMENT_UPLOAD" && (() => { const urls = parseFileUrls(sub.uploadedFileUrls); return urls.length > 0 && (
                                    <div>
                                      {urls.map((url, fIdx) => (
                                        <a
                                          key={fIdx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-primary hover:underline font-bold"
                                        >
                                          <FileText size={14} /> Download Student Document
                                        </a>
                                      ))}
                                    </div>
                                  ); })()}

                                  {task.type === "PAYMENT_PROOF" && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="font-semibold text-secondary">OR/Reference No:</span>
                                        <span className="font-bold text-on-surface">{sub.paymentReference}</span>
                                      </div>
                                       {(() => { const urls = parseFileUrls(sub.uploadedFileUrls); return urls.length > 0 && (
                                        <div>
                                           {urls.map((url, fIdx) => (
                                             <a
                                               key={fIdx}
                                               href={url}
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               className="flex items-center gap-1.5 text-primary hover:underline font-bold"
                                             >
                                               <FileText size={14} /> Download Receipt File
                                             </a>
                                           ))}
                                         </div>
                                       ); })()}
                                    </div>
                                  )}

                                  {task.type === "SURVEY" && (
                                    <div className="space-y-2">
                                      <span className="font-semibold text-secondary block">Survey Answers:</span>
                                      <div className="space-y-2 pl-2 border-l-2 border-outline-variant bg-surface-container-low/30 p-2 rounded">
                                        {(sub.surveyAnswers as any[] || []).map((ans: any, aIdx: number) => {
                                          const q = (task.surveyQuestions as any[] || []).find(x => x.id === ans.questionId);
                                          return (
                                            <div key={aIdx} className="space-y-0.5 border-b border-surface-container-high last:border-b-0 pb-1 last:pb-0">
                                              <span className="font-bold text-on-surface block">{q?.label || 'Question'}:</span>
                                              <span className="text-secondary block leading-snug">{ans.answer}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {task.type === "ACKNOWLEDGMENT" && (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 font-bold">
                                      <Check size={14} strokeWidth={3} /> Confirmed acknowledgment box checked.
                                    </div>
                                  )}

                                  {/* Approve / Reject Evaluation Buttons */}
                                  {subStatus === "pending" && (
                                    <div className="flex gap-2 pt-1.5 border-t border-surface-container-high">
                                      <button
                                        onClick={() => handleEvaluateSubmission(sub.id, "approved")}
                                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-all shadow flex items-center justify-center gap-1"
                                      >
                                        <Check size={12} strokeWidth={3} /> Approve
                                      </button>
                                      <button
                                        onClick={() => handleEvaluateSubmission(sub.id, "rejected")}
                                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-all shadow flex items-center justify-center gap-1"
                                      >
                                        <X size={12} strokeWidth={3} /> Reject
                                      </button>
                                    </div>
                                  )}

                                  {subStatus === "rejected" && (
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                      <span className="font-bold">Rejected Note:</span> {sub.reviewNotes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-secondary italic p-2 bg-surface-container rounded border border-dashed border-outline-variant">
                                  No submission received yet.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remarks & Clearance Date */}
              {(item.remarks || (item.status === "Cleared" && item.dateCleared)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 mt-2 border-t border-surface-container-low">
                  {/* Only show remarks when not cleared — cleared remarks are stale progress messages */}
                  {item.remarks && item.status !== "Cleared" && (
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">Remarks</span>
                      <p className="text-[12px] text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded border border-red-100 inline-block leading-snug">
                        {item.remarks}
                      </p>
                    </div>
                  )}
                  {item.status === "Cleared" && item.dateCleared && (
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">Date Cleared</span>
                      <span className="text-[12px] text-on-surface bg-surface-container px-3 py-1.5 rounded border border-surface-container-high inline-block font-medium">
                        {item.dateCleared}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClearanceStatusView({
  targetStudentId,
  isSysAdminView = false,
  viewingOfficeId,
  viewingOrgId,
  viewingDeptId,
}: {
  targetStudentId?: string;
  isSysAdminView?: boolean;
  viewingOfficeId?: number;
  viewingOrgId?: number;
  viewingDeptId?: number;
}) {
  const [student, setStudent] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentEntityId, setCurrentEntityId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<ClearanceItem[]>([]);
  const [officeReqs, setOfficeReqs] = useState<Record<number, any[]>>({});
  const [orgReqs, setOrgReqs] = useState<Record<number, any[]>>({});
  const [deptReqs, setDeptReqs] = useState<Record<number, any[]>>({});
  const [triggerSync, setTriggerSync] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setTriggerSync(prev => prev + 1);
    };
    window.addEventListener("clearanceRecordsUpdated", handleSync);
    return () => {
      window.removeEventListener("clearanceRecordsUpdated", handleSync);
    };
  }, []);

  useEffect(() => {
    // Load current user role context
    const role = localStorage.getItem("role");
    setCurrentUserRole(role);
    if (role === "head-office") {
      setCurrentEntityId(Number(localStorage.getItem("officeId")));
    } else if (role === "org") {
      setCurrentEntityId(Number(localStorage.getItem("orgId")));
    } else if (role === "department") {
      setCurrentEntityId(Number(localStorage.getItem("departmentId")));
    }

    // Load dynamic requirements configurations fallback
    const storedOfficeReqs = localStorage.getItem("officeRequirements");
    setOfficeReqs(storedOfficeReqs ? JSON.parse(storedOfficeReqs) : defaultOfficeRequirements);

    const storedOrgReqs = localStorage.getItem("orgRequirements");
    setOrgReqs(storedOrgReqs ? JSON.parse(storedOrgReqs) : defaultOrgRequirements);

    const storedDeptReqs = localStorage.getItem("departmentRequirements");
    setDeptReqs(storedDeptReqs ? JSON.parse(storedDeptReqs) : defaultDepartmentRequirements);

    // Load student profile from DB (not localStorage)
    let resolvedId = targetStudentId;
    if (!resolvedId) {
      const params = new URLSearchParams(window.location.search);
      const cookieStudentId = document.cookie
        .split("; ")
        .find(c => c.startsWith("activeStudentId="))
        ?.split("=")[1];
      resolvedId = params.get("studentId") || localStorage.getItem("activeStudentId") || cookieStudentId || "";
    }
    
    if (!resolvedId) return;

    // Fetch student profile from the DB API
    clearanceService.getStudentById(resolvedId).then(currentStudent => {
      if (currentStudent) setStudent(currentStudent);
    });

    const loadData = async () => {
      try {
        const mergedReqs = await clearanceService.getStudentRequirements(resolvedId);
        setRequirements(mergedReqs);
      } catch (err) {
        console.error("Failed to load student requirements from DB, falling back to mock", err);
        // Fallback mock logic
        const baseOffices = mockRequirements.filter((r: any) => r.type === "office");
        const studentOrgs = mockOrgMembers
          .filter((m) => m.studentId === currentStudent.id)
          .map((m) => mockOrgs.find((o) => o.id === m.orgId))
          .filter(Boolean);

        const dynamicOrgs = studentOrgs.map((org: any) => ({
          id: org.id,
          name: "Org Membership Clearance",
          responsible: org.name,
          type: "org",
          status: "Pending",
          dateCleared: null,
          remarks: "",
        }));

        const studentDept = mockDepartments.find((d: any) => d.abbreviation === currentStudent.department);
        const dynamicDepts = studentDept ? [{
          id: studentDept.id,
          name: "Department Clearance",
          responsible: studentDept.name,
          type: "department",
          status: "Pending",
          dateCleared: null,
          remarks: "",
        }] : [];

        const combinedReqs = [...baseOffices, ...dynamicOrgs, ...dynamicDepts];
        setRequirements(combinedReqs as any);
      }
    };

    loadData();
  }, [targetStudentId, triggerSync]);

  const handleStatusChange = (reqId: number, newStatus: ClearanceItem["status"], data?: any) => {
    setRequirements(prev => {
      const updatedReqs = prev.map(req => req.id === reqId ? { ...req, status: newStatus, ...data } : req);
      
      // Persist to localStorage
      if (student) {
        const storedRecords = localStorage.getItem("studentClearanceRecords");
        if (storedRecords) {
          const records = JSON.parse(storedRecords);
          const studentRecords = records[student.id] || [];
          
          const req = updatedReqs.find(r => r.id === reqId);
          if (req) {
            const isOffice = req.type === "office";
            const existingIdx = studentRecords.findIndex((r: any) => 
              (isOffice && r.officeId === reqId) || (!isOffice && r.orgId === reqId)
            );
            
            if (existingIdx >= 0) {
              studentRecords[existingIdx].status = newStatus;
              if (data?.remarks !== undefined) studentRecords[existingIdx].remarks = data.remarks;
              if (data?.dateCleared !== undefined) studentRecords[existingIdx].dateCleared = data.dateCleared;
              if (data?.uploadedFiles !== undefined) studentRecords[existingIdx].uploadedFiles = data.uploadedFiles;
              if (data?.completedTasks !== undefined) studentRecords[existingIdx].completedTasks = data.completedTasks;
            } else {
              studentRecords.push({
                [isOffice ? "officeId" : "orgId"]: reqId,
                status: newStatus,
                dateCleared: data?.dateCleared || null,
                remarks: data?.remarks || "",
                uploadedFiles: data?.uploadedFiles,
                completedTasks: data?.completedTasks
              });
            }
            
            records[student.id] = studentRecords;
            localStorage.setItem("studentClearanceRecords", JSON.stringify(records));
            
            // Dispatch a custom event to notify other components (like admin table) that clearance data changed
            window.dispatchEvent(new Event("clearanceRecordsUpdated"));
          }
        }
      }
      
      return updatedReqs;
    });
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Filter requirements by type
  let headOffices = requirements.filter((req) => req.type === "office");
  let orgsClubs = requirements.filter((req) => req.type === "org");
  let departments = requirements.filter((req) => req.type === "department");

  // Explicit props take highest precedence (used when an office/dept/org views a student's detail).
  // Falls back to the localStorage role for dev-bypass sessions.
  if (viewingOfficeId) {
    headOffices = headOffices.filter(req => req.id === viewingOfficeId);
    orgsClubs = [];
    departments = [];
  } else if (viewingOrgId) {
    orgsClubs = orgsClubs.filter(req => req.id === viewingOrgId);
    headOffices = [];
    departments = [];
  } else if (viewingDeptId) {
    departments = departments.filter(req => req.id === viewingDeptId);
    headOffices = [];
    orgsClubs = [];
  } else if (currentUserRole === "head-office" && currentEntityId) {
    headOffices = headOffices.filter(req => req.id === currentEntityId);
    orgsClubs = [];
    departments = [];
  } else if (currentUserRole === "org" && currentEntityId) {
    orgsClubs = orgsClubs.filter(req => req.id === currentEntityId);
    headOffices = [];
    departments = [];
  } else if (currentUserRole === "department" && currentEntityId) {
    departments = departments.filter(req => req.id === currentEntityId);
    headOffices = [];
    orgsClubs = [];
  }

  // Helper function to check if a requirement applies to the current student
  const isApplicable = (r: any) => {
    if (!r.appliesTo || r.appliesTo.length === 0 || r.appliesTo.includes("All Students")) return true;
    return (
      r.appliesTo.includes(student.program) ||
      r.appliesTo.includes(student.department) ||
      r.appliesTo.includes(student.year)
    );
  };

  const isOfficeView = !!(viewingOfficeId || viewingOrgId || viewingDeptId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Clearance Requirements
          </h2>
          <p className="text-secondary text-body-sm flex items-center gap-2">
            {isOfficeView ? `Viewing requirements for ${student.name}` : `Track and complete requirements for ${student.semester}`}
            {isSysAdminView && !isOfficeView && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-bold text-[10px] uppercase tracking-wider">
                Viewing: {student.name} ({student.id})
              </span>
            )}
          </p>
        </div>
        {isSysAdminView && !isOfficeView && (
          <a
            href="/admin/user-management/students"
            className="flex items-center justify-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors bg-surface-container-lowest border border-surface-container-high hover:border-primary/30 px-4 py-2 rounded-lg shadow-sm whitespace-nowrap"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back to Constituents
          </a>
        )}
      </section>

      {/* Student info card — shown to office/dept/org viewers */}
      {isOfficeView && (
        <div className="flex items-center gap-4 bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 shadow-sm">
          {student.avatarUrl ? (
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-12 h-12 rounded-full object-cover border border-surface-container-highest shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xl shrink-0 shadow-sm">
              {student.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-on-surface text-base leading-tight">{student.name}</p>
            <p className="text-xs text-secondary mt-0.5">{student.id} · {student.email}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{student.program}</span>
              <span className="text-[11px] bg-surface-container text-secondary px-2 py-0.5 rounded-full font-medium">{student.year}</span>
              <span className="text-[11px] bg-surface-container text-secondary px-2 py-0.5 rounded-full font-medium">{student.department}</span>
            </div>
          </div>
        </div>
      )}

      {/* Document upload instructions — student-only */}
      {!isSysAdminView && !isOfficeView && (
        <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-4 flex gap-3 text-on-surface">
          <div className="text-primary mt-0.5">
            <UploadCloud size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Document Upload Instructions</h4>
            <p className="text-sm text-secondary mt-1">
              Click on tasks that require file uploads to attach your documents. Once all tasks under an office are complete, the status will automatically change to "Under Review".
            </p>
          </div>
        </div>
      )}

      {/* Lists of Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Head Offices Section */}
        {headOffices.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-title-md text-base font-bold text-on-surface">Head Offices</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-surface-container-high text-secondary uppercase tracking-wider">
                {headOffices.length} Total
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm">
              <div className="space-y-1">
                {headOffices.map((item, i) => {
                  const tasks = item.tasks || (officeReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ id: String(r.id), name: r.name, type: r.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL" }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === headOffices.length - 1}
                      isSysAdminView={isSysAdminView}
                      studentId={student?.id || ""}
                      onStatusChange={(status, data) => handleStatusChange(item.id, status, data)}
                      tasks={tasks}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Departments Section */}
        {departments.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-title-md text-base font-bold text-on-surface">Departments</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-surface-container-high text-secondary uppercase tracking-wider">
                {departments.length} Total
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm">
              <div className="space-y-1">
                {departments.map((item, i) => {
                  const tasks = item.tasks || (deptReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ id: String(r.id), name: r.name, type: r.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL" }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === departments.length - 1}
                      isSysAdminView={isSysAdminView}
                      studentId={student?.id || ""}
                      onStatusChange={(status, data) => handleStatusChange(item.id, status, data)}
                      tasks={tasks}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Orgs & Clubs Section */}
        {orgsClubs.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-title-md text-base font-bold text-on-surface">Orgs & Clubs</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-surface-container-high text-secondary uppercase tracking-wider">
                {orgsClubs.length} Total
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm">
              <div className="space-y-1">
                {orgsClubs.map((item, i) => {
                  const tasks = item.tasks || (orgReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ id: String(r.id), name: r.name, type: r.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL" }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === orgsClubs.length - 1}
                      isSysAdminView={isSysAdminView}
                      studentId={student?.id || ""}
                      onStatusChange={(status, data) => handleStatusChange(item.id, status, data)}
                      tasks={tasks}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
