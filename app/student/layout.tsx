"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as clearanceService from "@/services/clearanceService";
import { signOut } from "next-auth/react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      // DATABASE SWAP POINT: clearanceService.getStudentProfile() replaces
      // the direct localStorage["students"] read. When a real DB is connected,
      // this function will query the authenticated student's record.
      const profile = await clearanceService.getStudentProfile();
      if (profile) {
        setStudent(profile);
      } else {
        setStudent(null); // Profile unavailable — will show loading state
      }
      setAvatarUrl(localStorage.getItem("avatarUrl"));
    };
    loadProfile();
    // Re-sync if another tab/context updates the students store
    window.addEventListener("storage", loadProfile);
    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  const handleLogout = () => {
    // Clear developer override cookies (needed when using the dev bypass panel)
    const devKeys = ["dev-role-override", "dev-entityId-override", "role", "officeId", "departmentId", "orgId", "activeStudentId", "avatarUrl"];
    devKeys.forEach((key) => {
      localStorage.removeItem(key);
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    });
    signOut({ callbackUrl: "/login" });
  };

  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navItems = [
    { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
    { label: "Clearance", href: "/student/clearance", icon: "verified" },
    { label: "Profile", href: "/student/profile", icon: "person" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* Sidebar Nav */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 hidden md:flex z-50">
        {/* Brand logo header */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <img
            src="/images/logos/cjc-logo.webp"
            alt="Cor Jesu College Logo"
            className="h-10 w-10 object-contain rounded-full shadow-sm"
          />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary whitespace-nowrap">
              Cor Jesu College
            </h1>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Student Access
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 w-full">
          <ul className="flex flex-col gap-1 w-full">
            {navItems.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                      active
                        ? "bg-primary-fixed text-primary border-primary font-bold"
                        : "text-secondary hover:bg-surface-container-high border-transparent"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {item.icon}
                    </span>
                    <span className="font-body-md text-body-md">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Footer */}
        <div className="px-4 mt-auto pt-4 border-t border-outline-variant">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={student ? student.name : "Profile Picture"}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shrink-0">
                  <span>{student ? student.name.charAt(0) : "S"}</span>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-on-surface text-body-sm leading-tight truncate w-32">
                  {student ? student.name : "Loading..."}
                </span>
                <span className="text-secondary text-label-sm truncate w-32">
                  {student ? student.email : "Student"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-primary transition-colors p-1"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-[280px] min-h-screen p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
