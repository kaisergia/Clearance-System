/**
 * prisma/seed.ts
 *
 * Seeds the clearance_system MySQL database from mock data.
 * Run with:  npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

// Import mock data — these files stay as-is and become the seed source
import { mockStudents, mockOfficeHeads } from "../mock/mockStudents";
import {
  mockOrgs,
  mockOrgMembers,
  mockDepartments,
  mockOffices,
  defaultOfficeRequirements,
  defaultDepartmentRequirements,
  defaultOrgRequirements,
} from "../mock/mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding clearance_system database…");

  // ── 1. Students ────────────────────────────────────────────────────────────
  console.log("  → Students");
  for (const s of mockStudents) {
    await prisma.student.upsert({
      where:  { id: s.id },
      update: { name: s.name, email: s.email, department: s.department,
                program: s.program, year: s.year, status: s.status, semester: s.semester },
      create: { id: s.id, name: s.name, email: s.email, department: s.department,
                program: s.program, year: s.year, status: s.status, semester: s.semester },
    });
  }

  // ── 2. Offices ─────────────────────────────────────────────────────────────
  console.log("  → Offices");
  for (const o of mockOffices) {
    await prisma.office.upsert({
      where:  { id: o.id },
      update: { name: o.name, head: o.head, email: o.email, logoUrl: (o as any).logoUrl ?? null, themeColor: (o as any).themeColor ?? null },
      create: { id: o.id, name: o.name, head: o.head, email: o.email,
                pending: o.pending, approved: o.approved, rejected: o.rejected,
                logoUrl: (o as any).logoUrl ?? null, themeColor: (o as any).themeColor ?? null },
    });
  }

  // ── 3. Departments ─────────────────────────────────────────────────────────
  console.log("  → Departments");
  for (const d of mockDepartments) {
    await prisma.department.upsert({
      where:  { id: d.id },
      update: { name: d.name, abbreviation: d.abbreviation, head: d.head, email: d.email, logoUrl: (d as any).logoUrl ?? null, themeColor: (d as any).themeColor ?? null },
      create: { id: d.id, name: d.name, abbreviation: d.abbreviation,
                head: d.head, email: d.email,
                pending: d.pending, approved: d.approved, rejected: d.rejected,
                logoUrl: (d as any).logoUrl ?? null, themeColor: (d as any).themeColor ?? null },
    });
  }

  // ── 4. Orgs ────────────────────────────────────────────────────────────────
  console.log("  → Organisations");
  for (const o of mockOrgs) {
    await prisma.org.upsert({
      where:  { id: o.id },
      update: { name: o.name, type: o.type, category: o.category, logoUrl: (o as any).logoUrl ?? null, themeColor: (o as any).themeColor ?? null },
      create: {
        id:          o.id,
        name:        o.name,
        type:        o.type,
        category:    o.category,
        department:  o.department ?? null,
        program:     o.program ?? null,
        adviser:     o.adviser ?? null,
        status:      o.status ?? "Active",
        dateAdded:   (o as any).dateAdded ?? null,
        memberCount: (o as any).memberCount ?? 0,
        logoUrl:     (o as any).logoUrl ?? null,
        themeColor:  (o as any).themeColor ?? null,
      },
    });
  }

  // ── 5. Org Members ─────────────────────────────────────────────────────────
  console.log("  → Org memberships");
  for (const m of mockOrgMembers) {
    // Only seed if both the org and student exist in our seeded data
    const studentExists = mockStudents.some((s) => s.id === m.studentId);
    if (!studentExists) continue;
    await prisma.orgMember.upsert({
      where:  { orgId_studentId: { orgId: m.orgId, studentId: m.studentId } },
      update: {},
      create: { orgId: m.orgId, studentId: m.studentId },
    });
  }

  // ── 6. Clearance Records (initial Pending state) ───────────────────────────
  console.log("  → Initial clearance records");
  for (const student of mockStudents) {
    // Office records
    for (const office of mockOffices) {
      await prisma.clearanceRecord.upsert({
        where:  { studentId_officeId: { studentId: student.id, officeId: office.id } },
        update: {},
        create: { studentId: student.id, officeId: office.id, status: "Pending" },
      });
    }
    // Student Government record (applies to all)
    await prisma.clearanceRecord.upsert({
      where:  { studentId_orgId: { studentId: student.id, orgId: 5 } },
      update: {},
      create: { studentId: student.id, orgId: 5, status: "Pending" },
    });
  }

  // ── 7. Default Office Requirements ────────────────────────────────────────
  console.log("  → Office requirements");
  for (const [officeIdStr, reqs] of Object.entries(defaultOfficeRequirements)) {
    const officeId = Number(officeIdStr);
    for (const req of reqs as any[]) {
      const existing = await prisma.officeRequirement.findUnique({ where: { id: req.id } });
      if (!existing) {
        await prisma.officeRequirement.create({
          data: {
            id:                 req.id,
            officeId,
            name:               req.name,
            description:        req.description ?? "",
            addedDate:          new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status:             req.status ?? "Live",
            appliesTo:          req.appliesTo ?? ["All Students"],
            requiresUpload:     req.requiresUpload ?? false,
            type:               req.type || (req.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL"),
            surveyQuestions:    req.surveyQuestions || null,
            acknowledgmentText: req.acknowledgmentText || null,
          },
        });
      }
    }
  }

  // ── 8. Default Department Requirements ────────────────────────────────────
  console.log("  → Department requirements");
  for (const [deptIdStr, reqs] of Object.entries(defaultDepartmentRequirements)) {
    const departmentId = Number(deptIdStr);
    for (const req of reqs as any[]) {
      const existing = await prisma.departmentRequirement.findUnique({ where: { id: req.id } });
      if (!existing) {
        await prisma.departmentRequirement.create({
          data: {
            id:                 req.id,
            departmentId,
            name:               req.name,
            description:        req.description ?? "",
            addedDate:          new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status:             req.status ?? "Live",
            appliesTo:          req.appliesTo ?? ["All Students"],
            requiresUpload:     req.requiresUpload ?? false,
            type:               req.type || (req.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL"),
            surveyQuestions:    req.surveyQuestions || null,
            acknowledgmentText: req.acknowledgmentText || null,
          },
        });
      }
    }
  }

  // ── 9. Default Org Requirements ───────────────────────────────────────────
  console.log("  → Org requirements");
  for (const [orgIdStr, reqs] of Object.entries(defaultOrgRequirements)) {
    const orgId = Number(orgIdStr);
    for (const req of reqs as any[]) {
      const existing = await prisma.orgRequirement.findUnique({ where: { id: req.id } });
      if (!existing) {
        await prisma.orgRequirement.create({
          data: {
            id:                 req.id,
            orgId,
            name:               req.name,
            description:        req.description ?? "",
            addedDate:          new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status:             req.status ?? "Live",
            appliesTo:          req.appliesTo ?? ["All Students"],
            requiresUpload:     req.requiresUpload ?? false,
            type:               req.type || (req.requiresUpload ? "DOCUMENT_UPLOAD" : "MANUAL"),
            surveyQuestions:    req.surveyQuestions || null,
            acknowledgmentText: req.acknowledgmentText || null,
          },
        });
      }
    }
  }

  // ── 10. Users ──────────────────────────────────────────────────────────────
  console.log("  → Users");

  const usersToCreate = [
    // Admin
    { email: "admin@clearance.edu",    role: "admin"       as const, displayName: "System Admin",          officeId: null, departmentId: null, orgId: null, studentId: null },
    // Head Offices
    { email: "registrar@uni.edu.ph",   role: "head_office" as const, displayName: "Ms. Reyes (Registrar)",  officeId: 1,    departmentId: null, orgId: null, studentId: null },
    { email: "library@uni.edu.ph",     role: "head_office" as const, displayName: "Mr. Santos (Library)",   officeId: 2,    departmentId: null, orgId: null, studentId: null },
    { email: "guidance@uni.edu.ph",    role: "head_office" as const, displayName: "Ms. Garcia (Guidance)",  officeId: 3,    departmentId: null, orgId: null, studentId: null },
    { email: "accounting@uni.edu.ph",  role: "head_office" as const, displayName: "Mr. Dela Cruz (Accounting)", officeId: 4, departmentId: null, orgId: null, studentId: null },
    { email: "discipline@uni.edu.ph",  role: "head_office" as const, displayName: "Ms. Mendoza (Discipline)", officeId: 5,  departmentId: null, orgId: null, studentId: null },
    // Departments
    { email: "ccis@uni.edu.ph",        role: "department"  as const, displayName: "Dr. Alan Turing (CCIS)",    officeId: null, departmentId: 1, orgId: null, studentId: null },
    { email: "coe@uni.edu.ph",         role: "department"  as const, displayName: "Engr. Nikola Tesla (COE)",  officeId: null, departmentId: 2, orgId: null, studentId: null },
    // Orgs
    { email: "csso@uni.edu.ph",        role: "org"         as const, displayName: "CS Society Officer",  officeId: null, departmentId: null, orgId: 1, studentId: null },
    { email: "jma@uni.edu.ph",         role: "org"         as const, displayName: "JMA Officer",         officeId: null, departmentId: null, orgId: 2, studentId: null },
    { email: "dance@uni.edu.ph",       role: "org"         as const, displayName: "Dance Troupe Officer", officeId: null, departmentId: null, orgId: 3, studentId: null },
    // Students
    { email: "eleanor@uni.edu.ph",     role: "student"     as const, displayName: "Eleanor Shellstrop",  officeId: null, departmentId: null, orgId: null, studentId: "2021-0492" },
    { email: "chidi@uni.edu.ph",       role: "student"     as const, displayName: "Chidi Anagonye",      officeId: null, departmentId: null, orgId: null, studentId: "2022-1103" },
    { email: "tahani@uni.edu.ph",      role: "student"     as const, displayName: "Tahani Al-Jamil",     officeId: null, departmentId: null, orgId: null, studentId: "2020-8831" },
    { email: "jason@uni.edu.ph",       role: "student"     as const, displayName: "Jason Mendoza",       officeId: null, departmentId: null, orgId: null, studentId: "2023-0012" },
    { email: "michael@uni.edu.ph",     role: "student"     as const, displayName: "Michael Realman",     officeId: null, departmentId: null, orgId: null, studentId: "2021-5529" },
  ];

  for (const u of usersToCreate) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { displayName: u.displayName },
      create: {
        email:        u.email,
        role:         u.role,
        displayName:  u.displayName,
        officeId:     u.officeId,
        departmentId: u.departmentId,
        orgId:        u.orgId,
        studentId:    u.studentId,
      },
    });
  }

  // ── 11. Announcements ──────────────────────────────────────────────────────
  console.log("  → Announcements");
  const sampleAnnouncements = [
    {
      id: 1,
      title: "1st Semester 2025-2026 Student Clearance Deadline Notice",
      content: "All graduating and continuing students are advised to complete their clearance requirements before the semester deadline. Please ensure all office, department, and organization deficiencies are settled promptly.",
      priority: "high" as const,
      isSystemWide: true,
      showOnLandingPage: true,
      isActive: true,
    },
    {
      id: 2,
      title: "Registrar Office — Document & Transcript Submissions",
      content: "Students with pending document submissions (Form 137/138, Honorable Dismissal, or Birth Certificates) must submit physical copies to Window 2 at the Registrar's Office.",
      priority: "normal" as const,
      isSystemWide: false,
      showOnLandingPage: true,
      isActive: true,
      officeId: 1,
    },
    {
      id: 3,
      title: "CCIS Departmental Clearance & Project Submissions",
      content: "All BS Computer Science and BS Information Technology students are requested to complete their CCIS department evaluation and capstone clearance.",
      priority: "normal" as const,
      isSystemWide: false,
      showOnLandingPage: true,
      isActive: true,
      departmentId: 1,
    },
  ];

  for (const a of sampleAnnouncements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        content: a.content,
        priority: a.priority,
        isSystemWide: a.isSystemWide,
        showOnLandingPage: a.showOnLandingPage,
        isActive: a.isActive,
      },
      create: a,
    });
  }

  // Resync PostgreSQL sequences for autoincrement tables after seeding explicit IDs
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Office"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Office"));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Department"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Department"));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Org"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Org"));`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Announcement"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "Announcement"));`);
  } catch (err) {
    // Ignore error if database is MySQL (XAMPP), as MySQL handles AUTO_INCREMENT sequence automatically
  }

  console.log("✅  Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
