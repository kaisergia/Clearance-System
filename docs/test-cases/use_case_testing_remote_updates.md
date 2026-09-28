# Use Case Testing Guide: Remote Updates & Schema Refactor

**Target Version / Commit:** `dfb13d9` (`refactor(db): simplify AcademicTerm schema and update term APIs`)  
**Document Location:** `docs/test-cases/use_case_testing_remote_updates.md`  
**Applicable Roles:** System Administrator, Head Office, Department Signatory, Organization Officer, Student  

---

## 1. Overview & Objectives

This document provides structured, end-to-end use case test procedures to validate all features, schema refactoring, and optimizations pulled from `origin/main` (`dfb13d9`).

### Key Areas Covered:
1. **Academic Term & Academic Year Architecture**: Structured `academicYear` + `semester` fields, compound unique validation, and new `/api/academic-years` endpoint.
2. **Constituent Export Modal**: Multi-parameter CSV/JSON export with dynamic filters from live SSC masterlist API in User Management.
3. **Reports Export Modal with Live Preview & Confirmation Dialog**: Real-time matching preview table and confirmation flow in Admin Reports.
4. **Constituents Table Role Protections**: Admin student selection capabilities while enforcing signatory-only clearance action boundaries.
5. **Dashboard Performance (N+1 Bulk Record Optimization)**: Instant load verification across Head Office, Department, and Org dashboards via single-query entity endpoints.

---

## 2. Test Environment Setup & Prerequisites

Before beginning test execution, verify your environment is configured:

1. **Start Local Database:**
   * Open XAMPP Control Panel and ensure **MySQL** is started on port `3306`.
2. **Sync Database Schema:**
   * Run the following command in PowerShell:
     ```powershell
     npx prisma db push
     ```
   * *Verify:* Prisma reports that the database schema is now in sync with `prisma/schema.prisma` (adding `academicYear` and `semester` to `AcademicTerm`, adding `academicYear` to `Student`).
3. **Generate Prisma Client (Already completed, run if refreshed):**
   ```powershell
   npx prisma generate
   ```
4. **Start Development Server:**
   ```powershell
   npm run dev
   ```
   * Application runs at: `http://localhost:3000`

---

## 3. Test Accounts & Role Reference

| Role | Access URL | Credentials / Dev Switch |
| :--- | :--- | :--- |
| **System Admin** | `/admin/dashboard` | Admin account (`admin@clearance.edu`) |
| **Head Office** | `/head-office/dashboard` | Registrar, Library, Accounting, Guidance, Discipline |
| **Department** | `/department/dashboard` | CCIS (`ccis@uni.edu.ph`), COE (`coe@uni.edu.ph`) |
| **Organization** | `/org/dashboard` | CSSO, JMA, Dance Troupe |
| **Student** | `/student/dashboard` | Student account or Google OAuth test student |

---

## 4. Test Cases

---

### TC-01: Create Structured Academic Term & Compound Validation

* **Module:** Admin / Clearance Requirements
* **Target Route:** `http://localhost:3000/admin/clearance-requirements`
* **API Endpoints:** `POST /api/terms`, `GET /api/terms`, `GET /api/academic-years`

#### Objective:
Verify that creating a new Academic Term uses structured Academic Year (`YYYY-YYYY`) and Semester fields, and prevents duplicate entries for the same year and semester.

#### Step-by-Step Execution:
1. Log in as **System Administrator** and navigate to **Clearance Requirements** (`/admin/clearance-requirements`).
2. Locate and click the **"New Academic Term"** button (or "Add Term").
3. Inspect the modal inputs:
   * Confirm there is a structured **Academic Year** field (e.g. `2025-2026`) and **Semester** selector (`1st Semester`, `2nd Semester`, `Summer Term`).
4. Enter `2026-2027` as the Academic Year and choose `1st Semester`.
5. Click **Create Term / Save**.
6. Refresh the page or inspect the Term dropdown.
7. Attempt to create the **exact same term** again (`2026-2027` + `1st Semester`).

#### Expected Results:
* [x] The first term creation succeeds and displays as `1st Semester 2026-2027` in the term selector.
* [x] The duplicate creation attempt is rejected with an error alert (e.g., `"Academic term already exists"` or 409/400 response), upholding the `@@unique([academicYear, semester])` database constraint.
* [x] Visiting `/api/academic-years` in the browser returns a JSON array grouping the term under `2026-2027`.

