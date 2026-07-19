"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOffices } from "@/components/contexts/OfficesContext";
import { useDepartments } from "@/components/contexts/DepartmentsContext";
import { mockStudents, mockOfficeHeads } from "@/mock/mockStudents";
import { signOut, useSession } from "next-auth/react";

function AddOfficeForm({ onCancel, onAdd }: { onCancel: () => void; onAdd: (data: any) => void }) {
  const [name, setName] = useState("");
  const [headName, setHeadName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const allConstituents = [...mockStudents, ...mockOfficeHeads];
  const filteredConstituents = headName 
    ? allConstituents.filter(c => c.name.toLowerCase().includes(headName.toLowerCase()) || c.email.toLowerCase().includes(headName.toLowerCase()))
    : allConstituents;

  const handleSelectHead = (constituent: any) => {
    setHeadName(constituent.name);
    setHeadEmail(constituent.email);
    setIsSearching(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !headName.trim() || !headEmail.trim()) return;
    onAdd({ name: name.trim(), description: description.trim(), head: { name: headName.trim(), email: headEmail.trim() } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h3 className="font-title-md text-title-md text-on-surface">Add Office</h3>
        <button onClick={onCancel} className="p-1 rounded text-secondary hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="space-y-md">
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Registrar" />
        </div>
        <div className="relative">
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Head Name *</label>
          <input 
            value={headName} 
            onChange={(e) => {
              setHeadName(e.target.value);
              setIsSearching(true);
            }} 
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
            placeholder="Search for a constituent..." 
          />
          {isSearching && filteredConstituents.length > 0 && (
            <ul className="absolute z-10 w-full bg-surface-container-lowest border border-surface-container-high mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredConstituents.map(c => (
                <li 
                  key={c.id} 
                  className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex flex-col"
                  onClick={() => handleSelectHead(c)}
                >
                  <span className="font-medium text-on-surface">{c.name}</span>
                  <span className="text-xs text-secondary">{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Head Email *</label>
          <input value={headEmail} onChange={(e) => setHeadEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. head@uni.edu.ph" />
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional description" />
        </div>
      </div>
      <div className="flex gap-sm mt-lg">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors">Add Office</button>
      </div>
    </div>
  );
}

function AddDepartmentForm({ onCancel, onAdd }: { onCancel: () => void; onAdd: (data: any) => void }) {
  const [name, setName] = useState("");
  const [headName, setHeadName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const allConstituents = [...mockStudents, ...mockOfficeHeads];
  const filteredConstituents = headName 
    ? allConstituents.filter(c => c.name.toLowerCase().includes(headName.toLowerCase()) || c.email.toLowerCase().includes(headName.toLowerCase()))
    : allConstituents;

  const handleSelectHead = (constituent: any) => {
    setHeadName(constituent.name);
    setHeadEmail(constituent.email);
    setIsSearching(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !headName.trim() || !headEmail.trim()) return;
    onAdd({ name: name.trim(), description: description.trim(), head: { name: headName.trim(), email: headEmail.trim() } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h3 className="font-title-md text-title-md text-on-surface">Add Department</h3>
        <button onClick={onCancel} className="p-1 rounded text-secondary hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="space-y-md">
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. CCIS" />
        </div>
        <div className="relative">
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Head Name *</label>
          <input 
            value={headName} 
            onChange={(e) => {
              setHeadName(e.target.value);
              setIsSearching(true);
            }} 
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
            placeholder="Search for a constituent..." 
          />
          {isSearching && filteredConstituents.length > 0 && (
            <ul className="absolute z-10 w-full bg-surface-container-lowest border border-surface-container-high mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredConstituents.map(c => (
                <li 
                  key={c.id} 
                  className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex flex-col"
                  onClick={() => handleSelectHead(c)}
                >
                  <span className="font-medium text-on-surface">{c.name}</span>
                  <span className="text-xs text-secondary">{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Head Email *</label>
          <input value={headEmail} onChange={(e) => setHeadEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. head@uni.edu.ph" />
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional description" />
        </div>
      </div>
      <div className="flex gap-sm mt-lg">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors">Add Department</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Navigation structure
// ──────────────────────────────────────────

// Level-2 items under User Management (except Offices and Organizations which are their own nested dropdowns)
const USER_MGMT_ITEMS = [
  { label: "Constituents", href: "/admin/user-management/students", icon: "school" },
];

// Bottom-level nav items (after the User Management group)
const BOTTOM_NAV = [
  { label: "Clearance Requirements", href: "/admin/clearance-requirements", icon: "fact_check" },
  { label: "Reports", href: "/admin/reports", icon: "assessment" },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: "history" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

// ──────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { offices, setOpenAddOfficeModal, openAddOfficeModal, addOffice, deleteOffice } = useOffices();
  const { departments, setOpenAddDepartmentModal, openAddDepartmentModal, addDepartment, deleteDepartment } = useDepartments();

  // Track which accordion groups are open
  const [userMgmtOpen, setUserMgmtOpen] = useState(
    pathname.includes("/admin/user-management") || pathname.includes("/admin/offices") || pathname.includes("/admin/departments")
  );
  const [officesOpen, setOfficesOpen] = useState(
    pathname.includes("/admin/offices")
  );
  const [departmentsOpen, setDepartmentsOpen] = useState(
    pathname.includes("/admin/departments")
  );
  const [organizationsOpen, setOrganizationsOpen] = useState(
    pathname.includes("/admin/organizations")
  );
  const [clubsOpen, setClubsOpen] = useState(
    pathname.includes("/admin/organizations/clubs")
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
    const devKeys = ["dev-role-override", "dev-entityId-override", "role", "officeId", "departmentId", "orgId", "activeStudentId", "avatarUrl"];
    devKeys.forEach((key) => {
      localStorage.removeItem(key);
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    });
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-surface-container-high shadow-sm flex flex-col z-50 overflow-y-auto">

        {/* Brand */}
        <div className="px-md py-lg border-b border-surface-container-high shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/logos/cjc-logo.webp"
              alt="Cor Jesu College Logo"
              className="w-10 h-10 object-contain rounded-lg shadow-sm shrink-0"
            />
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
                pathname.includes("/admin/user-management") || pathname.includes("/admin/offices") || pathname.includes("/admin/departments")
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

                {/* Students */}
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

                {/* ── Organizations (Level 2 accordion) ── */}
                <div>
                  <button
                    onClick={() => setOrganizationsOpen(!organizationsOpen)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-body-sm transition-colors ${
                      pathname.includes("/admin/organizations")
                        ? "bg-brand-red/5 text-brand-red font-semibold"
                        : "text-secondary hover:text-primary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    <span className="flex-1 text-left">Organization</span>
                    <span
                      className="material-symbols-outlined text-sm transition-transform duration-200"
                      style={{ transform: organizationsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Level-3: Organization categories */}
                  {organizationsOpen && (
                    <div className="pl-6 mt-0.5 space-y-0.5">
                      <Link
                        href="/admin/organizations/student-government"
                        className={`block px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                          pathname === "/admin/organizations/student-government"
                            ? "bg-brand-red/5 text-brand-red font-semibold"
                            : "text-secondary hover:text-primary hover:bg-surface-container-low"
                        }`}
                      >
                        Student Government
                      </Link>
                      <Link
                        href="/admin/organizations/lgu"
                        className={`block px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                          pathname === "/admin/organizations/lgu"
                            ? "bg-brand-red/5 text-brand-red font-semibold"
                            : "text-secondary hover:text-primary hover:bg-surface-container-low"
                        }`}
                      >
                        LGU
                      </Link>

                      {/* ── Clubs (Level 3 accordion) ── */}
                      <div>
                        <button
                          onClick={() => setClubsOpen(!clubsOpen)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                            pathname.includes("/admin/organizations/clubs")
                              ? "bg-brand-red/5 text-brand-red font-semibold"
                              : "text-secondary hover:text-primary hover:bg-surface-container-low"
                          }`}
                        >
                          Clubs
                          <span
                            className="material-symbols-outlined text-sm transition-transform duration-200"
                            style={{ transform: clubsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                          >
                            expand_more
                          </span>
                        </button>
                        
                        {/* Level-4: Club categories */}
                        {clubsOpen && (
                          <div className="pl-4 mt-0.5 space-y-0.5">
                            <Link
                              href="/admin/organizations/clubs/academic"
                              className={`block px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors ${
                                pathname === "/admin/organizations/clubs/academic"
                                  ? "bg-brand-red/5 text-brand-red font-semibold"
                                  : "text-secondary hover:text-primary hover:bg-surface-container-low"
                              }`}
                            >
                              Academic
                            </Link>
                            <Link
                              href="/admin/organizations/clubs/non-academic"
                              className={`block px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors ${
                                pathname === "/admin/organizations/clubs/non-academic"
                                  ? "bg-brand-red/5 text-brand-red font-semibold"
                                  : "text-secondary hover:text-primary hover:bg-surface-container-low"
                              }`}
                            >
                              Non-Academic
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* end Organizations */}

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
                            {offices.map((office) => (
                              <div key={office.id} className="relative group">
                                <Link
                                  href={`/admin/offices/${office.id}`}
                                  className={`block px-3 py-1.5 pr-8 rounded-lg font-label-md text-label-md transition-colors truncate ${
                                    pathname === `/admin/offices/${office.id}`
                                      ? "bg-brand-red/5 text-brand-red font-semibold"
                                      : "text-secondary hover:text-primary hover:bg-surface-container-low"
                                  }`}
                                >
                                  {office.name}
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteOffice(office.id);
                                  }}
                                  className="absolute right-2 top-1.5 text-secondary hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-brand-red/10 flex items-center justify-center"
                                  title="Delete Office"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            ))}

                      {/* + Add Office */}
                      <button
                        onClick={() => setOpenAddOfficeModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md text-secondary hover:text-brand-red hover:bg-brand-red/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Office
                      </button>
                    </div>
                  )}
                </div>
                {/* end Offices */}

                {/* ── Departments (Level 2 accordion, nested inside User Management) ── */}
                <div>
                  <button
                    onClick={() => setDepartmentsOpen(!departmentsOpen)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-body-sm text-body-sm transition-colors ${
                      pathname.includes("/admin/departments")
                        ? "bg-brand-red/5 text-brand-red font-semibold"
                        : "text-secondary hover:text-primary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    <span className="flex-1 text-left">Departments</span>
                    <span
                      className="material-symbols-outlined text-sm transition-transform duration-200"
                      style={{ transform: departmentsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Level-3: individual departments + Add Department */}
                  {departmentsOpen && (
                    <div className="pl-6 mt-0.5 space-y-0.5">
                      <Link
                        href="/admin/departments"
                        className={`block px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                          pathname === "/admin/departments"
                            ? "bg-brand-red/5 text-brand-red font-semibold"
                            : "text-secondary hover:text-primary hover:bg-surface-container-low"
                        }`}
                      >
                        All Departments
                      </Link>

                      {departments.map((dept) => (
                        <div key={dept.id} className="relative group">
                          <Link
                            href={`/admin/departments/${dept.id}`}
                            className={`block px-3 py-1.5 pr-8 rounded-lg font-label-md text-label-md transition-colors truncate ${
                              pathname === `/admin/departments/${dept.id}`
                                ? "bg-brand-red/5 text-brand-red font-semibold"
                                : "text-secondary hover:text-primary hover:bg-surface-container-low"
                            }`}
                          >
                            {dept.name}
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteDepartment(dept.id);
                            }}
                            className="absolute right-2 top-1.5 text-secondary hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-brand-red/10 flex items-center justify-center"
                            title="Delete Department"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => setOpenAddDepartmentModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-md text-label-md text-secondary hover:text-brand-red hover:bg-brand-red/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Department
                      </button>
                    </div>
                  )}
                </div>
                {/* end Departments */}

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
            {session?.user && (session.user as any).avatarUrl ? (
              <img
                src={(session.user as any).avatarUrl}
                alt={session.user.name || "Admin"}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm shrink-0">
                {session?.user?.name ? session.user.name.charAt(0) : "A"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate">
                {session?.user?.name || "Admin User"}
              </p>
              <p className="font-label-md text-label-md text-secondary truncate">
                {session?.user?.email || "admin@clearance.edu"}
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
        {/* Add Office Modal (global) */}
        {openAddOfficeModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpenAddOfficeModal(false)}>
            <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
              <AddOfficeForm onCancel={() => setOpenAddOfficeModal(false)} onAdd={(data) => addOffice(data)} />
            </div>
          </div>
        )}
        {/* Add Department Modal (global) */}
        {openAddDepartmentModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpenAddDepartmentModal(false)}>
            <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
              <AddDepartmentForm onCancel={() => setOpenAddDepartmentModal(false)} onAdd={(data) => addDepartment(data)} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
