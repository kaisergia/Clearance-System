import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // 1. Domain Restriction Check
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "g.cjc.edu.ph";
      if (!user.email.endsWith(`@${allowedDomain}`)) {
        console.warn(`[NextAuth] Rejected sign-in for email ${user.email}: Domain is not ${allowedDomain}`);
        return false; // Denied: NextAuth redirects to /login?error=AccessDenied
      }

      // 2. Look up the email in the User table
      let dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (dbUser) {
        // Self-healing: If User role is student, check if the Student record actually exists
        if (dbUser.role === "student" && dbUser.studentId) {
          const studentExists = await prisma.student.findUnique({
            where: { id: dbUser.studentId },
          });
          if (!studentExists) {
            console.warn(`[NextAuth] Orphaned User found for ${user.email} (missing Student record). Deleting user record to trigger recreation.`);
            await prisma.user.delete({
              where: { id: dbUser.id },
            });
            dbUser = null; // Set to null to fall through to auto-register flow
          }
        }
      }

      if (dbUser) {
        // Safety net: Deny access if role is null or invalid
        if (!dbUser.role) {
          console.error(`[NextAuth] Rejected sign-in for ${user.email}: User record has no valid role`);
          return false;
        }

        // Link Google ID and update Avatar URL if not set or changed
        if (dbUser.googleId !== user.id || dbUser.avatarUrl !== user.image) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              googleId: user.id,
              avatarUrl: user.image ?? null,
            },
          });
        }
        return true;
      }

      // 3. Auto-create User as STUDENT if not pre-registered
      console.log(`[NextAuth] Pre-registered User not found for ${user.email}. Auto-registering as Student.`);

      // Check if a Student record already exists with this email
      let dbStudent = await prisma.student.findUnique({
        where: { email: user.email },
      });

      if (!dbStudent) {
        // Generate a random student ID
        const generatedId = `CJC-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Auto-create Student record in the database
        dbStudent = await prisma.student.create({
          data: {
            id: generatedId,
            name: user.name || "Student User",
            email: user.email,
            department: "CCIS", // default department
            program: "BS Computer Science", // default program
            year: "1st Year",
            status: "Pending",
            semester: "1st Semester 2025-2026",
          },
        });

        // Initialize pending clearance records for the new student
        const offices = await prisma.office.findMany();
        for (const office of offices) {
          await prisma.clearanceRecord.create({
            data: {
              studentId: dbStudent.id,
              officeId: office.id,
              status: "Pending",
            },
          });
        }

        // Student Government record (usually orgId: 5)
        const ssgOrg = await prisma.org.findUnique({ where: { id: 5 } });
        if (ssgOrg) {
          await prisma.clearanceRecord.create({
            data: {
              studentId: dbStudent.id,
              orgId: ssgOrg.id,
              status: "Pending",
            },
          });
        }
      }

      // Create the User record linked to the Student record with Google details
      await prisma.user.create({
        data: {
          email: user.email,
          displayName: user.name || "Student User",
          role: "student",
          studentId: dbStudent.id,
          googleId: user.id,
          avatarUrl: user.image ?? null,
          isProfileComplete: false,
        },
      });

      return true;
    },

    async jwt({ token, user }) {
      // Query the DB on EVERY token refresh (not just on first sign-in).
      // When `user` is present it's the first sign-in; afterwards we use token.email.
      const lookupEmail = user?.email ?? token.email;
      if (lookupEmail) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: lookupEmail as string },
          });

          if (dbUser) {
            // Normalize "head_office" → "head-office" for UI routing
            token.role = dbUser.role === "head_office" ? "head-office" : dbUser.role;
            token.entityId =
              dbUser.officeId ??
              dbUser.departmentId ??
              dbUser.orgId ??
              dbUser.studentId ??
              null;
            token.avatarUrl = dbUser.avatarUrl;
            token.isProfileComplete = dbUser.isProfileComplete;
          }
        } catch (dbErr) {
          console.warn("[NextAuth JWT] Database offline, running in mock/local fallback mode:", dbErr);
          // Set sensible mock defaults to allow bypass
          token.role = "student";
          token.entityId = "2021-0492"; // Eleanor Shellstrop
          token.isProfileComplete = false; // Will trigger the profiling modal in layout
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).entityId = token.entityId;
        (session.user as any).avatarUrl = token.avatarUrl;
        (session.user as any).isProfileComplete = token.isProfileComplete;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
