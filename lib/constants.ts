/**
 * lib/constants.ts
 *
 * Single source of truth for domain-level lookup tables.
 * These constants were previously duplicated inline across multiple pages
 * (department, head-office, org, and reports pages).
 *
 * DATABASE SWAP POINT: When using a real database, replace these static arrays
 * with async service calls that fetch departments/programs from the DB.
 */

export const DEPARTMENTS: string[] = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];

export const DEPT_PROGRAMS: Record<string, string[]> = {
  CCIS: ["BS Computer Science", "BS Information Technology"],
  COE: ["BS Civil Engineering", "BS Mechanical Engineering", "BS Electrical Engineering"],
  CEDAS: ["BS Data Science", "BS Applied Mathematics"],
  CHS: ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
  CABE: ["BS Business Administration", "BS Accountancy", "BS Hospitality Management"],
};

export const YEAR_LEVELS: string[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/** Flat list of every program across all departments. */
export const ALL_PROGRAMS: string[] = Array.from(
  new Set(Object.values(DEPT_PROGRAMS).flat())
);

/**
 * PROGRAM_MAP: abbreviation lookup used by clearanceService for org membership checks.
 * Kept here as a single source of truth.
 */
export const PROGRAM_MAP: Record<string, string> = {
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
  "BS Hospitality Management": "BSHM",
};
