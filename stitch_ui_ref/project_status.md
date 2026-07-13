# Clearance System Project Status & Roadmap

This document summarizes the development progress, completed features, tasks currently in progress, and upcoming roadmap items for the university Clearance System.

---

## 1. Completed Tasks & Implemented Features

### 🏢 Head Office Portal Features (Completed So Far)
* **Description**: Built a comprehensive admin panel for university head offices (e.g. Guidance, Library, Registrar) to manage clearance requirements and review constituent checklists.
* **Key Features**:
  * **Clearance Requirements Manager**: Fully featured requirements management module ([clearance-requirements/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/clearance-requirements/page.tsx)) allowing listing, adding, editing, drafting, publishing, and deleting office-level requirements.
  * **Fine-Grained targeting (`appliesTo`)**: Supports checklists restricted to specific Departments, Programs, or Year levels using checkbox popover dropdowns.
  * **Constituents Roster**: Built an interactive roster table ([constituents/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/constituents/page.tsx)) to display all students. Includes bulk action triggers (Mark Cleared / Mark Pending) and real-time search and filter controls.
  * **Head Office Dashboard**: Main entry dashboard ([dashboard/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/dashboard/page.tsx)) showing counters for assigned, cleared, and pending students, alongside a list of recently updated records.

---

### 🔑 Authentication & Session Multi-Org Selector
* **Description**: Implemented a mock multi-session entry point for Organization Officers. 
* **Implementation Details**:
  * Added a dynamic **Organization Selector** on the [Login Page](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/(auth)/login/page.tsx) that displays only when the `Org / Club Officer` role is selected.
  * Captures the selected organization ID (`orgId`) and writes it to cookies and `localStorage` to dictate layout scopes.

### 🏢 Org-Specific Dynamic Sidebar Layout
* **Description**: Replaced the hardcoded sidebar layout with a dynamic one that fetches active session info.
* **Implementation Details**:
  * The [Sidebar Layout](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/layout.tsx) dynamically displays the organization's logo initials, full name, category tags (e.g., `Governance Club`, `Academic Club`, `LGU`), and adviser details.
  * Handles multi-session logouts by clearing both `role` and `orgId` cache.

### 📊 Dynamic Dashboards (Inclusive vs. Exclusive Scope)
* **Description**: Created dynamic dashboard stats and lists that query students depending on the organization's category.
* **Implementation Details**:
  * [Org Dashboard](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/dashboard/page.tsx) filters students and computes statistics (Total, Cleared, Pending, % Cleared) based on:
    * **Student Government (Gov)** $\rightarrow$ Inclusive (queries all students).
    * **LGU** $\rightarrow$ Exclusive (queries students matching `org.department` under the new CABE, CCIS, CEDAS, CHS, COE list).
    * **Academic Club** $\rightarrow$ Exclusive (queries students matching `org.program`).
    * **Non-Academic Club** $\rightarrow$ Inclusive (queries registered members from the `mockOrgMembers` list).

### 👥 Aligned Constituents Directory
* **Description**: Upgraded the [Org Constituents Page](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/constituents/page.tsx) to mirror the premium style, search parameters, and bulk actions of the Head Office portal.
* **Implementation Details**:
  * Added search filter inputs, semester dropdowns, and status tab triggers.
  * Implemented context-aware filters (locks department/program dropdowns for exclusive academic/LGU officers, but leaves them open for student government/general clubs).
  * **Bug Fixes**: Resolved mapping issues for program filtering where student records referenced `.course` instead of `.program`.

### 📋 Organization Requirements Configuration
* **Description**: Implemented the UI/mock controls for Org Officers to define and publish clearance checklist requirements for the current term ([app/org/clearance-requirements/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/clearance-requirements/page.tsx)).
* **Implementation Details**:
  * Added dynamic "Applies To" locking: LGUs lock department; Academic Clubs lock department and program; Student Governments and general clubs have fully editable inclusive targeting.
  * Filters requirement display to only show items belonging to the active organization session.

---

## 2. In Progress

### 📊 Organization Reports & Metrics
* **Description**: Implementing the Reports and Metrics page for the Organization Portal, porting charts and export options.
* **Current Focus**: Restricting calculations, charts, and export modal targets to the active organization's inclusive or exclusive scope.

### 🛡️ Row-Level Security (RLS) & RPC Setup Design
* **Description**: Moving from local storage mock assertions to draft SQL migrations/policies.
* **Current Focus**: Translating mock filters into Supabase RLS policies and PL/pgSQL database functions.

---

## 3. Upcoming Tasks

### 🎓 Student Checklist Aggregation (Multiple Affiliations)
* **Description**: Update the student-facing dashboard checklist view so that their clearance list aggregates requirement items from all active affiliations.
* **Tasks**:
  * Pull student's course, department, and voluntary club memberships.
  * Perform a combined query (`UNION`) of all active requirements and display them as grouped cards (e.g., Guidance, Accounting, Student Government, LGU, Academic Club).

### 🗄️ Database Integration & Migration
* **Description**: Switch the application from mock datasets to a live PostgreSQL/Supabase database.
* **Tasks**:
  * Initialize tables (`departments`, `programs`, `organizations`, `students`, `clearance_requirements`).
  * Integrate supabase-js client queries and replace mock imports.