---

### TC-02: Export Constituents Modal with SSC Filter Presets

* **Module:** Admin / User Management
* **Target Route:** `http://localhost:3000/admin/user-management`
* **Component:** `components/constituents/ExportConstituentsModal.tsx`

#### Objective:
Verify that the new Constituent Export Modal correctly filters user data, allows choosing CSV or JSON formats, and downloads the filtered constituent list.

#### Step-by-Step Execution:
1. Log in as **System Administrator** and go to **User Management** (`/admin/user-management`).
2. Notice the **"Export Constituents"** button in the header toolbar.
3. Select 2 or 3 student checkboxes in the table, then click **Export Constituents**.
4. In the modal:
   * Verify **Export Scope** shows option for **"Selected Users Only"** vs **"Filtered Users"**.
   * Toggle between **Selected Users** and **Filtered Users**.
   * Select a specific Department (e.g., `College of Computer Studies` / `CCIS`).
   * Select a specific Year Level (e.g., `4th Year`).
   * Toggle Format between **CSV (.csv)** and **JSON (.json)**.
5. Click the **"Export"** action button.

#### Expected Results:
* [x] The modal dynamically populates Department and Program options (via `/api/integration/ssc/masterlist?options=true`).
* [x] Clicking Export triggers an immediate file download named with the scope and timestamp (e.g., `constituents_export_*.csv` or `*.json`).
* [x] Opening the downloaded CSV/JSON shows only students matching the chosen filters (or selected IDs).
* [x] A success toast notification confirms the export completion.

---

### TC-03: Reports Download Modal with Confirmation Dialog & Live Preview

* **Module:** Admin / Reports
* **Target Route:** `http://localhost:3000/admin/reports`
* **Components:** `ConfirmationDialog.tsx`, `app/admin/reports/page.tsx`

#### Objective:
Verify that exporting reports presents a live student preview table matching the active filters and requires explicit confirmation before generating the file.

#### Step-by-Step Execution:
1. Log in as **System Administrator** and navigate to **Reports** (`/admin/reports`).
2. Click **"Download Report"** (or "Export Report") button.
3. In the Filter & Download Modal:
   * Uncheck one or two departments (e.g., uncheck `Engineering`).
   * Select Clearance Status: Toggle between `Cleared` and `Uncleared`.
   * Observe the **Live Preview Table** at the bottom of the modal.
4. Verify the student count indicator: `"Preview (X students to be exported)"`.
5. Verify the preview table columns: `Student ID`, `Name`, `Department`, `Program`, `Year`, and status badge.
6. Click **"Download"**.
7. Observe that a **Confirmation Dialog** appears:
   * *Title:* "Confirm Report Export"
   * *Message:* "Are you sure you want to download this student clearance report? This will generate and download the report based on your selected filters."
8. Click **Cancel** on the confirmation dialog.
9. Click **Download** again, and this time click **Confirm / Download**.

#### Expected Results:
* [x] The live preview table dynamically updates whenever department, year level, or clearance status checkboxes change.
* [x] Clicking Cancel closes the confirmation dialog without initiating any file download.
* [x] Clicking Confirm triggers the download (PDF / CSV / Excel depending on selected format) matching the previewed dataset.

---

### TC-04: Constituents Table Role Boundaries (SysAdmin vs Signatory)

* **Module:** Constituents & Signatory Dashboards
* **Target Routes:**
  * Admin: `http://localhost:3000/admin/user-management`
  * Head Office: `http://localhost:3000/head-office/constituents`

#### Objective:
Ensure System Administrators can check student rows for bulk export, but cannot see or click "Mark Cleared / Mark Uncleared" bulk clearance buttons reserved for authorized signatories.

#### Step-by-Step Execution:
1. Log in as **System Administrator** at `/admin/user-management`.
2. Check the header checkbox ("Select All") or select multiple individual students.
3. Observe the top action bar:
   * Verify that count of selected students is displayed.
   * Verify that green **"Mark Cleared"** and red **"Mark Uncleared"** buttons are **NOT** visible.
