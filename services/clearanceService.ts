/**
 * services/clearanceService.ts
 *
 * ★ DATABASE SWAP POINT ★
 *
 * This is the single data-access layer for all student records, clearance
 * requirements, and status checks.
 *
 * ── How the dual-mode fallback works ─────────────────────────────────────────
 * Each function first tries to reach the database through the Next.js API
 * routes (e.g. GET /api/students). If the API returns a non-OK response
 * (e.g. the DB is not yet connected, or you're running without XAMPP),
 * it automatically falls back to localStorage / mock data so the app
 * continues to work during development.
 *
 * This means you can flip between mock mode and DB mode just by
 * starting / stopping XAMPP — no code changes needed.
 *
 * ── Swapping to full DB mode ──────────────────────────────────────────────────
 * Once the DB is running and seeded, the API routes will respond correctly
 * and the fallback paths will never execute. Remove the fallback blocks
 * (marked "FALLBACK") when you're ready to enforce DB-only mode.
 */

import { mockStudents } from "@/mock/mockStudents";
import {
  mockRequirements,
  mockStudentClearanceRecords,
  mockOrgMembers,
  mockOrgs,
  mockOffices,
  mockDepartments,
  defaultDepartmentRequirements,
  defaultOfficeRequirements,
  defaultOrgRequirements,
} from "@/mock/mockData";
import { PROGRAM_MAP } from "@/lib/constants";

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

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True when running in the browser (not during SSR). */
const isBrowser = typeof window !== "undefined";

/**
 * Wrapper around fetch that returns null on any error, so callers can fall
 * back to localStorage gracefully.
 */
