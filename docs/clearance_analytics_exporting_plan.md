# Implementation Plan - Analytics & Exporting Fixes

This plan outlines the fixes and enhancements for the reports, analytics, and exporting functionality across the admin and signatory dashboards.

## User Review Required

> [!IMPORTANT]
> **No active term filtering on Admin Reports & Dashboard**: Currently, the admin analytics are term-agnostic and pool all students and offices together. We will add academic term selectors to resolve this.
> **Dead buttons**: Multiple Export/Download buttons across the admin panels (reports, dashboard, directories) are currently static/dead. We will implement fully dynamic CSV/Excel downloads for them.
> **Signatory Dashboard term-switching bug**: Switching terms on the signatory dashboards (Department, Head Office, Org) currently does not update the statistics because the data loading `useEffect` hooks lack the term dependency. We will add the term dependency and filter the student list by the selected term.

---

## Proposed Changes

### 1. API Modifications

#### [MODIFY] [route.ts](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/api/clearance-records/route.ts)
* Allow querying clearance records using only `termId` as a filter if no student/office/department/org IDs are provided. This enables the admin to query all records for a term in a single request.

---

### 2. Signatory Dashboard Fixes

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/department/dashboard/page.tsx)
* Add `selectedTerm` to the `useEffect` dependency array.
* Filter the loaded students by `s.semester === selectedTerm` so compliance percentages and counts reflect the selected term.

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/dashboard/page.tsx)
* Add `selectedTerm` to the `useEffect` dependency array.
* Filter the loaded students by `s.semester === selectedTerm` so compliance stats reflect the selected term.

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/dashboard/page.tsx)
* Add `selectedTerm` to the `useEffect` dependency array.
* Filter `allStudents` by `selectedTerm` before executing scope filtering logic.

---

### 3. Admin Reports & Dashboard

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/reports/page.tsx)
* Load all academic terms from `/api/terms` and implement a term selector dropdown.
* Fetch clearance records and calculate:
  * Dynamic **Total Cleared** / **Pending** counts for the selected term.
  * Department clearance rates matching the selected term.
  * Office clearance breakdown rates derived from actual `ClearanceRecord` rows instead of static DB columns.
* Bind the **Download Full Report** button to generate a CSV export of all student clearance statuses for the selected term.

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/dashboard/page.tsx)
* Bind the **Export Report** button to initiate the CSV export of the active term's clearance compliance list.

---

### 4. Admin Directory Exports

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/offices/page.tsx)
* Bind the **Export** button to download a CSV directory list of offices and their metadata.

#### [MODIFY] [page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/admin/departments/page.tsx)
* Bind the **Export** button to download a CSV directory list of departments and their metadata.

---

## Verification Plan

### Automated Tests
* Run `npx tsc --noEmit` to ensure type safety.

### Manual Verification
* Switch academic terms in the Department dashboard and confirm stats update dynamically.
* Open Admin Reports, select a term, and verify compliance stats change.
* Click **Download Full Report** in Admin Reports and ensure a valid CSV file downloads.
* Click **Export** in the Office and Department directories and verify directory CSVs download.
