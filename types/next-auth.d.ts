import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      entityId: string | number | null;
      isProfileComplete?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    entityId?: string | number | null;
    isProfileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    entityId?: string | number | null;
    isProfileComplete?: boolean;
  }
}
