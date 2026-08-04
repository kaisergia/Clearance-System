"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as clearanceService from "@/services/clearanceService";
import { ClearanceItem } from "@/services/clearanceService";

const PROGRAM_MAP: Record<string, string> = {
  "BS Computer Science": "BSCS",
  "BS Information Technology": "BSIT",
  "BS Business Administration": "BSBA",
  "BS Accountancy": "BSA",
  "BS Civil Engineering": "BSCE",
  "BS Mechanical Engineering": "BSME",
  "BS Electrical Engineering": "BSEE",
  "BS Data Science": "BSDS",
  "BS Applied Mathematics": "BSAM",
  "BS Nursing": "BSN",
  "BS Pharmacy": "BSP",
  "BS Medical Technology": "BSMT",
};

const statusStyles = {
  cleared: {
    dot: "bg-green-500 text-white",
    badge: "bg-green-50 text-green-700",
    line: "bg-green-400",
    label: "Cleared",
  },
  pending: {
    dot: "bg-white text-gray-300 border-2 border-gray-300",
    badge: "bg-gray-50 text-gray-500",
    line: "bg-gray-200",
    label: "Pending",
  },
};

function StepIcon({ status }: { status: "cleared" | "pending" }) {
  if (status === "cleared") return <Check size={14} strokeWidth={3} />;
  return null;
}

function SubClearance({ sub, isLast }: { sub: { id: string; name: string; status: string }; isLast: boolean }) {
  const cleared = sub.status === "cleared";
  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${cleared ? "bg-green-500 text-white" : "bg-white border-2 border-gray-300"
            }`}
        >
          {cleared && <Check size={9} strokeWidth={3} />}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[14px] my-0.5 ${cleared ? "bg-green-400" : "bg-gray-200"
              }`}
          />
        )}
      </div>

      <div className="flex items-center justify-between flex-1 pb-2.5">
        <span className={`text-[13px] ${cleared ? "text-gray-400" : "text-gray-700"}`}>
          {sub.name}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${cleared ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
        >
          {cleared ? "Cleared" : "Not cleared"}
        </span>
      </div>
    </div>
  );
}

