"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function HeadOfficeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "role=; path=/; max-age=0";
    localStorage.removeItem("role");
    router.push("/login");
  };

  const isLinkActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 hidden md:flex">
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
              OFFICE PORTAL
            </p>
          </div>
        </div>

        <nav className="flex-1 w-full">
          <ul className="flex flex-col gap-1 w-full">
            <li>
              <Link
                href="/head-office/dashboard"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/head-office/dashboard")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/head-office/dashboard") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  dashboard
                </span>
                <span className="font-body-md text-body-md">Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                href="/head-office/constituents"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/head-office/constituents")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/head-office/constituents") ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  person_search
                </span>
                <span className="font-body-md text-body-md">Constituents</span>
              </Link>
            </li>

            <li>
              <Link
                href="/head-office/clearance-requirements"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/head-office/clearance-requirements")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/head-office/clearance-requirements") ? { fontVariationSettings: "'FILL' 1" } : {}}
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
                href="/head-office/reports"
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                  isLinkActive("/head-office/reports")
                    ? "bg-primary-fixed text-primary border-primary font-bold"
                    : "text-secondary hover:bg-surface-container-high border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isLinkActive("/head-office/reports") ? { fontVariationSettings: "'FILL' 1" } : {}}
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
                <span>A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-on-surface text-body-sm leading-tight">Admin User</span>
                <span className="text-secondary text-label-sm truncate w-32">admin@clearance.edu</span>
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
