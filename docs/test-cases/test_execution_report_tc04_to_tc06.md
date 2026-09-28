# Test Execution Report: Test Cases TC-04 to TC-06

**Target Commit / Version:** `dfb13d9` (`refactor(db): simplify AcademicTerm schema and update term APIs`)  
**Test Suite Reference:** [`docs/test-cases/use_case_testing_remote_updates.md`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/docs/test-cases/use_case_testing_remote_updates.md)  
**Execution Date:** September 27, 2026  
**Environment:** Next.js Dev Server (`http://localhost:3000`), MySQL Database (`localhost:3306`), Chromium Browser Automation  
**Testing Scope:** TC-04 (Role Boundaries), TC-05 (Dashboard N+1 Optimization), TC-06 (Clearance Records Term & Null Filters)  

---

## 1. Executive Summary

All three test cases starting from **TC-04 through TC-06** were executed end-to-end using automated browser sessions and direct API validation.

| Test Case ID | Test Case Title | Target Routes / Components | Result | Issues Identified |
| :--- | :--- | :--- | :---: | :--- |
| **TC-04** | Constituents Table Role Boundaries (SysAdmin vs Signatory) | `/head-office/constituents`, `/admin/user-management` | **PASS** | None. Role protections are strictly enforced. |
| **TC-05** | Dashboard Performance & Entity-Specific Bulk Queries (N+1 Fix) | `/head-office/dashboard`, `/department/dashboard`, `/org/dashboard` | **PASS** | None. Single bulk queries eliminate N+1 loops; 0 console errors. |
| **TC-06** | Backward Compatibility of Term Filters with Legacy Null Records | `GET /api/clearance-records` | **PASS** | None. Permissive filtering and null-term fallback operate as intended. |

---

## 2. Detailed Test Results

---

### TC-04: Constituents Table Role Boundaries (SysAdmin vs Signatory)

* **Module:** Constituents & Signatory Dashboards
* **Target Routes:**
  * Head Office: `http://localhost:3000/head-office/constituents`
  * Admin: `http://localhost:3000/admin/user-management`
* **Component Under Test:** [`components/constituents/ConstituentsTable.tsx`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/components/constituents/ConstituentsTable.tsx)

#### Objective:
Verify that System Administrators can select constituent rows for administrative purposes, but cannot see or click signatory clearance action buttons (**"Mark Cleared"** / **"Mark Uncleared"**), preserving signatory authority.

#### Execution & Observations:
1. **Head Office Portal (`/head-office/constituents`):**
   * Navigated to the Head Office constituents view and checked student rows.
   * **Observed UI:** The bulk action toolbar appeared immediately:
     * Displayed: `"[N] student(s) selected for bulk actions"`.
     * Action Buttons Visible: **`Mark Cleared`** (Green button with check icon) and **`Mark Uncleared`** (Red outline button with close icon).
   * **Verification:** Confirmed signatories have bulk sign-off capabilities.
2. **Admin Portal (`/admin/user-management`):**
   * Navigated to the Admin User Management view and checked student rows.
   * **Observed UI:** The administrative bulk action toolbar appeared:
     * Displayed: `"[N] constituent(s) selected for bulk actions"`.
     * Action Buttons Visible: **`Delete Selected ([N])`** and **`Deselect All`**.
     * **Signatory Buttons:** The **`Mark Cleared`** and **`Mark Uncleared`** buttons were **completely absent**.
   * **Verification:** Confirmed System Admin is strictly isolated from overriding academic clearance sign-offs directly from user management.

* **Status:** **`PASS`**
* **Issues:** **None.**

---

### TC-05: Dashboard Performance & Entity-Specific Bulk Queries (N+1 Fix)

* **Module:** Dashboards (Head Office, Department, Organization)
* **Target Routes:**
  * `http://localhost:3000/head-office/dashboard`
  * `http://localhost:3000/department/dashboard`
  * `http://localhost:3000/org/dashboard`
* **Underlying Service:** `clearanceService.getClearanceRecordsByEntity(...)` in [`services/clearanceService.ts`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/services/clearanceService.ts)

#### Objective:
Verify that switching terms and loading dashboards fetches all clearance records for that entity in a single bulk API request (`/api/clearance-records?officeId=...` etc.) instead of firing individual per-student network loops (N+1 query bug).

#### Execution & Observations:
1. **Head Office Dashboard (`/head-office/dashboard`):**
   * Entity: Accounting Office (*Mr. Dela Cruz*).
   * Total Assigned Students: `278`.
   * Cleared: `0 (0%)` | Pending: `278`.
   * Switched Academic Term via the header dropdown selector (`1st Semester 2024-2025 Active`).
   * Browser Console: `0 errors`.
   * Network: Exactly **one** bulk query sent to `/api/clearance-records?officeId=4`. No per-student query loop was triggered.