function ClearanceStepRow({ step, isLast }: { step: any; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const styles = statusStyles[step.status as keyof typeof statusStyles] || statusStyles.pending;
  const hasPrereqs = step.prereqClearances && step.prereqClearances.length > 0;
  const hasTasks = step.taskClearances && step.taskClearances.length > 0;
  const hasSubs = hasPrereqs || hasTasks;

  return (
    <div className="flex gap-3">
      {/* Node + connecting line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${styles.dot}`}
        >
          <StepIcon status={step.status} />
        </div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${styles.line}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div
          className="rounded-xl px-3 py-2 -mt-1 hover:bg-surface-container-low transition-colors duration-150"
          onClick={() => hasSubs && setExpanded((e) => !e)}
          style={{ cursor: hasSubs ? "pointer" : "default" }}
        >
          <div className="flex items-start justify-between">
            <span className="text-[15px] font-semibold text-on-surface">{step.office}</span>
            <div className="flex flex-col items-center gap-1">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${styles.badge}`}>
                {styles.label}
              </span>
              {hasSubs &&
                (expanded ? (
                  <ChevronUp size={14} className="text-secondary" />
                ) : (
                  <ChevronDown size={14} className="text-secondary" />
                ))}
            </div>
          </div>

          {step.dateCleared && (
            <p className="text-[12px] text-secondary mt-0.5">{step.dateCleared}</p>
          )}

          {hasSubs && !expanded && (
            <div className="text-[12px] text-secondary mt-0.5 font-medium flex flex-wrap gap-x-3 gap-y-1">
              {hasPrereqs && (
                <span>
                  {step.prereqClearances.filter((s: any) => s.status === "cleared").length}/
                  {step.prereqClearances.length} prerequisites met
                </span>
              )}
              {hasTasks && (
                <span>
                  {step.taskClearances.filter((s: any) => s.status === "cleared").length}/
                  {step.taskClearances.length} tasks completed
                </span>
              )}
            </div>
          )}

          {hasSubs && expanded && (
            <div className="mt-3 pt-1 space-y-4">
              {hasPrereqs && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider block">
                    Prerequisite Signatories
                  </span>
                  <div className="space-y-1.5 pl-1.5">
                    {step.prereqClearances.map((sub: any, i: number) => (
                      <SubClearance
                        key={sub.id}
                        sub={sub}
                        isLast={i === step.prereqClearances.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hasTasks && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider block">
                    Office Requirements Checklist
                  </span>
                  <div className="space-y-1.5 pl-1.5">
                    {step.taskClearances.map((sub: any, i: number) => (
                      <SubClearance
                        key={sub.id}
                        sub={sub}
                        isLast={i === step.taskClearances.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {step.status !== "cleared" &&
                hasPrereqs &&
                step.prereqClearances.every((s: any) => s.status === "cleared") && (
                  <p className="text-[12px] text-secondary mt-1 pl-[26px] italic">
                    All prerequisites cleared — this office still needs to confirm your clearance.
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClearanceStatus({ requirements, studentId, viewingOfficeId, viewingDeptId, viewingOrgId }: { requirements: ClearanceItem[], studentId?: string, viewingOfficeId?: number, viewingDeptId?: number, viewingOrgId?: number }) {
  const [currentStudent, setCurrentStudent] = useState<any>(null);

  useEffect(() => {
    const loadStudent = async () => {
      const cookieStudentId = document.cookie
        .split("; ")
        .find(c => c.startsWith("activeStudentId="))
        ?.split("=")[1];
      const activeStudentId = studentId || localStorage.getItem("activeStudentId") || cookieStudentId || "";
      if (!activeStudentId) return;
      const student = await clearanceService.getStudentById(activeStudentId);
      setCurrentStudent(student);
    };
    loadStudent();
  }, [studentId]);

  if (!currentStudent) {
    return <div className="text-center p-4 text-secondary">Loading student details...</div>;
  }

  // Find all signatories that are declared as prerequisites of any step
  const prerequisiteKeys = new Set<string>();
  requirements.forEach((req) => {
    (req.prerequisiteSignatories || []).forEach((item: any) => {
      prerequisiteKeys.add(`${item.type}-${item.id}`);
    });
  });

  // Dynamically map requirements (which represent active signatories in sequence order) to steps
  const steps = requirements.map((req) => {
    let officeName = req.responsible;
    if (req.type === "department") {
      officeName = `${req.responsible} Department Clearance`;
    } else if (req.type === "org") {
      if (req.name.toLowerCase().includes("student government")) {
        officeName = "Student Government Clearance";
      } else {
        officeName = `${req.responsible} Club Clearance`;
      }
    }

    // Map prerequisite signatories to subClearances
    const prereqSubs = (req.prerequisiteSignatories || [])
      .map((item: any) => {
        const found = requirements.find((r) => r.type === item.type && r.id === item.id);
        if (!found) return null;
        let displayName = found.responsible;
        if (found.type === "department") {
          displayName = `${found.responsible} Department Clearance`;
        } else if (found.type === "org") {
          if (found.name.toLowerCase().includes("student government")) {
            displayName = "Student Government";
          } else {
            displayName = `${found.responsible} Club`;
          }
        }
        return {
          id: `${found.type}-${found.id}`,
          name: displayName,
          status: found.status === "Cleared" ? "cleared" : "pending",
        };
      })
      .filter(Boolean);

    // Map signatory tasks to subClearances (prerequisites) in the status tree
    const taskSubs = (req.tasks || []).map((task: any) => {
      const subStatus = task.submission?.status?.toLowerCase();
      const isTaskCleared = req.status === "Cleared" || subStatus === "approved" || subStatus === "cleared";
      return {
        id: String(task.id),
        name: task.name,
        status: isTaskCleared ? "cleared" : "pending"
      };
    });

    return {
      id: `${req.type}-${req.id}`,
      office: officeName,
      status: req.status === "Cleared" ? "cleared" : "pending",
      dateCleared: req.status === "Cleared" ? req.dateCleared : null,
      prereqClearances: prereqSubs,
      taskClearances: taskSubs,
      type: req.type,
    };
  });

  // Filter visible steps if viewed by a specific signatory role
  const visibleSteps = steps.filter((step) => {
    if (viewingOfficeId) {
      const matchedReq = requirements.find(r => r.type === "office" && r.id === viewingOfficeId);
      return matchedReq ? step.office.includes(matchedReq.responsible) : false;
    }
    if (viewingDeptId) {
      const matchedReq = requirements.find(r => r.type === "department" && r.id === viewingDeptId);
      return matchedReq ? step.office.includes(matchedReq.responsible) : false;
    }
    if (viewingOrgId) {
      const matchedReq = requirements.find(r => r.type === "org" && r.id === viewingOrgId);
      return matchedReq ? step.office.includes(matchedReq.responsible) : false;
    }
    // For overall student timeline view: hide steps that are displayed as nested sub-clearances (prerequisites)
    const stepKey = step.id;
    return !prerequisiteKeys.has(stepKey);
  });

  const allCleared = visibleSteps.length > 0 && visibleSteps.every((s) => s.status === "cleared");

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm p-6 w-full space-y-5">
      <p className="text-xs font-semibold text-secondary uppercase tracking-wider">
        Clearance Status
      </p>

      {visibleSteps.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
          <p className="text-sm font-semibold text-secondary">No published clearance available</p>
        </div>
      ) : (
        <div className="space-y-1">
          {visibleSteps.map((step, i) => (
            <ClearanceStepRow key={step.id} step={step} isLast={i === visibleSteps.length - 1} />
          ))}
        </div>
      )}

      {allCleared && (
        <div className="text-center py-3 mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-sm font-semibold text-emerald-700">All clear! Fully cleared for this office.</p>
        </div>
      )}
    </div>
  );
}
