# Clearance System

University clearance management system with role-based access.

## Tech Stack
- **Design** — Google Stitch / Material 3 Tailwind tokens
- **Frontend** — Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Planned Backend** — Prisma ORM + MySQL-compatible MariaDB (XAMPP)
- **Hosting** — Vercel (frontend) / XAMPP MariaDB (development)

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
Make sure you have **Node.js 22 LTS** installed.
Check with: `node -v`
Download from: https://nodejs.org

### 2. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/clearance-system.git
cd clearance-system
```

### 3. Install dependencies
```bash
npm ci
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
You'll be redirected to the login page automatically.

### Docker (local development)
Install Docker Desktop or Docker Engine with the Compose plugin, then run:
```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Compose starts MariaDB, phpMyAdmin, and the app. The app applies the Prisma schema with `prisma db push` before starting. Open [http://localhost:8080](http://localhost:8080) for phpMyAdmin; connect with username `clearance` and password `clearance_dev_only`. The database is also available to host tools at `127.0.0.1:3307`, leaving XAMPP's usual port 3306 free. Data is kept in a named volume; remove it with `docker compose down -v` to reset the Docker database.

The Docker database starts empty; it does not import data from an existing XAMPP installation. Export and import your database before switching if you need to keep existing records.

The Compose database credentials are for local development only. Do not expose this setup publicly or reuse those credentials in production. Docker excludes `.env*`, `.pem`, and `.key` files from its build context; OAuth and external integrations still need to be configured separately if you use them.

### Use XAMPP's database
You do not need XAMPP when using the default Docker setup. To use XAMPP instead, start MySQL in the XAMPP Control Panel and make sure it listens on port `3306`. Create a database named `clearance_system` in phpMyAdmin first; Prisma creates the tables but not the database itself.

To run Next.js directly on Windows, set the connection for the current PowerShell session, generate Prisma Client, apply the schema, and start the app:
```powershell
$env:DATABASE_URL = "mysql://root:@127.0.0.1:3306/clearance_system"
npx prisma generate
npx prisma db push
npm run dev
```

To keep the app in Docker while using XAMPP on Windows, run:
```powershell
docker compose -f compose.xampp.yaml up --build
```
This uses `host.docker.internal` to reach Windows. The default connection assumes the usual XAMPP `root` account with no password. If your account uses a password, set `DATABASE_URL` in the PowerShell session before starting Compose, using a URL-encoded password. This mode does not start the bundled MariaDB or phpMyAdmin containers.

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

### Planned database: Prisma + XAMPP MariaDB
```
XAMPP on host: mysql://root:@localhost:3306/clearance_system
Docker app:    mysql://clearance:clearance_dev_only@db:3306/clearance_system
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
