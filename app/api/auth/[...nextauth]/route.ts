import NextAuth, { NextAuthOptions } from "next-auth";
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
        },
      });

      return true;
    },

    async jwt({ token, user }) {
      // Query the DB on EVERY token refresh (not just on first sign-in).
      // When `user` is present it's the first sign-in; afterwards we use token.email.
      const lookupEmail = user?.email ?? token.email;
      if (lookupEmail) {
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
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).entityId = token.entityId;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
