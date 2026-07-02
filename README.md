# Clearance System

University clearance management system with role-based access.

## Tech Stack
- **Design** — Google Stitch (Tailwind export)
- **Frontend** — Next.js 14 (App Router) + Tailwind CSS
- **Backend** — PHP API (separate repo, coming soon)
- **Hosting** — Vercel

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
├── (auth)/login/         → Login page (mock role selector)
├── admin/                → System Admin pages
│   └── dashboard/
├── head-office/          → Head Office pages
│   └── dashboard/
├── org/                  → Org/Club Officer pages
│   └── dashboard/
└── student/              → Student pages
    └── dashboard/

components/
├── shared/               → Reusable across all roles
├── layouts/              → Role-specific layouts (sidebar, navbar)
├── admin/
├── head-office/
├── org/
└── student/

mock/                     → Fake data (replace with API later)
├── mockStudents.ts
└── mockData.ts           → orgs, offices, requirements
```

---

## Mock Login (Development Only)
The login page has a **role dropdown** for development.
Select a role → click Sign In → redirected to that role's dashboard.

**This will be replaced with real PHP API authentication later.**

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