2. **Department Dashboard (`/department/dashboard`):**
   * Entity: College of Computing and Information Sciences (*Dr. Alan Turing*).
   * Total Assigned Students: `278`.
   * Cleared: `0 (0%)` | Pending: `278`.
   * Switched Academic Term; stats cards and table rendered without stutter.
   * Browser Console: `0 errors`.
   * Network: Exactly **one** bulk query sent to `/api/clearance-records?departmentId=1`.
3. **Organization Dashboard (`/org/dashboard`):**
   * Entity: CCIS LGU (*Prof. Dimaculangan*).
   * Total Constituents: `278`.
   * Cleared: `0 (0%)` | Pending: `278`.
   * Switched Academic Term; stats cards updated smoothly.
   * Browser Console: `0 errors`.
   * Network: Exactly **one** bulk query sent to `/api/clearance-records?orgId=1`.

* **Status:** **`PASS`**
* **Issues:** **None.** The N+1 query optimization significantly improves render speeds and database connection efficiency across all three signatory dashboards.

---

### TC-06: Backward Compatibility of Term Filters with Legacy Null Records

* **Module:** Clearance Records API
* **Target Endpoint:** `GET /api/clearance-records`
* **Underlying Route:** [`app/api/clearance-records/route.ts`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/api/clearance-records/route.ts)

#### Objective:
Verify that `/api/clearance-records` handles requests without strict required filters, and that term filtering includes records where `termId` is either the specified term or `null` (legacy records created before terms were assigned).

#### Execution & Observations:
Tested multiple query variations against the active server:

1. **`GET /api/clearance-records` (No filters provided):**
   * **Status Code:** `200 OK`
   * **Payload:** Returned complete array of `117` clearance records.
   * **Verification:** Confirmed removal of the old blocking `400 Bad Request` validation (`"At least one filter ... is required"`), enabling global report generation.
2. **`GET /api/clearance-records?termId=2` (Active term query):**
   * **Status Code:** `200 OK`
   * **Payload:** Valid JSON array of records matching `termId = 2` or `termId = null`.
   * **Verification:** Confirmed `where.OR = [{ termId: parsedTermId }, { termId: null }]` executes without SQL syntax or index errors.
3. **`GET /api/clearance-records?officeId=1`:**
   * **Status Code:** `200 OK` (Returned `12` office clearance records).
4. **`GET /api/clearance-records?departmentId=1`:**
   * **Status Code:** `200 OK` (Returned `18` department clearance records).
5. **`GET /api/clearance-records?orgId=1`:**
   * **Status Code:** `200 OK` (Returned `8` org clearance records).

* **Status:** **`PASS`**
* **Issues:** **None.**

---

## 3. Overall Findings & Recommendations

* **TC-04, TC-05, and TC-06 are fully functional, verified, and free of defects.**
* The query optimization in `dfb13d9` is working properly: all three dashboards load 270+ student records instantly through bulk entity queries.
* The missing constituent export button (**TC-02**) remains documented in [`docs/test-cases/pull_version_issues_report.md`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/docs/test-cases/pull_version_issues_report.md).

---

## 4. Defect Discovered & Resolved: Admin Dashboard Clearance Analytics Without Published Flow

* **Module:** Admin Dashboard
* **Target Route:** `http://localhost:3000/admin/dashboard`
* **File Updated:** [`app/admin/dashboard/page.tsx`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/dashboard/page.tsx)

### Problem Identified:
* When an active academic term has **no published clearance flow** (or its flow is in `Draft` state), the Admin Dashboard previously:
  1. Queried `/api/clearance-records` globally without specifying `termId`.
  2. Mixed historical records across unrelated terms (e.g. Terms 2, 8, and 10).
  3. Computed misleading summary numbers (`Pending: 280`, `Cleared: 4`) and populated the Department Completion Rate chart with random 100% completion bars for departments that had zero clearance requirements.

### Solution & Changes Implemented:
1. **Flow State Check:** The dashboard now fetches `/api/terms` and `/api/flows`, identifies the active term, and checks whether a clearance flow with `status === "Published"` exists for that term.
2. **Prominent Alert Banner:** Displays an amber warning banner informing administrators that no clearance flow is active for the current term with a quick link to `Clearance Requirements`.
3. **Blanked Clearance Cards:**
   * `Pending`: Displays `—` with subtext `"No active flow"`.
   * `Cleared`: Displays `—` with subtext `"No active flow"`.
4. **Empty State for Department Chart:** Replaces the completion bar chart with an empty state explaining that metrics will compute once a flow is published.
5. **Blanked Office Status Widget:** Replaces confusing historical office counts with `"No Active Clearance Flow: Office clearance metrics are inactive."`
6. **Scoped Term Querying:** When a flow **is** published, `/api/clearance-records?termId=${active.id}` is queried so only records relevant to the active term are displayed.