4. Now switch to a **Head Office** role (e.g. Registrar or Accounting) at `/head-office/constituents`.
5. Select multiple student checkboxes.
6. Observe the top action bar.

#### Expected Results:
* [x] For System Admin, clearance action buttons are omitted, preventing unauthorized administrative override of academic clearance tasks.
* [x] For Head Office / Signatory roles, **"Mark Cleared"** and **"Mark Uncleared"** buttons appear and operate as expected.

---

### TC-05: Dashboard Performance & Entity-Specific Bulk Queries (N+1 Fix)

* **Module:** Dashboards (Department, Head Office, Organization)
* **Target Routes:**
  * `http://localhost:3000/department/dashboard`
  * `http://localhost:3000/head-office/dashboard`
  * `http://localhost:3000/org/dashboard`

#### Objective:
Verify that dashboards load student constituent records in a single bulk API request (`/api/clearance-records?departmentId=...` etc.) instead of individual requests per student.

#### Step-by-Step Execution:
1. Open your browser Developer Tools (**F12**) and go to the **Network** tab.
2. Filter network requests by `clearance-records`.
3. Navigate to `http://localhost:3000/department/dashboard`.
4. Switch academic terms using the term selector dropdown.
5. Check the Network requests fired:
   * Count how many `/api/clearance-records` calls are made.
6. Repeat for `/head-office/dashboard` and `/org/dashboard`.

#### Expected Results:
* [x] Only **one** request to `/api/clearance-records?departmentId=<ID>` (or `officeId`/`orgId`) is sent per term change.
* [x] No individual per-student requests (`/api/clearance-records?studentId=...`) are fired in a loop.
* [x] Dashboard statistics cards (Total, Cleared, Pending, Percentage) and constituent table update immediately without UI stuttering.

---

### TC-06: Backward Compatibility of Term Filters with Legacy Null Records

* **Module:** Clearance Records API
* **Target Endpoint:** `GET /api/clearance-records?termId=<activeTermId>`

#### Objective:
Confirm that students with clearance records from prior or unassigned terms (`termId = null`) still display appropriately when an active term filter is queried.

#### Step-by-Step Execution:
1. In the browser or API client (e.g., Postman / curl / fetch), query:
   ```
   http://localhost:3000/api/clearance-records?termId=1
   ```
2. Inspect the JSON response payload.

#### Expected Results:
* [x] Returns records where `termId` is `1` as well as records where `termId` is `null`.
* [x] Does not return a 400 Bad Request error if other filters are omitted.

---

## 5. Test Execution Checklist Matrix

| Case ID | Feature / Component | Tested By | Date | Status (Pass/Fail) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Structured Academic Term & Unique Compound Key | | | `[ ]` | |
| **TC-02** | Constituent Export Modal (CSV/JSON + SSC Filters) | Automated Audit | 2026-09-27 | `[FAIL]` | Missing UI trigger in `user-management/page.tsx` |
| **TC-03** | Reports Export Preview & Confirmation Dialog | | | `[ ]` | |
| **TC-04** | Constituents Table Admin Role Boundaries | Browser Automation | 2026-09-27 | `[PASS]` | SysAdmin lacks clearance override buttons; Signatories retain buttons |
| **TC-05** | Dashboard N+1 Bulk Query Optimization | Browser Automation | 2026-09-27 | `[PASS]` | Head Office, Dept, and Org dashboards load instantly via bulk queries |
| **TC-06** | Clearance Records Term Query Backward Compatibility | API Automation | 2026-09-27 | `[PASS]` | Handled global querying and legacy null-term records gracefully |

---

## 6. Troubleshooting Common Issues

* **Error: `Can't reach database server at localhost:3306`**
  * *Solution:* Make sure MySQL is started in XAMPP or your local MySQL service is active before running `npx prisma db push` or `npm run dev`.
* **Database out of sync or column not found (`academicYear` / `semester`):**
  * *Solution:* Execute:
    ```powershell
    npx prisma db push
    npx prisma generate
    ```
* **Browser shows stale term format:**
  * *Solution:* Hard-refresh browser (`Ctrl + F5`) or clear cache to ensure client bundles reload the new synthetic `name` resolver.
