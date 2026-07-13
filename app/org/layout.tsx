"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { mockOrgs } from "@/mock/mockData";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    const orgId = localStorage.getItem("orgId");
    if (orgId) {
      const found = mockOrgs.find((o) => o.id === parseInt(orgId));
      if (found) {
        setOrg(found);
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "role=; path=/; max-age=0";
    document.cookie = "orgId=; path=/; max-age=0";
    localStorage.removeItem("role");
    localStorage.removeItem("orgId");
    router.push("/login");
  };

  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  // Helper to make initials for the avatar logo
  const getInitials = (name: string) => {
    if (!name) return "ORG";
    const words = name.split(" ");
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "") + (words[2] ? words[2][0] : "")).toUpperCase();
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 hidden md:flex">
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
            <li>
              <Link
                href="/org/dashboard"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/org/dashboard")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/org/dashboard") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  dashboard
                </span>
                <span className="font-body-md text-body-md">Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                href="/org/constituents"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/org/constituents")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/org/constituents") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  person_search
                </span>
                <span className="font-body-md text-body-md">Constituents</span>
              </Link>
            </li>

            <li>
              <Link
                href="/org/clearance-requirements"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/org/clearance-requirements")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/org/clearance-requirements") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  task_alt
                </span>
                <span className="font-body-md text-body-md whitespace-nowrap">
                  Clearance Requirements
                </span>
              </Link>
            </li>

            <li>
              <Link
                href="/org/reports"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/org/reports")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/org/reports") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  assessment
                </span>
                <span className="font-body-md text-body-md">Reports</span>
              </Link>
            </li>
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
      <main className="md:ml-[280px] min-h-screen p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
