"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const loadProfile = () => {
      const stored = localStorage.getItem("students");
      if (stored) {
        const list = JSON.parse(stored);
        const current = list.find((s: any) => s.id === "2021-0492") || list[0];
        setStudent(current);
      } else {
        setStudent({ name: "Eleanor Shellstrop", email: "eleanor@uni.edu.ph" });
      }
    };
    loadProfile();
    // Listen for storage changes to sync layout footer immediately
    window.addEventListener("storage", loadProfile);
    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  const handleLogout = () => {
    document.cookie = "role=; path=/; max-age=0";
    localStorage.removeItem("role");
    router.push("/login");
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
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shrink-0">
                <span>{student ? student.name.charAt(0) : "E"}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-on-surface text-body-sm leading-tight truncate w-32">
                  {student ? student.name : "Eleanor Shellstrop"}
                </span>
                <span className="text-secondary text-label-sm truncate w-32">
                  {student ? student.email : "eleanor@uni.edu.ph"}
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
