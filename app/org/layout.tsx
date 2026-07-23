"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import * as clearanceService from "@/services/clearanceService";
import { Menu, X, LogOut } from "lucide-react";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const orgId = localStorage.getItem("orgId");
    if (orgId) {
      clearanceService.getOrgById(parseInt(orgId, 10)).then((found) => {
        if (found) setOrg(found);
      });
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
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

  const getInitials = (name: string) => {
    if (!name) return "ORG";
    const words = name.split(" ");
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "") + (words[2] ? words[2][0] : "")).toUpperCase();
  };

  const navItems = [
    { label: "Dashboard", href: "/org/dashboard", icon: "dashboard" },
    { label: "Constituents", href: "/org/constituents", icon: "person_search" },
    { label: "Clearance Requirements", href: "/org/clearance-requirements", icon: "task_alt" },
    { label: "Announcements", href: "/org/announcements", icon: "campaign" },
    { label: "Reports", href: "/org/reports", icon: "assessment" },
    { label: "Settings", href: "/org/settings", icon: "settings" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-xs">
            <span>{getInitials(org?.name)}</span>
          </div>
          <div>
            <h1 className="font-bold text-primary text-sm leading-none truncate max-w-[180px]">{org?.name || "Organization"}</h1>
            <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">Org Portal</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-16 left-0 right-0 bg-surface-container-lowest border-b border-outline-variant shadow-xl z-40 transition-all duration-200 transform md:hidden overflow-hidden ${
          mobileMenuOpen ? "max-h-[85vh] opacity-100 py-4" : "max-h-0 opacity-0 py-0"
        }`}
      >
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  active
                    ? "bg-primary-fixed text-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-2 border-t border-outline-variant px-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{org?.adviser || "Org Officer"}</span>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container-high flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Sidebar Nav */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 hidden md:flex z-50">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-on-primary">
            <span className="font-bold text-label-md">{getInitials(org?.name)}</span>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-headline-md text-headline-md font-bold text-primary truncate max-w-[180px]" title={org?.name || "Organization"}>
              {org?.name || "Organization"}
            </h1>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              {org ? `${org.category} ${org.type === "LGU" ? "LGU" : "Club"}` : "Org Portal"}
            </p>
          </div>
        </div>

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
                    <span className="font-body-md text-body-md whitespace-nowrap">{item.label}</span>
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
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                <span>{org?.name ? org.name[0] : "O"}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-on-surface text-body-sm leading-tight truncate w-32" title={org?.adviser || "Org Officer"}>
                  {org?.adviser || "Org Officer"}
                </span>
                <span className="text-secondary text-label-sm truncate w-32" title={org ? `officer@${org.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.edu` : "officer@org.edu"}>
                  {org ? `officer@${org.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.edu` : "officer@org.edu"}
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
      <main className="md:ml-[280px] min-h-screen p-4 sm:p-6 md:p-10 pt-20 md:pt-10">
        {children}
      </main>
    </div>
  );
}
