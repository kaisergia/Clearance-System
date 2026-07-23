"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AnnouncementsSection } from "@/components/landing/AnnouncementsSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LoginModal } from "@/components/landing/LoginModal";
import { DevDiagnosticsModal } from "@/components/landing/DevDiagnosticsModal";
import type { ClearanceSource } from "@/app/page";
import type { Announcement } from "@/components/landing/AnnouncementsSection";

const VideoSection = dynamic(
  () => import("@/components/landing/VideoSection").then((m) => ({ default: m.VideoSection })),
  { ssr: false }
);

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

function LoginPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sources, setSources] = useState<ClearanceSource[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  // Login modal open by default when visiting /login
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isDevOpen, setIsDevOpen] = useState(false);

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

  // Fetch clearance sources
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
        // no-op
      }
    }
    loadAnnouncements();
  }, []);

  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenDev={() => setIsDevOpen(true)}
      />
      <main>
        <HeroSection
          totalSources={sources.length}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
        <FeaturesSection clearanceSources={sources} />
        <HowItWorksSection />
        <AnnouncementsSection
          announcements={announcements}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
        <VideoSection />
        <CTASection onOpenLogin={() => setIsLoginOpen(true)} />
      </main>
      <LandingFooter />

      {/* Pop-up Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <DevDiagnosticsModal isOpen={isDevOpen} onClose={() => setIsDevOpen(false)} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}
