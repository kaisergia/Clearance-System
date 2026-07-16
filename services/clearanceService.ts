/**
 * DATABASE SWAP POINT
 * 
 * This file (services/clearanceService.ts) acts as the service abstraction layer for all
 * student profile records, clearance requirements, and status checks. Currently, it reads
 * and writes to localStorage using mock initial data.
 * 
 * Swap Instructions:
 * When migrating to a real database (e.g. Supabase, Prisma, REST API), replace the localStorage
 * read/write operations within these functions with database calls (e.g. supabaseClient queries).
 * Because all functions are fully asynchronous, no changes will be needed in the UI components
 * or pages calling them.
 */

import { mockStudents } from "@/mock/mockStudents";
import { 
  mockRequirements, 
  mockStudentClearanceRecords, 
  mockOrgMembers, 
  mockOrgs, 
  mockDepartments 
} from "@/mock/mockData";

export interface ClearanceItem {
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

// Initialize localStorage mock database if not already done
let isInitializing = false;
const initStorage = () => {
  if (typeof window === "undefined") return;

  const initialized = localStorage.getItem("clearance_initialized");
  if (!initialized && !isInitializing) {
    isInitializing = true;
    localStorage.setItem("students", JSON.stringify(mockStudents));
    localStorage.setItem("studentClearanceRecords", JSON.stringify(mockStudentClearanceRecords));
    localStorage.setItem("requirements", JSON.stringify(mockRequirements));
    localStorage.setItem("clearance_initialized", "true");
    sanitizeExistingStudentRecords().then(() => {
      isInitializing = false;
    });
  }
};

/**
 * Retrieves the list of all students.
 */
export async function getStudents(): Promise<any[]> {
  initStorage();
  if (typeof window === "undefined") return mockStudents;

  const stored = localStorage.getItem("students");
  return stored ? JSON.parse(stored) : mockStudents;
}

/**
 * Retrieves a specific student profile.
 */
export async function getStudentById(studentId: string): Promise<any | null> {
  const students = await getStudents();
  return students.find((s) => s.id === studentId) || null;
}

/**
 * Retrieves all individual clearance records.
 */
export async function getStudentClearanceRecords(studentId: string): Promise<any[]> {
  initStorage();
  if (typeof window === "undefined") return mockStudentClearanceRecords[studentId] || [];

  const stored = localStorage.getItem("studentClearanceRecords");
  if (!stored) return [];
  const records = JSON.parse(stored);
  return records[studentId] || [];
}

/**
 * Dynamically assembles and returns a student's full list of clearance requirements (merged with status).
 */
export async function getStudentRequirements(studentId: string): Promise<ClearanceItem[]> {
  initStorage();
  const student = await getStudentById(studentId);
  if (!student) return [];

  // 1. Get base office requirements
  const storedReqs = localStorage.getItem("requirements");
  const reqsList = storedReqs ? JSON.parse(storedReqs) : mockRequirements;
  const baseOffices = reqsList.filter((r: any) => r.type === "office");

  // 2. Get dynamic org requirements based on logical rules (Gov, LGU, AcademicClub, NonAcademicClub)
  const applicableOrgs = mockOrgs.filter((org) => {
    if (org.type === "Gov") {
      return true; // Gov applies to all students
    }
    if (org.type === "LGU") {
      return org.department === student.department; // LGU applies to students in the same department
    }
    if (org.type === "AcademicClub") {
      const studentProgCode = PROGRAM_MAP[student.program] || student.program;
      return org.program === studentProgCode; // AcademicClub applies to students in the program
    }
    if (org.type === "NonAcademicClub") {
      return mockOrgMembers.some((m) => m.orgId === org.id && m.studentId === student.id); // Member-only
    }
    return false;
  });

  const dynamicOrgs = applicableOrgs.map((org: any) => ({
    id: org.id,
    name: "Org Membership Clearance",
    responsible: org.name,
    type: "org" as const,
    status: "Pending" as const,
    dateCleared: null,
    remarks: "",
  }));

  // 3. Get dynamic department requirements
  const studentDept = mockDepartments.find((d: any) => d.abbreviation === student.department);
  const dynamicDepts = studentDept ? [{
    id: studentDept.id,
    name: "Department Clearance",
    responsible: studentDept.name,
    type: "department" as const,
    status: "Pending" as const,
    dateCleared: null,
    remarks: "",
  }] : [];

  const combined = [...baseOffices, ...dynamicOrgs, ...dynamicDepts];

  // 4. Merge with student's individual clearance records
  const records = await getStudentClearanceRecords(studentId);

  return combined.map((req: any) => {
    const matching = records.find((r: any) => 
      (req.type === "office" && r.officeId === req.id) || 
      (req.type === "org" && r.orgId === req.id) ||
      (req.type === "department" && r.departmentId === req.id)
    );

    if (matching) {
      return {
        ...req,
        status: matching.status || "Pending",
        dateCleared: matching.dateCleared,
        remarks: matching.remarks,
        uploadedFiles: matching.uploadedFiles,
        completedTasks: matching.completedTasks
      };
    }

    return {
      ...req,
      status: req.status || "Pending",
    };
  });
}

/**
 * Computes and returns the overall clearance status of a student.
 * Overall status is "Cleared" if and only if ALL requirements are "Cleared".
 */
export async function getOverallClearanceStatus(studentId: string): Promise<"Cleared" | "Pending"> {
  const reqs = await getStudentRequirements(studentId);
  if (reqs.length === 0) return "Pending";

  const allCleared = reqs.every((r) => r.status === "Cleared");
  return allCleared ? "Cleared" : "Pending";
}

/**
 * Synchronizes the student's overall status back to the main students list.
 */
export async function syncOverallStudentStatus(studentId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const overallStatus = await getOverallClearanceStatus(studentId);

  const storedStudents = localStorage.getItem("students");
  if (storedStudents) {
    const list = JSON.parse(storedStudents);
    const updated = list.map((s: any) => {
      if (s.id === studentId) {
        return { ...s, status: overallStatus };
      }
      return s;
    });
    localStorage.setItem("students", JSON.stringify(updated));
  }
}

/**
 * Updates a clearance record for a specific requirement node (office, org, or department).
 * Also automatically syncs and recomputes the student's overall status.
 */
export async function updateClearanceRecord(
  studentId: string,
  entityId: number,
  type: "office" | "org" | "department",
  status: "Cleared" | "Pending" | "Rejected" | "Submitted",
  data: Partial<Omit<ClearanceItem, "id" | "type" | "status">> = {}
): Promise<void> {
  initStorage();
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem("studentClearanceRecords");
  if (!stored) return;

  const records = JSON.parse(stored);
  if (!records[studentId]) records[studentId] = [];

  const studentRecords = records[studentId];
  const isOffice = type === "office";
  const isOrg = type === "org";
  const isDept = type === "department";

  const existingIdx = studentRecords.findIndex((r: any) => 
    (isOffice && r.officeId === entityId) || 
    (isOrg && r.orgId === entityId) ||
    (isDept && r.departmentId === entityId)
  );

  const dateCleared = status === "Cleared" 
    ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
    : null;

  const recordPayload = {
    ...(isOffice && { officeId: entityId }),
    ...(isOrg && { orgId: entityId }),
    ...(isDept && { departmentId: entityId }),
    status,
    dateCleared: data.dateCleared !== undefined ? data.dateCleared : dateCleared,
    remarks: data.remarks || "",
    uploadedFiles: data.uploadedFiles,
    completedTasks: data.completedTasks
  };

  if (existingIdx >= 0) {
    studentRecords[existingIdx] = {
      ...studentRecords[existingIdx],
      ...recordPayload
    };
  } else {
    studentRecords.push(recordPayload);
  }

  records[studentId] = studentRecords;
  localStorage.setItem("studentClearanceRecords", JSON.stringify(records));

  // Safeguard: Sync the overall student status list with the new requirements state
  await syncOverallStudentStatus(studentId);

  // Dispatch a custom event to notify listeners that clearance records changed
  window.dispatchEvent(new Event("clearanceRecordsUpdated"));
}

/**
 * Checks and corrects static status mismatches for ALL students.
 * (Run once on system load / initialization to align legacy states)
 */
export async function sanitizeExistingStudentRecords(): Promise<void> {
  initStorage();
  if (typeof window === "undefined") return;

  const students = await getStudents();
  for (const student of students) {
    await syncOverallStudentStatus(student.id);
  }
}
