# Implementation Plan - Clearance Flow Management System

This plan details the design, schema additions, and step-by-step implementation for the **Clearance Flow Management System** in the admin dashboard. This feature allows system administrators to create, sequence, and customize clearance workflows for academic semesters or summer classes.

---

## Roles & Separation of Responsibilities

### 1. System Admin (Flow Architect)
*   **Defines the Active Signatories**: Decides which offices, departments, or organizations are involved in the clearance process for the current term (this can change semester-to-semester).
*   **Builds the Flow Hierarchy**: Connects signatories in sequence and sets up **prerequisite dependencies** (e.g., B requires A to be cleared).

### 2. Signatories (Requirements Editors)
*   **Manages Requirements**: Once a signatory (e.g., Guidance Office, IT Department) is declared active in the clearance flow, their evaluators can log in and add/manage the specific requirements students must complete to clear their step.

---

## Design Decisions (Agreed Options)

### 1. Prerequisite Lock Style: Soft Locks
*   **Behavior**: Students can view requirements and upload/submit files or complete tasks for any signatory step at any time.
*   **Enforcement**: Evaluators/Signatories cannot mark a student as "Cleared" for their step (the approve action is locked/disabled or returns an error) until all prerequisite signatories in the flow have marked the student as "Cleared".

### 2. Post-Publish Edits: Allowed
*   Admins can modify a clearance flow (adding/removing signatories, changing prerequisites) even after it has been published and students have begun clearing. 
*   **Sync Logic**: Changes to the flow steps will dynamically update/sync active student clearance records without losing existing progress for untouched steps.

---

## Proposed Database Schema Changes

To support terms, flows, signatory steps, prerequisite dependencies, and associate signatory requirements to the active term, we propose adding/updating the following models in `prisma/schema.prisma`:

```prisma
// Represents an Academic Term (e.g., "1st Sem 2024-2025")
model AcademicTerm {
  id        Int             @id @default(autoincrement())
  name      String          @unique
  status    String          @default("Active") // "Active" | "Archived"
  flows     ClearanceFlow[]
  
  // Back-relations for term-specific requirements
  officeRequirements     OfficeRequirement[]
  departmentRequirements DepartmentRequirement[]
  orgRequirements        OrgRequirement[]
  
  createdAt DateTime        @default(now())
}

// Represents a Clearance Flow targeted at a subset of students
model ClearanceFlow {
  id             Int          @id @default(autoincrement())
  name           String
  description    String?      @db.Text
  termId         Int
  term           AcademicTerm @relation(fields: [termId], references: [id])
  status         String       @default("Draft") // "Draft" | "Published" | "Archived"
  
  // JSON field describing targeting criteria (e.g. { year: ["4th Year"], department: [] })
  targetCriteria Json?
  
  steps          FlowStep[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

// A signatory step in the Clearance Flow
model FlowStep {
  id             Int           @id @default(autoincrement())
  flowId         Int
  flow           ClearanceFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  
  // Represents who needs to clear this step.
  // officeId, departmentId, or orgId can be null if it's dynamic
  officeId       Int?
  departmentId   Int?
  orgId          Int?
  
  // If true, dynamically resolves to the student's department or active org memberships
  isDynamicDept  Boolean       @default(false)
  isDynamicOrgs  Boolean       @default(false)
  
  sequenceOrder  Int           @default(1)
  
  // Self-relation to model dependencies/prerequisites
  prerequisites  FlowStepPrerequisite[] @relation("StepToPrerequisite")
  dependentSteps FlowStepPrerequisite[] @relation("PrerequisiteToStep")
}

// Junction table for many-to-many prerequisites between FlowSteps
model FlowStepPrerequisite {
  stepId             Int
  prerequisiteStepId Int
  
  step               FlowStep @relation("StepToPrerequisite", fields: [stepId], references: [id], onDelete: Cascade)
  prerequisiteStep   FlowStep @relation("PrerequisiteToStep", fields: [prerequisiteStepId], references: [id], onDelete: Cascade)
  
  @@id([stepId, prerequisiteStepId])
}
```

### Updates to Requirement Models
We will add an optional `termId` relation to:
- `OfficeRequirement`
- `DepartmentRequirement`
- `OrgRequirement`

---

## Proposed UI & Flow Changes

### 1. Requirements Tab Page (`app/admin/clearance-requirements/page.tsx`)
*   **Flow List View**: Show flows grouped by Academic Term with stats (status, number of signatories, count of targeted students).
*   **Visual Flow Builder / Form**:
    *   Create or edit a Flow: Name, description, term selection, and targeting conditions.
    *   **Signatories List**: Add steps (Office, Student's Department, Student's Orgs) and define their sequence order.
    *   **Prerequisites Configuration**: For each added step, select which other steps must be completed first from a multi-select dropdown.
*   **Visualization**: Render a clean dependency timeline or flow tree indicating the sequence.

### 2. Signatory Dashboard (Offices / Departments / Orgs)
*   When a signatory configures their requirements, they will select the **Academic Term** (or it will default to the current active term).
*   They will see a notification if they have been declared as an active signatory in the current term's clearance flow, prompting them to add requirements.
