# Software Design Description (SDD) - University Clearance System

This Software Design Description (SDD) documents the design specifications, architecture, modular components, and database schemas implemented so far in the University Clearance System.

---

## 1. Introduction

### Purpose
This document provides a description of the system architecture, component modules, and user interfaces designed and implemented for the Clearance System. It serves as a technical reference for current features and future integrations.

### Scope
The Clearance System is a web-based portal designed to streamline the university clearance process. It serves administrative offices (Head Offices), student organizations (Clubs and Organizations), system administrators, and students. The system automates requirement checklists, targets specific student demographics, and enables bulk clearance validation.

---

## 2. System Architecture & Overview

The system is built on a responsive front-end architecture using Next.js and Tailwind CSS. The interface is divided into distinct portal layouts depending on the authenticated user role:
* **Admin Portal**: System configuration, office registry, and global user management.
* **Head Office Portal**: Administrative offices (e.g., Library, Guidance, Registrar) managing clearance checklists and student rosters.
* **Organization Portal**: Dynamic views for student governments, LGUs, and academic/non-academic clubs.
* **Student Portal**: Student-facing interface to view and complete active clearance requirements.

---

## 3. Module & Component Design

The following components and modules have been designed and implemented:

### 3.1 Head Office Portal Module
* **Description**: Built for university administrative offices to oversee requirements and review constituent progress.
* **Implemented Components**:
  * **Requirements Manager**: Component for listing, adding, editing, and publishing requirements ([app/head-office/clearance-requirements/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/clearance-requirements/page.tsx)).
  * **Constituents Directory**: Interactive list of student clearance records supporting status toggles and bulk operations ([app/head-office/constituents/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/constituents/page.tsx)).
  * **Head Office Dashboard**: Overview counters representing total, cleared, and pending reviews ([app/head-office/dashboard/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/dashboard/page.tsx)).
  * **Reports and Metrics Exporter**: Component for exporting clearance compliance metrics and filtered reports ([app/head-office/reports/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/head-office/reports/page.tsx)).

### 3.2 Organization Portal Module
* **Description**: Designed for student organizations, clubs, and local student councils.
* **Dynamic Scopes**:
  * **Inclusive Scope**: Student Government (Gov) and Non-Academic Clubs query all students or active registered members.
  * **Exclusive Scope**: LGU (Local Government Units) and Academic Clubs automatically filter and restrict queries to their specific department or program.
* **Implemented Components**:
  * **Multi-Org Selector**: Displays on login to session-bind the selected organization ([app/(auth)/login/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/(auth)/login/page.tsx)).
  * **Dynamic Sidebar Layout**: Renders logo initials, organization category tags, and adviser details dynamically ([app/org/layout.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/layout.tsx)).
  * **Org Constituents Page**: Aligned search parameters, status toggles, and locked filter dropdowns for exclusive org roles ([app/org/constituents/page.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/app/org/constituents/page.tsx)).

### 3.3 Reusable Modular UI Components
* **ExpandableAppliesTo**: Renders targeted filter badges (Departments, Programs, Year Levels) with inline expansion triggers to prevent layout clutter ([components/ExpandableAppliesTo.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/components/ExpandableAppliesTo.tsx)).
* **ConstituentsFilterBar**: Reusable filter panel managing search inputs, semester choices, and dropdown filters ([components/ConstituentsFilterBar.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/components/ConstituentsFilterBar.tsx)).
* **ConstituentsTable**: Shared data grid for rendering student profiles, department details, year levels, status badges, and bulk status updates ([components/ConstituentsTable.tsx](file:///c:/Users/surig/Documents/Development%20Poject/Clearance_System/Clearance-System/components/ConstituentsTable.tsx)).

---

## 4. Database Schema Design

The datatypes and entities utilized in the dynamic routing and state mapping match the following relational structure:

### Students Schema
* id (String, Primary Key)
* name (String)
* department (String)
* program (String)
* year (String)
* status (String: 'Cleared' | 'Pending')

### Organizations Schema
* id (Integer, Primary Key)
* name (String)
* category (String)
* type (String: 'Gov' | 'LGU' | 'AcademicClub' | 'NonAcademicClub')
* department (String, Nullable)
* program (String, Nullable)
* adviser (String)
