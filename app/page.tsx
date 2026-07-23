"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AnnouncementsSection } from "@/components/landing/AnnouncementsSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import type { Announcement } from "@/components/landing/AnnouncementsSection";

// Video carousel — client only (uses embla + iframe)
const VideoSection = dynamic(
  () => import("@/components/landing/VideoSection").then((m) => ({ default: m.VideoSection })),
  { ssr: false }
);

export interface ClearanceSource {
  name: string;
  type: "office" | "department" | "org";
  logoUrl?: string | null;
}

// Static fallback shown when DB is unreachable (e.g. XAMPP not started yet)
const STATIC_SOURCES: ClearanceSource[] = [
  { name: "Registrar", type: "office" },
  { name: "Library", type: "office" },
  { name: "Guidance Office", type: "office" },
  { name: "Accounting / Cashier", type: "office" },
  { name: "Discipline Office", type: "office" },
  { name: "College of Computing & Information Sciences", type: "department" },
  { name: "College of Engineering", type: "department" },
  { name: "Computer Science Society", type: "org" },
  { name: "CCIS LGU", type: "org" },
  { name: "Engineering Society", type: "org" },
  { name: "Student Government", type: "org" },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sources, setSources] = useState<ClearanceSource[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === "loading") return;
    if (session?.user) {
      const role = (session.user as any).role as string | undefined;
      const redirectMap: Record<string, string> = {
        student: "/student/dashboard",
        "head-office": "/head-office/dashboard",
        department: "/department/dashboard",
        org: "/org/dashboard",
        admin: "/admin/dashboard",
      };
      router.replace(redirectMap[role ?? ""] ?? "/student/dashboard");
    }
  }, [session, status, router]);

  // Fetch clearance sources from DB, fall back to static list if DB is down
  useEffect(() => {
    async function loadSources() {
      try {
        const [officesRes, deptsRes, orgsRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/departments"),
          fetch("/api/orgs"),
        ]);

        const [officesData, deptsData, orgsData] = await Promise.all([
          officesRes.ok ? officesRes.json() : [],
          deptsRes.ok ? deptsRes.json() : [],
          orgsRes.ok ? orgsRes.json() : [],
        ]);

        const offices: ClearanceSource[] = (
          Array.isArray(officesData) ? officesData : officesData.offices ?? []
        ).map((o: any) => ({ name: o.name, type: "office" as const, logoUrl: o.logoUrl ?? null }));

        const depts: ClearanceSource[] = (
          Array.isArray(deptsData) ? deptsData : deptsData.departments ?? []
        ).map((d: any) => ({ name: d.name, type: "department" as const, logoUrl: d.logoUrl ?? null }));

        const orgs: ClearanceSource[] = (
          Array.isArray(orgsData) ? orgsData : orgsData.orgs ?? []
        ).map((o: any) => ({ name: o.name, type: "org" as const, logoUrl: o.logoUrl ?? null }));

        const combined = [...offices, ...depts, ...orgs];
        setSources(combined.length > 0 ? combined : STATIC_SOURCES);
      } catch {
        setSources(STATIC_SOURCES);
      }
    }
    loadSources();
  }, []);

  // Fetch system-wide announcements
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch("/api/announcements?scope=public");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch {
        // no-op — AnnouncementsSection hides itself when empty
      }
    }
    loadAnnouncements();
  }, []);

  // Don't render landing page if session is confirmed — redirect in progress
  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main>
        <HeroSection totalSources={sources.length} />
        <FeaturesSection clearanceSources={sources} />
        <HowItWorksSection />
        <AnnouncementsSection announcements={announcements} />
        <VideoSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
