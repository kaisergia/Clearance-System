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
  const hasSubs = step.subClearances && step.subClearances.length > 0;

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
            <p className="text-[12px] text-secondary mt-0.5 font-medium">
              {step.subClearances.filter((s: any) => s.status === "cleared").length}/
              {step.subClearances.length} prerequisites met
            </p>
          )}

          {hasSubs && expanded && (
            <div className="mt-3 pt-1">
              {step.subClearances.map((sub: any, i: number) => (
                <SubClearance
                  key={sub.id}
                  sub={sub}
                  isLast={i === step.subClearances.length - 1}
                />
              ))}
              {step.status !== "cleared" &&
                step.subClearances.every((s: any) => s.status === "cleared") && (
                  <p className="text-[12px] text-secondary mt-1 pl-[26px]">
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

export default function ClearanceStatus({ requirements, studentId }: { requirements: ClearanceItem[], studentId?: string }) {
  const [currentStudent, setCurrentStudent] = useState<any>(null);

  useEffect(() => {
    const loadStudent = async () => {
      const activeStudentId = studentId || localStorage.getItem("activeStudentId") || "2021-0492";
      const student = await clearanceService.getStudentById(activeStudentId);
      setCurrentStudent(student);
    };
    loadStudent();
  }, [studentId]);

  // Helper to fetch status from mockRequirements
  const getStatus = (responsibleKey: string) => {
    const req = requirements.find((r) =>
      r.responsible.toLowerCase().includes(responsibleKey.toLowerCase())
    );
    return req && req.status === "Cleared" ? "cleared" : "pending";
  };

  const getDateCleared = (responsibleKey: string) => {
    const req = requirements.find((r) =>
      r.responsible.toLowerCase().includes(responsibleKey.toLowerCase())
    );
    return req && req.status === "Cleared" ? req.dateCleared : null;
  };

  // Find all dynamic orgs (which are in the requirements array as type "org")
  const orgReqs = requirements.filter((r) => r.type === "org");
  const sgReq = requirements.find((r) => r.responsible.toLowerCase().includes("student government"));
  const sgCleared = sgReq && sgReq.status === "Cleared";

  const subClearances = orgReqs.map((orgReq) => ({
    id: `org-${orgReq.id}`,
    name: orgReq.responsible,
    status: orgReq.status === "Cleared" ? "cleared" : "pending"
  }));

  const orgsStepStatus = sgCleared && orgReqs.every((r) => r.status === "Cleared") ? "cleared" : "pending";

  // Resolve Department Clearance status
  const deptReq = requirements.find((r) => r.type === "department");
  const deptCleared = deptReq && deptReq.status === "Cleared" ? "cleared" : "pending";
  const deptDateCleared = deptReq && deptReq.status === "Cleared" ? deptReq.dateCleared : null;

  if (!currentStudent) {
    return <div className="text-center p-4 text-secondary">Loading student details...</div>;
  }

  const steps = [
    {
      id: 1,
      office: "Library",
      status: getStatus("Library"),
      dateCleared: getDateCleared("Library"),
    },
    {
      id: 2,
      office: "Accounting",
      status: getStatus("Accounting"),
      dateCleared: getDateCleared("Accounting"),
    },
    {
      id: 3,
      office: "Registrar",
      status: getStatus("Registrar"),
      dateCleared: getDateCleared("Registrar"),
    },
    {
      id: 4,
      office: "Student Government & Orgs",
      status: orgsStepStatus,
      subClearances: subClearances,
    },
    {
      id: 5,
      office: "Guidance Office",
      status: getStatus("Guidance"),
      dateCleared: getDateCleared("Guidance"),
    },
    {
      id: 6,
      office: "Discipline Office",
      status: getStatus("Discipline"),
      dateCleared: getDateCleared("Discipline"),
    },
    {
      id: 7,
      office: `${currentStudent.department} Department Clearance`,
      status: deptCleared,
      dateCleared: deptDateCleared,
    },
    {
      id: 8,
      office: "Dean's Office Approval",
      status: requirements.every((r) => r.status === "Cleared") ? "cleared" : "pending",
    },
  ];

  const allCleared = steps.every((s) => s.status === "cleared");

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm p-6 w-full">
      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-5">
        Clearance Status
      </p>

      <div className="space-y-1">
        {steps.map((step, i) => (
          <ClearanceStepRow key={step.id} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>

      {allCleared && (
        <div className="text-center py-3 mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-sm font-semibold text-emerald-700">All clear! You're fully cleared.</p>
        </div>
      )}
    </div>
  );
}
