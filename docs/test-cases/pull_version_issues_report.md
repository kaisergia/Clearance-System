# Audit Report: Issues and Incompatibilities in Remote Pull (`dfb13d9`)

**Target Commit:** `dfb13d91ed076b843f4682462066b11fd22b5f0f`  
**Commit Message:** `refactor(db): simplify AcademicTerm schema and update term APIs`  
**Author:** KaiSiege  
**Report Location:** `docs/test-cases/pull_version_issues_report.md`  
**Purpose:** Documentation of bugs, unmounted components, and schema migration pitfalls identified during local testing after pulling the latest remote `main`.

---

## Executive Summary

The commit `dfb13d9` introduces valuable improvements, including simplifying the `AcademicTerm` data model, optimizing dashboard queries, and adding student export capabilities. However, several critical integration oversights were identified:

1. **Unmounted UI Component:** The new `ExportConstituentsModal` was committed as a standalone file but **never wired into the User Management UI**, leaving no way for users to access the export feature.
2. **Database Migration Blocker (`npx prisma db push` Crash):** The schema change drops `AcademicTerm.name` and adds a compound unique constraint on `[academicYear, semester]` with hardcoded defaults. For any developer or environment with existing database records, running `prisma db push` crashes with a duplicate key error (`Error 1062`) and causes data loss.
3. **IDE / Linter Stale Type Mismatch:** `prisma/seed.ts` causes immediate TypeScript errors in IDEs until `prisma generate` is executed and the TypeScript server is manually restarted.

---

## Detailed Issue Breakdown

---

### Issue 1: Orphaned / Unmounted Component (`ExportConstituentsModal.tsx`)

* **Severity:** **HIGH** (Feature completely inaccessible from UI)
* **Affected Files:**
  * [`components/constituents/ExportConstituentsModal.tsx`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/components/constituents/ExportConstituentsModal.tsx)
  * [`app/admin/user-management/page.tsx`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/user-management/page.tsx)

#### Problem Description:
* A complete, 459-line component was created at `components/constituents/ExportConstituentsModal.tsx` containing:
  * Export scope toggling (Selected Users vs. Filtered Users).
  * Dynamic department, program, and year level filters (via `/api/integration/ssc/masterlist?options=true`).
  * CSV and JSON data export generators.
* **However, the component is completely unused.** In `app/admin/user-management/page.tsx`:
  * `ExportConstituentsModal` is **never imported**.
  * No `showExportModal` state is declared.
  * No **"Export Constituents"** button exists on the controls bar (only *Import Excel*, *Sync SSC API*, and *Add Constituent* are rendered).
  * No **"Export Selected"** button exists on the bulk selection toolbar.

#### User Impact:
Administrators testing the constituent export feature cannot find any export button on the User Management screen.

#### Recommended Fix:
In `app/admin/user-management/page.tsx`:
1. Import `ExportConstituentsModal`:
   ```tsx
   import { ExportConstituentsModal } from "@/components/constituents/ExportConstituentsModal";
   ```
2. Add modal visibility state:
   ```tsx
   const [showExportModal, setShowExportModal] = useState(false);
   ```
3. Add the **"Export Constituents"** button in the controls toolbar next to "Import Excel":
   ```tsx
   <button
     onClick={() => setShowExportModal(true)}
     className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
     title="Export constituents to CSV or JSON"
   >
     <Download className="w-3.5 h-3.5 text-gray-600" />
     <span>Export Constituents</span>
   </button>
   ```
4. Add **"Export Selected"** in the bulk actions bar when users are selected.
5. Render the modal component at the bottom of the page:
   ```tsx
   <ExportConstituentsModal
     isOpen={showExportModal}
     onClose={() => setShowExportModal(false)}
     onSuccess={(msg) => showToast(msg)}
     users={allUsersList}
     selectedIds={selectedUserIds}
   />
   ```

---

### Issue 2: Schema Migration Crash & Data Loss on `prisma db push`

* **Severity:** **CRITICAL** (Database Setup / Migration Blocker)
* **Affected Files:**
  * [`prisma/schema.prisma`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/prisma/schema.prisma)
  * Database table: `AcademicTerm`

#### Problem Description:
In `prisma/schema.prisma`, `AcademicTerm` was refactored:
```prisma
// Removed:
// name String @unique

// Added:
academicYear String @default("2025-2026")
semester     String @default("1st Semester")
@@unique([academicYear, semester])
```

