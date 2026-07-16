"use client";

import { useState, useEffect, useRef } from "react";
import { mockStudents } from "@/mock/mockStudents";
import { mockRequirements, mockStudentClearanceRecords, mockOrgs, mockOrgMembers, defaultOfficeRequirements, defaultOrgRequirements, mockDepartments, defaultDepartmentRequirements } from "@/mock/mockData";
import { Check, ChevronDown, ChevronUp, UploadCloud, FileText, X } from "lucide-react";

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



function ClearanceItemRow({ item, isLast, isSysAdminView, onStatusChange, tasks = [] }: { item: ClearanceItem; isLast: boolean; isSysAdminView: boolean; onStatusChange: (status: ClearanceItem["status"], data?: { remarks?: string, uploadedFiles?: Record<number, string>, completedTasks?: number[] }) => void, tasks?: { label: string; requiresUpload?: boolean }[] }) {
  const [expanded, setExpanded] = useState(false);
  const styles = itemStatusStyles[item.status] || itemStatusStyles.Pending;

  // Track completed tasks locally for this mock
  const [completedTasks, setCompletedTasks] = useState<number[]>(item.completedTasks || []);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>(item.uploadedFiles || {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);

  // If the status is Cleared or Submitted, all tasks should appear completed
  const isFullyComplete = item.status === "Cleared" || item.status === "Submitted";

  useEffect(() => {
    if (isFullyComplete && completedTasks.length !== tasks.length) {
      setCompletedTasks(tasks.map((_, idx) => idx));
    }
  }, [isFullyComplete, tasks.length, completedTasks.length]);

  const handleToggleTask = (idx: number, requiresUpload?: boolean) => {
    if (isSysAdminView || isFullyComplete) return; // Prevent edits if sysadmin or already submitted/cleared

    if (requiresUpload && !completedTasks.includes(idx) && !uploadedFiles[idx]) {
      // Prompt for upload
      setActiveUploadIndex(idx);
      fileInputRef.current?.click();
      return;
    }

    setCompletedTasks((prev) => {
      const isCurrentlyCompleted = prev.includes(idx);
      const newCompleted = isCurrentlyCompleted ? prev.filter((i) => i !== idx) : [...prev, idx];
      
      // If all tasks are completed, change status to Submitted automatically
      if (newCompleted.length === tasks.length && item.status !== "Cleared") {
        onStatusChange("Submitted");
      } else if (newCompleted.length < tasks.length && item.status === "Submitted") {
        onStatusChange("Pending");
      }
      
      return newCompleted;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeUploadIndex !== null) {
      const fileName = e.target.files[0].name;
      setUploadedFiles(prev => ({ ...prev, [activeUploadIndex]: fileName }));
      
      setCompletedTasks((prev) => {
        if (!prev.includes(activeUploadIndex)) {
          const newCompleted = [...prev, activeUploadIndex];
          if (newCompleted.length === tasks.length && item.status !== "Cleared") {
            onStatusChange("Submitted", { uploadedFiles: { ...uploadedFiles, [activeUploadIndex]: fileName }, completedTasks: newCompleted });
          }
          return newCompleted;
        }
        return prev;
      });
      
      setActiveUploadIndex(null);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex gap-3">
      {/* Node + connecting line */}
      <div className="flex flex-col items-center mt-1">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${styles.dot}`}
        >
          {item.status === "Cleared" && <Check size={12} strokeWidth={4} />}
          {item.status === "Submitted" && <Check size={12} strokeWidth={4} />}
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
              {/* Tasks List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Required Checklist</span>
                
                <div className="space-y-2">
                  {tasks.map((task, idx) => {
                    const isTaskCompleted = completedTasks.includes(idx);
                    
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div 
                          className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${!isSysAdminView && !isFullyComplete ? 'cursor-pointer hover:bg-surface-container-high/50' : ''}`}
                          onClick={() => handleToggleTask(idx, task.requiresUpload)}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-[4px] flex items-center justify-center border transition-colors shrink-0 ${
                            isTaskCompleted 
                              ? "bg-primary border-primary text-white" 
                              : "border-outline-variant bg-surface-container-lowest text-transparent"
                          }`}>
                            <Check size={12} strokeWidth={4} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm block ${isTaskCompleted ? "text-secondary line-through" : "text-on-surface font-medium"}`}>
                              {task.label}
                            </span>
                            
                            {/* Upload area if needed and not completed */}
                            {task.requiresUpload && !isTaskCompleted && !isSysAdminView && !isFullyComplete && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                                <UploadCloud size={14} />
                                Click to Upload Document
                              </div>
                            )}
                            
                            {/* Show uploaded file name */}
                            {(uploadedFiles[idx] || (isTaskCompleted && task.requiresUpload)) && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-secondary bg-surface-container px-2 py-1 rounded inline-flex max-w-full">
                                <FileText size={12} className="shrink-0" />
                                <span className="truncate">{uploadedFiles[idx] || "document_submitted.pdf"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit All Button for Student (if all checked but status is still Pending/Rejected) */}
              {!isSysAdminView && !isFullyComplete && completedTasks.length === tasks.length && (
                <div className="pt-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onStatusChange("Submitted", { uploadedFiles, completedTasks }); }}
                    className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                  >
                    Submit Requirements for Review
                  </button>
                </div>
              )}

              {/* SysAdmin Evaluation Buttons */}
              {isSysAdminView && item.status === "Submitted" && (
                <div className="pt-3 mt-3 border-t border-surface-container-low flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Evaluate Submission</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onStatusChange("Cleared", { remarks: "", dateCleared: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } as any); 
                      }}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const remark = prompt("Please provide a remark for rejection:");
                        if (remark) {
                          onStatusChange("Rejected", { remarks: remark });
                        }
                      }}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Remarks & Clearance Date */}
              {(item.remarks || (item.status === "Cleared" && item.dateCleared)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 mt-2 border-t border-surface-container-low">
                  {item.remarks && (
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
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".pdf,.doc,.docx,.jpg,.png"
      />
    </div>
  );
}

export function ClearanceStatusView({ targetStudentId, isSysAdminView = false }: { targetStudentId?: string, isSysAdminView?: boolean }) {
  const [student, setStudent] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentEntityId, setCurrentEntityId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<ClearanceItem[]>([]);
  const [officeReqs, setOfficeReqs] = useState<Record<number, any[]>>({});
  const [orgReqs, setOrgReqs] = useState<Record<number, any[]>>({});
  const [deptReqs, setDeptReqs] = useState<Record<number, any[]>>({});

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

    // Load dynamic requirements configurations
    const storedOfficeReqs = localStorage.getItem("officeRequirements");
    setOfficeReqs(storedOfficeReqs ? JSON.parse(storedOfficeReqs) : defaultOfficeRequirements);

    const storedOrgReqs = localStorage.getItem("orgRequirements");
    setOrgReqs(storedOrgReqs ? JSON.parse(storedOrgReqs) : defaultOrgRequirements);

    const storedDeptReqs = localStorage.getItem("departmentRequirements");
    setDeptReqs(storedDeptReqs ? JSON.parse(storedDeptReqs) : defaultDepartmentRequirements);

    // Load student profile
    const storedStudents = localStorage.getItem("students");
    const studentsList = storedStudents ? JSON.parse(storedStudents) : mockStudents;
    
    // Check if studentId is passed in URL or props
    let resolvedId = targetStudentId;
    if (!resolvedId) {
      const params = new URLSearchParams(window.location.search);
      resolvedId = params.get("studentId") || localStorage.getItem("activeStudentId") || "2021-0492";
    }
    
    const currentStudent = studentsList.find((s: any) => s.id === resolvedId) || studentsList[0];
    setStudent(currentStudent);

    // Load base requirements
    const storedReqs = localStorage.getItem("requirements");
    const reqsList = storedReqs ? JSON.parse(storedReqs) : mockRequirements;
    
    // Filter base offices (orgs are dynamic per student)
    const baseOffices = reqsList.filter((r: any) => r.type === "office");

    // Dynamically build org requirements for this student
    const studentOrgs = mockOrgMembers
      .filter((m) => m.studentId === currentStudent.id)
      .map((m) => mockOrgs.find((o) => o.id === m.orgId))
      .filter(Boolean);

    const dynamicOrgs = studentOrgs.map((org: any) => ({
      id: org.id, // Using orgId directly so mapping works
      name: "Org Membership Clearance",
      responsible: org.name,
      type: "org",
      status: "Pending",
      dateCleared: null,
      remarks: "",
    }));

    // Dynamically build department requirement for this student
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

    // Load student clearance records (dynamic from Head Office)
    let storedRecords = localStorage.getItem("studentClearanceRecords");
    if (!storedRecords) {
      localStorage.setItem("studentClearanceRecords", JSON.stringify(mockStudentClearanceRecords));
      storedRecords = JSON.stringify(mockStudentClearanceRecords);
    }
    const records = JSON.parse(storedRecords);
    const studentRecords = records[currentStudent.id] || [];

    // Merge base requirements with actual student clearance status
    const mergedReqs = combinedReqs.map((req: any) => {
      const matchingRecord = studentRecords.find((r: any) => 
        (req.type === "office" && r.officeId === req.id) || 
        (req.type === "org" && r.orgId === req.id) ||
        (req.type === "department" && r.departmentId === req.id)
      );
      
      if (matchingRecord) {
        return {
          ...req,
          status: matchingRecord.status || "Pending",
          dateCleared: matchingRecord.dateCleared,
          remarks: matchingRecord.remarks,
          uploadedFiles: matchingRecord.uploadedFiles,
          completedTasks: matchingRecord.completedTasks
        };
      }
      
      return {
        ...req,
        status: req.status || "Pending",
      };
    });

    setRequirements(mergedReqs);
  }, [targetStudentId]);

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

  // Only show the requirements for the logged in entity's portal
  if (currentUserRole === "head-office" && currentEntityId) {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Clearance Requirements
          </h2>
          <p className="text-secondary text-body-sm flex items-center gap-2">
            Track and complete requirements for {student.semester}
            {isSysAdminView && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-bold text-[10px] uppercase tracking-wider">
                Viewing: {student.name} ({student.id})
              </span>
            )}
          </p>
        </div>
        {isSysAdminView && (
          <a
            href="/admin/user-management/students"
            className="flex items-center justify-center gap-2 text-sm font-bold text-secondary hover:text-primary transition-colors bg-surface-container-lowest border border-surface-container-high hover:border-primary/30 px-4 py-2 rounded-lg shadow-sm whitespace-nowrap"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back to Constituents
          </a>
        )}
      </section>

      {!isSysAdminView && (
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
                  const tasks = (officeReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ label: r.name, requiresUpload: r.requiresUpload }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === headOffices.length - 1}
                      isSysAdminView={isSysAdminView}
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
                  const tasks = (deptReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ label: r.name, requiresUpload: r.requiresUpload }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === departments.length - 1}
                      isSysAdminView={isSysAdminView}
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
                  const tasks = (orgReqs[item.id] || []).filter(r => r.status === "Live" && isApplicable(r)).map(r => ({ label: r.name, requiresUpload: r.requiresUpload }));
                  return (
                    <ClearanceItemRow
                      key={item.id}
                      item={item}
                      isLast={i === orgsClubs.length - 1}
                      isSysAdminView={isSysAdminView}
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
