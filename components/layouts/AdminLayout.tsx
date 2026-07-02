"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { mockOffices } from "@/mock/mockData";

// ──────────────────────────────────────────
// Navigation structure
// ──────────────────────────────────────────

// Level-2 items under User Management (except Offices which is its own nested dropdown)
const USER_MGMT_ITEMS = [
  { label: "Students", href: "/admin/user-management/students", icon: "school" },
  { label: "Orgs/Clubs", href: "/admin/user-management/orgs", icon: "groups" },
  { label: "Head Office Accounts", href: "/admin/user-management/head-office-accounts", icon: "corporate_fare" },
];

// Bottom-level nav items (after the User Management group)
const BOTTOM_NAV = [
  { label: "Clearance Requirements", href: "/admin/clearance-requirements", icon: "fact_check" },
  { label: "Reports", href: "/admin/reports", icon: "assessment" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

// ──────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Track which accordion groups are open
  const [userMgmtOpen, setUserMgmtOpen] = useState(
    pathname.includes("/admin/user-management") || pathname.includes("/admin/offices")
  );
  const [officesOpen, setOfficesOpen] = useState(
    pathname.includes("/admin/offices")
  );

  // Returns true when the current path matches or is a sub-path of href
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Shared style helpers
  const navItemBase =
    "flex items-center gap-3 rounded-lg transition-colors duration-200 font-body-md text-body-md border-l-4";
  const activeItem = "border-brand-red bg-brand-red/5 text-brand-red font-semibold";
  const inactiveItem =
    "border-transparent text-secondary hover:text-primary hover:bg-surface-container-low";

  const handleLogout = () => {
    document.cookie = "role=; path=/; max-age=0";
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-surface-container-high shadow-sm flex flex-col z-50 overflow-y-auto">

        {/* Brand */}
        <div className="px-md py-lg border-b border-surface-container-high shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-red flex items-center justify-center text-white shadow-sm shrink-0">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                admin_panel_settings
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-title-md text-title-md text-primary leading-tight truncate">
                Clearance System
              </h1>
              <p className="font-label-md text-label-md text-secondary">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-sm py-md space-y-0.5">

          {/* ── Dashboard ── */}
          <Link
            href="/admin/dashboard"
            className={`${navItemBase} px-3 py-2.5 ${isActive("/admin/dashboard") ? activeItem : inactiveItem}`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive("/admin/dashboard") ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              dashboard
            </span>
            Dashboard
          </Link>

          {/* ── User Management (Level 1 accordion) ── */}
          <div>
            <button
              onClick={() => setUserMgmtOpen(!userMgmtOpen)}
              className={`w-full ${navItemBase} px-3 py-2.5 ${
                pathname.includes("/admin/user-management") || pathname.includes("/admin/offices")
                  ? activeItem
                  : inactiveItem
              }`}
            >
              <span className="material-symbols-outlined">manage_accounts</span>
              <span className="flex-1 text-left">User Management</span>
              <span
                className="material-symbols-outlined text-sm transition-transform duration-200"
                style={{ transform: userMgmtOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                expand_more
              </span>
            </button>

            {/* Level-2 items under User Management */}
            {userMgmtOpen && (
              <div className="pl-8 mt-0.5 space-y-0.5">

                {/* Students, Orgs/Clubs, Head Office Accounts */}
                {USER_MGMT_ITEMS.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-body-sm transition-colors ${
                      isActive(sub.href)
                        ? "bg-brand-red/5 text-brand-red font-semibold"
                        : "text-secondary hover:text-primary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{sub.icon}</span>
                    {sub.label}
                  </Link>
                ))}

                {/* ── Offices (Level 2 accordion, nested inside User Management) ── */}
                <div>
                  <button
                    onClick={() => setOfficesOpen(!officesOpen)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-body-sm transition-colors ${
                      pathname.includes("/admin/offices")
                        ? "bg-brand-red/5 text-brand-red font-semibold"
                        : "text-secondary hover:text-primary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">domain</span>
                    <span className="flex-1 text-left">Offices</span>
                    <span
                      className="material-symbols-outlined text-sm transition-transform duration-200"
                      style={{ transform: officesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Level-3: individual offices + Add Office */}
                  {officesOpen && (
                    <div className="pl-6 mt-0.5 space-y-0.5">

                      {/* All Offices landing page */}
                      <Link
                        href="/admin/offices"
                        className={`block px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                          pathname === "/admin/offices"
                            ? "bg-brand-red/5 text-brand-red font-semibold"
                            : "text-secondary hover:text-primary hover:bg-surface-container-low"
                        }`}
                      >
                        All Offices
                      </Link>

                      {/* Individual office links */}
                      {mockOffices.map((office) => (
                        <Link
                          key={office.id}
                          href={`/admin/offices/${office.id}`}
                          className={`block px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors truncate ${
                            pathname === `/admin/offices/${office.id}`
                              ? "bg-brand-red/5 text-brand-red font-semibold"
                              : "text-secondary hover:text-primary hover:bg-surface-container-low"
                          }`}
                        >
                          {office.name}
                        </Link>
                      ))}

                      {/* + Add Office */}
                      <Link
                        href="/admin/offices/new"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md text-secondary hover:text-brand-red hover:bg-brand-red/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Office
                      </Link>
                    </div>
                  )}
                </div>
                {/* end Offices */}

              </div>
            )}
            {/* end User Management children */}
          </div>
          {/* end User Management */}

          {/* ── Clearance Requirements, Reports, Settings ── */}
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${navItemBase} px-3 py-2.5 ${isActive(item.href) ? activeItem : inactiveItem}`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin profile footer */}
        <div className="px-md py-md border-t border-surface-container-high shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate">Admin User</p>
              <p className="font-label-md text-label-md text-secondary truncate">
                admin@clearance.edu
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-secondary hover:text-brand-red transition-colors p-1 rounded shrink-0"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </aside>
      {/* end sidebar */}

      {/* ── Main content area ── */}
      <div className="ml-64 flex flex-col flex-1 min-h-screen">

        {/* Top header bar */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-surface-container-high shadow-sm flex justify-between items-center px-lg h-16">
          <div className="flex items-center gap-lg">
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">
              Clearance Management System
            </h2>
            <div className="relative hidden lg:block w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                className="w-full h-9 pl-10 pr-4 bg-surface-container-low rounded-full border border-surface-container-high focus:border-primary focus:ring-2 focus:ring-brand-red/20 font-body-sm text-body-sm outline-none transition-all"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-surface-container-lowest" />
            </button>
            <button className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

    </div>
  );
}