async function apiFetch<T>(path: string): Promise<T | null> {
  if (!isBrowser) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  if (!isBrowser) return null;
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage initialization  (mock mode only)
// ─────────────────────────────────────────────────────────────────────────────

let isInitializing = false;
const initStorage = () => {
  if (!isBrowser) return;
  const initialized = localStorage.getItem("clearance_initialized");
  if (!initialized && !isInitializing) {
    isInitializing = true;
    localStorage.setItem("students", JSON.stringify(mockStudents));
    localStorage.setItem("studentClearanceRecords", JSON.stringify(mockStudentClearanceRecords));
    localStorage.setItem("requirements", JSON.stringify(mockRequirements));
    localStorage.setItem("clearance_initialized", "true");
    sanitizeExistingStudentRecords().then(() => { isInitializing = false; });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Students
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves all students.
 * DB mode:   GET /api/students
 * Fallback:  localStorage["students"] → mockStudents
 */
export async function getStudents(): Promise<any[]> {
  const dbResult = await apiFetch<any[]>("/api/students");
  if (dbResult) return dbResult;

  // FALLBACK (mock/localStorage)
  initStorage();
  if (!isBrowser) return mockStudents;
  const stored = localStorage.getItem("students");
  return stored ? JSON.parse(stored) : mockStudents;
}

/**
 * Retrieves a specific student profile by ID.
 */
export async function getStudentById(studentId: string): Promise<any | null> {
  const dbResult = await apiFetch<any>(`/api/students/${studentId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  const students = await getStudents();
  return students.find((s) => s.id === studentId) || null;
}

/**
 * Returns the currently logged-in student profile.
 * Reads the identity key set at login (localStorage["activeStudentId"]).
 */
export async function getStudentProfile(): Promise<any | null> {
  const students = await getStudents();
  if (!isBrowser) return students[0] || null;

  // Priority: localStorage → cookie (set synchronously by AuthProvider) → mock fallback
  const localId = localStorage.getItem("activeStudentId");
  const cookieId = document.cookie
    .split("; ")
    .find(c => c.startsWith("activeStudentId="))
    ?.split("=")[1];

  const studentId = localId || cookieId;
  if (studentId) {
    return students.find((s: any) => s.id === studentId) || null;
  }
  // Last resort: return the mock Eleanor student only for dev bypass
  return students.find((s: any) => s.id === "2021-0492") || students[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clearance Records
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentClearanceRecords(studentId: string): Promise<any[]> {
  const dbResult = await apiFetch<any[]>(`/api/clearance-records?studentId=${studentId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  initStorage();
  if (!isBrowser) return mockStudentClearanceRecords[studentId] || [];
  const stored = localStorage.getItem("studentClearanceRecords");
  if (!stored) return [];
  const records = JSON.parse(stored);
  return records[studentId] || [];
}

export async function getStudentRequirements(studentId: string): Promise<ClearanceItem[]> {
  const dbResult = await apiFetch<ClearanceItem[]>(`/api/student-requirements?studentId=${studentId}`);
  if (dbResult) return dbResult;

  // FALLBACK — original localStorage logic
  initStorage();
  const student = await getStudentById(studentId);
  if (!student) return [];

  const storedReqs = isBrowser ? localStorage.getItem("requirements") : null;
  const reqsList = storedReqs ? JSON.parse(storedReqs) : mockRequirements;
  const baseOffices = reqsList.filter((r: any) => r.type === "office");

  const applicableOrgs = mockOrgs.filter((org) => {
    if (org.type === "Gov") return true;
    if (org.type === "LGU") return org.department === student.department;
    if (org.type === "AcademicClub") {
      const studentProgCode = PROGRAM_MAP[student.program] || student.program;
      return org.program === studentProgCode;
    }
    if (org.type === "NonAcademicClub") {
      return mockOrgMembers.some((m) => m.orgId === org.id && m.studentId === student.id);
    }
    return false;
  });

  const dynamicOrgs = applicableOrgs.map((org: any) => ({
    id: org.id, name: "Org Membership Clearance", responsible: org.name,
    type: "org" as const, status: "Pending" as const, dateCleared: null, remarks: "",
  }));

  const studentDept = mockDepartments.find((d: any) => d.abbreviation === student.department);
  const dynamicDepts = studentDept ? [{
    id: studentDept.id, name: "Department Clearance", responsible: studentDept.name,
    type: "department" as const, status: "Pending" as const, dateCleared: null, remarks: "",
  }] : [];

  const combined = [...baseOffices, ...dynamicOrgs, ...dynamicDepts];
  const records = await getStudentClearanceRecords(studentId);

  return combined.map((req: any) => {
    const matching = records.find((r: any) =>
      (req.type === "office" && r.officeId === req.id) ||
      (req.type === "org" && r.orgId === req.id) ||
      (req.type === "department" && r.departmentId === req.id)
    );
    if (matching) {
      return { ...req, status: matching.status || "Pending", dateCleared: matching.dateCleared,
               remarks: matching.remarks, uploadedFiles: matching.uploadedFiles,
               completedTasks: matching.completedTasks };
    }
    return { ...req, status: req.status || "Pending" };
  });
}

export async function getOverallClearanceStatus(studentId: string): Promise<"Cleared" | "Pending"> {
  const reqs = await getStudentRequirements(studentId);
  if (reqs.length === 0) return "Pending";
  return reqs.every((r) => r.status === "Cleared") ? "Cleared" : "Pending";
}

export async function syncOverallStudentStatus(studentId: string): Promise<void> {
  if (!isBrowser) return;
  const overallStatus = await getOverallClearanceStatus(studentId);
  const storedStudents = localStorage.getItem("students");
  if (storedStudents) {
    const list = JSON.parse(storedStudents);
    const updated = list.map((s: any) =>
      s.id === studentId ? { ...s, status: overallStatus } : s
    );
    localStorage.setItem("students", JSON.stringify(updated));
  }
}

export async function updateClearanceRecord(
  studentId: string,
  entityId: number,
  type: "office" | "org" | "department",
  status: "Cleared" | "Pending" | "Rejected" | "Submitted",
  data: Partial<Omit<ClearanceItem, "id" | "type" | "status">> = {}
): Promise<void> {
  // Try DB first
  const dbResult = await apiPost("/api/clearance-records", {
    studentId, entityId, type, status, data,
  });

  if (!dbResult) {
    // FALLBACK — localStorage
    initStorage();
    if (!isBrowser) return;
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
      completedTasks: data.completedTasks,
    };

    if (existingIdx >= 0) {
      studentRecords[existingIdx] = { ...studentRecords[existingIdx], ...recordPayload };
    } else {
      studentRecords.push(recordPayload);
    }

    records[studentId] = studentRecords;
    localStorage.setItem("studentClearanceRecords", JSON.stringify(records));
    await syncOverallStudentStatus(studentId);
  }

  if (isBrowser) window.dispatchEvent(new Event("clearanceRecordsUpdated"));
}

export async function sanitizeExistingStudentRecords(): Promise<void> {
  initStorage();
  if (!isBrowser) return;
  const students = await getStudents();
  for (const student of students) {
    await syncOverallStudentStatus(student.id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Requirements  (office / department / org)
// ─────────────────────────────────────────────────────────────────────────────

export async function getDepartmentRequirements(departmentId: number): Promise<any[]> {
  const dbResult = await apiFetch<any[]>(`/api/requirements/department/${departmentId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return defaultDepartmentRequirements[departmentId] || [];
  const stored = localStorage.getItem("departmentRequirements");
  const allReqs = stored ? JSON.parse(stored) : defaultDepartmentRequirements;
  return allReqs[departmentId] || [];
}

export async function saveDepartmentRequirements(departmentId: number, requirements: any[]): Promise<void> {
  await apiPost(`/api/requirements/department/${departmentId}`, { requirements });

  // FALLBACK — always also write to localStorage (keeps mock mode in sync)
  if (!isBrowser) return;
  const stored = localStorage.getItem("departmentRequirements");
  const allReqs = stored ? JSON.parse(stored) : { ...defaultDepartmentRequirements };
  allReqs[departmentId] = requirements;
  localStorage.setItem("departmentRequirements", JSON.stringify(allReqs));
}

export async function getOfficeRequirements(officeId: number): Promise<any[]> {
  const dbResult = await apiFetch<any[]>(`/api/requirements/office/${officeId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return defaultOfficeRequirements[officeId] || [];
  const stored = localStorage.getItem("officeRequirements");
  const allReqs = stored ? JSON.parse(stored) : defaultOfficeRequirements;
  return allReqs[officeId] || [];
}

export async function saveOfficeRequirements(officeId: number, requirements: any[]): Promise<void> {
  await apiPost(`/api/requirements/office/${officeId}`, { requirements });

  if (!isBrowser) return;
  const stored = localStorage.getItem("officeRequirements");
  const allReqs = stored ? JSON.parse(stored) : { ...defaultOfficeRequirements };
  allReqs[officeId] = requirements;
  localStorage.setItem("officeRequirements", JSON.stringify(allReqs));
}

export async function getOrgRequirements(orgId: number): Promise<any[]> {
  const dbResult = await apiFetch<any[]>(`/api/requirements/org/${orgId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return defaultOrgRequirements[orgId] || [];
  const stored = localStorage.getItem("orgRequirements");
  const allReqs = stored ? JSON.parse(stored) : defaultOrgRequirements;
  return allReqs[orgId] || [];
}

export async function saveOrgRequirements(orgId: number, requirements: any[]): Promise<void> {
  await apiPost(`/api/requirements/org/${orgId}`, { requirements });

  if (!isBrowser) return;
  const stored = localStorage.getItem("orgRequirements");
  const allReqs = stored ? JSON.parse(stored) : { ...defaultOrgRequirements };
  allReqs[orgId] = requirements;
  localStorage.setItem("orgRequirements", JSON.stringify(allReqs));
}

export async function getOrgs(): Promise<any[]> {
  const dbResult = await apiFetch<any[]>("/api/orgs");
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return mockOrgs;
  const stored = localStorage.getItem("orgs");
  return stored ? JSON.parse(stored) : mockOrgs;
}

/**
 * Returns a single org by ID from the DB.
 * Falls back to mockOrgs if DB is unavailable.
 */
export async function getOrgById(orgId: number): Promise<any | null> {
  const orgs = await getOrgs();
  return orgs.find((o: any) => o.id === orgId) || null;
}

/**
 * Returns all offices from the DB.
 * Falls back to mockOffices if DB is unavailable.
 */
export async function getOffices(): Promise<any[]> {
  const dbResult = await apiFetch<any[]>("/api/offices");
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return mockOffices;
  return mockOffices;
}

/**
 * Returns a single office by ID from the DB.
 */
export async function getOfficeById(officeId: number): Promise<any | null> {
  const offices = await getOffices();
  return offices.find((o: any) => o.id === officeId) || null;
}

/**
 * Returns all departments from the DB.
 * Falls back to mockDepartments if DB is unavailable.
 */
export async function getDepartments(): Promise<any[]> {
  const dbResult = await apiFetch<any[]>("/api/departments");
  if (dbResult) return dbResult;

  // FALLBACK
  if (!isBrowser) return mockDepartments;
  return mockDepartments;
}

/**
 * Returns a single department by ID from the DB.
 */
export async function getDepartmentById(departmentId: number): Promise<any | null> {
  const departments = await getDepartments();
  return departments.find((d: any) => d.id === departmentId) || null;
}

/**
 * Returns student IDs that are members of a given org.
 * Used for NonAcademicClub constituent resolution.
 */
export async function getOrgMemberIds(orgId: number): Promise<string[]> {
  const dbResult = await apiFetch<string[]>(`/api/org-members?orgId=${orgId}`);
  if (dbResult) return dbResult;

  // FALLBACK
  return mockOrgMembers
    .filter((m: any) => m.orgId === orgId)
    .map((m: any) => m.studentId);
}

/**
 * Returns all org memberships for a given student (with org details).
 * Used on the student profile page.
 */
export async function getStudentOrgMemberships(studentId: string): Promise<any[]> {
  const dbResult = await apiFetch<any[]>(`/api/org-members?studentId=${encodeURIComponent(studentId)}`);
  if (dbResult) return dbResult;

  // FALLBACK
  const memberOrgs = mockOrgMembers
    .filter((m: any) => m.studentId === studentId)
    .map((m: any) => mockOrgs.find((o: any) => o.id === m.orgId))
    .filter(Boolean);
  return memberOrgs.map((org: any) => ({ org }));
}