When a developer with existing records (e.g. 7 terms like *"1st Semester 2024-2025"*, *"2nd Semester 2025-2026"*, *"Summer 2026-2027"*) pulls this change and runs `npx prisma db push`:
1. Prisma alerts:
   ```
   ⚠️ There might be data loss when applying the changes:
     • You are about to drop the column `name` on the `academicterm` table, which still contains 7 non-null values.
     • A unique constraint covering the columns `[academicYear,semester]` on the table `AcademicTerm` will be added. If there are existing duplicate values, this will fail.
   ```
2. If the developer ignores the warning (`y`):
   * MySQL creates the new columns and populates **every existing row** with the default values: `academicYear = '2025-2026'` and `semester = '1st Semester'`.
   * MySQL immediately attempts to create the unique index on `(academicYear, semester)`.
   * **Result:** MySQL aborts with a duplicate key error:
     `Error: Duplicate entry '2025-2026-1st Semester' for key 'AcademicTerm_academicYear_semester_key'`
   * All distinct previous term names are permanently dropped and lost.

#### Recommended Fix:
1. Provide a migration script that parses existing `name` strings (e.g. `"2nd Semester 2025-2026"`) into their respective `semester` and `academicYear` values before adding the unique constraint.
2. Alternatively, create a Prisma Migrate migration file (`prisma/migrations/...`) containing a data migration step instead of relying on `db push`.

---

### Issue 3: Stale IDE Type Cache in `prisma/seed.ts`

* **Severity:** **MEDIUM** (Developer Confusion / Linter Warning)
* **Affected File:**
  * [`prisma/seed.ts`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/prisma/seed.ts) (Lines 102–108)

#### Problem Description:
In `prisma/seed.ts`, the upsert query was changed to:
```typescript
const defaultTerm = await prisma.academicTerm.upsert({
  where: {
    academicYear_semester: {
      academicYear: "2024-2025",
      semester: "1st Semester",
    },
  },
  ...
});
```
Because Prisma generates `@prisma/client` types on the local machine, pulling this file causes VS Code / TypeScript Language Server to immediately mark `academicYear_semester` in red squiggly lines:
```
Type '{ academicYear_semester: ... }' is not assignable to type 'AcademicTermWhereUniqueInput'.
```

#### Recommended Fix:
Add a post-pull instruction in the commit / PR notes:
1. Run `npx prisma generate` to re-build local `@prisma/client` types.
2. In VS Code: Press `Ctrl + Shift + P` -> Select **"TypeScript: Restart TS Server"**.

---

### Issue 5: Admin Dashboard Displays Historical Analytics When No Clearance Flow is Published

* **Severity:** **MEDIUM** (Misleading Analytics & Data Leak Across Terms)
* **Affected File:**
  * [`app/admin/dashboard/page.tsx`](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/dashboard/page.tsx)

#### Problem Description:
When an active academic term has no published clearance flow (e.g. flow is in `Draft`), the pulled Admin Dashboard:
1. Fetched `/api/clearance-records` globally without specifying `termId`.
2. Mixed historical records across unrelated terms.
3. Showed misleading metrics (`Pending: 280`, `Cleared: 4`, random 100% completion bars for unrelated departments).

#### Solution Applied:
* Check `/api/flows` for `status === "Published"` matching the active term.
* Blank analytics cards (`Pending: —`, `Cleared: —` with `"No active flow"`).
* Replace Department Completion chart with an empty state explaining that metrics calculate once a flow is published.
* Add prominent warning banner linking to `Clearance Requirements`.

---

## Summary Checklist for Team Review

| Item | Problem | Impact | Status |
| :--- | :--- | :--- | :--- |
| **1. Export Constituents Button** | `ExportConstituentsModal.tsx` exists on disk but is not imported or rendered anywhere in the application. | Users cannot export constituents. | Needs to be wired into `app/admin/user-management/page.tsx`. |
| **2. DB Migration Collision** | `AcademicTerm` unique compound constraint fails on existing data during `prisma db push`. | Blocks database updates and corrupts existing term history. | Needs data pre-migration step for existing records. |
| **3. Seed Script TS Error** | Generated client types out of sync after git pull. | Red squiggly errors in editor. | Resolved by `npx prisma generate` + TS Server restart. |
| **4. Inconsistent SSC Sync** | SSC API sync button removed from signatory toolbars. | Signatories cannot initiate sync. | Feature restricted to Admin. |
| **5. Unfiltered Dashboard Analytics** | Dashboard calculated clearance stats using mixed historical records when no flow was published. | Misleading charts and statistics. | **RESOLVED:** Dashboard now blanks analytics and shows "No Active Flow" alert when no flow is published. |
