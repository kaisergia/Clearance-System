# Clearance System

University clearance management system with role-based access.

## Tech Stack
- **Design** — Google Stitch / Material 3 Tailwind tokens
- **Frontend** — Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Planned Backend** — Prisma ORM + MySQL (XAMPP)
- **Hosting** — Vercel (frontend) / XAMPP localhost (DB, development)

## Roles
| Role | Dashboard Route |
|---|---|
| System Admin | `/admin/dashboard` |
| Head Office | `/head-office/dashboard` |
| Org / Club Officer | `/org/dashboard` |
| Student | `/student/dashboard` |

---

## Getting Started

### 1. Prerequisites
Make sure you have **Node.js 18+** installed.
Check with: `node -v`
Download from: https://nodejs.org

### 2. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/clearance-system.git
cd clearance-system
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
You'll be redirected to the login page automatically.

---

## Project Structure
```
app/
├── (auth)/login/         → Login page (mock role selector — intentional, dev-only)
├── admin/                → System Admin pages
├── head-office/          → Head Office pages
├── org/                  → Org/Club Officer pages
└── student/              → Student pages

components/
├── constituents/         → Shared table/filter components
├── contexts/             → React Contexts (SettingsContext, OfficesContext, etc.)
├── layouts/              → Role-specific layouts (sidebar, navbar)
└── ui/                   → Reusable UI primitives

lib/
└── constants.ts          → Shared lookup tables (DEPARTMENTS, DEPT_PROGRAMS,
                            YEAR_LEVELS, PROGRAM_MAP) — single source of truth

mock/                     → Mock seed data (DO NOT DELETE — used as Prisma seed source)
├── mockStudents.ts       → Student records
└── mockData.ts           → Orgs, offices, departments, requirements, clearance records

services/
└── clearanceService.ts   → ★ DATABASE SWAP POINT ★
                            Single data-access layer. All reads/writes for students,
                            clearance records, and requirements go through this file.
                            Replace localStorage calls with Prisma queries in Phase 2.
```

---

## Mock Login (Development Only)
The login page has a **role dropdown** for development.
Select a role → click Sign In → redirected to that role's dashboard.

**This will be replaced with real authentication (Prisma session + MySQL) in Phase 2.**

---

## Data Access Architecture

All student, clearance record, and requirement data flows through **`services/clearanceService.ts`**.
This is the single **DATABASE SWAP POINT**. It currently reads/writes `localStorage`
seeded from `mock/mockData.ts` and `mock/mockStudents.ts`.

> **Rule:** No page or component should read/write `localStorage` for student or requirement
> data directly. All such access must go through `clearanceService`.

### Planned database: Prisma + XAMPP MySQL
```
Database URL: mysql://root:@localhost:3306/clearance_system
```

### Swapping to Prisma (Phase 2)
Replace the `localStorage` operations inside each `clearanceService` function with
Prisma client queries, for example:

```ts
// Before (mock localStorage)
export async function getStudents(): Promise<any[]> {
  const stored = localStorage.getItem("students");
  return stored ? JSON.parse(stored) : mockStudents;
}

// After (Prisma + MySQL)
import { prisma } from "@/lib/prisma";
export async function getStudents() {
  return prisma.student.findMany();
}
```

Because all service functions are `async`, **no changes are needed in UI pages or components**.

---

## Color Reference
Primary brand color: `#f44a3b` (Tailwind class: `brand-red`)

| Token | Color | Usage |
|---|---|---|
| `brand-red` | `#f44a3b` | Buttons, active states, highlights |
| `primary` | `#b51b15` | Primary text accents |
| `surface` | `#f7f9fb` | Page backgrounds |
| `on-surface` | `#191c1e` | Body text |

---

## Team — Who Builds What
| Member | Pages |
|---|---|
| TBD | Admin — Dashboard, User Management, Offices |
| TBD | Head Office — Requests, Orgs, Settings |
| TBD | Org — Members, Requirements, Profile |
| TBD | Student — Requirements, Clearance Summary |

---

## Adding New Pages
1. Create folder inside the correct role directory
   e.g. `app/admin/user-management/students/`
2. Add `page.tsx` inside it
3. Add the route to the sidebar navigation component

---

## When PHP API is Ready
Replace mock data imports:
```ts
// Before (mock)
import { mockStudents } from "@/mock/mockStudents";

// After (real API)
const students = await fetch("https://api.yourschool.edu/students");
```

Everything else stays the same.
