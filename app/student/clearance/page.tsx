"use client";

import { useState, useEffect } from "react";
import { mockStudents } from "@/mock/mockStudents";
import { mockRequirements } from "@/mock/mockData";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface ClearanceItem {
  id: number;
  name: string;
  responsible: string;
  type: "office" | "org";
  status: "Cleared" | "Pending" | "Rejected";
  dateCleared?: string | null;
  remarks?: string;
}

const itemStatusStyles = {
  Cleared: {
    dot: "bg-green-500 text-white",
    badge: "bg-green-50 text-green-700",
    line: "bg-green-400",
    label: "Cleared",
  },
  Pending: {
    dot: "bg-white text-gray-300 border-2 border-gray-300",
    badge: "bg-gray-50 text-gray-500",
    line: "bg-gray-200",
    label: "Pending",
  },
};

const requirementTasks: Record<string, string[]> = {
  "library": ["Return all borrowed books", "Settle outstanding overdue fines", "Submit research thesis copy"],
  "accounting": ["Settle outstanding tuition fees", "Clear laboratory breakage fees", "Submit financial clearance form"],
  "registrar": ["Submit official transcript copy", "Verify high school card / F137", "Clear academic deficiency holds"],
  "guidance office": ["Accomplish exit counseling interview", "Submit personality evaluation test", "Clear guidance behavior record"],
  "discipline office": ["Verify zero behavioral violations", "Clear community service hours", "Submit good moral character form"],
  "computer science society": ["Pay CSS membership dues", "Settle project contributions", "Verify seminar attendance"],
  "student government": ["Pay SSG membership dues", "Attend general assembly", "Verify community service attendance"],
};

function ClearanceItemRow({ item, isLast }: { item: ClearanceItem; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isCleared = item.status === "Cleared";
  const styles = isCleared ? itemStatusStyles.Cleared : itemStatusStyles.Pending;
  
  const tasks = requirementTasks[item.responsible.toLowerCase()] || [
    "Verify record deficiencies",
    "Submit required office documentation",
    "Obtain officer signature approval"
  ];

  return (
    <div className="flex gap-3">
      {/* Node + connecting line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${styles.dot}`}
        >
          {isCleared && <Check size={14} strokeWidth={3} />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${styles.line}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div 
          onClick={() => setExpanded(!expanded)}
          className="rounded-xl px-3 py-2 -mt-1 hover:bg-surface-container-low transition-colors duration-150 cursor-pointer border border-transparent hover:border-surface-container-high"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <span className="text-[15px] font-semibold text-on-surface block leading-tight">{item.name}</span>
              <span className="text-[12px] text-secondary mt-0.5 block">{item.responsible}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap uppercase tracking-wider ${styles.badge}`}>
                {styles.label}
              </span>
              {expanded ? (
                <ChevronUp size={16} className="text-secondary" />
              ) : (
                <ChevronDown size={16} className="text-secondary" />
              )}
            </div>
          </div>

          {/* Expanded Drawer content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-surface-container-high space-y-3.5 animate-fadeIn">
              {/* Tasks List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Required Checklist Tasks</span>
                <div className="space-y-1.5 pl-0.5">
                  {tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isCleared ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent"
                      }`}>
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className={`text-xs ${isCleared ? "text-secondary line-through" : "text-on-surface"}`}>
                        {task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks & Clearance Date */}
              {(item.remarks || (isCleared && item.dateCleared)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {item.remarks && (
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Remarks</span>
                      <p className="text-[12px] text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 inline-block leading-snug">
                        {item.remarks}
                      </p>
                    </div>
                  )}
                  {isCleared && item.dateCleared && (
                    <div>
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">Date Cleared</span>
                      <span className="text-[12px] text-on-surface bg-surface-container px-2.5 py-1 rounded-md border border-surface-container-high inline-block">
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

export default function StudentClearance() {
  const [student, setStudent] = useState<any>(null);
  const [requirements, setRequirements] = useState<ClearanceItem[]>([]);

  useEffect(() => {
    // Load student profile
    const storedStudents = localStorage.getItem("students");
    const studentsList = storedStudents ? JSON.parse(storedStudents) : mockStudents;
    
    // Check if studentId is passed in URL
    const params = new URLSearchParams(window.location.search);
    const studentIdParam = params.get("studentId");
    
    const targetStudentId = studentIdParam || "2021-0492";
    const currentStudent = studentsList.find((s: any) => s.id === targetStudentId) || studentsList[0];
    setStudent(currentStudent);

    // Load requirements and normalize Rejected status to Pending
    const storedReqs = localStorage.getItem("requirements");
    const reqsList = storedReqs ? JSON.parse(storedReqs) : mockRequirements;
    const normalizedReqs = reqsList.map((r: any) => ({
      ...r,
      status: r.status === "Rejected" ? "Pending" : r.status,
    }));
    setRequirements(normalizedReqs);
  }, []);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
      </div>
    );
  }

  // Filter requirements by type
  const headOffices = requirements.filter((req) => req.type === "office");
  const orgsClubs = requirements.filter((req) => req.type === "org");

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            Clearance Requirements
          </h2>
          <p className="text-secondary text-body-sm">
            Track and complete requirements for {student.semester}
            {new URLSearchParams(window.location.search).get("studentId") && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium text-xs">
                Viewing for {student.name} ({student.id})
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Lists of Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Head Offices Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-title-md text-base font-bold text-on-surface">Head Offices</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-secondary-fixed text-on-secondary-fixed uppercase tracking-wider">
              {headOffices.length} Total
            </span>
          </div>
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm">
            <div className="space-y-1">
              {headOffices.map((item, i) => (
                <ClearanceItemRow
                  key={item.id}
                  item={item}
                  isLast={i === headOffices.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Orgs & Clubs Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-title-md text-base font-bold text-on-surface">Orgs & Clubs</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-secondary-fixed text-on-secondary-fixed uppercase tracking-wider">
              {orgsClubs.length} Total
            </span>
          </div>
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm">
            <div className="space-y-1">
              {orgsClubs.map((item, i) => (
                <ClearanceItemRow
                  key={item.id}
                  item={item}
                  isLast={i === orgsClubs.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
